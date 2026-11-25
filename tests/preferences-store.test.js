import test from 'node:test';
import assert from 'node:assert/strict';
import {PreferencesStore} from '../js/modules/PreferencesStore.js';
import {STORAGE_PREFIX, THEME} from '../js/constants.js';

const memoryStorage = (initial = {}) => {
    const data = new Map(Object.entries(initial));
    return {
        getItem: (key) => data.has(key) ? data.get(key) : null,
        setItem: (key, value) => { data.set(key, String(value)); },
        data
    };
};

test('guarda y carga el tema con el prefijo de la aplicación', () => {
    const storage = memoryStorage();
    const store = new PreferencesStore(storage);

    assert.equal(store.loadTheme(), THEME.DARK);
    assert.equal(store.saveTheme(THEME.LIGHT), true);
    assert.equal(storage.data.get(`${STORAGE_PREFIX}theme`), THEME.LIGHT);
    assert.equal(store.loadTheme(), THEME.LIGHT);
});

test('si el almacenamiento falla, devuelve el valor por defecto y no lanza', () => {
    const originalError = console.error;
    console.error = () => {};
    try {
        const broken = {getItem() { throw new Error('bloqueado'); }, setItem() { throw new Error('bloqueado'); }};
        const store = new PreferencesStore(broken);

        assert.equal(store.loadTheme(THEME.LIGHT), THEME.LIGHT);
        assert.equal(store.saveTheme(THEME.DARK), false);
    } finally {
        console.error = originalError;
    }
});
