/**
 * GameManager Module
 * Gestiona la lógica del juego de bingo: reproducción aleatoria, historial, LÍNEA y BINGO
 */
export class GameManager {
    gameStarted = false;
    lineaCompleted = false;
    bingoCompleted = false;
    playedSongs = [];
    currentSongIndex = null;
    continuousMode = false;
    titleRevealTime = 5; // segundos
    iconRevealTime = 10; // segundos
    gameName = ''; // Nombre del juego/lista
    cartonesGenerated = false; // Flag para controlar si se generaron cartones
    cartones = []; // Array de cartones generados

    /**
     * Establece los cartones generados
     */
    setCartones(cartones) {
        this.cartones = cartones || [];
        this.cartonesGenerated = this.cartones.length > 0;
    }

    /**
     * Obtiene los cartones almacenados
     */
    getCartones() {
        return this.cartones;
    }

    /**
     * Añade cartones a los existentes
     */
    addCartones(newCartones) {
        if (!Array.isArray(newCartones)) return;
        this.cartones = [...this.cartones, ...newCartones];
        this.cartonesGenerated = this.cartones.length > 0;
    }

    /**
     * Elimina todos los cartones
     */
    clearCartones() {
        this.cartones = [];
        this.cartonesGenerated = false;
    }

    /**
     * Obtiene el número de cartones almacenados
     */
    getCartonesCount() {
        return this.cartones.length;
    }

    /**
     * Establece el nombre del juego
     */
    setGameName(name) {
        this.gameName = name || '';
    }

    /**
     * Obtiene el nombre del juego
     */
    getGameName() {
        return this.gameName;
    }

    /**
     * Marca que se generaron cartones
     */
    setCartonesGenerated(generated) {
        this.cartonesGenerated = generated;
    }

    /**
     * Verifica si se generaron cartones
     */
    hasCartonesGenerated() {
        return this.cartonesGenerated;
    }

    /**
     * Inicia el juego
     */
    startGame() {
        this.gameStarted = true;
    }

    /**
     * Verifica si el juego ha comenzado
     */
    isGameStarted() {
        return this.gameStarted;
    }

    /**
     * Alterna el modo continuo
     */
    toggleContinuousMode() {
        this.continuousMode = !this.continuousMode;
        return this.continuousMode;
    }

    /**
     * Obtiene una canción aleatoria no reproducida
     */
    getRandomUnplayedSong(songs) {
        const unplayedSongs = songs.filter(song => !song.played && song.file);
        
        if (unplayedSongs.length === 0) {
            return null;
        }

        return unplayedSongs[Math.floor(Math.random() * unplayedSongs.length)];
    }

    /**
     * Obtiene una canción aleatoria (cualquiera con archivo)
     */
    getRandomSong(songs) {
        const availableSongs = songs.filter(song => song.file);
        
        if (availableSongs.length === 0) {
            return null;
        }

        return availableSongs[Math.floor(Math.random() * availableSongs.length)];
    }

    /**
     * Marca una canción como reproducida y la agrega al historial
     */
    markSongAsPlayed(song) {
        if (!song.played && this.gameStarted) {
            song.played = true;
            song.playedOrder = this.playedSongs.length + 1; // Añadir orden de reproducción
            this.playedSongs.push(song);
            return true;
        }
        return false;
    }

    /**
     * Valida si se puede cantar LÍNEA
     */
    canCallLinea() {
        if (this.lineaCompleted) {
            return {
                valid: false,
                error: 'La línea ya fue cantada. Solo puedes cantar línea una vez por juego.',
                title: 'Línea Ya Cantada'
            };
        }

        if (this.playedSongs.length < 4) {
            return {
                valid: false,
                error: 'Debes reproducir al menos 4 canciones antes de cantar LÍNEA.',
                title: 'Canciones Insuficientes'
            };
        }

        return { valid: true };
    }

    /**
     * Marca LÍNEA como completada
     */
    completeLinea() {
        this.lineaCompleted = true;
    }

    /**
     * Valida si se puede cantar BINGO
     */
    canCallBingo() {
        if (this.bingoCompleted) {
            return {
                valid: false,
                error: 'El bingo ya fue completado. Reinicia el juego para comenzar de nuevo.',
                title: 'Bingo Ya Completado'
            };
        }

        if (this.playedSongs.length < 12) {
            return {
                valid: false,
                error: 'Debes reproducir al menos 12 canciones antes de cantar BINGO.',
                title: 'Canciones Insuficientes'
            };
        }

        return { valid: true };
    }

    /**
     * Marca BINGO como completado
     */
    completeBingo() {
        this.bingoCompleted = true;
    }

    /**
     * Verifica si todas las canciones han sido reproducidas
     */
    allSongsPlayed(songs) {
        const unplayedSongs = songs.filter(song => !song.played && song.file);
        return unplayedSongs.length === 0;
    }

    /**
     * Verifica si solo queda una canción sin reproducir
     */
    onlyOneSongLeft(songs) {
        const unplayedSongs = songs.filter(song => !song.played && song.file);
        return unplayedSongs.length === 1;
    }

    /**
     * Reinicia el estado del juego
     */
    resetGame() {
        this.gameStarted = false;
        this.continuousMode = false;
        this.lineaCompleted = false;
        this.bingoCompleted = false;
        this.playedSongs = [];
        this.currentSongIndex = null;
        // NO resetear gameName ni cartonesGenerated
        // El nombre y cartones persisten entre juegos
    }

    /**
     * Obtiene estadísticas del juego
     */
    getGameStats(totalSongsWithFiles) {
        return {
            gameStarted: this.gameStarted,
            songsPlayed: this.playedSongs.length,
            totalSongs: totalSongsWithFiles,
            percentage: totalSongsWithFiles > 0 
                ? Math.round((this.playedSongs.length / totalSongsWithFiles) * 100) 
                : 0,
            lineaCompleted: this.lineaCompleted,
            bingoCompleted: this.bingoCompleted,
            continuousMode: this.continuousMode
        };
    }

    /**
     * Establece la canción actual
     */
    setCurrentSong(songId) {
        this.currentSongIndex = songId;
    }

    /**
     * Obtiene la canción actual
     */
    getCurrentSong() {
        return this.currentSongIndex;
    }

    /**
     * Limpia el historial de canciones reproducidas
     */
    clearHistory() {
        this.playedSongs = [];
    }

    /**
     * Obtiene el historial de canciones reproducidas
     */
    getHistory() {
        return this.playedSongs;
    }

    /**
     * Establece el tiempo de revelación del título
     */
    setTitleRevealTime(seconds) {
        this.titleRevealTime = seconds;
    }

    /**
     * Establece el tiempo de revelación del icono
     */
    setIconRevealTime(seconds) {
        this.iconRevealTime = seconds;
    }

    /**
     * Obtiene el tiempo de revelación del título
     */
    getTitleRevealTime() {
        return this.titleRevealTime;
    }

    /**
     * Obtiene el tiempo de revelación del icono
     */
    getIconRevealTime() {
        return this.iconRevealTime;
    }
}
