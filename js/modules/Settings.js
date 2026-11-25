import {
    DEFAULT_CARTON_COUNT,
    DEFAULT_EFFECTS_VOLUME,
    DEFAULT_ICON_REVEAL_TIME,
    DEFAULT_MUSIC_VOLUME,
    DEFAULT_PRINT_PRIMARY_COLOR,
    DEFAULT_PRINT_SECONDARY_COLOR,
    DEFAULT_TITLE_REVEAL_TIME,
    MAX_CARTONS_GENERATED,
    MAX_GAME_NAME_LENGTH,
    MAX_REVEAL_TIME_SECONDS,
    THEME
} from '../constants.js';

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

const volume = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1 ? value : undefined;
const integerIn = (min, max) => (value) => Number.isInteger(value) && value >= min && value <= max ? value : undefined;
const color = (value) => typeof value === 'string' && HEX_COLOR.test(value) ? value.toLowerCase() : undefined;
const text = (value) => typeof value === 'string' ? value.trim().slice(0, MAX_GAME_NAME_LENGTH) : undefined;
const theme = (value) => Object.values(THEME).includes(value) ? value : undefined;

const FIELDS = {
    theme: {defaultValue: THEME.DARK, normalize: theme},
    musicVolume: {defaultValue: DEFAULT_MUSIC_VOLUME, normalize: volume},
    effectsVolume: {defaultValue: DEFAULT_EFFECTS_VOLUME, normalize: volume},
    titleRevealTime: {defaultValue: DEFAULT_TITLE_REVEAL_TIME, normalize: integerIn(0, MAX_REVEAL_TIME_SECONDS)},
    iconRevealTime: {defaultValue: DEFAULT_ICON_REVEAL_TIME, normalize: integerIn(0, MAX_REVEAL_TIME_SECONDS)},
    gameName: {defaultValue: '', normalize: text},
    printPrimaryColor: {defaultValue: DEFAULT_PRINT_PRIMARY_COLOR, normalize: color},
    printSecondaryColor: {defaultValue: DEFAULT_PRINT_SECONDARY_COLOR, normalize: color},
    cartonCount: {defaultValue: DEFAULT_CARTON_COUNT, normalize: integerIn(1, MAX_CARTONS_GENERATED)}
};

export const SETTING_KEYS = Object.freeze(Object.keys(FIELDS));

export function defaultSettings() {
    return Object.fromEntries(SETTING_KEYS.map(key => [key, FIELDS[key].defaultValue]));
}

export function sanitizeSettings(raw) {
    const values = {};
    const discarded = [];

    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
        for (const [key, value] of Object.entries(raw)) {
            const normalized = Object.hasOwn(FIELDS, key) ? FIELDS[key].normalize(value) : undefined;

            if (normalized === undefined) {
                discarded.push(key);
            } else {
                values[key] = normalized;
            }
        }
    }

    return {values, applied: Object.keys(values), discarded};
}
