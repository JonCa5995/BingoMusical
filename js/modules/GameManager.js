import {
    DEFAULT_ICON_REVEAL_TIME,
    DEFAULT_TITLE_REVEAL_TIME,
    MIN_SONGS_FOR_BINGO,
    MIN_SONGS_FOR_LINEA
} from '../constants.js';
import {MSG} from '../messages.js';

export class GameManager {
    gameStarted = false;
    lineaCompleted = false;
    bingoCompleted = false;
    playedSongs = [];
    currentSongIndex = null;
    continuousMode = false;
    titleRevealTime = DEFAULT_TITLE_REVEAL_TIME;
    iconRevealTime = DEFAULT_ICON_REVEAL_TIME;
    gameName = '';
    cartones = [];

    setCartones(cartones) {
        this.cartones = cartones || [];
    }

    getCartones() {
        return this.cartones;
    }

    addCartones(newCartones) {
        if (!Array.isArray(newCartones)) return;
        this.cartones = [...this.cartones, ...newCartones];
    }

    clearCartones() {
        this.cartones = [];
    }

    getCartonesCount() {
        return this.cartones.length;
    }

    setGameName(name) {
        this.gameName = name || '';
    }

    getGameName() {
        return this.gameName;
    }

    hasCartonesGenerated() {
        return this.cartones.length > 0;
    }

    startGame() {
        this.gameStarted = true;
    }

    isGameStarted() {
        return this.gameStarted;
    }

    toggleContinuousMode() {
        this.continuousMode = !this.continuousMode;
        return this.continuousMode;
    }

    isContinuousMode() {
        return this.continuousMode;
    }

    getRandomUnplayedSong(songs) {
        const unplayedSongs = songs.filter(song => !song.played && song.file);

        if (unplayedSongs.length === 0) {
            return null;
        }

        return unplayedSongs[Math.floor(Math.random() * unplayedSongs.length)];
    }

    getRandomSong(songs) {
        const availableSongs = songs.filter(song => song.file);

        if (availableSongs.length === 0) {
            return null;
        }

        return availableSongs[Math.floor(Math.random() * availableSongs.length)];
    }

    markSongAsPlayed(song) {
        if (!song.played && this.gameStarted) {
            song.played = true;
            song.playedOrder = this.playedSongs.length + 1;
            this.playedSongs.push(song);
            return true;
        }
        return false;
    }

    canCallLinea() {
        if (this.lineaCompleted) {
            return {valid: false, alert: MSG.game.lineaAlreadyCalled};
        }

        if (this.playedSongs.length < MIN_SONGS_FOR_LINEA) {
            return {valid: false, alert: MSG.game.lineaNeedsSongs(MIN_SONGS_FOR_LINEA)};
        }

        return {valid: true};
    }

    completeLinea() {
        this.lineaCompleted = true;
    }

    canCallBingo() {
        if (this.bingoCompleted) {
            return {valid: false, alert: MSG.game.bingoAlreadyCalled};
        }

        if (this.playedSongs.length < MIN_SONGS_FOR_BINGO) {
            return {valid: false, alert: MSG.game.bingoNeedsSongs(MIN_SONGS_FOR_BINGO)};
        }

        return {valid: true};
    }

    completeBingo() {
        this.bingoCompleted = true;
    }

    isBingoCompleted() {
        return this.bingoCompleted;
    }

    allSongsPlayed(songs) {
        const unplayedSongs = songs.filter(song => !song.played && song.file);
        return unplayedSongs.length === 0;
    }

    resetGame() {
        this.gameStarted = false;
        this.continuousMode = false;
        this.lineaCompleted = false;
        this.bingoCompleted = false;
        this.playedSongs = [];
        this.currentSongIndex = null;
    }

    setCurrentSong(songId) {
        this.currentSongIndex = songId;
    }

    getCurrentSong() {
        return this.currentSongIndex;
    }

    getHistory() {
        return this.playedSongs;
    }

    clearHistory() {
        this.playedSongs = [];
    }

    setTitleRevealTime(seconds) {
        this.titleRevealTime = seconds;
    }

    setIconRevealTime(seconds) {
        this.iconRevealTime = seconds;
    }

    getTitleRevealTime() {
        return this.titleRevealTime;
    }

    getIconRevealTime() {
        return this.iconRevealTime;
    }
}
