import test from 'node:test';
import assert from 'node:assert/strict';
import {installDocument} from './helpers/fakeDom.js';
import {STORAGE_PREFIX} from '../js/constants.js';

const KEY = `${STORAGE_PREFIX}settings`;
const data = new Map([[KEY, JSON.stringify({
    musicVolume: 0.4, effectsVolume: 0.2, titleRevealTime: 9, iconRevealTime: 3, gameName: 'Fiesta de prueba',
    printPrimaryColor: '#112233', printSecondaryColor: '#445566', cartonCount: 25, theme: 'light', clipSeconds: 20, randomClipStart: true
})]]);

globalThis.localStorage = {
    getItem: (key) => data.has(key) ? data.get(key) : null,
    setItem: (key, value) => { data.set(key, String(value)); }
};

const dom = installDocument();
const originalWarn = console.warn;
console.warn = () => {};

await import('../js/app.js');

const {get} = dom;
const stored = () => JSON.parse(data.get(KEY));
const settle = async () => { for (let i = 0; i < 5; i++) await new Promise(resolve => setImmediate(resolve)); };
const isOpen = (id) => !get(id)._cls.has('hidden');

test.after(() => { console.warn = originalWarn; });

test('al arrancar aplica los ajustes guardados a los volúmenes', () => {
    assert.equal(get('#music-volume').value, 40);
    assert.equal(get('#music-volume').attrs['aria-valuenow'], '40');
    assert.equal(get('#music-volume-value').textContent, '40%');
    assert.equal(get('#effects-volume').value, 20);
    assert.equal(get('#audio-player').volume, 0.4);
});

test('al arrancar aplica los tiempos de revelado, el nombre y los datos de cartones', () => {
    assert.equal(get('#title-reveal-time').value, 9);
    assert.equal(get('#icon-reveal-value').textContent, '3 segundos');
    assert.equal(get('#game-name-input').value, 'Fiesta de prueba');
    assert.equal(get('#carton-count').value, 25);
    assert.equal(get('#print-primary-color').value, '#112233');
    assert.equal(get('q:.color-preview-print').style['background-color'], '#112233');
    assert.equal(get('q:.color-preview-print-secondary').style['background-color'], '#445566');
});

test('al arrancar aplica el fragmento guardado a los controles de la configuración', () => {
    assert.equal(get('#clip-seconds').value, 20);
    assert.equal(get('#clip-seconds-value').textContent, '20 segundos');
    assert.equal(get('#random-clip-start').checked, true);
    assert.equal(get('#random-clip-start').disabled, false);
});

test('al arrancar aplica el tema guardado', () => {
    assert.equal(document.documentElement.dataset.theme, 'light');
});

test('mover un volumen lo guarda sin perder el resto', () => {
    get('#music-volume').fire('input', {target: {value: '55', setAttribute() {}}});

    assert.equal(stored().musicVolume, 0.55);
    assert.equal(stored().gameName, 'Fiesta de prueba');
    assert.equal(stored().titleRevealTime, 9);
});

test('cambiar el nombre del juego lo guarda', () => {
    get('#game-name-input').fire('input', {target: {value: '  Otro nombre '}});

    assert.equal(stored().gameName, 'Otro nombre');
});

test('guardar la configuración guarda los tiempos', () => {
    get('#config-btn').fire('click');
    get('#title-reveal-time').value = '12';
    get('#icon-reveal-time').value = '20';
    get('#clip-seconds').value = '35';
    get('#random-clip-start').checked = false;
    get('#save-config-btn').fire('click');
    get('#alert-ok').fire('click');

    assert.equal(stored().titleRevealTime, 12);
    assert.equal(stored().iconRevealTime, 20);
    assert.equal(stored().clipSeconds, 35);
    assert.equal(stored().randomClipStart, false);
});

test('importar ajustes los aplica en vivo y los guarda', async () => {
    const file = {text: async () => JSON.stringify({type: 'settings', version: 1, settings: {
        musicVolume: 0.8, effectsVolume: 0.1, titleRevealTime: 2, gameName: 'Importado', printPrimaryColor: '#abcdef', cartonCount: 7, theme: 'dark', clipSeconds: 45, randomClipStart: true, basura: 1
    }})};

    get('#import-settings-input').fire('change', {target: {files: [file], value: 'ruta'}});
    await settle();

    assert.equal(get('#music-volume').value, 80);
    assert.equal(get('#effects-volume-value').textContent, '10%');
    assert.equal(get('#title-reveal-time').value, 2);
    assert.equal(get('#title-reveal-value').textContent, '2 segundos');
    assert.equal(get('#game-name-input').value, 'Importado');
    assert.equal(get('#carton-count').value, 7);
    assert.equal(get('q:.color-preview-print').style['background-color'], '#abcdef');
    assert.equal(document.documentElement.dataset.theme, 'dark');
    assert.equal(get('#clip-seconds').value, 45);
    assert.equal(get('#random-clip-start').checked, true);
    assert.equal(isOpen('#alert-modal'), true);

    const saved = stored();
    assert.equal(saved.clipSeconds, 45);
    assert.equal(saved.randomClipStart, true);
    assert.equal(saved.musicVolume, 0.8);
    assert.equal(saved.titleRevealTime, 2);
    assert.equal(saved.gameName, 'Importado');
    assert.equal(saved.theme, 'dark');
    assert.equal('basura' in saved, false);
    get('#alert-ok').fire('click');
});

test('importar un archivo que no es de ajustes avisa y deja todo como estaba', async () => {
    const before = data.get(KEY);
    const file = {text: async () => JSON.stringify({name: 'una lista', songs: []})};

    get('#import-settings-input').fire('change', {target: {files: [file], value: 'ruta'}});
    await settle();

    assert.equal(data.get(KEY), before);
    assert.equal(get('#music-volume').value, 80);
    assert.equal(isOpen('#alert-modal'), true);
});
