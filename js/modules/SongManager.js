/**
 * SongManager Module
 * Gestiona las operaciones CRUD de canciones y su filtrado/ordenamiento
 */
export class SongManager {
    constructor() {
        this.songs = [];
        this.songIdCounter = 1;
    }

    /**
     * Agrega nuevas canciones desde archivos
     * @returns {Object} Resultado con canciones agregadas y duplicados
     */
    addSongsFromFiles(files, existingSongs, getRandomIcon) {
        const duplicates = [];
        const newSongs = [];
        const existingTitles = new Set(existingSongs.map(s => s.title));

        for (const file of files) {
            const fileName = file.name.replace(/\.[^/.]+$/, "");

            if (existingTitles.has(fileName)) {
                duplicates.push(fileName);
                continue;
            }

            const randomIcon = getRandomIcon(existingSongs);

            newSongs.push({
                id: this.songIdCounter++,
                title: fileName,
                icon: randomIcon,
                iconType: 'emoji',
                audioPath: file.name,
                file: file,
                played: false
            });
            existingTitles.add(fileName);
        }

        return { newSongs, duplicates };
    }

    /**
     * Elimina una canción por ID
     */
    deleteSong(songs, songId) {
        return songs.filter(s => s.id !== songId);
    }

    /**
     * Elimina todas las canciones
     */
    deleteAllSongs() {
        return [];
    }

    /**
     * Filtra y ordena canciones según criterios
     */
    filterAndSort(songs, filters) {
        const { searchTerm = '', filterStatus = 'all', sortOrder = 'default' } = filters;
        
        let filteredSongs = [...songs];

        // Filtro por búsqueda
        if (searchTerm) {
            const term = searchTerm.toLowerCase().trim();
            filteredSongs = filteredSongs.filter(song => 
                song.title.toLowerCase().includes(term)
            );
        }

        // Filtro por estado
        if (filterStatus === 'played') {
            filteredSongs = filteredSongs.filter(song => song.played);
        } else if (filterStatus === 'pending') {
            filteredSongs = filteredSongs.filter(song => !song.played);
        }

        // Ordenamiento
        switch (sortOrder) {
            case 'alphabetical':
                filteredSongs.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'alphabetical-reverse':
                filteredSongs.sort((a, b) => b.title.localeCompare(a.title));
                break;
            case 'played-first':
                filteredSongs.sort((a, b) => {
                    // Si ambas reproducidas, ordenar por orden de reproducción (antiguas primero)
                    if (a.played && b.played) {
                        return (a.playedOrder || 0) - (b.playedOrder || 0);
                    }
                    // Si una está reproducida y la otra no
                    if (a.played === b.played) return 0;
                    return a.played ? -1 : 1;
                });
                break;
            case 'played-last':
                filteredSongs.sort((a, b) => {
                    // Si ambas reproducidas, ordenar por orden de reproducción inverso (recientes primero)
                    if (a.played && b.played) {
                        return (b.playedOrder || 0) - (a.playedOrder || 0);
                    }
                    // Si una está reproducida y la otra no
                    if (a.played === b.played) return 0;
                    return a.played ? -1 : 1;
                });
                break;
            case 'pending-first':
                filteredSongs.sort((a, b) => {
                    if (a.played === b.played) return 0;
                    return a.played ? 1 : -1;
                });
                break;
            // 'default' mantiene el orden original
        }

        return filteredSongs;
    }

    /**
     * Obtiene el total de canciones con archivos
     */
    getTotalSongsWithFiles(songs) {
        return songs.filter(s => s.file).length;
    }

    /**
     * Obtiene canciones no reproducidas con archivos
     */
    getUnplayedSongsWithFiles(songs) {
        return songs.filter(song => !song.played && song.file);
    }

    /**
     * Obtiene canciones reproducidas
     */
    getPlayedSongs(songs) {
        return songs.filter(song => song.played);
    }

    /**
     * Marca una canción como reproducida
     */
    markAsPlayed(songs, songId) {
        const song = songs.find(s => s.id === songId);
        if (song) {
            song.played = true;
            return true;
        }
        return false;
    }

    /**
     * Reinicia el estado de reproducción de todas las canciones
     */
    resetPlayedStatus(songs) {
        for (const song of songs) {
            song.played = false;
            song.playedOrder = undefined; // Limpiar el orden de reproducción
        }
        return songs;
    }

    /**
     * Busca una canción por ID
     */
    findSongById(songs, songId) {
        return songs.find(s => s.id === songId);
    }

    /**
     * Valida si hay suficientes canciones para jugar
     */
    hasEnoughSongs(songs, minRequired) {
        return this.getTotalSongsWithFiles(songs) >= minRequired;
    }

    /**
     * Valida si hay suficientes canciones y devuelve un mensaje de error si no
     */
    validateMinSongs(songs, minRequired) {
        const totalSongsWithFiles = this.getTotalSongsWithFiles(songs);
        if (totalSongsWithFiles < minRequired) {
            return {
                valid: false,
                error: `Necesitas al menos ${minRequired} canciones cargadas para poder jugar.`,
                title: 'Canciones Insuficientes'
            };
        }
        return { valid: true };
    }

    /**
     * Obtiene estadísticas de canciones
     */
    getStats(songs) {
        const total = songs.length;
        const withFiles = this.getTotalSongsWithFiles(songs);
        const played = this.getPlayedSongs(songs).length;
        const pending = withFiles - played;

        return {
            total,
            withFiles,
            played,
            pending,
            percentage: withFiles > 0 ? Math.round((played / withFiles) * 100) : 0
        };
    }

    /**
     * Reinicia el contador de IDs
     */
    resetIdCounter() {
        this.songIdCounter = 1;
    }

    /**
     * Establece el contador de IDs
     */
    setIdCounter(value) {
        this.songIdCounter = value;
    }

    /**
     * Obtiene el siguiente ID disponible
     */
    getNextId() {
        return this.songIdCounter++;
    }
}
