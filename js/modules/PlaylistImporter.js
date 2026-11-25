import { ICON_TYPE, AUDIO_FILE_EXTENSION } from '../constants.js';

export class PlaylistImporter {
    constructor({ songsFolder, songManager, getRandomIcon, fetchFn = (...args) => globalThis.fetch(...args) }) {
        this.songsFolder = songsFolder;
        this.songManager = songManager;
        this.getRandomIcon = getRandomIcon;
        this.fetch = fetchFn;
    }

    async loadSongs(playlistSongs) {
        const { candidates, duplicates } = this._prepareCandidates(playlistSongs);

        const songs = await Promise.all(candidates.map(candidate => this._loadAudio(candidate)));
        const missing = songs.filter(song => !song.file).map(song => song.title);

        this.songManager.resetIdCounter();
        this.songManager.assignMissingIds(songs);

        return { songs, duplicates, missing };
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
                const assigned = [...usedIcons].map(usedIcon => ({ icon: usedIcon, iconType: ICON_TYPE.EMOJI }));
                icon = this.getRandomIcon(assigned);
                iconType = ICON_TYPE.EMOJI;
            }

            usedIcons.add(icon);
            titlesAdded.add(title);

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
            return { ...candidate, file: null, played: false };
        }
    }
}
