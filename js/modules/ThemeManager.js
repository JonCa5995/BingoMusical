/**
 * ThemeManager Module
 * Tema claro/oscuro: aplicarlo, alternarlo y recordarlo entre visitas.
 */
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
        this.apply(this.preferences.loadTheme('dark'));
        this.toggleButton.addEventListener('click', () => this.toggle());
    }

    getCurrent() {
        return this.root.dataset.theme || 'dark';
    }

    toggle() {
        const newTheme = this.getCurrent() === 'dark' ? 'light' : 'dark';
        this.apply(newTheme);
        this.preferences.saveTheme(newTheme);
        this.onToggle();
    }

    apply(theme) {
        this.root.dataset.theme = theme;
        this.icon.textContent = theme === 'dark' ? '🌙' : '☀️';
        this.toggleButton.setAttribute('title', theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro');
    }
}
