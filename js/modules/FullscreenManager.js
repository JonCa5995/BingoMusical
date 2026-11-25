/**
 * FullscreenManager Module
 * Pantalla completa: alternarla y reflejar su estado en el botón y en <body>.
 */
export class FullscreenManager {
    /**
     * @param {Object} deps
     * @param {HTMLElement} deps.button - Botón de pantalla completa
     * @param {Document} [deps.doc] - Documento (inyectable para pruebas)
     * @param {Function} [deps.onToggle] - Se llama al alternar (p. ej. para sonar un clic)
     */
    constructor({ button, doc = document, onToggle = () => {} }) {
        this.button = button;
        this.doc = doc;
        this.onToggle = onToggle;
    }

    /**
     * Escucha el botón y los cambios de pantalla completa (incluida la salida con Esc del navegador)
     */
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
        this.button.setAttribute('aria-label', active ? 'Salir de pantalla completa' : 'Activar pantalla completa');
    }
}
