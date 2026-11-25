import { STORAGE_PREFIX, THEME } from '../constants.js';

const KEYS = {
    THEME: `${STORAGE_PREFIX}theme`
};

export class PreferencesStore {
    constructor(storage = globalThis.localStorage) {
        this.storage = storage;
    }

    saveTheme(theme) {
        try {
            this.storage.setItem(KEYS.THEME, theme);
            return true;
        } catch (error) {
            console.error('Error al guardar tema:', error);
            return false;
        }
    }

    loadTheme(defaultTheme = THEME.DARK) {
        try {
            return this.storage.getItem(KEYS.THEME) || defaultTheme;
        } catch (error) {
            console.error('Error al cargar tema:', error);
            return defaultTheme;
        }
    }
}
