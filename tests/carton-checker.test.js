import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCelebration, evaluateCarton} from '../js/modules/CartonChecker.js';
import {BingoCartonGenerator} from '../js/bingoCartonGenerator.js';
import {CELL_TYPE} from '../js/constants.js';
import {makeSongs, seedRandom} from './helpers/seed.js';

const songCell = (id, position = 0) => ({type: CELL_TYPE.SONG, position, song: {id, title: 'c' + id}});
const decorative = (position) => ({type: CELL_TYPE.DECORATIVE, position});
const carton = (...rows) => ({id: 1, rows: rows.map(cells => ({cells}))});

const sample = () => carton(
    [songCell(1), decorative(1), songCell(2), songCell(3), songCell(4)],
    [songCell(5), songCell(6), decorative(2), songCell(7), songCell(8)],
    [songCell(9), songCell(10), songCell(11), songCell(12), decorative(4)]
);

test('sin ninguna canción reproducida no hay línea ni bingo', () => {
    const result = evaluateCarton(sample(), new Set());

    assert.equal(result.linea, false);
    assert.equal(result.bingo, false);
    assert.equal(result.total, 12);
    assert.equal(result.missingForBingo, 12);
    assert.equal(result.missingForLinea, 4);
    assert.deepEqual(result.completeRows, []);
});

test('una fila con sus cuatro canciones reproducidas es línea y dice qué fila', () => {
    const result = evaluateCarton(sample(), new Set([5, 6, 7, 8, 1]));

    assert.equal(result.linea, true);
    assert.deepEqual(result.completeRows, [2]);
    assert.equal(result.missingForLinea, 0);
    assert.equal(result.bingo, false);
    assert.equal(result.missingForBingo, 7);
});

test('varias filas completas se listan todas', () => {
    const result = evaluateCarton(sample(), new Set([1, 2, 3, 4, 9, 10, 11, 12]));

    assert.deepEqual(result.completeRows, [1, 3]);
    assert.equal(result.linea, true);
});

test('con todas las canciones reproducidas hay bingo', () => {
    const result = evaluateCarton(sample(), new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]));

    assert.equal(result.bingo, true);
    assert.equal(result.missingForBingo, 0);
    assert.deepEqual(result.completeRows, [1, 2, 3]);
});

test('sin línea, indica cuántas canciones le faltan a la fila más cercana', () => {
    const result = evaluateCarton(sample(), new Set([1, 2, 3, 5, 6]));

    assert.equal(result.linea, false);
    assert.equal(result.missingForLinea, 1);
});

test('cada canción indica si ha salido, en el orden del cartón', () => {
    const result = evaluateCarton(sample(), new Set([2, 4]));

    assert.deepEqual(result.rows[0].songs.map(item => [item.song.id, item.played]), [[1, false], [2, true], [3, false], [4, true]]);
    assert.equal(result.rows[0].missing, 2);
    assert.equal(result.rows[0].complete, false);
});

test('las casillas decorativas no cuentan para nada', () => {
    const result = evaluateCarton(sample(), new Set());

    assert.deepEqual(result.rows.map(row => row.songs.length), [4, 4, 4]);
});

test('un cartón sin canciones (todas se perdieron) no tiene línea ni bingo ni canciones que faltar', () => {
    const empty = carton([decorative(0), decorative(1)], [decorative(0)], []);

    const result = evaluateCarton(empty, new Set([1, 2, 3]));

    assert.equal(result.linea, false);
    assert.equal(result.bingo, false);
    assert.equal(result.total, 0);
    assert.equal(result.missingForLinea, null);
});

test('una fila sin canciones nunca cuenta como completa', () => {
    const result = evaluateCarton(carton([decorative(0)], [songCell(1), songCell(2)]), new Set());

    assert.deepEqual(result.rows.map(row => row.complete), [false, false]);
    assert.equal(result.missingForLinea, 2);
});

test('funciona con cartones reales generados y cuadra con el estado de reproducción', () => {
    const seed = seedRandom(31);
    try {
        const songs = makeSongs(30);
        const [first] = new BingoCartonGenerator().generateCartones(songs, 1);
        const playedIds = new Set(first.songs.map(song => song.id));

        const result = evaluateCarton(first, playedIds);

        assert.equal(result.bingo, true);
        assert.equal(result.linea, true);
        assert.deepEqual(result.completeRows, [1, 2, 3]);
        assert.equal(result.total, 12);
    } finally {
        seed.restore();
    }
});

