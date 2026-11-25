import {STORAGE_PREFIX, THEME} from '../constants.js';
import {defaultSettings, sanitizeSettings} from './Settings.js';

const KEYS = {
    SETTINGS: `${STORAGE_PREFIX}settings`,
    LEGACY_THEME: `${STORAGE_PREFIX}theme`
};

export class PreferencesStore {
    constructor(storage = globalThis.localStorage) {
        this.storage = storage;
    }

    _readStored() {
        try {
            const stored = this.storage.getItem(KEYS.SETTINGS);
            const parsed = stored ? JSON.parse(stored) : {};
            const legacyTheme = this.storage.getItem(KEYS.LEGACY_THEME);

            if (legacyTheme && !(parsed && typeof parsed === 'object' && 'theme' in parsed)) {
                return sanitizeSettings({...parsed, theme: legacyTheme}).values;
            }

            return sanitizeSettings(parsed).values;
        } catch (error) {
            console.error('Error al cargar ajustes:', error);
            return {};
        }
    }

    loadSettings() {
        return {...defaultSettings(), ...this._readStored()};
    }

    saveSettings(partial) {
        try {
            const {values} = sanitizeSettings(partial);
            this.storage.setItem(KEYS.SETTINGS, JSON.stringify({...this._readStored(), ...values}));
            return true;
        } catch (error) {
            console.error('Error al guardar ajustes:', error);
            return false;
        }
    }

    saveTheme(theme) {
        return this.saveSettings({theme});
    }

    loadTheme(defaultTheme = THEME.DARK) {
        return this._readStored().theme ?? defaultTheme;
    }
}
