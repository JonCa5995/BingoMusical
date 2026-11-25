import {AUDIO_EXTENSIONS} from '../constants.js';

const stripExtension = (name) => name.replace(/\.[^/.]+$/, '');
const normalize = (text) => text.normalize('NFC').trim().toLowerCase();
const isAudio = (file) => Boolean(file?.name) && (file.type?.startsWith('audio/') || AUDIO_EXTENSIONS.test(file.name));

export function linkAudioFiles(songs, files) {
    const byTitle = new Map();

    for (const file of files) {
        if (!isAudio(file)) continue;

        const key = normalize(stripExtension(file.name));
        if (!byTitle.has(key)) byTitle.set(key, file);
    }

    const pending = songs.filter(song => !song.file);
    const linked = [];
    const missing = [];

    for (const song of pending) {
        const file = byTitle.get(normalize(song.title));

        if (file) {
            song.file = file;
            song.audioPath = file.name;
            linked.push(song);
        } else {
            missing.push(song);
        }
    }

    return {linked, missing, pendingCount: pending.length, audioFiles: byTitle.size};
}
