import test from 'node:test';
import assert from 'node:assert/strict';
import {captureSnapshot, restoreFromSnapshot, summarizeSnapshot, validateGameFile} from '../js/modules/GameSnapshot.js';
import {deserializeCartones} from '../js/modules/CartonSerializer.js';
import {defaultSettings} from '../js/modules/Settings.js';
import {GAME_FILE_TYPE, GAME_FILE_VERSION, MAX_CARTONES_IN_FILE, MAX_ICON_DATA_LENGTH, MAX_SONG_TITLE_LENGTH, MAX_SONGS_IN_FILE} from '../js/constants.js';
import {TEXT} from '../js/messages.js';
import {clone, makeGame, makeSnapshot} from './helpers/snapshot.js';

const PNG = 'data:image/png;base64,iVBORw0KGgo=';

test('la captura lleva tipo, versión, fecha, ajustes, canciones, estado de la partida y cartones', () => {
    const snapshot = makeSnapshot();

    assert.equal(snapshot.type, GAME_FILE_TYPE);
    assert.equal(snapshot.version, GAME_FILE_VERSION);
    assert.equal(snapshot.date, '2026-04-05T06:07:08.000Z');
    assert.equal(snapshot.songs.length, 26);
    assert.equal(snapshot.cartones.length, 3);
    assert.deepEqual(snapshot.game, {started: true, currentSongId: 3, lineaCompleted: false, bingoCompleted: false});
    assert.deepEqual(snapshot.songs.filter(song => song.played).map(song => [song.id, song.playedOrder]), [[1, 1], [2, 2], [3, 3]]);
    assert.equal(snapshot.settings.gameName, 'Fiesta');
});

test('la captura no incluye los archivos de audio ni datos de más', () => {
    const {songs, game} = makeGame();
    songs[0].secreto = 'x';
    const text = JSON.stringify(captureSnapshot({songs, game, settings: defaultSettings()}));

    assert.equal(text.includes('secreto'), false);
    assert.equal(text.includes('"file"'), false);
});

test('capturar, pasar por JSON, validar y restaurar devuelve exactamente la misma partida', () => {
    const {songs, game} = makeGame({played: 5});
    game.completeLinea();
    const snapshot = captureSnapshot({songs, game, settings: {...defaultSettings(), musicVolume: 0.3}});

    const validation = validateGameFile(clone(snapshot));
    assert.equal(validation.success, true);
    assert.deepEqual(validation.snapshot, {...snapshot, settings: validation.snapshot.settings});

    const restored = restoreFromSnapshot(validation.snapshot);
    assert.deepEqual(restored.songs.map(song => [song.id, song.title, song.icon, song.played, song.playedOrder]),
        songs.map(song => [song.id, song.title, song.icon, Boolean(song.played), song.playedOrder]));
    assert.deepEqual(restored.gameState.playedSongs.map(song => song.id), [1, 2, 3, 4, 5]);
    assert.equal(restored.gameState.started, true);
    assert.equal(restored.gameState.lineaCompleted, true);
    assert.equal(restored.gameState.currentSongId, 5);
    assert.equal(restored.settings.musicVolume, 0.3);
    assert.ok(restored.songs.every(song => song.file === null));

    const cartones = deserializeCartones(validation.snapshot.cartones, restored.songs);
    assert.deepEqual(cartones.map(carton => carton.songs.map(song => song.id)), game.getCartones().map(carton => carton.songs.map(song => song.id)));
});

test('las canciones restauradas llevan la ruta de audio esperada y sin orden si no se han reproducido', () => {
    const {songs} = restoreFromSnapshot(validateGameFile(clone(makeSnapshot())).snapshot);

    assert.equal(songs[0].audioPath, 'Canción 1.mp3');
    assert.equal(songs[10].playedOrder, undefined);
    assert.equal(songs[10].played, false);
});

test('los iconos de imagen válidos se aceptan', () => {
    const snapshot = makeSnapshot();
    snapshot.songs[0].iconType = 'image';
    snapshot.songs[0].icon = PNG;

    assert.equal(validateGameFile(clone(snapshot)).success, true);
});

