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
     * @param {Object} elements - Los elementos de los diálogos (dom.dialogs)
     * @param {ModalManager} modals - Donde se registran los dos diálogos
     * @param {SoundEffects} sounds
     */
    constructor(elements, modals, sounds) {
        this.el = elements;
        this.modals = modals;
        this.sounds = sounds;
        this.confirmCallback = null;

        elements.confirmCancelBtn.addEventListener('click', () => this.closeConfirm(false));
        elements.confirmAcceptBtn.addEventListener('click', () => this.closeConfirm(true));
        elements.alertOkBtn.addEventListener('click', () => this.closeAlert());

        // Se abren encima de cualquier otro modal, así que Escape los cierra primero
        const options = {priority: 10, closeOnOutsideClick: false};
        modals.registerModal(elements.confirmModal, () => this.closeConfirm(false), options);
        modals.registerModal(elements.alertModal, () => this.closeAlert(), options);
    }

    /**
     * Muestra un aviso
     * @param {{message: string, title?: string}} alert
     */
    showAlert({message, title = DEFAULT_TITLES.alert}) {
        this.el.alertTitle.textContent = title;
        // textContent: los mensajes pueden incluir nombres de archivo; los saltos de línea se respetan por CSS
        this.el.alertMessage.textContent = message;
        this.modals.openModal(this.el.alertModal);

        this.sounds.play(ERROR_TITLE.test(title) ? SOUND.ERROR : SOUND.CLICK);
    }

    closeAlert() {
        this.modals.closeModal(this.el.alertModal);
    }

    /**
     * Pide confirmación
     * @param {{message: string, title?: string}} confirmation
     * @returns {Promise<boolean>} true si el usuario acepta
     */
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
