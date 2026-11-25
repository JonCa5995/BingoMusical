import test from 'node:test';
import assert from 'node:assert/strict';
import {installDocument} from './helpers/fakeDom.js';

installDocument();
const originalWarn = console.warn;
const originalError = console.error;
console.warn = () => {};
console.error = () => {};

const {BingoMusical} = await import('../js/app.js');

test.after(() => {
    console.warn = originalWarn;
    console.error = originalError;
});

const song = {id: 7, title: 'Siete', file: {name: 'siete.mp3'}};

const build = ({listener = true, currentSong = null} = {}) => {
    const log = [];
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    const app = Object.create(BingoMusical.prototype);

    Object.assign(app, {
        songs: [song],
        waitingForProjection: false,
        songManager: {findSongById: (songs, id) => songs.find(item => item.id === id)},
        dialogs: {showAlert: (alert) => log.push(['aviso', alert])},
        game: {getCurrentSong: () => currentSong, getClip: () => null},
        projection: {hasListener: () => listener, dockLogo: () => { log.push('acopla'); return gate; }},
        audio: {play: (file) => log.push(['suena', file.name])},
        _onSongStarted: () => {}
    });

    return {app, log, release: () => release()};
};

const tick = () => new Promise(resolve => setImmediate(resolve));

test('con una proyección abierta y ninguna canción previa, primero se acopla el logo y después suena la primera canción', async () => {
    const {app, log, release} = build();

    app.playSong(song.id);
    await tick();

    assert.deepEqual(log, ['acopla']);

    release();
    await tick();

    assert.deepEqual(log, ['acopla', ['suena', 'siete.mp3']]);
});

test('mientras espera al logo, otra petición de reproducir no arranca una segunda canción', async () => {
    const {app, log, release} = build();

    app.playSong(song.id);
    app.playSong(song.id);
    app.playSong(song.id);
    release();
    await tick();

    assert.equal(log.filter(entry => Array.isArray(entry) && entry[0] === 'suena').length, 1);
    assert.equal(log.filter(entry => entry === 'acopla').length, 1);
    assert.equal(app.waitingForProjection, false);
});

test('sin ninguna proyección abierta la primera canción suena al instante, sin esperar', () => {
    const {app, log} = build({listener: false});

    app.playSong(song.id);

    assert.deepEqual(log, [['suena', 'siete.mp3']]);
});

test('si ya hay una canción en marcha, las siguientes no esperan al logo', () => {
    const {app, log} = build({currentSong: 3});

    app.playSong(song.id);

    assert.deepEqual(log, [['suena', 'siete.mp3']]);
});

test('una canción sin archivo avisa y no espera ni suena', async () => {
    const {app, log} = build();
    app.songs = [{id: 7, title: 'Sin archivo', file: null}];

    app.playSong(7);
    await tick();

    assert.equal(log.length, 1);
    assert.equal(log[0][0], 'aviso');
});
