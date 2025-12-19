/**
 * StorageManager Module
 * Gestiona la persistencia de datos (export/import JSON y localStorage)
 */
export class StorageManager {
    STORAGE_PREFIX = 'bingoMusical_';
    constructor() {
        this.STORAGE_KEYS = {
            THEME: this.STORAGE_PREFIX + 'theme',
            SONGS: this.STORAGE_PREFIX + 'songs',
            HISTORY: this.STORAGE_PREFIX + 'history',
            SETTINGS: this.STORAGE_PREFIX + 'settings'
        };
    }

    // ========================================
    // LocalStorage Methods (opcional)
    // ========================================

    /**
     * Guarda un valor en localStorage
     */
    save(key, value) {
        try {
            const data = JSON.stringify(value);
            localStorage.setItem(this.STORAGE_KEYS[key] || key, data);
            return true;
        } catch (error) {
            console.error('Error al guardar en localStorage:', error);
            return false;
        }
    }

    /**
     * Carga un valor desde localStorage
     */
    load(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS[key] || key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error('Error al cargar desde localStorage:', error);
            return defaultValue;
        }
    }

    /**
     * Elimina un valor de localStorage
     */
    remove(key) {
        try {
            localStorage.removeItem(this.STORAGE_KEYS[key] || key);
            return true;
        } catch (error) {
            console.error('Error al eliminar de localStorage:', error);
            return false;
        }
    }

    /**
     * Limpia todos los datos del juego de localStorage
     */
    clearAll() {
        try {
            for (const key of Object.values(this.STORAGE_KEYS)) {
                localStorage.removeItem(key);
            }
            return true;
        } catch (error) {
            console.error('Error al limpiar localStorage:', error);
            return false;
        }
    }

    // ========================================
    // Theme Persistence
    // ========================================

    /**
     * Guarda el tema seleccionado
     */
    saveTheme(theme) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.THEME, theme);
            return true;
        } catch (error) {
            console.error('Error al guardar tema:', error);
            return false;
        }
    }

    /**
     * Carga el tema guardado
     */
    loadTheme(defaultTheme = 'dark') {
        try {
            return localStorage.getItem(this.STORAGE_KEYS.THEME) || defaultTheme;
        } catch (error) {
            console.error('Error al cargar tema:', error);
            return defaultTheme;
        }
    }

    // ========================================
    // Export/Import Playlist
    // ========================================

    /**
     * Exporta la lista de canciones a un archivo JSON
     */
    exportPlaylist(songs, songsFolder, gameName = '', cartones = []) {
        if (!songs || songs.length === 0) {
            return { success: false, error: 'No hay canciones para exportar' };
        }

        try {
            const playlist = {
                version: '1.1',
                name: gameName || 'Lista de Bingo Musical',
                date: new Date().toISOString(),
                songs: songs.map(song => ({
                    id: song.id,
                    title: song.title,
                    icon: song.icon,
                    iconType: song.iconType || 'emoji',
                })),
                cartones: cartones.map(carton => ({
                    id: carton.id,
                    songs: carton.songs.map(s => s.id),
                    rows: carton.rows.map(row => ({
                        cells: row.cells.map(cell => ({
                            position: cell.position,
                            songId: cell.type === 'song' ? cell.song.id : null
                        }))
                    })),
                    generatedAt: carton.generatedAt
                }))
            };

            const dataStr = JSON.stringify(playlist, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            const url = URL.createObjectURL(dataBlob);

            const link = document.createElement('a');
            const date = new Date().toISOString().split('T')[0];
            const fileName = gameName
                ? `${gameName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${date}.json`
                : `bingo-musical-${date}.json`;
            link.href = url;
            link.download = fileName;
            link.setAttribute('aria-label', 'Descargar lista de canciones en formato JSON');
            
            document.body.appendChild(link);
            link.click();
            link.remove();

            URL.revokeObjectURL(url);

            const cartonesInfo = cartones.length > 0
                ? `\n${cartones.length} cartón(es) incluido(s) en el archivo.`
                : '';

            return {
                success: true,
                message: `Lista "${gameName || 'Bingo Musical'}" exportada correctamente.${cartonesInfo}\n\n` +
                        `Coloca el archivo JSON en la carpeta raíz del proyecto.\n` +
                        `Coloca los archivos de audio en: ${songsFolder}`
            };
        } catch (error) {
            console.error('Error al exportar playlist:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Importa una lista de canciones desde un archivo JSON
     */
    async importPlaylist(file) {
        if (!file) {
            return { success: false, error: 'No se seleccionó ningún archivo' };
        }

        try {
            const text = await file.text();
            const playlist = JSON.parse(text);

            if (!playlist.songs || !Array.isArray(playlist.songs)) {
                throw new Error('Formato de archivo inválido');
            }

            return { success: true, playlist };
        } catch (error) {
            console.error('Error al importar playlist:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Valida la estructura de una playlist importada
     */
    validatePlaylist(playlist) {
        if (!playlist || typeof playlist !== 'object') {
            return { valid: false, error: 'Formato de playlist inválido' };
        }

        if (!playlist.songs || !Array.isArray(playlist.songs)) {
            return { valid: false, error: 'La playlist no contiene canciones' };
        }

        const invalidSongs = playlist.songs.filter(song => 
            !song.title || typeof song.title !== 'string'
        );

        if (invalidSongs.length > 0) {
            return { valid: false, error: 'Algunas canciones no tienen título válido' };
        }

        return { valid: true };
    }

    // ========================================
    // Future: Songs Persistence (preparado para cuando lo necesites)
    // ========================================

    /**
     * Guarda la lista de canciones (deshabilitado por ahora)
     */
    saveSongs(songs) {
        // Deshabilitado: no guardar en localStorage por decisión del usuario
        // return this.save('SONGS', songs);
        console.log('SaveSongs: Persistencia deshabilitada');
        return false;
    }

    /**
     * Carga la lista de canciones (deshabilitado por ahora)
     */
    loadSongs() {
        // Deshabilitado: no cargar de localStorage
        // return this.load('SONGS', []);
        console.log('LoadSongs: Persistencia deshabilitada');
        return [];
    }

    /**
     * Guarda el historial de reproducción (deshabilitado por ahora)
     */
    saveHistory(history) {
        // Deshabilitado
        console.log('SaveHistory: Persistencia deshabilitada');
        return false;
    }

    /**
     * Carga el historial de reproducción (deshabilitado por ahora)
     */
    loadHistory() {
        // Deshabilitado
        console.log('LoadHistory: Persistencia deshabilitada');
        return [];
    }
}
