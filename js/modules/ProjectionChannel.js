import {
    MS_PER_SECOND,
    PROJECTION_ALIVE_TIMEOUT_MS,
    PROJECTION_CHANNEL,
    PROJECTION_DOCK_MS,
    PROJECTION_FEATURES,
    PROJECTION_HISTORY_LIMIT,
    PROJECTION_PAGE,
    PROJECTION_STATE_VERSION,
    PROJECTION_WINDOW_NAME
} from '../constants.js';

export function buildProjectionState({songs, game, theme, startedAt, revealed}) {
    const history = game.getHistory();
    const current = songs.find(song => song.id === game.getCurrentSong());
    const gameStarted = game.isGameStarted();

    return {
        type: 'state',
        version: PROJECTION_STATE_VERSION,
        theme,
        gameName: game.getGameName(),
        gameStarted,
        played: history.length,
        total: songs.length,
        current: current ? {id: current.id, title: current.title, icon: current.icon, iconType: current.iconType} : null,
        startedAt: startedAt ?? null,
        titleRevealMs: game.getTitleRevealTime() * MS_PER_SECOND,
        iconRevealMs: game.getIconRevealTime() * MS_PER_SECOND,
        revealed: Boolean(revealed) || !gameStarted,
        history: history.slice(-PROJECTION_HISTORY_LIMIT).map(({id, icon, iconType}) => ({id, icon, iconType}))
    };
}

export function buildProjectionProgress({timeline, playing}) {
    const finite = (value) => (Number.isFinite(value) && value > 0 ? value : 0);

    return {
        type: 'progress',
        version: PROJECTION_STATE_VERSION,
        currentTime: finite(timeline.currentTime),
        duration: finite(timeline.duration),
        playing: Boolean(playing)
    };
}

const createBrowserChannel = () => typeof globalThis.BroadcastChannel === 'function'
    ? new globalThis.BroadcastChannel(PROJECTION_CHANNEL)
    : null;

export class ProjectionChannel {
    constructor({
        getState,
        getProgress = () => null,
        createChannel = createBrowserChannel,
        openWindow = (...args) => globalThis.open?.(...args),
        now = () => Date.now(),
        wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))
    }) {
        this.getState = getState;
        this.getProgress = getProgress;
        this.openWindow = openWindow;
        this.now = now;
        this.wait = wait;
        this.lastSeen = null;
        this.pending = false;
        this.channel = createChannel();

        if (this.channel) {
            this.channel.onmessage = (event) => this._receive(event.data);
            this.channel.unref?.();
        }
    }

    _receive(message) {
        const type = message?.type;

        if (type === 'bye') {
            this.lastSeen = null;
            return;
        }

        if (type !== 'hello' && type !== 'alive') return;

        this.lastSeen = this.now();

        if (type === 'hello') {
            this.publish();
            this.publishProgress();
        }
    }

    hasListener() {
        return this.lastSeen !== null && this.now() - this.lastSeen < PROJECTION_ALIVE_TIMEOUT_MS;
    }

    dockLogo() {
        this.channel?.postMessage({type: 'dock', version: PROJECTION_STATE_VERSION});
        return this.wait(PROJECTION_DOCK_MS);
    }

    publish() {
        this.channel?.postMessage(this.getState());
    }

    publishProgress() {
        const progress = this.getProgress();
        if (progress) this.channel?.postMessage(progress);
    }

    schedulePublish() {
        if (!this.channel || this.pending) return;

        this.pending = true;
        queueMicrotask(() => {
            this.pending = false;
            this.publish();
        });
    }

    open() {
        this.openWindow(PROJECTION_PAGE, PROJECTION_WINDOW_NAME, PROJECTION_FEATURES);
    }
}
