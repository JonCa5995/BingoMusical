import {BingoCartonGenerator} from '../../js/bingoCartonGenerator.js';
import {GameManager} from '../../js/modules/GameManager.js';
import {captureSnapshot} from '../../js/modules/GameSnapshot.js';
import {defaultSettings} from '../../js/modules/Settings.js';
import {makeSongs, seedRandom} from './seed.js';

export function makeGame({songCount = 26, played = 3, cartones = 3, started = true, name = 'Fiesta'} = {}) {
    const seed = seedRandom(21);
    try {
        const songs = makeSongs(songCount);
        const game = new GameManager();
        game.setGameName(name);

        if (started) game.startGame();
        for (const song of songs.slice(0, played)) game.markSongAsPlayed(song);
        if (played > 0) game.setCurrentSong(songs[played - 1].id);
        if (cartones > 0) game.setCartones(new BingoCartonGenerator().generateCartones(songs, cartones));

        return {songs, game};
    } finally {
        seed.restore();
    }
}

export function makeSnapshot(options = {}) {
    const {songs, game} = makeGame(options);
    return captureSnapshot({songs, game, settings: {...defaultSettings(), gameName: options.name ?? 'Fiesta'}, now: new Date('2026-04-05T06:07:08.000Z')});
}

export const clone = (value) => JSON.parse(JSON.stringify(value));
