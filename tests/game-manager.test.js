import test from 'node:test';
import assert from 'node:assert/strict';
import {GameManager} from '../js/modules/GameManager.js';
import {MSG} from '../js/messages.js';
import {MIN_SONGS_FOR_BINGO, MIN_SONGS_FOR_LINEA} from '../js/constants.js';
import {makeSongs, seedRandom} from './helpers/seed.js';

test('empieza sin partida, sin cartones y con los tiempos de revelado por defecto', () => {
    const game = new GameManager();

    assert.equal(game.isGameStarted(), false);
    assert.equal(game.getCartonesCount(), 0);
    assert.equal(game.getGameName(), '');
    assert.equal(game.getCurrentSong(), null);
    assert.deepEqual(game.getHistory(), []);
});

test('markSongAsPlayed solo marca con la partida iniciada y numera por orden', () => {
    const game = new GameManager();
    const [first, second] = makeSongs(2);

    assert.equal(game.markSongAsPlayed(first), false);
    game.startGame();
    assert.equal(game.markSongAsPlayed(first), true);
    assert.equal(game.markSongAsPlayed(first), false);
    assert.equal(game.markSongAsPlayed(second), true);

    assert.equal(first.playedOrder, 1);
    assert.equal(second.playedOrder, 2);
    assert.deepEqual(game.getHistory().map(song => song.id), [1, 2]);
});

test('canCallLinea y canCallBingo piden las canciones mínimas y no se repiten', () => {
    const game = new GameManager();
    game.startGame();

    assert.deepEqual(game.canCallLinea(), {valid: false, alert: MSG.game.lineaNeedsSongs(MIN_SONGS_FOR_LINEA)});
    assert.deepEqual(game.canCallBingo(), {valid: false, alert: MSG.game.bingoNeedsSongs(MIN_SONGS_FOR_BINGO)});

    makeSongs(MIN_SONGS_FOR_BINGO).forEach(song => game.markSongAsPlayed(song));
    assert.deepEqual(game.canCallLinea(), {valid: true});
    assert.deepEqual(game.canCallBingo(), {valid: true});

    game.completeLinea();
    game.completeBingo();
    assert.equal(game.canCallLinea().alert, MSG.game.lineaAlreadyCalled);
    assert.equal(game.canCallBingo().alert, MSG.game.bingoAlreadyCalled);
});

test('las canciones sin archivo no se eligen ni cuentan como pendientes', () => {
    const game = new GameManager();
    const songs = makeSongs(4, {withFile: 2});
    songs[0].played = true;

    assert.equal(game.getRandomUnplayedSong(songs).id, 2);
    assert.equal(game.allSongsPlayed(songs), false);
    songs[1].played = true;
    assert.equal(game.allSongsPlayed(songs), true);
    assert.equal(game.getRandomUnplayedSong(songs), null);
    assert.equal(game.getRandomSong([]), null);
});

test('con lista vacía no se llama a Math.random', () => {
    const seed = seedRandom(3);
    try {
        const game = new GameManager();
        game.getRandomSong([]);
        game.getRandomUnplayedSong(makeSongs(3, {withFile: 0}));
        assert.equal(seed.calls(), 0);
    } finally {
        seed.restore();
    }
});

test('resetGame limpia la partida pero conserva cartones y nombre', () => {
    const game = new GameManager();
    game.setGameName('Fiesta');
    game.setCartones([{id: 1}]);
    game.startGame();
    game.markSongAsPlayed(makeSongs(1)[0]);
    game.completeBingo();

    game.resetGame();

    assert.equal(game.isGameStarted(), false);
    assert.equal(game.isBingoCompleted(), false);
    assert.deepEqual(game.getHistory(), []);
    assert.equal(game.getGameName(), 'Fiesta');
    assert.equal(game.getCartonesCount(), 1);
});

test('addCartones añade y setCartones tolera valores nulos', () => {
    const game = new GameManager();

    game.setCartones(null);
    assert.equal(game.getCartonesCount(), 0);
    game.addCartones([{id: 1}, {id: 2}]);
    game.addCartones('no es una lista');
    assert.equal(game.getCartonesCount(), 2);
});

test('alterna el modo continuo', () => {
    const game = new GameManager();

    assert.equal(game.toggleContinuousMode(), true);
    assert.equal(game.isContinuousMode(), true);
    assert.equal(game.toggleContinuousMode(), false);
});