test('una partida sin iniciar pero con canciones reproducidas se normaliza como iniciada', () => {
    const snapshot = makeSnapshot();
    snapshot.game.started = false;

    assert.equal(validateGameFile(clone(snapshot)).snapshot.game.started, true);
});

test('los campos desconocidos se descartan y los ajustes inválidos se avisan', () => {
    const snapshot = makeSnapshot();
    snapshot.extra = 'x';
    snapshot.songs[0].otra = 1;
    snapshot.settings = {musicVolume: 9, theme: 'dark', raro: true};

    const {snapshot: clean, discardedSettings} = validateGameFile(clone(snapshot));

    assert.equal('extra' in clean, false);
    assert.equal('otra' in clean.songs[0], false);
    assert.deepEqual(clean.settings, {theme: 'dark'});
    assert.deepEqual(discardedSettings.sort(), ['musicVolume', 'raro']);
});

test('un objeto settings ausente o inválido no impide restaurar la partida', () => {
    for (const settings of [undefined, null, 'x', []]) {
        const snapshot = makeSnapshot();
        snapshot.settings = settings;

        const result = validateGameFile(clone(snapshot));
        assert.equal(result.success, true);
        assert.deepEqual(result.snapshot.settings, {});
    }
});

test('rechaza lo que no es una partida o es de una versión que no se entiende', () => {
    const notGame = {success: false, error: TEXT.savedGame.notGame};

    for (const data of [null, undefined, 5, 'texto', [], {}, {type: 'settings', version: 1}, {type: 'game'}, {type: 'game', version: 0}, {type: 'game', version: '1'}, {type: 'game', version: 1.5}]) {
        assert.deepEqual(validateGameFile(data), notGame, JSON.stringify(data));
    }
    assert.deepEqual(validateGameFile({...makeSnapshot(), version: GAME_FILE_VERSION + 1}), {success: false, error: TEXT.savedGame.newerVersion(GAME_FILE_VERSION + 1)});
});

