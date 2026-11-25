/**
 * Dialogs Module
 * Diálogos de alerta (aviso con un botón) y de confirmación (aceptar o cancelar, con promesa).
 * Se registra en ModalManager y conecta sus propios botones.
 */
import {SOUND} from '../constants.js';
import {DEFAULT_TITLES} from '../messages.js';

/** Los títulos con estas palabras suenan como error */
const ERROR_TITLE = /error|inválido|insuficientes/i;

export class Dialogs {
    /**
     * @param {DOMElements} dom
     * @param {ModalManager} modals - Donde se registran los dos diálogos
     * @param {SoundEffects} sounds
     */
    constructor(dom, modals, sounds) {
        this.dom = dom;
        this.modals = modals;
        this.sounds = sounds;
        this.confirmCallback = null;

        dom.confirmCancelBtn.addEventListener('click', () => this.closeConfirm(false));
        dom.confirmAcceptBtn.addEventListener('click', () => this.closeConfirm(true));
        dom.alertOkBtn.addEventListener('click', () => this.closeAlert());

        // Se abren encima de cualquier otro modal, así que Escape los cierra primero
        const options = {priority: 10, closeOnOutsideClick: false};
        modals.registerModal(dom.confirmModal, () => this.closeConfirm(false), options);
        modals.registerModal(dom.alertModal, () => this.closeAlert(), options);
    }

    /**
     * Muestra un aviso
     * @param {{message: string, title?: string}} alert
     */
    showAlert({message, title = DEFAULT_TITLES.alert}) {
        this.dom.alertTitle.textContent = title;
        // textContent: los mensajes pueden incluir nombres de archivo; los saltos de línea se respetan por CSS
        this.dom.alertMessage.textContent = message;
        this.modals.openModal(this.dom.alertModal);

        this.sounds.play(ERROR_TITLE.test(title) ? SOUND.ERROR : SOUND.CLICK);
    }

    closeAlert() {
        this.modals.closeModal(this.dom.alertModal);
    }

    /**
     * Pide confirmación
     * @param {{message: string, title?: string}} confirmation
     * @returns {Promise<boolean>} true si el usuario acepta
     */
    showConfirm({message, title = DEFAULT_TITLES.confirm}) {
        return new Promise((resolve) => {
            this.dom.confirmTitle.textContent = title;
            this.dom.confirmMessage.textContent = message;
            this.modals.openModal(this.dom.confirmModal);

            this.confirmCallback = resolve;
            this.sounds.play(SOUND.CLICK);
        });
    }

    closeConfirm(result) {
        this.modals.closeModal(this.dom.confirmModal);

        if (this.confirmCallback) {
            this.confirmCallback(result);
            this.confirmCallback = null;
        }
    }
}
