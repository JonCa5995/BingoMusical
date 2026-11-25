import {downloadFile, gameNameOrDefault, slugify} from '../utils.js';
import {serializeCartones} from './CartonSerializer.js';
import {DEFAULT_PLAYLIST_NAME, ICON_TYPE} from '../constants.js';
import {TEXT} from '../messages.js';

export class PlaylistFile {
    constructor({download = downloadFile, now = () => new Date()} = {}) {
        this.download = download;
        this.now = now;
    }

    build(songs, gameName = '', cartones = []) {
        return {
            version: '1.1',
            name: gameName || DEFAULT_PLAYLIST_NAME,
            date: this.now().toISOString(),
            songs: songs.map(song => ({
                id: song.id,
                title: song.title,
                icon: song.icon,
                iconType: song.iconType || ICON_TYPE.EMOJI,
            })),
            cartones: serializeCartones(cartones)
        };
    }

    export(songs, songsFolder, gameName = '', cartones = []) {
        if (!songs || songs.length === 0) {
            return {success: false, error: TEXT.playlist.noSongsToExport};
        }

        try {
            const playlist = this.build(songs, gameName, cartones);
            const date = this.now().toISOString().split('T')[0];
            const fileName = `${slugify(gameNameOrDefault(gameName))}-${date}.json`;

            this.download(
                JSON.stringify(playlist, null, 2),
                fileName,
                'application/json',
                TEXT.playlist.downloadLabel
            );

            const cartonesInfo = cartones.length > 0
                ? TEXT.playlist.cartonesIncluded(cartones.length)
                : '';

            return {
                success: true,
                message: TEXT.playlist.exported(gameNameOrDefault(gameName), cartonesInfo, songsFolder)
            };
        } catch (error) {
            console.error('Error al exportar playlist:', error);
            return {success: false, error: error.message};
        }
    }

    async read(file) {
        if (!file) {
            return {success: false, error: TEXT.playlist.noFileSelected};
        }

        try {
            const playlist = JSON.parse(await file.text());

            if (!Array.isArray(playlist.songs)) {
                return {success: false, error: TEXT.playlist.invalidFormat};
            }

            return {success: true, playlist};
        } catch (error) {
            console.error('Error al importar playlist:', error);
            return {success: false, error: error.message};
        }
    }
}
