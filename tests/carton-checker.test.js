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

test('buildCelebration de una línea correcta dibuja el cartón entero: la fila completa con sus iconos y huecos en el resto', () => {
    const cartonWithLine = richCarton();
    const result = evaluateCarton(cartonWithLine, new Set([1, 2, 3, 4, 9]));

    const celebration = buildCelebration({kind: 'linea', ok: true, carton: cartonWithLine, result, view: 'carton'});

    assert.equal(celebration.kind, 'linea');
    assert.equal(celebration.ok, true);
    assert.equal(celebration.cartonId, 7);
    assert.equal(celebration.rows.length, 3);
    assert.deepEqual(celebration.rows[0].songs, [0, 1, 2, 3].map(i => ({icon: '🎵' + i, iconType: 'emoji', played: true})));
    assert.equal(celebration.rows[0].complete, true);
    assert.deepEqual(celebration.rows[1].songs.map(song => song.played), [false, false, false, false]);
    assert.ok(celebration.rows[1].songs.every(song => song.icon === ''));
    assert.deepEqual(celebration.rows[2].songs.map(song => [song.played, song.icon]), [[true, '🎸'], [false, ''], [false, '']]);
});

test('buildCelebration de una línea correcta con la vista «solo la línea» incluye únicamente las filas completas, con tick en todo', () => {
    const cartonWithLine = richCarton();
    const result = evaluateCarton(cartonWithLine, new Set([1, 2, 3, 4, 9]));

    const celebration = buildCelebration({kind: 'linea', ok: true, carton: cartonWithLine, result, view: 'line'});

    assert.equal(celebration.rows.length, 1);
    assert.equal(celebration.rows[0].complete, true);
    assert.deepEqual(celebration.rows[0].songs, [0, 1, 2, 3].map(i => ({icon: '🎵' + i, iconType: 'emoji', played: true})));
    assert.equal(JSON.stringify(celebration).includes('🎸'), false);
});

test('buildCelebration de una línea correcta con la vista «solo la línea» y varias filas completas las incluye todas', () => {
    const cartonWithLines = richCarton();
    const result = evaluateCarton(cartonWithLines, new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]));

    const celebration = buildCelebration({kind: 'linea', ok: true, carton: cartonWithLines, result, view: 'line'});

    assert.equal(celebration.rows.length, 2);
    assert.ok(celebration.rows.every(row => row.complete && row.songs.every(song => song.played)));
});

test('buildCelebration de una línea correcta sin indicar vista dibuja el cartón entero, que es lo más prudente', () => {
    const cartonWithLine = richCarton();
    const result = evaluateCarton(cartonWithLine, new Set([1, 2, 3, 4]));

    const celebration = buildCelebration({kind: 'linea', ok: true, carton: cartonWithLine, result});

    assert.equal(celebration.rows.length, 3);
});

test('buildCelebration de una línea correcta no envía el icono de ninguna casilla que no haya salido', () => {
    const cartonWithLine = richCarton();
    const result = evaluateCarton(cartonWithLine, new Set([1, 2, 3, 4]));

    const celebration = buildCelebration({kind: 'linea', ok: true, carton: cartonWithLine, result, view: 'carton'});

    const sent = JSON.stringify(celebration);
    assert.equal(sent.includes('data:image'), false);
    assert.equal(sent.includes('🎸'), false);
    assert.equal(celebration.rows.flatMap(row => row.songs).filter(song => song.icon !== '').length, 4);
});

