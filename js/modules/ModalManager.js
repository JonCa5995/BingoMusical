/**
 * ModalManager Module
 * Gestiona todos los modales de la aplicación (alertas, confirmaciones, cartones)
 */
export class ModalManager {
    constructor(dom, audio) {
        this.dom = dom;
        this.audio = audio;
        this.confirmCallback = null;
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
    showAlert(message, title = 'Información') {
        this.dom.alertTitle.textContent = title;
        this.dom.alertMessage.innerHTML = message;
        this.openModal(this.dom.alertModal);

        const isError = /error|inválido|insuficientes/i.test(title);
        this.audio.playEffect(isError ? 'error' : 'click');
    }

    /**
     * Cierra el modal de alerta
     */
    closeAlertModal(renderCallback) {
        if (renderCallback) {
            renderCallback();
        }
        this.closeModal(this.dom.alertModal);
    }

    /**
     * Muestra un modal de confirmación y retorna una promesa
     */
    showConfirm(message, title = 'Confirmar') {
        return new Promise((resolve) => {
            this.dom.confirmTitle.textContent = title;
            this.dom.confirmMessage.textContent = message;
            this.openModal(this.dom.confirmModal);

            this.confirmCallback = resolve;
            this.audio.playEffect('click');
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
     * Abre el modal de generación de cartones
     */
    openCartonModal(totalSongs, minRequired, updatePreviewCallback) {
        if (totalSongs < minRequired) {
            this.showAlert(
                `Necesitas al menos ${minRequired} canciones cargadas para poder generar cartones.`,
                'Canciones Insuficientes'
            );
            return;
        }

        this.openModal(this.dom.cartonModal);

        // Generar vista previa inicial
        if (updatePreviewCallback) {
            updatePreviewCallback();
        }
        
        this.audio.playEffect('click');
    }

    /**
     * Cierra el modal de cartones
     */
    closeCartonModal() {
        this.closeModal(this.dom.cartonModal);
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
     * Configura el cierre de un modal al hacer click fuera del contenido
     * @param {HTMLElement} modalElement - Elemento del modal
     * @param {Function} closeCallback - Función a ejecutar para cerrar el modal
     */
    setupOutsideClickClose(modalElement, closeCallback) {
        modalElement.addEventListener('click', (e) => {
            if (e.target === modalElement) {
                closeCallback();
            }
        });
    }

    /**
     * Verifica si algún modal está abierto
     */
    checkOpenModals() {
        return this.isModalOpen(this.dom.iconModal) ||
            this.isModalOpen(this.dom.cartonModal) ||
            this.isModalOpen(this.dom.configModal) ||
            this.isModalOpen(this.dom.confirmModal) ||
            this.isModalOpen(this.dom.alertModal);
    }

    /**
     * Cierra modales con la tecla Escape
     */
    closeModalsOnEscape(iconCloseCallback) {
        if (this.isModalOpen(this.dom.iconModal)) {
            if (iconCloseCallback) iconCloseCallback();
        } else if (this.isModalOpen(this.dom.cartonModal)) {
            this.closeCartonModal();
        } else if (this.isModalOpen(this.dom.configModal)) {
            this.closeModal(this.dom.configModal);
        } else if (this.isModalOpen(this.dom.confirmModal)) {
            this.closeConfirmModal(false);
        } else if (this.isModalOpen(this.dom.alertModal)) {
            this.closeAlertModal();
        }
    }
}
