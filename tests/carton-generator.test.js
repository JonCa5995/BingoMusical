import test from 'node:test';
import assert from 'node:assert/strict';
import {BingoCartonGenerator} from '../js/bingoCartonGenerator.js';
import {CELL_TYPE, CELLS_PER_ROW, MIN_SONGS_REQUIRED, ROWS_PER_CARTON, SONGS_IN_ROW, SONGS_PER_CARTON} from '../js/constants.js';
import {TEXT} from '../js/messages.js';
import {makeSongs, seedRandom} from './helpers/seed.js';

const songCells = (carton) => carton.rows.flatMap(row => row.cells.filter(cell => cell.type === CELL_TYPE.SONG));

test('un cartón tiene 3 filas de 8 casillas con 4 canciones por fila y 12 distintas', () => {
    const seed = seedRandom(1);
    try {
        const carton = new BingoCartonGenerator().generateSingleCarton(makeSongs(30), 7);

        assert.equal(carton.id, 7);
        assert.equal(carton.rows.length, ROWS_PER_CARTON);
        for (const row of carton.rows) {
            assert.equal(row.cells.length, CELLS_PER_ROW);
            assert.equal(row.cells.filter(cell => cell.type === CELL_TYPE.SONG).length, SONGS_IN_ROW);
        }
        assert.equal(carton.songs.length, SONGS_PER_CARTON);
        assert.equal(new Set(songCells(carton).map(cell => cell.song.id)).size, SONGS_PER_CARTON);
    } finally {
        seed.restore();
    }
});

test('dos cartones nunca comparten una fila', () => {
    const seed = seedRandom(2);
    try {
        const generator = new BingoCartonGenerator();
        const cartones = generator.generateCartones(makeSongs(30), 200);
        const keys = cartones.flatMap(carton => generator._rowKeys(carton));

        assert.equal(cartones.length, 200);
        assert.equal(new Set(keys).size, keys.length);
    } finally {
        seed.restore();
    }
});

test('numera los cartones a partir de los existentes y no repite sus filas', () => {
    const seed = seedRandom(3);
    try {
        const generator = new BingoCartonGenerator();
        const songs = makeSongs(30);
        const existing = generator.generateCartones(songs, 40);
        const added = generator.generateCartones(songs, 25, existing);
        const keys = [...existing, ...added].flatMap(carton => generator._rowKeys(carton));

        assert.deepEqual(added.map(carton => carton.id), Array.from({length: 25}, (_, index) => 41 + index));
        assert.equal(new Set(keys).size, keys.length);
    } finally {
        seed.restore();
    }
});

test('con la misma semilla genera exactamente los mismos cartones', () => {
    const run = () => {
        const seed = seedRandom(9);
        try {
            const cartones = new BingoCartonGenerator().generateCartones(makeSongs(24), 30);
            return JSON.stringify(cartones.map(carton => ({...carton, generatedAt: undefined})));
        } finally {
            seed.restore();
        }
    };

    assert.equal(run(), run());
});

test('con menos canciones del mínimo lanza el error esperado', () => {
    const generator = new BingoCartonGenerator();

    assert.throws(() => generator.generateCartones(makeSongs(MIN_SONGS_REQUIRED - 1), 1),
        {message: TEXT.cartones.generatorNeedsSongs(MIN_SONGS_REQUIRED)});
    assert.deepEqual(generator.generateCartones(makeSongs(MIN_SONGS_REQUIRED), 0), []);
});

test('al agotar las filas posibles lanza el error de unicidad', () => {
    const seed = seedRandom(4);
    try {
        const generator = new BingoCartonGenerator();
        const songs = makeSongs(24);
        let all = [];

        assert.throws(() => {
            for (let round = 0; round < 12; round++) {
                all = all.concat(generator.generateCartones(songs, 500, all));
            }
        }, {message: TEXT.cartones.notUnique});
        assert.ok(all.length >= 2000, `se generaron ${all.length} antes de saturar`);
    } finally {
        seed.restore();
    }
});

test('generateAsMany devuelve todos los cartones pedidos cuando caben', () => {
    const seed = seedRandom(61);
    try {
        const {cartones, missing} = new BingoCartonGenerator().generateAsMany(makeSongs(30), 40);

        assert.equal(cartones.length, 40);
        assert.equal(missing, 0);
    } finally {
        seed.restore();
    }
});

test('generateAsMany, al saturar, devuelve los cartones posibles y cuántos faltan en lugar de fallar', () => {
    const seed = seedRandom(62);
    try {
        const generator = new BingoCartonGenerator();
        const songs = makeSongs(24);
        let all = [];
        let partial = null;

        for (let round = 0; round < 12 && !partial; round++) {
            const result = generator.generateAsMany(songs, 500, all);
            all = all.concat(result.cartones);
            if (result.missing > 0) partial = result;
        }

        assert.ok(partial, 'debería saturarse con 24 canciones');
        assert.equal(partial.cartones.length + partial.missing, 500);
        assert.ok(partial.cartones.length < 500);
        const keys = all.flatMap(carton => generator._rowKeys(carton));
        assert.equal(new Set(keys).size, keys.length);

        let rounds = 0;
        let last = partial;
        while (last.cartones.length > 0 && rounds++ < 60) {
            last = generator.generateAsMany(songs, 50, all);
            all = all.concat(last.cartones);
        }

        assert.equal(last.cartones.length, 0, 'tras agotarse, ya no devuelve ninguno');
        assert.equal(last.missing, 50);
        const finalKeys = all.flatMap(carton => generator._rowKeys(carton));
        assert.equal(new Set(finalKeys).size, finalKeys.length);
    } finally {
        seed.restore();
    }
});

test('generateAsMany numera los cartones posibles a continuación de los existentes', () => {
    const seed = seedRandom(63);
    try {
        const generator = new BingoCartonGenerator();
        const songs = makeSongs(24);
        const existing = generator.generateCartones(songs, 2900);

        const {cartones} = generator.generateAsMany(songs, 400, existing);

        assert.equal(cartones[0].id, 2901);
        assert.ok(cartones.length < 400);
    } finally {
        seed.restore();
    }
});

test('generateAsMany con pocas canciones sigue lanzando el error de mínimo', () => {
    assert.throws(() => new BingoCartonGenerator().generateAsMany(makeSongs(MIN_SONGS_REQUIRED - 1), 1),
        {message: TEXT.cartones.generatorNeedsSongs(MIN_SONGS_REQUIRED)});
});
