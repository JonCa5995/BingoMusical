/**
 * StorageManager Module
 * Gestiona la persistencia de datos (export/import JSON y localStorage)
 */
import {downloadFile, slugify} from '../utils.js';

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
    // LocalStorage Methods
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
            return {success: false, error: 'No hay canciones para exportar'};
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

            const date = new Date().toISOString().split('T')[0];
            const fileName = `${gameName ? slugify(gameName) : 'bingo-musical'}-${date}.json`;

            downloadFile(
                JSON.stringify(playlist, null, 2),
                fileName,
                'application/json',
                'Descargar lista de canciones en formato JSON'
            );

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
            return {success: false, error: error.message};
        }
    }

    /**
     * Importa una lista de canciones desde un archivo JSON
     */
    async importPlaylist(file) {
        if (!file) {
            return {success: false, error: 'No se seleccionó ningún archivo'};
        }

        try {
            const text = await file.text();
            const playlist = JSON.parse(text);

            if (!playlist.songs || !Array.isArray(playlist.songs)) {
                return {success: false, error: 'Formato de archivo inválido'};
            }

            return {success: true, playlist};
        } catch (error) {
            console.error('Error al importar playlist:', error);
            return {success: false, error: error.message};
        }
    }

}
