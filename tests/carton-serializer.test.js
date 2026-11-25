import test from 'node:test';
import assert from 'node:assert/strict';
import {BingoCartonGenerator} from '../js/bingoCartonGenerator.js';
import {deserializeCartones, serializeCartones} from '../js/modules/CartonSerializer.js';
import {CELL_TYPE} from '../js/constants.js';
import {makeSongs, seedRandom} from './helpers/seed.js';

const shape = (cartones) => cartones.map(carton => ({
    id: carton.id,
    songs: carton.songs.map(song => song.id),
    rows: carton.rows.map(row => row.cells.map(cell => [cell.position, cell.type, cell.song?.id ?? null]))
}));

test('serializar y deserializar devuelve los mismos cartones', () => {
    const seed = seedRandom(5);
    try {
        const songs = makeSongs(30);
        const cartones = new BingoCartonGenerator().generateCartones(songs, 25);
        const restored = deserializeCartones(JSON.parse(JSON.stringify(serializeCartones(cartones))), songs);

        assert.deepEqual(shape(restored), shape(cartones));
        assert.equal(restored[0].generatedAt, cartones[0].generatedAt);
    } finally {
        seed.restore();
    }
});

test('los datos serializados solo llevan identificadores, no canciones', () => {
    const seed = seedRandom(6);
    try {
        const songs = makeSongs(24);
        const [carton] = serializeCartones(new BingoCartonGenerator().generateCartones(songs, 1));

        assert.ok(carton.songs.every(Number.isInteger));
        assert.ok(carton.rows.every(row => row.cells.every(cell => cell.songId === null || Number.isInteger(cell.songId))));
        assert.equal(JSON.stringify(carton).includes('Canción'), false);
    } finally {
        seed.restore();
    }
});

test('una canción que ya no existe se convierte en casilla decorativa y avisa', () => {
    const originalWarn = console.warn;
    const warnings = [];
    console.warn = (message) => warnings.push(message);
    try {
        const data = [{
            id: 1, generatedAt: 'x', songs: [1, 99],
            rows: [{cells: [{position: 0, songId: 1}, {position: 1, songId: 99}, {position: 2, songId: null}]}]
        }];
        const [carton] = deserializeCartones(data, makeSongs(1));
        const types = carton.rows[0].cells.map(cell => cell.type);

        assert.deepEqual(types, [CELL_TYPE.SONG, CELL_TYPE.DECORATIVE, CELL_TYPE.DECORATIVE]);
        assert.deepEqual(carton.songs.map(song => song.id), [1]);
        assert.equal(warnings.length, 1);
    } finally {
        console.warn = originalWarn;
    }
});
