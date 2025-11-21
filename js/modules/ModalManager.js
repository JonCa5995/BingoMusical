/**
 * ModalManager Module
 * Gestiona todos los modales de la aplicación (alertas, confirmaciones, cartones)
 */
export class ModalManager {
    constructor(dom, audio) {
        this.dom = dom;
        this.audio = audio;
        this.confirmCallback = null;
        this.shouldRender = false;
    }

    /**
     * Muestra un modal de alerta
     */
    showAlert(message, title = 'Información') {
        this.dom.alertTitle.textContent = title;
        this.dom.alertMessage.innerHTML = message;
        this.dom.alertModal.classList.remove('hidden');
        
        if (this.dom.alertModal.showModal) {
            this.dom.alertModal.showModal();
        }
        
        const isError = /error|inválido|insuficientes/i.test(title);
        this.audio.playEffect(isError ? 'error' : 'click');
    }

    /**
     * Cierra el modal de alerta
     */
    closeAlertModal(renderCallback) {
        if (this.shouldRender && renderCallback) {
            renderCallback();
            this.shouldRender = false;
        }
        
        if (this.dom.alertModal.close) {
            this.dom.alertModal.close();
        }
        
        this.dom.alertModal.classList.add('hidden');
    }

    /**
     * Muestra un modal de confirmación y retorna una promesa
     */
    showConfirm(message, title = 'Confirmar') {
        return new Promise((resolve) => {
            this.dom.confirmTitle.textContent = title;
            this.dom.confirmMessage.textContent = message;
            this.dom.confirmModal.classList.remove('hidden');
            
            if (this.dom.confirmModal.showModal) {
                this.dom.confirmModal.showModal();
            }
            
            this.confirmCallback = resolve;
            this.audio.playEffect('click');
        });
    }

    /**
     * Cierra el modal de confirmación
     */
    closeConfirmModal(result) {
        if (this.dom.confirmModal.close) {
            this.dom.confirmModal.close();
        }
        
        this.dom.confirmModal.classList.add('hidden');
        
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

        this.dom.cartonModal.classList.remove('hidden');
        
        if (this.dom.cartonModal.showModal) {
            this.dom.cartonModal.showModal();
        }
        
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
        if (this.dom.cartonModal.close) {
            this.dom.cartonModal.close();
        }
        
        this.dom.cartonModal.classList.add('hidden');
    }

    /**
     * Verifica si algún modal está abierto
     */
    checkOpenModals() {
        return !this.dom.iconModal.classList.contains('hidden') ||
            !this.dom.cartonModal.classList.contains('hidden') ||
            !this.dom.configModal.classList.contains('hidden') ||
            !this.dom.confirmModal.classList.contains('hidden') ||
            !this.dom.alertModal.classList.contains('hidden');
    }

    /**
     * Cierra modales con la tecla Escape
     */
    closeModalsOnEscape(iconCloseCallback) {
        if (!this.dom.iconModal.classList.contains('hidden')) {
            if (iconCloseCallback) iconCloseCallback();
        } else if (!this.dom.cartonModal.classList.contains('hidden')) {
            this.closeCartonModal();
        } else if (!this.dom.configModal.classList.contains('hidden')) {
            if (this.dom.configModal.close) {
                this.dom.configModal.close();
            }
            this.dom.configModal.classList.add('hidden');
        } else if (!this.dom.confirmModal.classList.contains('hidden')) {
            this.closeConfirmModal(false);
        } else if (!this.dom.alertModal.classList.contains('hidden')) {
            this.closeAlertModal();
        }
    }

    /**
     * Marca que se debe renderizar al cerrar el modal
     */
    setShouldRender(value) {
        this.shouldRender = value;
    }

    /**
     * Obtiene el callback de confirmación
     */
    getConfirmCallback() {
        return this.confirmCallback;
    }
}
