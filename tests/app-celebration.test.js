import test from 'node:test';
import assert from 'node:assert/strict';
import {installDocument} from './helpers/fakeDom.js';

installDocument();
const originalWarn = console.warn;
const originalError = console.error;
console.warn = () => {};
console.error = () => {};

const {BingoMusical} = await import('../js/app.js');
const {CELEBRATION, CHECK_MODE} = await import('../js/constants.js');

test.after(() => {
    console.warn = originalWarn;
    console.error = originalError;
});

const carton = {
    id: 5,
    rows: [{cells: [{type: 'song', position: 0, song: {id: 1, title: 'Uno', icon: '🎵', iconType: 'emoji'}}]}]
};
const result = {rows: [{songs: [{song: carton.rows[0].cells[0].song, played: true}], missing: 0, complete: true}], linea: true, bingo: false};

const build = ({valid = true, enough = true} = {}) => {
    const log = [];
    const app = Object.create(BingoMusical.prototype);

    Object.assign(app, {
        celebration: null,
        songs: [],
        songManager: {validateMinSongs: () => (enough ? {valid: true} : {valid: false, alert: 'faltan canciones'})},
        dialogs: {showAlert: (alert) => log.push(['aviso', alert])},
        sounds: {play: (sound) => log.push(['suena', sound])},
        game: {
            canCallLinea: () => (valid ? {valid: true} : {valid: false, alert: 'ya cantada'}),
            completeLinea: () => log.push('completa linea'),
            canCallBingo: () => (valid ? {valid: true} : {valid: false, alert: 'ya cantado'}),
            completeBingo: () => log.push('completa bingo'),
            isGameStarted: () => true,
            isContinuousMode: () => false,
            isBingoCompleted: () => false,
            allSongsPlayed: () => true
        },
        projection: {schedulePublish: () => log.push(['publica', app.celebration?.kind ?? null, app.celebration?.ok ?? null])},
        cartonCheck: {open: (mode) => log.push(['abre modal', mode])},
        _onGameChanged: () => log.push('cambia'),
        updateControls: () => {}
    });

    return {app, log};
};

test('pulsar LÍNEA abre la ventana de cartón en modo línea, sin cantar todavía', () => {
    const {app, log} = build();

    app.triggerLinea();

    assert.deepEqual(log, [['abre modal', CHECK_MODE.LINEA]]);
    assert.equal(app.celebration, null);
});

test('pulsar BINGO abre la ventana de cartón en modo bingo', () => {
    const {app, log} = build();

    app.triggerBingo();

    assert.deepEqual(log, [['abre modal', CHECK_MODE.BINGO]]);
});

test('si ya estaba cantada (o faltan canciones) avisa y no abre la ventana', () => {
    const cantada = build({valid: false});
    cantada.app.triggerLinea();
    cantada.app.triggerBingo();
    assert.deepEqual(cantada.log, [['aviso', 'ya cantada'], ['aviso', 'ya cantado']]);

    const pocas = build({enough: false});
    pocas.app.triggerLinea();
    assert.deepEqual(pocas.log, [['aviso', 'faltan canciones']]);
});

test('cantar la línea con un cartón completa la línea, suena la victoria y envía las filas a la proyección', () => {
    const {app, log} = build();

    app._singFromModal({kind: CELEBRATION.LINEA, carton, result});

    assert.deepEqual(log, ['completa linea', ['suena', 'win'], 'cambia']);
    assert.equal(app.celebration.kind, 'linea');
    assert.equal(app.celebration.ok, true);
    assert.equal(app.celebration.cartonId, 5);
    assert.equal(app.celebration.rows.length, 1);
    assert.deepEqual(app.celebration.rows[0].songs, [{icon: '🎵', iconType: 'emoji', played: true}]);
});

test('cantar el bingo completa el bingo y suena el efecto de bingo', () => {
    const {app, log} = build();

    app._singFromModal({kind: CELEBRATION.BINGO, carton, result});

    assert.deepEqual(log.slice(0, 2), ['completa bingo', ['suena', 'complete']]);
    assert.equal(app.celebration.kind, 'bingo');
});

