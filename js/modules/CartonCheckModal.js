import {CELEBRATION, CHECK_MODE, ICON_TYPE, SOUND} from '../constants.js';
import {MSG, TEXT} from '../messages.js';
import {evaluateCarton} from './CartonChecker.js';

const CLASS_PRIMARY = 'btn btn-play btn-icon';
const CLASS_SECONDARY = 'btn btn-secondary btn-icon';

export class CartonCheckModal {
    constructor({elements, openButton, game, modals, dialogs, sounds, callbacks}) {
        this.el = elements;
        this.openButton = openButton;
        this.game = game;
        this.modals = modals;
        this.dialogs = dialogs;
        this.sounds = sounds;
        this.callbacks = callbacks;
        this.mode = CHECK_MODE.CHECK;
        this.carton = null;
        this.result = null;
        this.shown = false;
    }

    init() {
        const el = this.el;

        this.openButton.addEventListener('click', () => this.open());
        el.closeCheckCartonModalBtn.addEventListener('click', () => this.close());
        this.modals.registerModal(el.checkCartonModal, () => this.close());
        el.checkCartonModal.addEventListener('close', () => this._onClosed());
        el.checkCartonSubmitBtn.addEventListener('click', () => this.check());
        el.checkCartonNumberInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.check();
        });
    }

    open(mode = CHECK_MODE.CHECK) {
        const count = this.game.getCartonesCount();

        if (count === 0 && mode === CHECK_MODE.CHECK) {
            this.dialogs.showAlert(MSG.checkCarton.noCartones);
            return;
        }

        this._reset(mode);
        const el = this.el;
        el.checkCartonTitle.textContent = TEXT.checkCarton.modeTitle[mode];
        el.checkCartonNumberInput.max = count;
        el.checkCartonNumberInput.value = '';

        if (mode === CHECK_MODE.ENDED) {
            this._openEnded();
        } else if (count === 0) {
            this._openWithoutCartones();
        } else {
            el.checkCartonNumberInput.disabled = false;
            el.checkCartonSubmitBtn.disabled = false;
        }

        this.modals.openWithClick(el.checkCartonModal);
        if (!el.checkCartonNumberInput.disabled) el.checkCartonNumberInput.focus();
    }

    _reset(mode) {
        this.mode = mode;
        this.carton = null;
        this.result = null;
        this.shown = false;
        this.el.checkCartonResult.replaceChildren();
        this.el.checkCartonActions.replaceChildren();
    }

    _openEnded() {
        this.el.checkCartonNumberInput.disabled = true;
        this.el.checkCartonSubmitBtn.disabled = true;
        this.shown = true;
        this._renderActions(this._continueActions(true), {text: TEXT.checkCarton.ended, ok: true});
    }

    _openWithoutCartones() {
        this.el.checkCartonNumberInput.disabled = true;
        this.el.checkCartonSubmitBtn.disabled = true;
        this._renderActions([this._singAction(this._modeKind(), false)], {text: TEXT.checkCarton.withoutCartones, ok: false});
    }

    _modeKind() {
        return this.mode === CHECK_MODE.LINEA ? CELEBRATION.LINEA : CELEBRATION.BINGO;
    }

    check() {
        const count = this.game.getCartonesCount();
        const number = Number.parseInt(this.el.checkCartonNumberInput.value);

        if (!Number.isInteger(number) || number < 1) {
            this.dialogs.showAlert(MSG.checkCarton.invalidNumber(count));
            return;
        }

        const carton = this.game.getCartones().find(item => item.id === number);

        if (!carton) {
            this.dialogs.showAlert(MSG.checkCarton.notFound(number, count));
            return;
        }

        const playedIds = new Set(this.game.getHistory().map(song => song.id));
        const result = evaluateCarton(carton, playedIds);

        this._dismissProjection();
        this.carton = carton;
        this.result = result;
        this.sounds.play(result.linea ? SOUND.WIN : SOUND.CLICK);
        this.render(carton, result);
        this._renderActions(this._actionsFor(result));
    }

    _actionsFor(result) {
        const {mode} = this;
        const actions = [];
        const checking = mode === CHECK_MODE.CHECK;

        if ((checking || mode === CHECK_MODE.LINEA) && result.linea && this.game.canCallLinea().valid) {
            actions.push(this._singAction(CELEBRATION.LINEA, true));
        }

        if ((checking || mode === CHECK_MODE.BINGO) && result.bingo && this.game.canCallBingo().valid) {
            actions.push(this._singAction(CELEBRATION.BINGO, true));
        }

        if (mode === CHECK_MODE.LINEA && !result.linea) actions.push(this._failureAction(CELEBRATION.LINEA));
        if (mode === CHECK_MODE.BINGO && !result.bingo) actions.push(this._failureAction(CELEBRATION.BINGO));

        return actions;
    }

    _singAction(kind, withCarton) {
        const label = withCarton ? TEXT.checkCarton.sing[kind] : TEXT.checkCarton.singWithoutCarton[kind];

        return {label, className: CLASS_PRIMARY, handler: () => this._sing(kind, withCarton)};
    }

    _failureAction(kind) {
        return {label: TEXT.checkCarton.showFailure, className: CLASS_SECONDARY, handler: () => this._showFailure(kind)};
    }

    _continueActions(withRestart) {
        const actions = [{label: TEXT.checkCarton.continuePlaying, className: CLASS_PRIMARY, handler: () => this.close()}];

        if (withRestart) {
            actions.push({label: TEXT.checkCarton.restart, className: CLASS_SECONDARY, handler: () => this._restart()});
        }

        return actions;
    }

    _sing(kind, withCarton) {
        this.callbacks.onSing({kind, carton: withCarton ? this.carton : null, result: withCarton ? this.result : null});
        this.shown = true;
        this._renderActions(this._continueActions(kind === CELEBRATION.BINGO), {text: TEXT.checkCarton.onProjector, ok: true});
    }

    _showFailure(kind) {
        this.callbacks.onShowFailure({kind, carton: this.carton, result: this.result});
        this.shown = true;
        this._renderActions(this._continueActions(false), {text: TEXT.checkCarton.failureOnProjector, ok: false});
    }

    async _restart() {
        await this.callbacks.onRestart();
        this.close();
    }

    close() {
        this.modals.closeWithClick(this.el.checkCartonModal);
        this._onClosed();
    }

    _onClosed() {
        this._dismissProjection();
    }

    _dismissProjection() {
        if (!this.shown) return;

        this.shown = false;
        this.callbacks.onDismiss();
    }

    _renderActions(actions, status = null) {
        const container = this.el.checkCartonActions;
        container.replaceChildren();

        if (status) {
            container.append(this._element('p', `check-verdict check-actions-status ${status.ok ? 'check-ok' : 'check-pending'}`, status.text));
        }

        for (const {label, className, handler} of actions) {
            const button = this._element('button', className, label);
            button.type = 'button';
            button.addEventListener('click', handler);
            container.append(button);
        }
    }

    render(carton, result) {
        const container = this.el.checkCartonResult;
        container.replaceChildren();

        const title = this._element('h3', 'check-carton-title', TEXT.checkCarton.cartonTitle(carton.id));
        const linea = this._element('p', `check-verdict ${result.linea ? 'check-ok' : 'check-pending'}`, TEXT.checkCarton.linea(result));
        const bingo = this._element('p', `check-verdict ${result.bingo ? 'check-ok' : 'check-pending'}`, TEXT.checkCarton.bingo(result));
        container.append(title, linea, bingo);

        result.rows.forEach((row, index) => container.append(this._renderRow(row, index + 1)));
    }

    _renderRow(row, number) {
        const section = this._element('section', `check-row ${row.complete ? 'check-row-complete' : ''}`);
        const heading = this._element('h4', 'check-row-title', TEXT.checkCarton.row(number, row));
        const list = this._element('ul', 'check-songs');

        for (const {song, played} of row.songs) {
            const item = this._element('li', `check-song ${played ? 'check-song-played' : 'check-song-pending'}`);
            const mark = this._element('span', 'check-mark', played ? '✓' : '✗');
            mark.setAttribute('role', 'img');
            mark.setAttribute('aria-label', played ? TEXT.checkCarton.played : TEXT.checkCarton.pending);

            item.append(mark, this._icon(song), this._element('span', 'check-song-title', song.title));
            list.append(item);
        }

        section.append(heading, list);
        return section;
    }

    _icon(song) {
        if (song.iconType === ICON_TYPE.IMAGE) {
            const image = document.createElement('img');
            image.className = 'check-song-icon';
            image.alt = '';
            image.src = song.icon;
            return image;
        }

        return this._element('span', 'check-song-icon', song.icon);
    }

    _element(tag, className, text) {
        const element = document.createElement(tag);
        element.className = className;
        if (text !== undefined) element.textContent = text;
        return element;
    }
}
