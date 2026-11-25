import {ALERT_KIND, SOUND} from '../constants.js';
import {DEFAULT_TITLES} from '../messages.js';

export class Dialogs {
    constructor(elements, modals, sounds) {
        this.el = elements;
        this.modals = modals;
        this.sounds = sounds;
        this.confirmCallback = null;

        elements.confirmCancelBtn.addEventListener('click', () => this.closeConfirm(false));
        elements.confirmAcceptBtn.addEventListener('click', () => this.closeConfirm(true));
        elements.alertOkBtn.addEventListener('click', () => this.closeAlert());

        const options = {priority: 10, closeOnOutsideClick: false};
        modals.registerModal(elements.confirmModal, () => this.closeConfirm(false), options);
        modals.registerModal(elements.alertModal, () => this.closeAlert(), options);
    }

    showAlert({message, title = DEFAULT_TITLES.alert, kind}) {
        this.el.alertTitle.textContent = title;
        this.el.alertMessage.textContent = message;
        this.modals.openModal(this.el.alertModal);

        this.sounds.play(kind === ALERT_KIND.ERROR ? SOUND.ERROR : SOUND.CLICK);
    }

    closeAlert() {
        this.modals.closeModal(this.el.alertModal);
    }

    showConfirm({message, title = DEFAULT_TITLES.confirm}) {
        return new Promise((resolve) => {
            this.el.confirmTitle.textContent = title;
            this.el.confirmMessage.textContent = message;
            this.modals.openModal(this.el.confirmModal);

            this.confirmCallback = resolve;
            this.sounds.play(SOUND.CLICK);
        });
    }

    closeConfirm(result) {
        this.modals.closeModal(this.el.confirmModal);

        if (this.confirmCallback) {
            this.confirmCallback(result);
            this.confirmCallback = null;
        }
    }
}
