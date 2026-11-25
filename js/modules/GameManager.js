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

    _unplayedSongs(songs) {
        return songs.filter(song => !song.played && song.file);
    }

    _pickRandom(list) {
        if (list.length === 0) {
            return null;
        }

        return list[Math.floor(Math.random() * list.length)];
    }

    getRandomUnplayedSong(songs) {
        return this._pickRandom(this._unplayedSongs(songs));
    }

    getRandomSong(songs) {
        return this._pickRandom(songs.filter(song => song.file));
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

    _canCall(completed, alreadyAlert, needed, needsAlert) {
        if (completed) {
            return {valid: false, alert: alreadyAlert};
        }

        if (this.playedSongs.length < needed) {
            return {valid: false, alert: needsAlert(needed)};
        }

        return {valid: true};
    }

    canCallLinea() {
        return this._canCall(this.lineaCompleted, MSG.game.lineaAlreadyCalled, MIN_SONGS_FOR_LINEA, MSG.game.lineaNeedsSongs);
    }

    completeLinea() {
        this.lineaCompleted = true;
    }

    canCallBingo() {
        return this._canCall(this.bingoCompleted, MSG.game.bingoAlreadyCalled, MIN_SONGS_FOR_BINGO, MSG.game.bingoNeedsSongs);
    }

    completeBingo() {
        this.bingoCompleted = true;
    }

    isBingoCompleted() {
        return this.bingoCompleted;
    }

    allSongsPlayed(songs) {
        return this._unplayedSongs(songs).length === 0;
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
