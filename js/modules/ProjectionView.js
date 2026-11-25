import {ICON_TYPE, PROJECTION_STATE_VERSION, THEME} from '../constants.js';
import {TEXT} from '../messages.js';
import {isImageDataUrl} from '../utils.js';

const FADE_IN = 'opacity 1s ease-in';

const isValidState = (state) => state?.type === 'state' && state.version === PROJECTION_STATE_VERSION
    && typeof state.gameName === 'string' && Number.isFinite(state.played) && Number.isFinite(state.total)
    && Array.isArray(state.history) && Number.isFinite(state.titleRevealMs) && Number.isFinite(state.iconRevealMs);

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
    }

    start() {
        this.channel.onmessage = (event) => this.handle(event.data);
        this.channel.postMessage({type: 'hello'});
        this.renderWaiting();
    }

    handle(state) {
        if (!isValidState(state)) return;

        this.state = state;
        this._clearTimers();

        if (Object.values(THEME).includes(state.theme)) this.root.dataset.theme = state.theme;
        this.el.gameName.textContent = state.gameName;
        this.el.counter.textContent = TEXT.projection.counter(state.played, state.total);

        if (!state.current) {
            this.renderWaiting();
            this._renderHistory();
            return;
        }

        this.el.status.textContent = '';
        this.el.title.textContent = state.current.title;
        this._renderIcon(state.current);
        this._reveal(this.el.title, state.titleRevealMs, state, () => {});
        this._reveal(this.el.icon, state.iconRevealMs, state, () => { this.iconVisible = true; this._renderHistory(); });
        this.iconVisible = this._isRevealedNow(state.iconRevealMs, state);
        this._renderHistory();
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
