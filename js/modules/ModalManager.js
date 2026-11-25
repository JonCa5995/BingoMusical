/**
 * ModalManager Module
 * Registro de los modales de la aplicación: abrir, cerrar, cierre con Escape y clic fuera.
 * Las alertas y confirmaciones están en Dialogs.
 */
import {SOUND} from '../constants.js';

export class ModalManager {
    /**
     * @param {SoundEffects} sounds - Para el clic al abrir y cerrar con openWithClick/closeWithClick
     */
    constructor(sounds) {
        this.sounds = sounds;
        this.modals = [];
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

    /** Abre un modal con el sonido de clic */
    openWithClick(modalElement) {
        this.sounds.play(SOUND.CLICK);
        this.openModal(modalElement);
    }

    /** Cierra un modal con el sonido de clic */
    closeWithClick(modalElement) {
        this.sounds.play(SOUND.CLICK);
        this.closeModal(modalElement);
    }

    /**
     * Registra un modal (Escape, atajos bloqueados y cierre al hacer clic fuera) y conecta su botón de cerrar.
     * Todos los cierres suenan con el clic.
     * @returns {Function} La función que cierra el modal
     */
    registerWithCloseButton(modalElement, closeButton) {
        const close = () => this.closeWithClick(modalElement);
        closeButton.addEventListener('click', close);
        this.registerModal(modalElement, close);
        return close;
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
