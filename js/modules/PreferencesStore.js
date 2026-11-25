/**
 * PreferencesStore Module
 * Preferencias del usuario que se recuerdan entre visitas (por ahora, el tema).
 */
const STORAGE_PREFIX = 'bingoMusical_';
const KEYS = {
    THEME: `${STORAGE_PREFIX}theme`
};

export class PreferencesStore {
    /**
     * @param {Storage} [storage] - Almacén clave/valor (localStorage por defecto; inyectable para pruebas)
     */
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

    loadTheme(defaultTheme = 'dark') {
        try {
            return this.storage.getItem(KEYS.THEME) || defaultTheme;
        } catch (error) {
            console.error('Error al cargar tema:', error);
            return defaultTheme;
        }
    }
}
