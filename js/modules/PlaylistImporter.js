/**
 * PlaylistImporter Module
 * Convierte las canciones de un JSON de playlist en canciones jugables: descarta
 * duplicados, asigna iconos libres, conserva los IDs y descarga los audios.
 * No toca la interfaz ni el estado del juego.
 */
import { ICON_TYPE, AUDIO_FILE_EXTENSION } from '../constants.js';

export class PlaylistImporter {
    /**
     * @param {Object} deps
     * @param {string} deps.songsFolder - Carpeta (URL relativa) donde están los mp3
     * @param {SongManager} deps.songManager - Para asignar IDs a las canciones que no lo traen
     * @param {Function} deps.getRandomIcon - (cancionesConIcono) => icono libre
     * @param {Function} [deps.fetchFn] - fetch inyectable (para pruebas)
     */
    constructor({ songsFolder, songManager, getRandomIcon, fetchFn = (...args) => globalThis.fetch(...args) }) {
        this.songsFolder = songsFolder;
        this.songManager = songManager;
        this.getRandomIcon = getRandomIcon;
        this.fetch = fetchFn;
    }

    /**
     * @param {Array} playlistSongs - Canciones tal como vienen en el JSON ({ id, title, icon, iconType })
     * @returns {Promise<{songs: Array, duplicates: string[]}>}
     */
    async loadSongs(playlistSongs) {
        const { candidates, duplicates } = this._prepareCandidates(playlistSongs);

        // Descargar todos los audios en paralelo, con una sola petición por canción
        const loaded = await Promise.all(candidates.map(candidate => this._loadAudio(candidate)));
        const songs = loaded.filter(Boolean);

        // La importación reemplaza la lista: los IDs nuevos empiezan de cero sin chocar con los conservados
        this.songManager.resetIdCounter();
        this.songManager.assignMissingIds(songs);

        return { songs, duplicates };
    }

    _prepareCandidates(playlistSongs) {
        const duplicates = [];
        const candidates = [];
        const titlesAdded = new Set();
        const usedIcons = new Set();
        const usedIds = new Set();

        for (const songData of playlistSongs) {
            const title = songData.title;

            if (titlesAdded.has(title)) {
                duplicates.push(title);
                continue;
            }

            let { icon, iconType = ICON_TYPE.EMOJI } = songData;

            if (!icon || usedIcons.has(icon)) {
                // Excluir los iconos ya asignados en esta importación
                const assigned = [...usedIcons].map(usedIcon => ({ icon: usedIcon, iconType: ICON_TYPE.EMOJI }));
                icon = this.getRandomIcon(assigned);
                iconType = ICON_TYPE.EMOJI;
            }

            usedIcons.add(icon);
            titlesAdded.add(title);

            // Conservar el ID original para que los cartones importados sigan apuntando a la misma canción
            const hasValidId = Number.isInteger(songData.id) && !usedIds.has(songData.id);
            const id = hasValidId ? songData.id : null;
            if (hasValidId) usedIds.add(id);

            candidates.push({ id, title, icon, iconType, audioPath: this.songsFolder + title + AUDIO_FILE_EXTENSION });
        }

        return { candidates, duplicates };
    }

    async _loadAudio(candidate) {
        try {
            const url = this.songsFolder + encodeURIComponent(candidate.title) + AUDIO_FILE_EXTENSION;
            const response = await this.fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return { ...candidate, file: await response.blob(), played: false };
        } catch {
            console.warn(`Archivo no encontrado: ${candidate.audioPath}`);
            return null;
        }
    }
}
