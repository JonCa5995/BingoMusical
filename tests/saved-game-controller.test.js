import test from 'node:test';
import assert from 'node:assert/strict';
import {SavedGameController} from '../js/modules/SavedGameController.js';
import {GameManager} from '../js/modules/GameManager.js';
import {SongManager} from '../js/modules/SongManager.js';
import {AUTOSAVE_DELAY_MS} from '../js/constants.js';
import {MSG} from '../js/messages.js';
import {clone, makeGame, makeSnapshot} from './helpers/snapshot.js';

const build = ({songCount = 26, played = 3, cartones = 3, started = true, confirmAnswers = [], stored = null} = {}) => {
    const {songs, game} = makeGame({songCount, played, cartones, started});
    const state = {songs};
    const log = [];
    const answers = [...confirmAnswers];
    const store = {
        saved: [], cleared: 0,
        save: async (snapshot) => { store.saved.push(snapshot); return true; },
        load: async () => stored,
        clear: async () => { store.cleared++; return true; }
    };
    const controller = new SavedGameController({
        game, songManager: new SongManager(), store,
        dialogs: {showAlert: (alert) => log.push(['aviso', alert]), showConfirm: async (confirm) => { log.push(['confirmación', confirm]); return answers.shift() ?? false; }},
        sounds: {play: (name) => log.push(['sonido', name])},
        getSongs: () => state.songs, setSongs: (songs) => { state.songs = songs; },
        getSettings: () => ({gameName: game.getGameName()}),
        applySettings: (values) => log.push(['ajustes', values]),
        renderRestored: (render) => log.push(['pintar', render]),
        download: (...args) => log.push(['descarga', ...args]),
        now: () => new Date('2026-06-07T08:09:10.000Z')
    });
    return {controller, game, state, log, store};
};

const emptyController = () => build({songCount: 0, played: 0, cartones: 0, started: false});

test('no guarda automáticamente hasta que se resuelve la oferta de partida guardada', (t) => {
    t.mock.timers.enable({apis: ['setTimeout']});
    const {controller, store} = build();

    controller.scheduleAutosave();
    t.mock.timers.tick(AUTOSAVE_DELAY_MS * 2);

    assert.equal(store.saved.length, 0);
});

test('agrupa varios cambios seguidos en un solo guardado tras el retardo', async (t) => {
    t.mock.timers.enable({apis: ['setTimeout']});
    const {controller, store} = build();
    controller.enabled = true;

    controller.scheduleAutosave();
    t.mock.timers.tick(AUTOSAVE_DELAY_MS - 100);
    controller.scheduleAutosave();
    t.mock.timers.tick(AUTOSAVE_DELAY_MS - 100);
    assert.equal(store.saved.length, 0);
    t.mock.timers.tick(100);
    await Promise.resolve();

    assert.equal(store.saved.length, 1);
    assert.equal(store.saved[0].songs.length, 26);
    assert.equal(store.saved[0].game.started, true);
});

test('si no queda nada que guardar, borra la partida guardada en lugar de guardar una vacía', async (t) => {
    t.mock.timers.enable({apis: ['setTimeout']});
    const {controller, store} = emptyController();
    controller.enabled = true;

    controller.scheduleAutosave();
    t.mock.timers.tick(AUTOSAVE_DELAY_MS);
    await Promise.resolve();

    assert.equal(store.saved.length, 0);
    assert.equal(store.cleared, 1);
});

test('flush guarda al momento lo pendiente y no hace nada si no hay nada pendiente', async (t) => {
    t.mock.timers.enable({apis: ['setTimeout']});
    const {controller, store} = build();
    controller.enabled = true;

    await controller.flush();
    assert.equal(store.saved.length, 0);

    controller.scheduleAutosave();
    await controller.flush();
    assert.equal(store.saved.length, 1);

    t.mock.timers.tick(AUTOSAVE_DELAY_MS * 2);
    assert.equal(store.saved.length, 1);
});

test('sin partida guardada, habilita el autoguardado y no pregunta nada', async () => {
    const {controller, log} = build();

    await controller.offerSavedGame();

    assert.equal(controller.enabled, true);
    assert.deepEqual(log, []);
});

test('una partida guardada vacía se ignora', async () => {
    const {controller, log} = build({stored: makeSnapshot({songCount: 0, played: 0, cartones: 0, started: false})});

    await controller.offerSavedGame();

    assert.deepEqual(log, []);
    assert.equal(controller.enabled, true);
});

test('si hay partida guardada y se acepta, se restaura y se avisa', async () => {
    const stored = makeSnapshot({songCount: 28, played: 5, cartones: 2, name: 'Guardada'});
    const {controller, game, state, log} = build({songCount: 0, played: 0, cartones: 0, started: false, confirmAnswers: [true], stored});

    await controller.offerSavedGame();

    assert.deepEqual(log[0], ['confirmación', MSG.savedGame.found({songs: 28, played: 5, cartones: 2})]);
    assert.equal(state.songs.length, 28);
    assert.equal(game.isGameStarted(), true);
    assert.equal(game.getHistory().length, 5);
    assert.equal(game.getCartonesCount(), 2);
    assert.equal(game.getCurrentSong(), 5);
    assert.ok(log.some(entry => entry[0] === 'ajustes' && entry[1].gameName === 'Guardada'));
    assert.deepEqual(log.at(-1), ['aviso', MSG.savedGame.restored({songs: 28, played: 5, cartones: 2})]);
    assert.equal(controller.enabled, true);
});

