import { THEME } from '../constants.js';
import { TEXT } from '../messages.js';

export class ThemeManager {
    constructor({ preferences, toggleButton, icon, root = document.documentElement, onToggle = () => {} }) {
        this.preferences = preferences;
        this.toggleButton = toggleButton;
        this.icon = icon;
        this.root = root;
        this.onToggle = onToggle;
    }

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
        const dark = theme === THEME.DARK;

        this.root.dataset.theme = theme;
        this.icon.textContent = dark ? '🌙' : '☀️';
        this.toggleButton.setAttribute('title', dark ? TEXT.theme.toLight : TEXT.theme.toDark);
    }
}
