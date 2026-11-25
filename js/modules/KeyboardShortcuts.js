/**
 * KeyboardShortcuts Module
 * Registro de atajos de teclado: añadir un atajo nuevo es registrarlo, sin tocar
 * la gestión del teclado. La ayuda se genera a partir del propio registro.
 */
import { TEXT } from '../messages.js';

export class KeyboardShortcuts {
    /**
     * @param {Function} isModalOpen - Devuelve true si hay algún modal abierto
     */
    constructor(isModalOpen) {
        this.isModalOpen = isModalOpen;
        this.shortcuts = new Map();
    }

    /**
     * Registra un atajo
     * @param {string} key - Valor de KeyboardEvent.key en minúsculas (' ', 'n', 'escape', '?')
     * @param {Object} shortcut
     * @param {Function} shortcut.action - Qué hace el atajo
     * @param {string} shortcut.label - Nombre de la tecla para la ayuda (p. ej. 'ESPACIO')
     * @param {string} shortcut.description - Descripción para la ayuda
     * @param {string} [shortcut.icon] - Emoji que acompaña a la línea de ayuda
     * @param {boolean} [shortcut.allowInModal=false] - Funciona aunque haya un modal abierto
     * @param {boolean} [shortcut.preventDefault=true] - Evitar la acción por defecto del navegador
     */
    register(key, { action, label, description, icon = '', allowInModal = false, preventDefault = true }) {
        this.shortcuts.set(key, { action, label, description, icon, allowInModal, preventDefault });
        return this;
    }

    /**
     * Empieza a escuchar el teclado
     */
    attach(target = document) {
        target.addEventListener('keydown', (e) => this._handleKeydown(e));
    }

    _handleKeydown(e) {
        // Ignorar atajos si estamos escribiendo en un input o textarea
        const tagName = e.target.tagName?.toLowerCase();
        if (tagName === 'input' || tagName === 'textarea' || e.target.isContentEditable) {
            return;
        }

        const shortcut = this.shortcuts.get(e.key.toLowerCase());
        if (!shortcut) return;

        // Con un modal abierto solo funcionan los atajos que lo permiten (Escape)
        if (!shortcut.allowInModal && this.isModalOpen()) return;

        if (shortcut.preventDefault) e.preventDefault();
        shortcut.action();
    }

    /**
     * Texto de ayuda con todos los atajos registrados
     */
    getHelpText() {
        const lines = [...this.shortcuts.values()].map(({ icon, label, description }) =>
            `${icon} ${label} → ${description}`.trim()
        );
        return [TEXT.shortcuts.helpHeader, '', ...lines].join('\n');
    }
}
