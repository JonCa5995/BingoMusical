/**
 * ThemeManager Module
 * Tema claro/oscuro: aplicarlo, alternarlo y recordarlo entre visitas.
 */
import { THEME } from '../constants.js';
import { TEXT } from '../messages.js';

export class ThemeManager {
    /**
     * @param {Object} deps
     * @param {PreferencesStore} deps.preferences - Dónde se guarda el tema elegido
     * @param {HTMLElement} deps.toggleButton - Botón que alterna el tema
     * @param {HTMLElement} deps.icon - Icono dentro del botón
     * @param {HTMLElement} [deps.root] - Elemento que recibe data-theme (inyectable para pruebas)
     * @param {Function} [deps.onToggle] - Se llama al alternar (p. ej. para sonar un clic)
     */
    constructor({ preferences, toggleButton, icon, root = document.documentElement, onToggle = () => {} }) {
        this.preferences = preferences;
        this.toggleButton = toggleButton;
        this.icon = icon;
        this.root = root;
        this.onToggle = onToggle;
    }

    /**
     * Aplica el tema guardado y escucha el botón
     */
    init() {
        this.apply(this.preferences.loadTheme(THEME.DARK));
        this.toggleButton.addEventListener('click', () => this.toggle());
    }

    getCurrent() {
        return this.root.dataset.theme || THEME.DARK;
    }

    toggle() {
        const newTheme = this.getCurrent() === THEME.DARK ? THEME.LIGHT : THEME.DARK;
        this.apply(newTheme);
        this.preferences.saveTheme(newTheme);
        this.onToggle();
    }

    apply(theme) {
        this.root.dataset.theme = theme;
        this.icon.textContent = theme === THEME.DARK ? '🌙' : '☀️';
        this.toggleButton.setAttribute('title', theme === THEME.DARK ? TEXT.theme.toLight : TEXT.theme.toDark);
    }
}
