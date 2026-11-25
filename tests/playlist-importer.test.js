import test from 'node:test';
import assert from 'node:assert/strict';
import {PlaylistImporter} from '../js/modules/PlaylistImporter.js';
import {SongManager} from '../js/modules/SongManager.js';

const makeImporter = (available = []) => {
    const urls = [];
    const importer = new PlaylistImporter({
        songsFolder: 'canciones/',
        songManager: new SongManager(),
        getRandomIcon: () => '🎲',
        fetchFn: async (url) => {
            urls.push(url);
            const found = available.some(title => url === `canciones/${encodeURIComponent(title)}.mp3`);
            return {ok: found, status: found ? 200 : 404, blob: async () => ({blob: url})};
        }
    });
    return {importer, urls};
};

const silenceWarnings = () => {
    const original = console.warn;
    console.warn = () => {};
    return () => { console.warn = original; };
};

test('carga el audio de cada canción desde la carpeta, con el título codificado', async () => {
    const {importer, urls} = makeImporter(['Uno', 'Canción rara']);

    const {songs, missing} = await importer.loadSongs([{id: 1, title: 'Uno', icon: '🎵'}, {id: 2, title: 'Canción rara', icon: '🎸'}]);

    assert.deepEqual(urls, ['canciones/Uno.mp3', 'canciones/Canci%C3%B3n%20rara.mp3']);
    assert.ok(songs.every(song => song.file && song.played === false));
    assert.deepEqual(missing, []);
});

test('las canciones cuyo audio no se encuentra se conservan sin archivo, con su icono e id', async () => {
    const restore = silenceWarnings();
    try {
        const {importer} = makeImporter(['Uno']);

        const {songs, missing} = await importer.loadSongs([
            {id: 7, title: 'Uno', icon: '🎵'}, {id: 8, title: 'Falta', icon: '🎸'}, {id: 9, title: 'Falta 2', icon: '🥁', iconType: 'emoji'}
        ]);

        assert.equal(songs.length, 3);
        assert.deepEqual(missing, ['Falta', 'Falta 2']);
        assert.equal(songs[1].file, null);
        assert.equal(songs[1].icon, '🎸');
        assert.deepEqual(songs.map(song => song.id), [7, 8, 9]);
        assert.ok(songs[0].file);
    } finally {
        restore();
    }
});

test('si no se encuentra ningún audio, todas las canciones se conservan sin archivo', async () => {
    const restore = silenceWarnings();
    try {
        const {importer} = makeImporter([]);

        const {songs, missing} = await importer.loadSongs([{title: 'A'}, {title: 'B'}]);

        assert.equal(songs.length, 2);
        assert.deepEqual(missing, ['A', 'B']);
        assert.ok(songs.every(song => song.file === null));
    } finally {
        restore();
    }
});

test('una lista vacía no devuelve canciones ni faltas', async () => {
    const {importer} = makeImporter([]);

    assert.deepEqual(await importer.loadSongs([]), {songs: [], duplicates: [], missing: []});
});

test('omite los títulos repetidos y los avisa', async () => {
    const {importer} = makeImporter(['Uno']);

    const {songs, duplicates} = await importer.loadSongs([{title: 'Uno', icon: '🎵'}, {title: 'Uno', icon: '🎸'}]);

    assert.equal(songs.length, 1);
    assert.deepEqual(duplicates, ['Uno']);
});

test('reasigna ids a las canciones sin id válido, también a las que no tienen audio', async () => {
    const restore = silenceWarnings();
    try {
        const {importer} = makeImporter(['Uno']);

        const {songs} = await importer.loadSongs([{id: 5, title: 'Uno'}, {title: 'Sin id'}, {id: 5, title: 'Id repetido'}]);

        assert.equal(songs[0].id, 5);
        assert.ok(Number.isInteger(songs[1].id) && songs[1].id > 5);
        assert.ok(Number.isInteger(songs[2].id) && songs[2].id > 5 && songs[2].id !== songs[1].id);
    } finally {
        restore();
    }
});

test('un icono repetido o ausente se sustituye por uno libre', async () => {
    const {importer} = makeImporter(['A', 'B', 'C']);

    const {songs} = await importer.loadSongs([{title: 'A', icon: '🎵'}, {title: 'B', icon: '🎵'}, {title: 'C'}]);

    assert.equal(songs[0].icon, '🎵');
    assert.equal(songs[1].icon, '🎲');
    assert.equal(songs[2].icon, '🎲');
});
