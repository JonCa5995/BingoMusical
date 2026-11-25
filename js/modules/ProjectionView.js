import {CELEBRATION, DEFAULT_GAME_NAME, ICON_TYPE, PROJECTION_STATE_VERSION, THEME} from '../constants.js';
import {TEXT} from '../messages.js';
import {formatTime} from './AudioControlsView.js';
import {isImageDataUrl} from '../utils.js';

const FADE_IN = 'opacity 1s ease-in';

const isValidState = (state) => state?.type === 'state' && state.version === PROJECTION_STATE_VERSION
    && typeof state.gameName === 'string' && Number.isFinite(state.played) && Number.isFinite(state.total)
    && Array.isArray(state.history) && Number.isFinite(state.titleRevealMs) && Number.isFinite(state.iconRevealMs)
    && (state.celebration == null || Object.values(CELEBRATION).includes(state.celebration));

export class ProjectionView {
    constructor({elements, channel, root = document.documentElement, now = () => Date.now(), timers = {set: (fn, delay) => setTimeout(fn, delay), clear: (id) => clearTimeout(id)}}) {
        this.el = elements;
        this.channel = channel;
        this.root = root;
        this.now = now;
        this.timers = timers;
        this.pendingTimers = [];
        this.iconVisible = false;
        this.state = null;
        this.docked = false;
        this.celebration = null;
    }

    start() {
        this.channel.onmessage = (event) => this.receive(event.data);
        this.channel.postMessage({type: 'hello'});
        this.renderWaiting();
        this.syncLogo(false);
    }

    syncLogo(animate) {
        const target = (this.docked ? this.el.logoSlot : this.el.icon);
        this.el.header.classList.toggle('docked', this.docked);
        const rect = target.getBoundingClientRect();
        const logo = this.el.logo;

        logo.classList.toggle('animated', animate);
        logo.classList.toggle('docked', this.docked);
        Object.assign(logo.style, {left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px`});
    }

    receive(message) {
        if (message?.type === 'progress') {
            this.handleProgress(message);
        } else if (message?.type === 'dock') {
            this.handleDock(message);
        } else {
            this.handle(message);
        }
    }

    handleDock(message) {
        if (message.version !== PROJECTION_STATE_VERSION || this.docked) return;

        this.docked = true;
        this.syncLogo(true);
    }

    sendAlive() {
        this.channel.postMessage({type: 'alive'});
    }

    sendBye() {
        this.channel.postMessage({type: 'bye'});
    }

    handleProgress(progress) {
        if (progress.version !== PROJECTION_STATE_VERSION || !Number.isFinite(progress.currentTime) || !Number.isFinite(progress.duration)) return;

        const percent = progress.duration > 0 ? Math.min(100, (progress.currentTime / progress.duration) * 100) : 0;
        this._showProgress(percent, progress.currentTime, progress.duration);
        this._setPlaying(progress.playing);
    }

    _showProgress(percent, currentTime, duration) {
        this.el.progressFill.style.width = `${percent}%`;
        this.el.progressBar.setAttribute('aria-valuenow', String(Math.round(percent)));
        this.el.time.textContent = TEXT.projection.time(formatTime(currentTime), formatTime(duration));
    }

    _showCelebration(kind) {
        if (kind === this.celebration) return;

        this.celebration = kind;
        this.el.celebration.classList.toggle('hidden', kind === null);
        if (kind === null) return;

        const texts = TEXT.projection.celebration[kind];
        this.el.celebrationTitle.textContent = texts.title;
        this.el.celebrationTitle.classList.toggle('celebration-title-linea', kind === CELEBRATION.LINEA);
        this.el.celebrationText.textContent = texts.text;
    }

    _setPlaying(playing) {
        this.el.icon.classList.toggle('playing', Boolean(playing) && Boolean(this.state?.current));
    }

    handle(state) {
        if (!isValidState(state)) return;

        const previous = this.state;
        const songChanged = previous?.current?.id !== state.current?.id;
        this.state = state;
        this._clearTimers();
        if (songChanged) this._showProgress(0, 0, 0);

        if (Object.values(THEME).includes(state.theme)) this.root.dataset.theme = state.theme;
        const named = Boolean(state.gameName) && state.gameName !== DEFAULT_GAME_NAME;
        this.el.gameName.textContent = named ? state.gameName : '';
        this.el.gameName.hidden = !named;
        this.el.counter.textContent = TEXT.projection.counter(state.played, state.total);
        this._showCelebration(state.celebration ?? null);

        const animate = previous !== null;
        this.docked = Boolean(state.current);
        this.el.icon.classList.toggle('has-song', this.docked);
        if (!state.current) this._setPlaying(false);

        if (!state.current) {
            this.renderWaiting();
            this._renderHistory();
            this.syncLogo(animate);
            return;
        }

        this.el.status.textContent = '';
        this.el.title.textContent = state.current.title;
        this._renderIcon(state.current);
        this._reveal(this.el.title, state.titleRevealMs, state, () => {});
        this._reveal(this.el.icon.children[0], state.iconRevealMs, state, () => { this.iconVisible = true; this._renderHistory(); });
        this.iconVisible = this._isRevealedNow(state.iconRevealMs, state);
        this._renderHistory();
        this.syncLogo(animate);
    }

    renderWaiting() {
        this._clearTimers();
        this.el.status.textContent = TEXT.projection.waiting;
        this.el.title.textContent = '';
        this.el.icon.replaceChildren();
        this.el.counter.textContent = this.state ? TEXT.projection.counter(this.state.played, this.state.total) : '';
        this.iconVisible = false;
    }

    _isRevealedNow(revealMs, state) {
        return state.revealed || state.startedAt === null || this.now() >= state.startedAt + revealMs;
    }

    _reveal(element, revealMs, state, onVisible) {
        if (this._isRevealedNow(revealMs, state)) {
            element.style.transition = '';
            element.style.opacity = '1';
            return;
        }

        element.style.transition = '';
        element.style.opacity = '0';

        const delay = Math.max(0, state.startedAt + revealMs - this.now());
        this.pendingTimers.push(this.timers.set(() => {
            element.style.transition = FADE_IN;
            element.style.opacity = '1';
            onVisible();
        }, delay));
    }

    _renderIcon(song) {
        const icon = this._iconNode(song);
        this.el.icon.replaceChildren(icon);
    }

    _iconNode(song) {
        if (song.iconType === ICON_TYPE.IMAGE && isImageDataUrl(song.icon)) {
            const image = document.createElement('img');
            image.className = 'projection-image';
            image.alt = '';
            image.src = song.icon;
            return image;
        }

        const emoji = document.createElement('span');
        emoji.className = 'projection-emoji';
        emoji.textContent = song.iconType === ICON_TYPE.IMAGE ? '' : String(song.icon);
        return emoji;
    }

    _renderHistory() {
        const state = this.state;
        const currentId = state.current?.id;
        const items = state.history
            .filter(song => song.id !== currentId || this.iconVisible)
            .reverse()
            .map(song => {
                const item = document.createElement('div');
                item.className = 'projection-history-item';
                item.append(this._iconNode(song));
                return item;
            });

        this.el.history.replaceChildren(...items);
    }

    _clearTimers() {
        this.pendingTimers.forEach(timer => this.timers.clear(timer));
        this.pendingTimers = [];
    }
}
