import test from 'node:test';
import assert from 'node:assert/strict';
import {SongManager, SORT_STRATEGIES} from '../js/modules/SongManager.js';
import {MSG} from '../js/messages.js';

const file = (name) => ({name});
const randomIcon = () => '🎵';

test('addSongsFromFiles quita la extensión, asigna ids correlativos y detecta duplicados', () => {
    const manager = new SongManager();
    const {newSongs, duplicates} = manager.addSongsFromFiles([file('Uno.mp3'), file('Dos.mp3'), file('Uno.mp3')], [], randomIcon);

    assert.deepEqual(newSongs.map(song => [song.id, song.title]), [[1, 'Uno'], [2, 'Dos']]);
    assert.deepEqual(duplicates, ['Uno']);
    assert.equal(newSongs[0].audioPath, 'Uno.mp3');
    assert.equal(newSongs[0].played, false);
});

test('no repite títulos ya existentes', () => {
    const manager = new SongManager();
    const existing = [{id: 1, title: 'Uno', icon: '🎵'}];
    const {newSongs, duplicates} = manager.addSongsFromFiles([file('Uno.mp3'), file('Tres.mp3')], existing, randomIcon);

    assert.deepEqual(newSongs.map(song => song.title), ['Tres']);
    assert.deepEqual(duplicates, ['Uno']);
});

test('filterAndSort filtra por texto y estado y ordena', () => {
    const manager = new SongManager();
    const songs = [
        {id: 1, title: 'Beta', played: true, playedOrder: 2},
        {id: 2, title: 'alfa', played: false},
        {id: 3, title: 'Gamma', played: true, playedOrder: 1}
    ];

    assert.deepEqual(manager.filterAndSort(songs, {searchTerm: ' AL '}).map(song => song.id), [2]);
    assert.deepEqual(manager.filterAndSort(songs, {filterStatus: 'played'}).map(song => song.id), [1, 3]);
    assert.deepEqual(manager.filterAndSort(songs, {filterStatus: 'pending'}).map(song => song.id), [2]);
    assert.deepEqual(manager.filterAndSort(songs, {sortOrder: 'alphabetical'}).map(song => song.title), ['alfa', 'Beta', 'Gamma']);
    assert.deepEqual(manager.filterAndSort(songs, {sortOrder: 'played-first'}).map(song => song.id), [3, 1, 2]);
    assert.deepEqual(manager.filterAndSort(songs, {sortOrder: 'played-last'}).map(song => song.id), [1, 3, 2]);
    assert.deepEqual(manager.filterAndSort(songs, {sortOrder: 'pending-first'}).map(song => song.id)[0], 2);
    assert.deepEqual(manager.filterAndSort(songs, {}).map(song => song.id), [1, 2, 3]);
    assert.ok(Object.keys(SORT_STRATEGIES).length >= 5);
});

test('validateMinSongs cuenta solo las canciones con archivo', () => {
    const manager = new SongManager();
    const songs = [{file: {}}, {file: {}}, {file: null}];

    assert.deepEqual(manager.validateMinSongs(songs, 2), {valid: true});
    assert.deepEqual(manager.validateMinSongs(songs, 3), {valid: false, alert: MSG.songs.notEnoughToPlay(3)});
    assert.equal(manager.getTotalSongsWithFiles(songs), 2);
});

test('assignMissingIds continúa tras el mayor id existente', () => {
    const manager = new SongManager();
    const songs = [{id: 5}, {id: null}, {id: 2}, {id: null}];

    manager.assignMissingIds(songs);

    assert.deepEqual(songs.map(song => song.id), [5, 6, 2, 7]);
    manager.resetIdCounter();
    assert.equal(manager.songIdCounter, 1);
});

test('resetPlayedStatus, deleteSong y findSongById', () => {
    const manager = new SongManager();
    const songs = [{id: 1, played: true, playedOrder: 1}, {id: 2, played: true, playedOrder: 2}];

    manager.resetPlayedStatus(songs);

    assert.deepEqual(songs.map(song => [song.played, song.playedOrder]), [[false, undefined], [false, undefined]]);
    assert.deepEqual(manager.deleteSong(songs, 1).map(song => song.id), [2]);
    assert.equal(manager.findSongById(songs, 2).id, 2);
    assert.equal(manager.findSongById(songs, 9), undefined);
});
