/**
 * SongManager Module
 * Gestiona las operaciones CRUD de canciones y su filtrado/ordenamiento
 */

/** Reproducidas antes que pendientes; entre reproducidas, según `playedOrderDirection` (1 o -1) */
const playedFirst = (playedOrderDirection) => (a, b) => {
    if (a.played && b.played) {
        return playedOrderDirection * ((a.playedOrder || 0) - (b.playedOrder || 0));
    }
    if (a.played === b.played) return 0;
    return a.played ? -1 : 1;
};

/**
 * Estrategias de ordenación, indexadas por el valor del <select id="sort-order">.
 * Para añadir una ordenación nueva basta con añadir aquí su comparador.
 */
export const SORT_STRATEGIES = {
    'alphabetical': (a, b) => a.title.localeCompare(b.title),
    'alphabetical-reverse': (a, b) => b.title.localeCompare(a.title),
    // Reproducidas primero, de la más antigua a la más reciente
    'played-first': playedFirst(1),
    // Reproducidas primero, de la más reciente a la más antigua
    'played-last': playedFirst(-1),
    'pending-first': (a, b) => {
        if (a.played === b.played) return 0;
        return a.played ? 1 : -1;
    }
};

export class SongManager {
    songIdCounter = 1;

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

            // Incluir las canciones de este mismo lote para no repetir iconos
            const randomIcon = getRandomIcon([...existingSongs, ...newSongs]);

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

        // Ordenamiento ('default' u otro valor sin estrategia mantiene el orden original)
        const comparator = SORT_STRATEGIES[sortOrder];
        if (comparator) {
            filteredSongs.sort(comparator);
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
     * Reinicia el estado de reproducción de todas las canciones
     */
    resetPlayedStatus(songs) {
        for (const song of songs) {
            song.played = false;
            song.playedOrder = undefined;
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
     * Reinicia el contador de IDs
     */
    resetIdCounter() {
        this.songIdCounter = 1;
    }


    /**
     * Ajusta el contador por encima del mayor ID existente y asigna ID
     * a las canciones que no lo tengan
     */
    assignMissingIds(songs) {
        const maxId = songs.reduce((max, s) => (s.id === null ? max : Math.max(max, s.id)), 0);
        this.songIdCounter = Math.max(this.songIdCounter, maxId + 1);
        for (const song of songs) {
            if (song.id === null) song.id = this.songIdCounter++;
        }
    }
}
