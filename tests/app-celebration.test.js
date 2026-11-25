import test, {mock} from 'node:test';
import assert from 'node:assert/strict';
import {installDocument, mkEl} from './helpers/fakeDom.js';

installDocument();
const originalWarn = console.warn;
const originalError = console.error;
console.warn = () => {};
console.error = () => {};

const {BingoMusical} = await import('../js/app.js');
const {CELEBRATION, CELEBRATION_DELAY_MS} = await import('../js/constants.js');

test.after(() => {
    console.warn = originalWarn;
    console.error = originalError;
});

const build = ({valid = true} = {}) => {
    const log = [];
    const app = Object.create(BingoMusical.prototype);
    const lineaOverlay = mkEl('aside');
    const bingoOverlay = mkEl('aside');
    lineaOverlay.classList.add('hidden');
    bingoOverlay.classList.add('hidden');

    Object.assign(app, {
        celebration: null,
        songs: [],
        songManager: {validateMinSongs: () => ({valid: true})},
        dialogs: {showAlert: (alert) => log.push(['aviso', alert])},
        sounds: {play: (sound) => log.push(['suena', sound])},
        game: {
            canCallLinea: () => (valid ? {valid: true} : {valid: false, alert: 'no'}),
            completeLinea: () => log.push('completa linea'),
            canCallBingo: () => ({valid: true}),
            completeBingo: () => log.push('completa bingo'),
            isGameStarted: () => true,
            isContinuousMode: () => false,
            isBingoCompleted: () => false,
            allSongsPlayed: () => true
        },
        projection: {schedulePublish: () => log.push(['publica', app.celebration])},
        dom: {celebration: {lineaOverlay, celebrationOverlay: bingoOverlay}},
        _onGameChanged: () => log.push('cambia'),
        updateControls: () => {}
    });

    return {app, log, lineaOverlay, bingoOverlay};
};

test('cantar LÍNEA muestra la celebración en la ventana principal y la envía a la proyección tras el mismo retardo', () => {
    mock.timers.enable({apis: ['setTimeout']});
    try {
        const {app, log, lineaOverlay} = build();

        app.triggerLinea();
        assert.equal(lineaOverlay.classList.contains('hidden'), true);
        assert.equal(app.celebration, null);

        mock.timers.tick(CELEBRATION_DELAY_MS);

        assert.equal(lineaOverlay.classList.contains('hidden'), false);
        assert.equal(app.celebration, CELEBRATION.LINEA);
        assert.deepEqual(log.at(-1), ['publica', CELEBRATION.LINEA]);
    } finally {
        mock.timers.reset();
    }
});

test('cantar BINGO envía la celebración de bingo', () => {
    mock.timers.enable({apis: ['setTimeout']});
    try {
        const {app, bingoOverlay} = build();

        app.triggerBingo();
        mock.timers.tick(CELEBRATION_DELAY_MS);

        assert.equal(bingoOverlay.classList.contains('hidden'), false);
        assert.equal(app.celebration, CELEBRATION.BINGO);
    } finally {
        mock.timers.reset();
    }
});

test('una llamada no válida avisa y no celebra nada, ni aquí ni en la proyección', () => {
    mock.timers.enable({apis: ['setTimeout']});
    try {
        const {app, log, lineaOverlay} = build({valid: false});

        app.triggerLinea();
        mock.timers.tick(CELEBRATION_DELAY_MS * 2);

        assert.equal(lineaOverlay.classList.contains('hidden'), true);
        assert.equal(app.celebration, null);
        assert.equal(log.some(entry => Array.isArray(entry) && entry[0] === 'publica'), false);
        assert.equal(log[0][0], 'aviso');
    } finally {
        mock.timers.reset();
    }
});

test('cerrar la celebración en la ventana principal la quita también de la proyección', () => {
    const {app, log, lineaOverlay} = build();
    app._showCelebration(CELEBRATION.LINEA, lineaOverlay);

    app._hideCelebration(lineaOverlay);

    assert.equal(lineaOverlay.classList.contains('hidden'), true);
    assert.equal(app.celebration, null);
    assert.deepEqual(log.at(-1), ['publica', null]);
});

test('al acabar la última canción sin cantar BINGO, el bingo automático también llega a la proyección', () => {
    mock.timers.enable({apis: ['setTimeout']});
    try {
        const {app, bingoOverlay} = build();

        app.onSongEnded();
        mock.timers.tick(CELEBRATION_DELAY_MS);

        assert.equal(bingoOverlay.classList.contains('hidden'), false);
        assert.equal(app.celebration, CELEBRATION.BINGO);
    } finally {
        mock.timers.reset();
    }
});
