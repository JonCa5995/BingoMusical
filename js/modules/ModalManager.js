import {SOUND} from '../constants.js';

export class ModalManager {
    constructor(sounds) {
        this.sounds = sounds;
        this.modals = [];
    }

    openModal(modalElement) {
        modalElement.classList.remove('hidden');
        if (modalElement.showModal) {
            modalElement.showModal();
        }
    }

    closeModal(modalElement) {
        if (modalElement.close) {
            modalElement.close();
        }
        modalElement.classList.add('hidden');
    }

    openWithClick(modalElement) {
        this.sounds.play(SOUND.CLICK);
        this.openModal(modalElement);
    }

    closeWithClick(modalElement) {
        this.sounds.play(SOUND.CLICK);
        this.closeModal(modalElement);
    }

    registerWithCloseButton(modalElement, closeButton) {
        const close = () => this.closeWithClick(modalElement);
        closeButton.addEventListener('click', close);
        this.registerModal(modalElement, close);
        return close;
    }

    isModalOpen(modalElement) {
        return !modalElement.classList.contains('hidden');
    }

    registerModal(element, onClose, {priority = 0, closeOnOutsideClick = true} = {}) {
        this.modals.push({element, onClose, priority});
        this.modals.sort((a, b) => b.priority - a.priority);

        if (closeOnOutsideClick) {
            element.addEventListener('click', (e) => {
                if (e.target === element) onClose();
            });
        }
    }

    checkOpenModals() {
        return this.modals.some(({element}) => this.isModalOpen(element));
    }

    closeModalsOnEscape() {
        const topModal = this.modals.find(({element}) => this.isModalOpen(element));
        topModal?.onClose();
    }
}
