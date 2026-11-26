import {SETTINGS_FILE_TYPE, SETTINGS_FILE_VERSION} from '../constants.js';
import {TEXT} from '../messages.js';
import {sanitizeSettings} from './Settings.js';

export function buildSettingsFile(settings, now = new Date()) {
    return {
        type: SETTINGS_FILE_TYPE,
        version: SETTINGS_FILE_VERSION,
        date: now.toISOString(),
        settings: sanitizeSettings(settings).values
    };
}

export function parseSettingsFile(text) {
    let data;

    try {
        data = JSON.parse(text);
    } catch {
        return {success: false, error: TEXT.settings.invalidJson};
    }

    if (data?.type !== SETTINGS_FILE_TYPE || typeof data.settings !== 'object' || data.settings === null || Array.isArray(data.settings)) {
        return {success: false, error: TEXT.settings.notSettings};
    }

    if (!Number.isInteger(data.version) || data.version < 1) {
        return {success: false, error: TEXT.settings.notSettings};
    }

    if (data.version > SETTINGS_FILE_VERSION) {
        return {success: false, error: TEXT.settings.newerVersion(data.version)};
    }

    const {values, applied, discarded} = sanitizeSettings(data.settings);
    return {success: true, values, applied, discarded};
}
