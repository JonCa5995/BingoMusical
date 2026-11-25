import test from 'node:test';
import assert from 'node:assert/strict';
import {PreferencesStore} from '../js/modules/PreferencesStore.js';
import {defaultSettings} from '../js/modules/Settings.js';
import {STORAGE_PREFIX, THEME} from '../js/constants.js';

const memoryStorage = (initial = {}) => {
    const data = new Map(Object.entries(initial));
    return {
        getItem: (key) => data.has(key) ? data.get(key) : null,
        setItem: (key, value) => { data.set(key, String(value)); },
        data
    };
};

const silenceErrors = () => {
    const original = console.error;
    console.error = () => {};
    return () => { console.error = original; };
};

test('sin nada guardado devuelve los ajustes por defecto', () => {
    const store = new PreferencesStore(memoryStorage());

    assert.deepEqual(store.loadSettings(), defaultSettings());
    assert.equal(store.loadTheme(), THEME.DARK);
});

test('guarda los ajustes en una sola clave y los recupera al recargar', () => {
    const storage = memoryStorage();

    new PreferencesStore(storage).saveSettings({musicVolume: 0.4, gameName: 'Fiesta', titleRevealTime: 8});
    new PreferencesStore(storage).saveSettings({theme: THEME.LIGHT});
    const loaded = new PreferencesStore(storage).loadSettings();

    assert.equal(storage.data.has(`${STORAGE_PREFIX}settings`), true);
    assert.equal(loaded.musicVolume, 0.4);
    assert.equal(loaded.gameName, 'Fiesta');
    assert.equal(loaded.titleRevealTime, 8);
    assert.equal(loaded.theme, THEME.LIGHT);
    assert.equal(loaded.iconRevealTime, defaultSettings().iconRevealTime);
});

test('guardar un ajuste no borra los demás, y los inválidos no se guardan', () => {
    const storage = memoryStorage();
    const store = new PreferencesStore(storage);

    store.saveSettings({musicVolume: 0.2});
    store.saveSettings({effectsVolume: 5, gameName: 'Hola', desconocido: 1});
    const stored = JSON.parse(storage.data.get(`${STORAGE_PREFIX}settings`));

    assert.deepEqual(stored, {musicVolume: 0.2, gameName: 'Hola'});
});

test('un JSON corrupto o con valores fuera de rango cae a los valores por defecto', () => {
    const restore = silenceErrors();
    try {
        const corrupt = new PreferencesStore(memoryStorage({[`${STORAGE_PREFIX}settings`]: '{no es json'}));
        assert.deepEqual(corrupt.loadSettings(), defaultSettings());

        const outOfRange = new PreferencesStore(memoryStorage({[`${STORAGE_PREFIX}settings`]: JSON.stringify({musicVolume: 9, titleRevealTime: -3, theme: 'rosa'})}));
        assert.deepEqual(outOfRange.loadSettings(), defaultSettings());
    } finally {
        restore();
    }
});

test('recupera el tema guardado por versiones anteriores', () => {
    const store = new PreferencesStore(memoryStorage({[`${STORAGE_PREFIX}theme`]: THEME.LIGHT}));

    assert.equal(store.loadTheme(), THEME.LIGHT);
    assert.equal(store.loadSettings().theme, THEME.LIGHT);
});

test('si el almacenamiento falla, devuelve los valores por defecto y no lanza', () => {
    const restore = silenceErrors();
    try {
        const broken = {getItem() { throw new Error('bloqueado'); }, setItem() { throw new Error('bloqueado'); }};
        const store = new PreferencesStore(broken);

        assert.deepEqual(store.loadSettings(), defaultSettings());
        assert.equal(store.loadTheme(THEME.LIGHT), THEME.LIGHT);
        assert.equal(store.saveSettings({musicVolume: 0.5}), false);
        assert.equal(store.saveTheme(THEME.DARK), false);
    } finally {
        restore();
    }
});

test('sin almacenamiento disponible no lanza', () => {
    const restore = silenceErrors();
    try {
        const store = new PreferencesStore(undefined);

        assert.deepEqual(store.loadSettings(), defaultSettings());
        assert.equal(store.saveSettings({musicVolume: 0.5}), false);
    } finally {
        restore();
    }
});