const richCarton = () => ({
    id: 7,
    rows: [
        {cells: [songCell(1), songCell(2), songCell(3), songCell(4)].map((cell, i) => ({...cell, song: {...cell.song, icon: '🎵' + i, iconType: 'emoji'}}))},
        {cells: [songCell(5), songCell(6), songCell(7), songCell(8)].map(cell => ({...cell, song: {...cell.song, icon: 'data:image/png;base64,AAAA', iconType: 'image'}}))},
        {cells: [songCell(9), decorative(1), songCell(10), songCell(11)].map(cell => cell.song ? {...cell, song: {...cell.song, icon: '🎸', iconType: 'emoji'}} : cell)}
    ]
});

test('buildCelebration de una línea correcta incluye solo las filas completas, con los iconos y su estado', () => {
    const cartonWithLine = richCarton();
    const result = evaluateCarton(cartonWithLine, new Set([1, 2, 3, 4, 9]));

    const celebration = buildCelebration({kind: 'linea', ok: true, carton: cartonWithLine, result});

    assert.equal(celebration.kind, 'linea');
    assert.equal(celebration.ok, true);
    assert.equal(celebration.cartonId, 7);
    assert.equal(celebration.rows.length, 1);
    assert.deepEqual(celebration.rows[0].songs, [0, 1, 2, 3].map(i => ({icon: '🎵' + i, iconType: 'emoji', played: true})));
    assert.equal(celebration.rows[0].complete, true);
});

test('buildCelebration de una línea correcta con varias filas completas las incluye todas', () => {
    const cartonWithLines = richCarton();
    const result = evaluateCarton(cartonWithLines, new Set([1, 2, 3, 4, 5, 6, 7, 8]));

    const celebration = buildCelebration({kind: 'linea', ok: true, carton: cartonWithLines, result});

    assert.equal(celebration.rows.length, 2);
    assert.ok(celebration.rows.every(row => row.complete));
});

test('buildCelebration de un bingo correcto incluye las tres filas, todas con sus iconos como salidos', () => {
    const full = richCarton();
    const result = evaluateCarton(full, new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]));

    const celebration = buildCelebration({kind: 'bingo', ok: true, carton: full, result});

    assert.equal(celebration.rows.length, 3);
    assert.ok(celebration.rows.every(row => row.complete && row.songs.every(song => song.played)));
    assert.equal(celebration.rows[1].songs[0].iconType, 'image');
    assert.equal(celebration.rows[2].songs.length, 3);
});

test('buildCelebration de un fallo incluye las tres filas con lo que ha salido y lo que no', () => {
    const partial = richCarton();
    const result = evaluateCarton(partial, new Set([1, 2, 5]));

    const celebration = buildCelebration({kind: 'linea', ok: false, carton: partial, result});

    assert.equal(celebration.ok, false);
    assert.equal(celebration.rows.length, 3);
    assert.deepEqual(celebration.rows[0].songs.map(song => song.played), [true, true, false, false]);
    assert.deepEqual(celebration.rows[1].songs.map(song => song.played), [true, false, false, false]);
    assert.equal(celebration.rows.some(row => row.complete), false);
});

test('buildCelebration sin cartón devuelve la pantalla genérica, sin filas', () => {
    assert.deepEqual(buildCelebration({kind: 'bingo', ok: true}), {kind: 'bingo', ok: true, cartonId: null, rows: []});
    assert.deepEqual(buildCelebration({kind: 'linea', ok: true, carton: null, result: null}), {kind: 'linea', ok: true, cartonId: null, rows: []});
});

test('buildCelebration solo lleva datos simples: sin títulos ni objetos de canción', () => {
    const full = richCarton();
    const result = evaluateCarton(full, new Set([1, 2, 3, 4]));

    const celebration = buildCelebration({kind: 'linea', ok: true, carton: full, result});

    assert.deepEqual(Object.keys(celebration.rows[0].songs[0]).sort(), ['icon', 'iconType', 'played']);
    assert.doesNotThrow(() => structuredClone(celebration));
});
