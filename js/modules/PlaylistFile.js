/**
 * PlaylistFile Module
 * Archivo JSON de la playlist: crearlo y descargarlo (exportar) y leerlo (importar).
 */
import { downloadFile, slugify } from '../utils.js';
import { serializeCartones } from './CartonSerializer.js';

export class PlaylistFile {
    /**
     * @param {Object} [options]
     * @param {Function} [options.download] - (contenido, nombre, mime, ariaLabel); inyectable para pruebas
     * @param {Function} [options.now] - Devuelve la fecha actual; inyectable para pruebas
     */
    constructor({ download = downloadFile, now = () => new Date() } = {}) {
        this.download = download;
        this.now = now;
    }

    /**
     * Construye el contenido del JSON de la playlist
     */
    build(songs, gameName = '', cartones = []) {
        return {
            version: '1.1',
            name: gameName || 'Lista de Bingo Musical',
            date: this.now().toISOString(),
            songs: songs.map(song => ({
                id: song.id,
                title: song.title,
                icon: song.icon,
                iconType: song.iconType || 'emoji',
            })),
            cartones: serializeCartones(cartones)
        };
    }

    /**
     * Exporta la lista de canciones (y sus cartones) a un archivo JSON
     */
    export(songs, songsFolder, gameName = '', cartones = []) {
        if (!songs || songs.length === 0) {
            return { success: false, error: 'No hay canciones para exportar' };
        }

        try {
            const playlist = this.build(songs, gameName, cartones);
            const date = this.now().toISOString().split('T')[0];
            const fileName = `${gameName ? slugify(gameName) : 'bingo-musical'}-${date}.json`;

            this.download(
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
            return { success: false, error: error.message };
        }
    }

    /**
     * Lee un archivo JSON de playlist
     * @param {File} file
     */
    async read(file) {
        if (!file) {
            return { success: false, error: 'No se seleccionó ningún archivo' };
        }

        try {
            const playlist = JSON.parse(await file.text());

            if (!Array.isArray(playlist.songs)) {
                return { success: false, error: 'Formato de archivo inválido' };
            }

            return { success: true, playlist };
        } catch (error) {
            console.error('Error al importar playlist:', error);
            return { success: false, error: error.message };
        }
    }
}