test('buildCelebration de una línea correcta con varias filas completas las marca todas como completas, con huecos solo donde falta', () => {
    const cartonWithLines = richCarton();
    const result = evaluateCarton(cartonWithLines, new Set([1, 2, 3, 4, 5, 6, 7, 8]));

    const celebration = buildCelebration({kind: 'linea', ok: true, carton: cartonWithLines, result});

    assert.equal(celebration.rows.length, 3);
    assert.deepEqual(celebration.rows.map(row => row.complete), [true, true, false]);
    assert.ok(celebration.rows[2].songs.every(song => song.icon === '' && !song.played));
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

test('buildCelebration de un fallo con toda la tabla incluye las tres filas con lo que ha salido y lo que no', () => {
    const partial = richCarton();
    const result = evaluateCarton(partial, new Set([1, 2, 5]));

    const celebration = buildCelebration({kind: 'bingo', ok: false, carton: partial, result, view: 'table'});

    assert.equal(celebration.ok, false);
    assert.equal(celebration.rows.length, 3);
    assert.deepEqual(celebration.rows[0].songs.map(song => song.played), [true, true, false, false]);
    assert.deepEqual(celebration.rows[1].songs.map(song => song.played), [true, false, false, false]);
    assert.equal(celebration.rows.some(row => row.complete), false);
});

test('buildCelebration de un fallo con solo lo acertado dibuja el cartón entero pero sin el icono de lo que no ha salido', () => {
    const partial = richCarton();
    const result = evaluateCarton(partial, new Set([1, 2, 5]));

    const celebration = buildCelebration({kind: 'linea', ok: false, carton: partial, result, view: 'played'});

    assert.equal(celebration.rows.length, 3);
    assert.deepEqual(celebration.rows.map(row => row.songs.length), [4, 4, 3]);
    assert.deepEqual(celebration.rows[0].songs.map(song => song.played), [true, true, false, false]);
    assert.deepEqual(celebration.rows[0].songs.slice(0, 2).map(song => song.icon), ['🎵0', '🎵1']);
    assert.deepEqual(celebration.rows[0].songs.slice(2).map(song => song.icon), ['', '']);
    assert.ok(celebration.rows.flatMap(row => row.songs).filter(song => !song.played).every(song => song.icon === ''));
    assert.equal(JSON.stringify(celebration).includes('🎵2'), false);
    assert.equal(JSON.stringify(celebration).includes('🎵3'), false);
    assert.equal(JSON.stringify(celebration).includes('🎸'), false);
});

test('buildCelebration de un fallo, por defecto, no descubre lo que falta', () => {
    const partial = richCarton();
    const result = evaluateCarton(partial, new Set([1]));

    const celebration = buildCelebration({kind: 'bingo', ok: false, carton: partial, result});

    assert.equal(celebration.rows.length, 3);
    assert.equal(celebration.rows.flatMap(row => row.songs).filter(song => song.icon !== '').length, 1);
});

test('buildCelebration de un fallo sin ningún icono acertado dibuja el cartón entero todo con cruces', () => {
    const partial = richCarton();
    const result = evaluateCarton(partial, new Set());

    const celebration = buildCelebration({kind: 'linea', ok: false, carton: partial, result, view: 'played'});

    assert.equal(celebration.rows.length, 3);
    assert.ok(celebration.rows.flatMap(row => row.songs).every(song => song.played === false && song.icon === ''));
    assert.equal(celebration.rows.flatMap(row => row.songs).length, 11);
});

test('buildCelebration de un acierto de bingo no se ve afectado por la vista de fallo elegida', () => {
    const full = richCarton();
    const result = evaluateCarton(full, new Set([1, 2, 3, 4]));

    const withPlayed = buildCelebration({kind: 'bingo', ok: true, carton: full, result, view: 'played'});
    const withTable = buildCelebration({kind: 'bingo', ok: true, carton: full, result, view: 'table'});

    assert.deepEqual(withPlayed, withTable);
    assert.equal(withPlayed.rows.length, 3);
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

test('buildCelebration de un fallo con vista de solo texto no lleva ninguna fila ni ningún icono', () => {
    const partial = richCarton();
    const result = evaluateCarton(partial, new Set([1, 2, 5]));

    const celebration = buildCelebration({kind: 'linea', ok: false, carton: partial, result, view: 'text'});

    assert.deepEqual(celebration, {kind: 'linea', ok: false, cartonId: 7, rows: []});
    assert.equal(JSON.stringify(celebration).includes('🎵'), false);
});

test('la vista de solo texto no cambia los aciertos', () => {
    const full = richCarton();
    const result = evaluateCarton(full, new Set([1, 2, 3, 4]));

    const celebration = buildCelebration({kind: 'linea', ok: true, carton: full, result, view: 'text'});

    assert.equal(celebration.rows.length, 3);
});