test('si se rechaza la partida guardada, se descarta', async () => {
    const stored = makeSnapshot();
    const {controller, state, store, log} = build({songCount: 0, played: 0, cartones: 0, started: false, confirmAnswers: [false], stored});

    await controller.offerSavedGame();

    assert.equal(store.cleared, 1);
    assert.equal(state.songs.length, 0);
    assert.equal(log.some(entry => entry[0] === 'pintar'), false);
    assert.equal(controller.enabled, true);
});

test('restaurar deja las canciones sin archivo, con ids nuevos disponibles y pide pintar el estado', () => {
    const {controller, state, log, game} = build({songCount: 0, played: 0, cartones: 0, started: false});

    controller.restore(clone(makeSnapshot({songCount: 26, played: 4})));

    assert.ok(state.songs.every(song => song.file === null));
    const render = log.find(entry => entry[0] === 'pintar')[1];
    assert.deepEqual(render.playedSongs.map(song => song.id), [1, 2, 3, 4]);
    assert.equal(render.currentSong.id, 4);
    assert.equal(game.getHistory().length, 4);
});

test('restaurar sin canción actual no marca ninguna', () => {
    const {controller, log} = build({songCount: 0, played: 0, cartones: 0, started: false});
    const snapshot = clone(makeSnapshot({songCount: 26, played: 0, started: false}));
    snapshot.game.currentSongId = null;

    controller.restore(snapshot);

    assert.equal(log.find(entry => entry[0] === 'pintar')[1].currentSong, null);
});

test('exportar sin nada que guardar avisa y no descarga', () => {
    const {controller, log} = emptyController();

    controller.exportGame();

    assert.deepEqual(log, [['aviso', MSG.savedGame.nothingToExport]]);
});

test('exportar descarga un JSON de partida con la fecha y el nombre del juego en el archivo', () => {
    const {controller, game, log} = build({played: 2});
    game.setGameName('Noche Mágica');

    controller.exportGame();

    const [, content, fileName, mime] = log.find(entry => entry[0] === 'descarga');
    assert.equal(fileName, 'partida-noche-m-gica-2026-06-07.json');
    assert.equal(mime, 'application/json');
    const data = JSON.parse(content);
    assert.equal(data.type, 'game');
    assert.equal(data.songs.length, 26);
    assert.equal(data.songs.filter(song => song.played).length, 2);
    assert.equal(JSON.stringify(data).includes('"file"'), false);
    assert.deepEqual(log.at(-1), ['aviso', MSG.savedGame.exported]);
});

test('importar una partida inválida avisa y no cambia nada', async () => {
    const {controller, state, log} = build();
    const before = state.songs;

    assert.equal(await controller.importGame({type: 'game', version: 1, songs: 'x'}), false);

    assert.equal(state.songs, before);
    assert.equal(log[0][1].kind, 'error');
    assert.equal(log.some(entry => entry[0] === 'confirmación'), false);
});

test('importar una partida válida con trabajo en curso pide confirmación; si se cancela no cambia nada', async () => {
    const {controller, state, log} = build({confirmAnswers: [false]});
    const before = state.songs;

    assert.equal(await controller.importGame(clone(makeSnapshot({songCount: 30}))), false);

    assert.deepEqual(log[0], ['confirmación', MSG.savedGame.replaceCurrent]);
    assert.equal(state.songs, before);
});

test('importar una partida válida con trabajo en curso y confirmar la sustituye', async () => {
    const {controller, state, game, log} = build({confirmAnswers: [true]});

    assert.equal(await controller.importGame(clone(makeSnapshot({songCount: 30, played: 6, cartones: 4}))), true);

    assert.equal(state.songs.length, 30);
    assert.equal(game.getHistory().length, 6);
    assert.equal(game.getCartonesCount(), 4);
    assert.deepEqual(log.at(-1), ['aviso', MSG.savedGame.restored({songs: 30, played: 6, cartones: 4})]);
    assert.ok(log.some(entry => entry[0] === 'sonido'));
});

test('importar sobre una partida vacía no pide confirmación', async () => {
    const {controller, log} = emptyController();

    assert.equal(await controller.importGame(clone(makeSnapshot())), true);

    assert.equal(log.some(entry => entry[0] === 'confirmación'), false);
});

test('restaurar sustituye también el estado anterior del juego (reiniciando lo que no venga en el archivo)', () => {
    const {controller, game} = build({played: 9});
    game.completeBingo();

    controller.restore(clone(makeSnapshot({songCount: 26, played: 2, cartones: 1})));

    assert.equal(game.isBingoCompleted(), false);
    assert.equal(game.getHistory().length, 2);
    assert.equal(new GameManager().getHistory().length, 0);
});
