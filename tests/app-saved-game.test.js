import test from 'node:test';
import assert from 'node:assert/strict';
import {installDocument} from './helpers/fakeDom.js';
import {createFakeIndexedDb} from './helpers/fakeIndexedDb.js';
import {clone, makeSnapshot} from './helpers/snapshot.js';
import {createIndexedDbStorage} from '../js/modules/GameStateStore.js';

const idb = createFakeIndexedDb();
globalThis.indexedDB = idb;
await createIndexedDbStorage(idb).set('current', makeSnapshot({songCount: 27, played: 4, cartones: 3, name: 'Guardada'}));

const dom = installDocument();
const originalWarn = console.warn;
const originalError = console.error;
console.warn = () => {};
console.error = () => {};

await import('../js/app.js');

const {get} = dom;
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const settle = async () => { for (let i = 0; i < 8; i++) await new Promise(resolve => setImmediate(resolve)); };
const isOpen = (id) => !get(id)._cls.has('hidden');
const savedGame = () => idb.databases.get('bingoMusical')?.get('game')?.get('current');
const importFile = (data) => get('#import-file').fire('change', {target: {files: [{text: async () => JSON.stringify(data)}], value: 'ruta'}});

await settle();

test.after(() => {
    console.warn = originalWarn;
    console.error = originalError;
});

test('al arrancar con una partida guardada pregunta si se quiere reanudar, con el resumen', () => {
    assert.equal(isOpen('#confirm-modal'), true);
    assert.ok(get('#confirm-message').textContent.includes('27 canciones (4 reproducidas) y 3 cartones'));
});

test('al aceptar, restaura canciones, historial, nombre, cartones y estado de la partida', async () => {
    get('#confirm-accept').fire('click');
    await settle();

    assert.equal(isOpen('#confirm-modal'), false);
    assert.equal(isOpen('#alert-modal'), true);
    assert.equal(get('#alert-title').textContent, 'Partida Restaurada');
    assert.ok(get('#alert-message').textContent.includes('Vincular audio'));

    const items = get('#songs-list').children.filter(child => String(child.className).includes('song-item'));
    assert.equal(items.length, 27);
    assert.equal(get('#history-grid').children.length, 4);
    assert.equal(get('#game-name-input').value, 'Guardada');
    assert.ok(get('#play-btn').innerHTML.includes('Siguiente'));
    assert.equal(get('#played-counter').textContent, '4');
    assert.equal(get('#total-counter').textContent, '0');

    get('#alert-ok').fire('click');
    get('#generate-cartones').fire('click');
    assert.ok(get('#existing-cartones-info').textContent.includes('3 cartón'));
    get('#close-carton-options-modal').fire('click');
});

test('tras restaurar, un cambio se vuelve a guardar en el navegador pasado el retardo', async () => {
    get('#game-name-input').fire('input', {target: {value: 'Nombre nuevo'}});
    await sleep(900);

    assert.equal(savedGame().settings.gameName, 'Nombre nuevo');
    assert.equal(savedGame().songs.length, 27);
    assert.equal(savedGame().songs.filter(song => song.played).length, 4);
});

test('exportar la partida descarga el archivo y avisa de que no incluye el audio', () => {
    get('#export-game-btn').fire('click');

    assert.equal(isOpen('#alert-modal'), true);
    assert.equal(get('#alert-title').textContent, 'Partida Exportada');
    assert.ok(get('#alert-message').textContent.includes('No incluye los archivos de audio'));
    get('#alert-ok').fire('click');
});

test('importar una partida inválida muestra un error y no cambia nada', async () => {
    importFile({type: 'game', version: 1, songs: [{id: -1, title: 'x', icon: '🎵'}], cartones: [], game: {}});
    await settle();

    assert.equal(isOpen('#alert-modal'), true);
    assert.equal(get('#alert-title').textContent, 'Error de Importación');
    assert.ok(get('#alert-message').textContent.includes('no es válido'));
    assert.equal(isOpen('#confirm-modal'), false);
    get('#alert-ok').fire('click');
});

test('importar una partida válida con una en curso pide confirmación, y si se cancela no cambia nada', async () => {
    importFile(clone(makeSnapshot({songCount: 30, played: 7, cartones: 2, name: 'Importada'})));
    await settle();

    assert.equal(isOpen('#confirm-modal'), true);
    assert.equal(get('#confirm-title').textContent, 'Reemplazar Partida');
    get('#confirm-cancel').fire('click');
    await settle();

    assert.notEqual(get('#game-name-input').value, 'Importada');
    assert.equal(get('#history-grid').children.length, 4);
    assert.equal(get('#played-counter').textContent, '4');
});

test('al confirmar, la partida importada sustituye a la actual', async () => {
    importFile(clone(makeSnapshot({songCount: 30, played: 7, cartones: 2, name: 'Importada'})));
    await settle();
    get('#confirm-accept').fire('click');
    await settle();

    assert.equal(get('#game-name-input').value, 'Importada');
    assert.equal(get('#history-grid').children.length, 7);
    assert.equal(get('#played-counter').textContent, '7');
    assert.equal(get('#alert-title').textContent, 'Partida Restaurada');
    get('#alert-ok').fire('click');
});

test('con la partida empezada, importar una lista normal sigue avisando de que no se puede', async () => {
    importFile({name: 'lista', songs: []});
    await settle();

    assert.equal(isOpen('#alert-modal'), true);
    assert.equal(get('#alert-title').textContent, 'Juego Iniciado');
    get('#alert-ok').fire('click');
});

test('un archivo que no es JSON de lista ni de partida se rechaza como antes', async () => {
    get('#import-file').fire('change', {target: {files: [{text: async () => 'no es json'}], value: 'ruta'}});
    await settle();

    assert.equal(get('#alert-title').textContent, 'Error de Importación');
    get('#alert-ok').fire('click');
});

test('con cartones en el juego, el botón de comprobar se habilita y el resultado cuadra con las canciones reproducidas', () => {
    const snapshot = makeSnapshot({songCount: 30, played: 7, cartones: 2, name: 'Importada'});
    const expected = snapshot.cartones[1].rows.flatMap(row => row.cells.map(cell => cell.songId)).filter(id => id !== null && id <= 7).length;

    assert.equal(get('#open-check-carton-btn').disabled, false);
    get('#open-check-carton-btn').fire('click');
    assert.equal(isOpen('#check-carton-modal'), true);

    get('#check-carton-number').value = '2';
    get('#check-carton-submit').fire('click');

    const result = get('#check-carton-result');
    assert.equal(result.children[0].textContent, 'Cartón 2');
    const rows = result.children.slice(3);
    const played = rows.flatMap(row => row.children[1].children).filter(item => item.className.includes('check-song-played')).length;
    assert.equal(rows.length, 3);
    assert.equal(played, expected);
    get('#close-check-carton-modal').fire('click');
});
