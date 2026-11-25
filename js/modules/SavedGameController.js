import {AUTOSAVE_DELAY_MS, SOUND} from '../constants.js';
import {MSG, TEXT} from '../messages.js';
import {downloadFile, gameNameOrDefault, slugify} from '../utils.js';
import {deserializeCartones} from './CartonSerializer.js';
import {captureSnapshot, restoreFromSnapshot, summarizeSnapshot, validateGameFile} from './GameSnapshot.js';

export class SavedGameController {
    constructor({game, songManager, store, dialogs, sounds, getSongs, setSongs, getSettings, applySettings, renderRestored, download = downloadFile, now = () => new Date()}) {
        this.game = game;
        this.songManager = songManager;
        this.store = store;
        this.dialogs = dialogs;
        this.sounds = sounds;
        this.getSongs = getSongs;
        this.setSongs = setSongs;
        this.getSettings = getSettings;
        this.applySettings = applySettings;
        this.renderRestored = renderRestored;
        this.download = download;
        this.now = now;
        this.enabled = false;
        this.timer = null;
    }

    capture() {
        return captureSnapshot({songs: this.getSongs(), game: this.game, settings: this.getSettings(), now: this.now()});
    }

    isEmpty() {
        return this.getSongs().length === 0 && this.game.getCartonesCount() === 0;
    }

    scheduleAutosave() {
        if (!this.enabled) return;

        if (this.timer) clearTimeout(this.timer);
        this.timer = setTimeout(() => this.autosave(), AUTOSAVE_DELAY_MS);
    }

    flush() {
        if (!this.timer) return Promise.resolve();

        clearTimeout(this.timer);
        return this.autosave();
    }

    autosave() {
        this.timer = null;
        return this.isEmpty() ? this.store.clear() : this.store.save(this.capture());
    }

    async offerSavedGame() {
        try {
            const snapshot = await this.store.load();

            if (snapshot && (snapshot.songs.length > 0 || snapshot.cartones.length > 0)) {
                const summary = summarizeSnapshot(snapshot);

                if (await this.dialogs.showConfirm(MSG.savedGame.found(summary))) {
                    this.restore(snapshot);
                    this.dialogs.showAlert(MSG.savedGame.restored(summary));
                } else {
                    await this.store.clear();
                }
            }
        } finally {
            this.enabled = true;
        }
    }

    exportGame() {
        if (this.isEmpty()) {
            this.dialogs.showAlert(MSG.savedGame.nothingToExport);
            return;
        }

        const date = this.now().toISOString().split('T')[0];
        const name = slugify(gameNameOrDefault(this.game.getGameName()));

        this.download(JSON.stringify(this.capture(), null, 2), `partida-${name}-${date}.json`, 'application/json', TEXT.savedGame.downloadLabel);
        this.dialogs.showAlert(MSG.savedGame.exported);
    }

    async importGame(data) {
        const validation = validateGameFile(data);

        if (!validation.success) {
            this.dialogs.showAlert(MSG.savedGame.importFailed(validation.error));
            return false;
        }

        const hasWork = !this.isEmpty() || this.game.isGameStarted();
        if (hasWork && !await this.dialogs.showConfirm(MSG.savedGame.replaceCurrent)) {
            return false;
        }

        this.restore(validation.snapshot);
        this.sounds.play(SOUND.WIN);
        this.dialogs.showAlert(MSG.savedGame.restored(summarizeSnapshot(validation.snapshot)));
        return true;
    }

    restore(snapshot) {
        const {songs, gameState, settings} = restoreFromSnapshot(snapshot);

        this.songManager.resetIdCounter();
        this.songManager.assignMissingIds(songs);
        this.setSongs(songs);
        this.game.restore(gameState);
        this.game.setCartones(deserializeCartones(snapshot.cartones, songs));
        this.applySettings(settings);
        this.renderRestored({
            songs,
            playedSongs: gameState.playedSongs,
            currentSong: songs.find(song => song.id === gameState.currentSongId) ?? null
        });
        this.scheduleAutosave();
    }
}
