/**
 * ModalManager Module
 * Gestiona todos los modales de la aplicación (alertas, confirmaciones, cartones)
 */
import { SOUND } from '../constants.js';
import { DEFAULT_TITLES } from '../messages.js';

export class ModalManager {
    constructor(dom, sounds) {
        this.dom = dom;
        this.sounds = sounds;
        this.confirmCallback = null;
        this.modals = [];

        this._registerOwnModals();
    }

    /**
     * Abre un modal de forma genérica
     */
    openModal(modalElement) {
        modalElement.classList.remove('hidden');
        if (modalElement.showModal) {
            modalElement.showModal();
        }
    }

    /**
     * Cierra un modal de forma genérica
     */
    closeModal(modalElement) {
        if (modalElement.close) {
            modalElement.close();
        }
        modalElement.classList.add('hidden');
    }

    /**
     * Muestra un modal de alerta
     */
    showAlert({message, title = DEFAULT_TITLES.alert}) {
        this.dom.alertTitle.textContent = title;
        // textContent: los mensajes pueden incluir nombres de archivo; los saltos de línea se respetan por CSS
        this.dom.alertMessage.textContent = message;
        this.openModal(this.dom.alertModal);

        const isError = /error|inválido|insuficientes/i.test(title);
        this.sounds.play(isError ? SOUND.ERROR : SOUND.CLICK);
    }

    /**
     * Cierra el modal de alerta
     */
    closeAlertModal() {
        this.closeModal(this.dom.alertModal);
    }

    /**
     * Muestra un modal de confirmación y retorna una promesa
     */
    showConfirm({message, title = DEFAULT_TITLES.confirm}) {
        return new Promise((resolve) => {
            this.dom.confirmTitle.textContent = title;
            this.dom.confirmMessage.textContent = message;
            this.openModal(this.dom.confirmModal);

            this.confirmCallback = resolve;
            this.sounds.play(SOUND.CLICK);
        });
    }

    /**
     * Cierra el modal de confirmación
     */
    closeConfirmModal(result) {
        this.closeModal(this.dom.confirmModal);

        if (this.confirmCallback) {
            this.confirmCallback(result);
            this.confirmCallback = null;
        }
    }


    /**
     * Verifica si un modal está abierto
     * @param {HTMLElement} modalElement - Elemento del modal
     * @returns {boolean} - true si está abierto
     */
    isModalOpen(modalElement) {
        return !modalElement.classList.contains('hidden');
    }

    /**
     * Registra un modal para que lo tengan en cuenta los atajos de teclado y Escape.
     * Añadir un modal nuevo solo requiere registrarlo; no hay que tocar este módulo.
     * @param {HTMLElement} element - Elemento del modal
     * @param {Function} onClose - Cómo se cierra (con su lógica propia: sonidos, limpieza...)
     * @param {Object} [options]
     * @param {number} [options.priority=0] - Con varios abiertos, Escape cierra el de mayor prioridad
     * @param {boolean} [options.closeOnOutsideClick=true] - Cerrar al hacer clic fuera del contenido
     */
    registerModal(element, onClose, {priority = 0, closeOnOutsideClick = true} = {}) {
        this.modals.push({element, onClose, priority});
        // Mantener ordenado de mayor a menor prioridad
        this.modals.sort((a, b) => b.priority - a.priority);

        if (closeOnOutsideClick) {
            element.addEventListener('click', (e) => {
                if (e.target === element) onClose();
            });
        }
    }

    /**
     * Registra los modales propios de este módulo. Se abren encima de los demás,
     * así que tienen prioridad para Escape.
     */
    _registerOwnModals() {
        const options = {priority: 10, closeOnOutsideClick: false};
        this.registerModal(this.dom.confirmModal, () => this.closeConfirmModal(false), options);
        this.registerModal(this.dom.alertModal, () => this.closeAlertModal(), options);
    }

    /**
     * Verifica si algún modal registrado está abierto
     */
    checkOpenModals() {
        return this.modals.some(({element}) => this.isModalOpen(element));
    }

    /**
     * Cierra con Escape el modal abierto de mayor prioridad
     */
    closeModalsOnEscape() {
        const topModal = this.modals.find(({element}) => this.isModalOpen(element));
        topModal?.onClose();
    }
}
