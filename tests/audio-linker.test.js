import test from 'node:test';
import assert from 'node:assert/strict';
import {linkAudioFiles} from '../js/modules/AudioLinker.js';

const file = (name, type = 'audio/mpeg') => ({name, type});
const song = (title, withFile = false) => ({id: title, title, file: withFile ? {name: 'previo.mp3'} : null});

test('vincula cada canción sin archivo con el archivo cuyo nombre, sin extensión, es su título', () => {
    const songs = [song('Uno'), song('Dos')];

    const result = linkAudioFiles(songs, [file('Dos.mp3'), file('Uno.wav')]);

    assert.equal(result.linked.length, 2);
    assert.equal(songs[0].file.name, 'Uno.wav');
    assert.equal(songs[1].audioPath, 'Dos.mp3');
    assert.deepEqual(result.missing, []);
    assert.equal(result.pendingCount, 2);
});

test('las canciones sin coincidencia quedan pendientes y se cuentan', () => {
    const songs = [song('Uno'), song('Dos'), song('Tres')];

    const result = linkAudioFiles(songs, [file('Uno.mp3')]);

    assert.deepEqual(result.missing.map(item => item.title), ['Dos', 'Tres']);
    assert.equal(songs[1].file, null);
    assert.equal(result.audioFiles, 1);
});

test('no toca las canciones que ya tienen archivo', () => {
    const songs = [song('Uno', true), song('Dos')];

    const result = linkAudioFiles(songs, [file('Uno.mp3'), file('Dos.mp3')]);

    assert.equal(songs[0].file.name, 'previo.mp3');
    assert.equal(result.pendingCount, 1);
    assert.equal(result.linked.length, 1);
});

test('ignora mayúsculas, espacios sobrantes y la forma Unicode del nombre', () => {
    const nfd = 'Canción'.normalize('NFD');
    const songs = [song('Canción'), song('Adiós')];

    linkAudioFiles(songs, [file(`${nfd}.mp3`), file('  ADIÓS .mp3')]);

    assert.ok(songs[0].file);
    assert.ok(songs[1].file);
});

test('solo acepta archivos de audio, por tipo o por extensión', () => {
    const songs = [song('Foto'), song('Texto'), song('Sonido'), song('Otro')];

    linkAudioFiles(songs, [file('Foto.jpg', 'image/jpeg'), file('Texto.txt', 'text/plain'), file('Sonido.flac', ''), file('Otro.dat', 'audio/x-raro')]);

    assert.equal(songs[0].file, null);
    assert.equal(songs[1].file, null);
    assert.ok(songs[2].file);
    assert.ok(songs[3].file);
});

test('si hay dos archivos con el mismo título se queda con el primero', () => {
    const songs = [song('Uno')];

    linkAudioFiles(songs, [file('Uno.mp3'), file('Uno.wav')]);

    assert.equal(songs[0].file.name, 'Uno.mp3');
});

test('tolera archivos sin nombre y listas vacías', () => {
    const songs = [song('Uno')];

    assert.doesNotThrow(() => linkAudioFiles(songs, [null, {}, file('')]));
    assert.deepEqual(linkAudioFiles([], [file('Uno.mp3')]), {linked: [], missing: [], pendingCount: 0, audioFiles: 1});
    assert.equal(linkAudioFiles(songs, []).linked.length, 0);
});