test('cantar sin cartón envía la pantalla genérica, sin filas', () => {
    const {app} = build();

    app._singFromModal({kind: CELEBRATION.LINEA, carton: null, result: null});

    assert.deepEqual(app.celebration, {kind: 'linea', ok: true, cartonId: null, rows: []});
});

test('mostrar un fallo con toda la tabla enseña también los iconos que faltan, y con solo lo acertado los sustituye por huecos', () => {
    const pendiente = {rows: [{songs: [{song: carton.rows[0].cells[0].song, played: true}, {song: {id: 2, title: 'Dos', icon: '🥁', iconType: 'emoji'}, played: false}], missing: 1, complete: false}], linea: false, bingo: false};
    const {app} = build();

    app._showFailureFromModal({kind: CELEBRATION.BINGO, carton, result: pendiente, view: 'table'});
    assert.equal(app.celebration.rows[0].songs.length, 2);

    app._showFailureFromModal({kind: CELEBRATION.BINGO, carton, result: pendiente, view: 'played'});
    assert.equal(app.celebration.rows[0].songs.length, 2);
    assert.equal(app.celebration.rows[0].songs[0].icon, '🎵');
    assert.equal(app.celebration.rows[0].songs[1].icon, '');
    assert.equal(app.celebration.rows[0].songs[1].played, false);
});

test('mostrar un fallo no cambia la partida: suena el error y publica la pantalla de fallo', () => {
    const {app, log} = build();

    app._showFailureFromModal({kind: CELEBRATION.LINEA, carton, result});

    assert.deepEqual(log, [['suena', 'error'], ['publica', 'linea', false]]);
    assert.equal(app.celebration.ok, false);
    assert.equal(app.celebration.rows.length, 1);
    assert.equal(log.includes('completa linea'), false);
});

test('quitar la pantalla la borra de la proyección, y repetirlo no vuelve a publicar', () => {
    const {app, log} = build();
    app._showFailureFromModal({kind: CELEBRATION.BINGO, carton, result});
    log.length = 0;

    app._dismissCelebration();
    app._dismissCelebration();

    assert.equal(app.celebration, null);
    assert.deepEqual(log, [['publica', null, null]]);
});

test('al acabar la última canción sin cantar BINGO se canta solo y se abre la ventana de fin de canciones', () => {
    const {app, log} = build();

    app.onSongEnded();

    assert.deepEqual(log.slice(0, 3), ['completa bingo', ['suena', 'complete'], 'cambia']);
    assert.deepEqual(log.at(-1), ['abre modal', CHECK_MODE.ENDED]);
    assert.equal(app.celebration.kind, 'bingo');
    assert.equal(app.celebration.cartonId, null);
});

test('cantar la línea con la vista «solo la línea» envía únicamente las filas completas', () => {
    const {app} = build();
    const parcial = {rows: [
        {songs: [{song: carton.rows[0].cells[0].song, played: true}], missing: 0, complete: true},
        {songs: [{song: {id: 2, title: 'Dos', icon: '🥁', iconType: 'emoji'}, played: false}], missing: 1, complete: false}
    ], linea: true, bingo: false};

    app._singFromModal({kind: CELEBRATION.LINEA, carton, result: parcial, view: 'line'});
    assert.equal(app.celebration.rows.length, 1);

    app._singFromModal({kind: CELEBRATION.LINEA, carton, result: parcial, view: 'carton'});
    assert.equal(app.celebration.rows.length, 2);
    assert.equal(app.celebration.rows[1].songs[0].icon, '');
});

test('mostrar el fallo de línea solo con texto envía la pantalla sin filas', () => {
    const {app, log} = build();

    app._showFailureFromModal({kind: CELEBRATION.LINEA, carton, result, view: 'text'});

    assert.equal(app.celebration.ok, false);
    assert.deepEqual(app.celebration.rows, []);
    assert.deepEqual(log.at(-1), ['publica', 'linea', false]);
});