const REJECTED = [
    ['canciones que no son una lista', (s) => { s.songs = 'x'; }],
    ['demasiadas canciones', (s) => { s.songs = Array.from({length: MAX_SONGS_IN_FILE + 1}, (_, i) => ({id: i, title: 't', icon: '🎵'})); }],
    ['cartones que no son una lista', (s) => { s.cartones = {}; }],
    ['demasiados cartones', (s) => { s.cartones = Array.from({length: MAX_CARTONES_IN_FILE + 1}, () => ({})); }],
    ['una canción que no es un objeto', (s) => { s.songs[0] = 7; }],
    ['id negativo', (s) => { s.songs[0].id = -1; }],
    ['id decimal', (s) => { s.songs[0].id = 1.5; }],
    ['id de texto', (s) => { s.songs[0].id = '3'; }],
    ['ids repetidos', (s) => { s.songs[1].id = s.songs[0].id; }],
    ['título vacío', (s) => { s.songs[0].title = '   '; }],
    ['título que no es texto', (s) => { s.songs[0].title = 12; }],
    ['título demasiado largo', (s) => { s.songs[0].title = 'a'.repeat(MAX_SONG_TITLE_LENGTH + 1); }],
    ['tipo de icono desconocido', (s) => { s.songs[0].iconType = 'sonido'; }],
    ['emoji demasiado largo', (s) => { s.songs[0].icon = '🎵'.repeat(40); }],
    ['icono vacío', (s) => { s.songs[0].icon = ''; }],
    ['imagen con javascript:', (s) => { s.songs[0].iconType = 'image'; s.songs[0].icon = 'javascript:alert(1)'; }],
    ['imagen con una URL remota', (s) => { s.songs[0].iconType = 'image'; s.songs[0].icon = 'https://ejemplo.com/a.png'; }],
    ['imagen con data: que no es imagen', (s) => { s.songs[0].iconType = 'image'; s.songs[0].icon = 'data:text/html;base64,PHNjcmlwdD4='; }],
    ['imagen SVG en data:', (s) => { s.songs[0].iconType = 'image'; s.songs[0].icon = 'data:image/svg+xml;base64,PHN2Zz4='; }],
    ['imagen con comillas que escapan del atributo', (s) => { s.songs[0].iconType = 'image'; s.songs[0].icon = PNG + '"onerror="x'; }],
    ['imagen demasiado grande', (s) => { s.songs[0].iconType = 'image'; s.songs[0].icon = 'data:image/png;base64,' + 'A'.repeat(MAX_ICON_DATA_LENGTH); }],
    ['estado de reproducción que no es booleano', (s) => { s.songs[0].played = 'si'; }],
    ['reproducida sin orden', (s) => { s.songs[0].playedOrder = null; }],
    ['reproducida con orden 0', (s) => { s.songs[0].playedOrder = 0; }],
    ['reproducidas con el mismo orden', (s) => { s.songs[1].playedOrder = s.songs[0].playedOrder; }],
    ['sin datos de partida', (s) => { delete s.game; }],
    ['datos de partida que no son un objeto', (s) => { s.game = []; }],
    ['bandera de partida que falta', (s) => { delete s.game.started; }],
    ['bandera de partida que no es booleana', (s) => { s.game.bingoCompleted = 1; }],
    ['canción actual que no está en la lista', (s) => { s.game.currentSongId = 9999; }],
    ['cartón que no es un objeto', (s) => { s.cartones[0] = null; }],
    ['cartón con id 0', (s) => { s.cartones[0].id = 0; }],
    ['cartón con demasiadas canciones', (s) => { s.cartones[0].songs = Array.from({length: 13}, (_, i) => i); }],
    ['cartón con canciones que no son ids', (s) => { s.cartones[0].songs = ['a']; }],
    ['cartón con demasiadas filas', (s) => { s.cartones[0].rows.push({cells: []}, {cells: []}); }],
    ['fila que no es un objeto', (s) => { s.cartones[0].rows[0] = 'x'; }],
    ['fila con demasiadas casillas', (s) => { s.cartones[0].rows[0].cells = Array.from({length: 9}, (_, i) => ({position: i, songId: null})); }],
    ['casilla con posición fuera de rango', (s) => { s.cartones[0].rows[0].cells[0].position = 8; }],
    ['casilla con posición negativa', (s) => { s.cartones[0].rows[0].cells[0].position = -1; }],
    ['casilla con canción que no es id', (s) => { s.cartones[0].rows[0].cells[0].songId = 'x'; }]
];

for (const [label, mutate] of REJECTED) {
    test(`rechaza una partida con ${label}`, () => {
        const snapshot = clone(makeSnapshot());
        mutate(snapshot);

        const result = validateGameFile(snapshot);

        assert.equal(result.success, false);
        assert.ok(result.error.startsWith('El archivo de partida no es válido'), result.error);
    });
}

test('un archivo con __proto__ no contamina los objetos ni se cuela en el resultado', () => {
    const text = JSON.stringify(makeSnapshot()).replace('{"type"', '{"__proto__":{"contaminado":true},"type"');
    const result = validateGameFile(JSON.parse(text));

    assert.equal(result.success, true);
    assert.equal({}.contaminado, undefined);
    assert.equal(result.snapshot.contaminado, undefined);
});

test('un valor sospechoso en el título se conserva como texto (la interfaz lo escapa al pintarlo)', () => {
    const snapshot = makeSnapshot();
    snapshot.songs[0].title = '<img src=x onerror=alert(1)>';

    assert.equal(validateGameFile(clone(snapshot)).snapshot.songs[0].title, '<img src=x onerror=alert(1)>');
});

test('el resumen cuenta canciones, reproducidas y cartones', () => {
    assert.deepEqual(summarizeSnapshot(makeSnapshot({songCount: 30, played: 4, cartones: 2})), {songs: 30, played: 4, cartones: 2});
});

test('una partida vacía se puede capturar y validar', () => {
    const snapshot = makeSnapshot({songCount: 0, played: 0, cartones: 0, started: false});

    assert.equal(validateGameFile(clone(snapshot)).success, true);
    assert.deepEqual(summarizeSnapshot(snapshot), {songs: 0, played: 0, cartones: 0});
});
