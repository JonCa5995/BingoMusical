import {TEXT} from '../messages.js';

export class FullscreenManager {
    constructor({ button, doc = document, onToggle = () => {} }) {
        this.button = button;
        this.doc = doc;
        this.onToggle = onToggle;
    }

    init() {
        this.button.addEventListener('click', () => this.toggle());
        this.doc.addEventListener('fullscreenchange', () => this.render());
    }

    isActive() {
        return Boolean(this.doc.fullscreenElement);
    }

    toggle() {
        this.onToggle();

        if (this.isActive()) {
            this.doc.exitFullscreen().catch(err => console.warn('Error al salir de pantalla completa:', err));
        } else {
            this.doc.documentElement.requestFullscreen().catch(err => {
                console.warn('Error al entrar en pantalla completa:', err);
            });
        }
    }

    render() {
        const active = this.isActive();
        this.doc.body.classList.toggle('fullscreen', active);
        this.button.innerHTML = `<span class="fullscreen-icon" aria-hidden="true">${active ? '⊗' : '⛶'}</span>`;
        this.button.setAttribute('aria-label', active ? TEXT.fullscreen.exit : TEXT.fullscreen.enter);
    }
}
