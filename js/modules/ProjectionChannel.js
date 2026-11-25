import {
    MS_PER_SECOND,
    PROJECTION_CHANNEL,
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

const createBrowserChannel = () => typeof globalThis.BroadcastChannel === 'function'
    ? new globalThis.BroadcastChannel(PROJECTION_CHANNEL)
    : null;

export class ProjectionChannel {
    constructor({getState, createChannel = createBrowserChannel, openWindow = (...args) => globalThis.open?.(...args)}) {
        this.getState = getState;
        this.openWindow = openWindow;
        this.pending = false;
        this.channel = createChannel();

        if (this.channel) {
            this.channel.onmessage = (event) => {
                if (event.data?.type === 'hello') this.publish();
            };
            this.channel.unref?.();
        }
    }

    publish() {
        this.channel?.postMessage(this.getState());
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
