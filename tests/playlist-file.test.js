import test from 'node:test';
import assert from 'node:assert/strict';
import {PlaylistFile} from '../js/modules/PlaylistFile.js';
import {BingoCartonGenerator} from '../js/bingoCartonGenerator.js';
import {DEFAULT_GAME_NAME, DEFAULT_PLAYLIST_NAME} from '../js/constants.js';
import {TEXT} from '../js/messages.js';
import {makeSongs, seedRandom} from './helpers/seed.js';

const fixedNow = () => new Date('2026-01-02T03:04:05.000Z');

const makeFile = () => {
    const downloads = [];
    const file = new PlaylistFile({download: (...args) => downloads.push(args), now: fixedNow});
    return {file, downloads};
};

test('build resume las canciones y los cartones en un objeto con versión', () => {
    const seed = seedRandom(1);
    try {
        const {file} = makeFile();
        const songs = makeSongs(24);
        const cartones = new BingoCartonGenerator().generateCartones(songs, 2);
        const playlist = file.build(songs, 'Fiesta', cartones);

        assert.equal(playlist.version, '1.1');
        assert.equal(playlist.name, 'Fiesta');
        assert.equal(playlist.date, '2026-01-02T03:04:05.000Z');
        assert.equal(playlist.songs.length, 24);
        assert.deepEqual(Object.keys(playlist.songs[0]).sort(), ['icon', 'iconType', 'id', 'title']);
        assert.equal(playlist.cartones.length, 2);
        assert.equal(file.build(songs).name, DEFAULT_PLAYLIST_NAME);
    } finally {
        seed.restore();
    }
});

test('export descarga un JSON con nombre de archivo basado en el juego y la fecha', () => {
    const {file, downloads} = makeFile();
    const result = file.export(makeSongs(3), 'canciones/', 'Mi Fiesta', []);

    assert.equal(result.success, true);
    assert.equal(downloads.length, 1);
    const [content, fileName, mime] = downloads[0];
    assert.equal(fileName, 'mi-fiesta-2026-01-02.json');
    assert.equal(mime, 'application/json');
    assert.equal(JSON.parse(content).songs.length, 3);
    assert.ok(result.message.includes('Mi Fiesta'));
});

test('export sin nombre usa el nombre por defecto y sin canciones falla', () => {
    const {file, downloads} = makeFile();

    assert.deepEqual(file.export([], 'canciones/'), {success: false, error: TEXT.playlist.noSongsToExport});
    file.export(makeSongs(1), 'canciones/', '');
    assert.ok(downloads[0][1].startsWith('bingo-musical-'));
    assert.ok(DEFAULT_GAME_NAME.length > 0);
});

test('read acepta una lista válida y rechaza archivos incorrectos', async () => {
    const {file} = makeFile();
    const textFile = (text) => ({text: async () => text});
    const originalError = console.error;
    console.error = () => {};
    try {
        assert.deepEqual(await file.read(textFile('{"songs": [{"title": "A"}]}')), {success: true, playlist: {songs: [{title: 'A'}]}});
        assert.deepEqual(await file.read(textFile('{"name": "x"}')), {success: false, error: TEXT.playlist.invalidFormat});
        assert.equal((await file.read(textFile('no es json'))).success, false);
        assert.deepEqual(await file.read(null), {success: false, error: TEXT.playlist.noFileSelected});
    } finally {
        console.error = originalError;
    }
});
