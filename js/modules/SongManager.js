import { ICON_TYPE } from '../constants.js';
import { MSG } from '../messages.js';

const playedFirst = (playedOrderDirection) => (a, b) => {
    if (a.played && b.played) {
        return playedOrderDirection * ((a.playedOrder || 0) - (b.playedOrder || 0));
    }
    if (a.played === b.played) return 0;
    return a.played ? -1 : 1;
};

export const SORT_STRATEGIES = {
    'alphabetical': (a, b) => a.title.localeCompare(b.title),
    'alphabetical-reverse': (a, b) => b.title.localeCompare(a.title),
    'played-first': playedFirst(1),
    'played-last': playedFirst(-1),
    'pending-first': (a, b) => {
        if (a.played === b.played) return 0;
        return a.played ? 1 : -1;
    }
};

export class SongManager {
    songIdCounter = 1;

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

            const randomIcon = getRandomIcon([...existingSongs, ...newSongs]);

            newSongs.push({
                id: this.songIdCounter++,
                title: fileName,
                icon: randomIcon,
                iconType: ICON_TYPE.EMOJI,
                audioPath: file.name,
                file: file,
                played: false
            });
            existingTitles.add(fileName);
        }

        return { newSongs, duplicates };
    }

    deleteSong(songs, songId) {
        return songs.filter(s => s.id !== songId);
    }

    filterAndSort(songs, filters) {
        const { searchTerm = '', filterStatus = 'all', sortOrder = 'default' } = filters;
        
        let filteredSongs = [...songs];

        if (searchTerm) {
            const term = searchTerm.toLowerCase().trim();
            filteredSongs = filteredSongs.filter(song => 
                song.title.toLowerCase().includes(term)
            );
        }

        if (filterStatus === 'played') {
            filteredSongs = filteredSongs.filter(song => song.played);
        } else if (filterStatus === 'pending') {
            filteredSongs = filteredSongs.filter(song => !song.played);
        }

        const comparator = SORT_STRATEGIES[sortOrder];
        if (comparator) {
            filteredSongs.sort(comparator);
        }

        return filteredSongs;
    }

    getTotalSongsWithFiles(songs) {
        return songs.filter(s => s.file).length;
    }

    resetPlayedStatus(songs) {
        for (const song of songs) {
            song.played = false;
            song.playedOrder = undefined;
        }
        return songs;
    }

    findSongById(songs, songId) {
        return songs.find(s => s.id === songId);
    }

    validateMinSongs(songs, minRequired) {
        const totalSongsWithFiles = this.getTotalSongsWithFiles(songs);
        if (totalSongsWithFiles < minRequired) {
            return { valid: false, alert: MSG.songs.notEnoughToPlay(minRequired) };
        }
        return { valid: true };
    }

    resetIdCounter() {
        this.songIdCounter = 1;
    }

    assignMissingIds(songs) {
        const maxId = songs.reduce((max, s) => (s.id === null ? max : Math.max(max, s.id)), 0);
        this.songIdCounter = Math.max(this.songIdCounter, maxId + 1);
        for (const song of songs) {
            if (song.id === null) song.id = this.songIdCounter++;
        }
    }
}
