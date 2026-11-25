import {ICON_TYPE, SOUND} from '../constants.js';
import {MSG, TEXT} from '../messages.js';
import {evaluateCarton} from './CartonChecker.js';

export class CartonCheckModal {
    constructor({elements, openButton, game, modals, dialogs, sounds}) {
        this.el = elements;
        this.openButton = openButton;
        this.game = game;
        this.modals = modals;
        this.dialogs = dialogs;
        this.sounds = sounds;
    }

    init() {
        const el = this.el;

        this.openButton.addEventListener('click', () => this.open());
        this.modals.registerWithCloseButton(el.checkCartonModal, el.closeCheckCartonModalBtn);
        el.checkCartonSubmitBtn.addEventListener('click', () => this.check());
        el.checkCartonNumberInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.check();
        });
    }

    open() {
        const count = this.game.getCartonesCount();

        if (count === 0) {
            this.dialogs.showAlert(MSG.checkCarton.noCartones);
            return;
        }

        this.el.checkCartonNumberInput.max = count;
        this.el.checkCartonResult.replaceChildren();
        this.modals.openWithClick(this.el.checkCartonModal);
        this.el.checkCartonNumberInput.focus();
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

        this.sounds.play(result.linea ? SOUND.WIN : SOUND.CLICK);
        this.render(carton, result);
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
