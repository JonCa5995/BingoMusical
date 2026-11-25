import {BingoCartonGenerator} from "./bingoCartonGenerator.js";
import {DOMElements} from "./modules/DOMElements.js";
import {AudioManager} from "./modules/AudioManager.js";
import {SoundEffects} from "./modules/SoundEffects.js";
import {AudioControlsView} from "./modules/AudioControlsView.js";
import {PlaylistFile} from "./modules/PlaylistFile.js";
import {PreferencesStore} from "./modules/PreferencesStore.js";
import {ThemeManager} from "./modules/ThemeManager.js";
import {FullscreenManager} from "./modules/FullscreenManager.js";
import {DragAndDropUploader} from "./modules/DragAndDropUploader.js";
import {IconManager} from "./modules/IconManager.js";
import {SongManager} from "./modules/SongManager.js";
import {GameManager} from "./modules/GameManager.js";
import {UIManager} from "./modules/UIManager.js";
import {ModalManager} from "./modules/ModalManager.js";
import {Dialogs} from "./modules/Dialogs.js";
import {ConfigModal} from "./modules/ConfigModal.js";
import {CartonModals} from "./modules/CartonModals.js";
import {CartonManager} from "./modules/CartonManager.js";
import {KeyboardShortcuts} from "./modules/KeyboardShortcuts.js";
import {CartonHtmlRenderer} from "./modules/CartonHtmlRenderer.js";
import {CartonExporter} from "./modules/CartonExporter.js";
import {SongListView} from "./modules/SongListView.js";
import {PlaylistImporter} from "./modules/PlaylistImporter.js";
import {deserializeCartones} from "./modules/CartonSerializer.js";
import {
    CELEBRATION_DELAY_MS,
    CONTINUOUS_NEXT_SONG_DELAY_MS,
    DEFAULT_EFFECTS_VOLUME,
    DEFAULT_GAME_NAME,
    DEFAULT_MUSIC_VOLUME,
    DEFAULT_SONGS_FOLDER,
    IMPORT_MESSAGE_DELAY_MS,
    LOGO_PATH,
    MAX_GAME_NAME_LENGTH,
    MIN_SONGS_REQUIRED,
    MS_PER_SECOND,
    SOUND
} from "./constants.js";
import {MSG, SHORTCUTS, TEXT} from "./messages.js";

class BingoMusical {
    constructor() {
        this.songs = [];
        this.listRevealTimers = [];
        this.cartonGenerator = new BingoCartonGenerator();
        this.songsFolder = DEFAULT_SONGS_FOLDER;

        this._createAudio();
        this._createDialogsAndIcons();
        this._createGameAndUI();
        this._createShellFeatures();
        this._createCartones();
        this._createSongList();

        this.init();
    }

    _createAudio() {
        this.dom = new DOMElements();
        this.sounds = new SoundEffects();
        this.audio = new AudioManager(this.dom.player.audioPlayer, this.sounds);
        this.audioControls = new AudioControlsView({
            audioElement: this.dom.player.audioPlayer,
            elements: {
                progressBar: this.dom.player.progressBar,
                progressFill: this.dom.player.progressFill,
                currentTimeSpan: this.dom.player.currentTimeSpan,
                durationSpan: this.dom.player.durationSpan,
                musicVolumeSlider: this.dom.volume.musicVolumeSlider,
                musicVolumeValueSpan: this.dom.volume.musicVolumeValueSpan,
                effectsVolumeSlider: this.dom.volume.effectsVolumeSlider,
                effectsVolumeValueSpan: this.dom.volume.effectsVolumeValueSpan
            },
            handlers: {
                onSeek: (fraction) => this.audio.seekToFraction(fraction),
                onMusicVolume: (volume) => this.audio.setVolume(volume),
                onEffectsVolume: (volume) => this.sounds.setVolume(volume)
            }
        });
    }

    _createDialogsAndIcons() {
        this.playlistFile = new PlaylistFile();
        this.modal = new ModalManager(this.sounds);
        this.dialogs = new Dialogs(this.dom.dialogs, this.modal, this.sounds);
        this.icons = new IconManager(this.dom.iconPicker, this.sounds, () => this.songs, this.modal);
    }

    _createGameAndUI() {
        this.songManager = new SongManager();
        this.game = new GameManager();
        this.ui = new UIManager(this.dom.ui, MIN_SONGS_REQUIRED);
    }

    _createShellFeatures() {
        this.theme = new ThemeManager({
            preferences: new PreferencesStore(),
            toggleButton: this.dom.toolbar.themeToggleBtn,
            icon: this.dom.toolbar.themeIcon,
            onToggle: () => this.sounds.play(SOUND.CLICK)
        });
        this.fullscreen = new FullscreenManager({
            button: this.dom.toolbar.fullscreenBtn,
            onToggle: () => this.sounds.play(SOUND.CLICK)
        });
        this.dragAndDrop = new DragAndDropUploader({
            zones: [...document.querySelectorAll('.file-label'), this.dom.songs.songsSection],
            fileInput: this.dom.songs.addSongsInput,
            isEnabled: () => !this.game.isGameStarted()
        });
    }

    _createCartones() {
        this.carton = new CartonManager(this.dom.cartones.printCartonPreview, this.sounds, this.cartonGenerator,
            new CartonExporter(new CartonHtmlRenderer())
        );
        this.configModal = new ConfigModal({
            elements: this.dom.config,
            game: this.game,
            modals: this.modal,
            dialogs: this.dialogs,
            sounds: this.sounds,
            canOpen: () => this.checkGameNotStarted(MSG.gameStarted.changeConfig)
        });
        this.cartonModals = new CartonModals({
            elements: this.dom.cartones,
            game: this.game,
            cartonManager: this.carton,
            modals: this.modal,
            dialogs: this.dialogs,
            sounds: this.sounds,
            getSongs: () => this.songs,
            onCartonesChanged: () => this.updateUIState()
        });
    }

    _createSongList() {
        this.importer = new PlaylistImporter({
            songsFolder: this.songsFolder,
            songManager: this.songManager,
            getRandomIcon: (songs) => this.icons.getRandomAvailableIcon(songs)
        });
        this.songList = new SongListView({
            ui: this.ui,
            songManager: this.songManager,
            filterControls: {
                searchInput: this.dom.songs.searchInput,
                filterStatus: this.dom.songs.filterStatus,
                sortOrder: this.dom.songs.sortOrder
            },
            getSongs: () => this.songs,
            getPlaybackState: () => ({
                currentSongId: this.game.getCurrentSong(),
                gameStarted: this.game.isGameStarted()
            }),
            handlers: {
                onIconClick: (song) => this.onSongIconClick(song),
                onSongClick: (song) => this.onSongClick(song),
                onDelete: (song) => this.deleteSong(song.id)
            }
        });
    }

    init() {
        this._applyConfigToDom();
        this.setupEventListeners();
        this.configModal.init();
        this.cartonModals.init();
        this.audioControls.bind();
        this.dragAndDrop.init();
        this.theme.init();
        this.fullscreen.init();
        this.songList.render();
        this.updateCounters();
        this.updateControls(false);
    }

    _applyConfigToDom() {
        const dom = this.dom;

        dom.game.gameNameInput.maxLength = MAX_GAME_NAME_LENGTH;
        dom.game.gameNameInput.title = TEXT.gameName.editHint(MAX_GAME_NAME_LENGTH);

        for (const [slider, label, volume] of [
            [dom.volume.musicVolumeSlider, dom.volume.musicVolumeValueSpan, DEFAULT_MUSIC_VOLUME],
            [dom.volume.effectsVolumeSlider, dom.volume.effectsVolumeValueSpan, DEFAULT_EFFECTS_VOLUME]
        ]) {
            const percent = Math.round(volume * 100);
            slider.value = percent;
            slider.setAttribute('aria-valuenow', percent);
            label.textContent = `${percent}%`;
        }
    }

    _setupPlayerEventListeners() {
        this.dom.player.playBtn.addEventListener('click', () => this.playRandomSong());
        this.dom.player.pauseBtn.addEventListener('click', () => this.pauseSong());
        this.dom.player.stopBtn.addEventListener('click', () => this.restartSong());

        this.dom.player.audioPlayer.addEventListener('ended', () => this.onSongEnded());

        this.dom.player.audioPlayer.addEventListener('playbackfailed', () => this.updateControls(false));
    }

    _setupSongManagementEventListeners() {
        this.dom.songs.addSongsLabel.addEventListener('click', async (e) => {
            if (this.game.getCartonesCount() > 0) {
                e.preventDefault();
                if (await this.cartonModals.confirmAndClear(TEXT.cartonActions.addSongs)) {
                    this.dom.songs.addSongsInput.click();
                }
            }
        });

        this.dom.songs.addSongsInput.addEventListener('change', (e) => this.addSongs(e));
        this.dom.history.clearHistoryBtn.addEventListener('click', () => this.reiniciarJuego());
        this.dom.game.shuffleAllBtn.addEventListener('click', () => this.toggleContinuousMode());

        this.songList.bindFilterControls();

        this.dom.songs.deleteAllBtn.addEventListener('click', () => this.deleteAllSongs());
    }

    // ============================================================
    // CONFIGURACIÓN DE EVENT LISTENERS
    // ============================================================

    setupEventListeners() {
        this._setupPlayerEventListeners();
        this._setupSongManagementEventListeners();
        this._setupCelebrationEventListeners();
        this._setupKeyboardShortcuts();
        this._setupGameNameEventListeners();

        this.dom.songs.exportListBtn.addEventListener('click', () => this.exportPlaylist());
        this.dom.songs.importListBtn.addEventListener('click', () => this.dom.songs.importFileInput.click());
        this.dom.songs.importFileInput.addEventListener('change', (e) => this.importPlaylist(e));
        this.dom.game.lineaBtn.addEventListener('click', () => this.triggerLinea());
        this.dom.game.bingoBtn.addEventListener('click', () => this.triggerBingo());
        this.dom.toolbar.shortcutsHelpBtn.addEventListener('click', () => this.showKeyboardShortcutsHelp());
    }

    _setupGameNameEventListeners() {
        this.dom.game.gameNameInput.addEventListener('input', (e) => {
            this.game.setGameName(e.target.value.trim());
        });

        this.dom.game.gameNameInput.addEventListener('blur', (e) => {
            const name = e.target.value.trim();
            if (name.length > MAX_GAME_NAME_LENGTH) {
                this.dialogs.showAlert(MSG.game.nameTooLong(MAX_GAME_NAME_LENGTH));
                e.target.value = name.substring(0, MAX_GAME_NAME_LENGTH);
                this.game.setGameName(e.target.value);
            }
        });
    }

    _setupCelebrationEventListeners() {
        this.dom.celebration.continueLineaBtn.addEventListener('click', () => {
            this.dom.celebration.lineaOverlay.classList.add('hidden');
        });

        this.dom.celebration.restartBtn.addEventListener('click', () => {
            this.reiniciarJuego();
            this.dom.celebration.celebrationOverlay.classList.add('hidden');
        });
    }

    playPauseOnSpace() {
        if (this.audio.isPlaying || this.game.getCurrentSong() !== null) {
            this.pauseSong();
        } else if (this.songs.length >= MIN_SONGS_REQUIRED) {
            this.playRandomSong();
        }
    }

    nextSongOnN() {
        if (this.game.isGameStarted()) {
            if (!this.game.isBingoCompleted()) {
                this.playRandomSong();
            }
        } else {
            this.playRandomContinuousSong();
        }
    }

    _setupKeyboardShortcuts() {
        this.shortcuts = new KeyboardShortcuts(() => this.modal.checkOpenModals());

        this.shortcuts
            .register(' ', {
                ...SHORTCUTS.playPause,
                action: () => this.playPauseOnSpace()
            })
            .register('r', {
                ...SHORTCUTS.restart,
                action: () => {
                    if (this.game.getCurrentSong() !== null) this.restartSong();
                }
            })
            .register('n', {
                ...SHORTCUTS.next,
                action: () => this.nextSongOnN()
            })
            .register('f', {
                ...SHORTCUTS.fullscreen,
                action: () => this.fullscreen.toggle()
            })
            .register('l', {
                ...SHORTCUTS.linea,
                action: () => {
                    if (!this.dom.game.lineaBtn.disabled) this.triggerLinea();
                }
            })
            .register('b', {
                ...SHORTCUTS.bingo,
                action: () => {
                    if (!this.dom.game.bingoBtn.disabled) this.triggerBingo();
                }
            })
            .register('escape', {
                ...SHORTCUTS.escape,
                allowInModal: true, preventDefault: false,
                action: () => this.modal.closeModalsOnEscape()
            })
            .register('?', {
                ...SHORTCUTS.help,
                action: () => this.showKeyboardShortcutsHelp()
            });

        this.shortcuts.attach(document);
    }

    showKeyboardShortcutsHelp() {
        this.dialogs.showAlert({title: TEXT.shortcuts.helpTitle, message: this.shortcuts.getHelpText()});
    }

    // ============================================================
    // VALIDACIONES Y UTILIDADES
    // ============================================================

    checkGameNotStarted(gameStartedMessage) {
        if (this.game.isGameStarted()) {
            this.dialogs.showAlert(gameStartedMessage);
            return false;
        }
        return true;
    }

    clearFileInput(event) {
        event.target.value = '';
    }

    refreshUI() {
        this.songList.render();
        this.updateCounters();
        this.updateUIState();
    }

    // ============================================================
    // GESTIÓN DE JUEGO (LÍNEA Y BINGO)
    // ============================================================

    triggerLinea() {
        this._callGame({
            canCall: () => this.game.canCallLinea(),
            complete: () => this.game.completeLinea(),
            sound: SOUND.WIN,
            overlay: this.dom.celebration.lineaOverlay
        });
    }

    triggerBingo() {
        this._callGame({
            canCall: () => this.game.canCallBingo(),
            complete: () => this.game.completeBingo(),
            sound: SOUND.COMPLETE,
            overlay: this.dom.celebration.celebrationOverlay
        });
    }

    _callGame({canCall, complete, sound, overlay}) {
        if (!this._ensureEnoughSongs()) return;

        const check = canCall();
        if (!check.valid) {
            this.dialogs.showAlert(check.alert);
            return;
        }

        complete();
        this.sounds.play(sound);
        setTimeout(() => overlay.classList.remove('hidden'), CELEBRATION_DELAY_MS);
    }

    _ensureEnoughSongs() {
        const validation = this.songManager.validateMinSongs(this.songs, MIN_SONGS_REQUIRED);
        if (!validation.valid) {
            this.dialogs.showAlert(validation.alert);
        }
        return validation.valid;
    }

    // ============================================================
    // GESTIÓN DE PLAYLIST (EXPORTAR/IMPORTAR)
    // ============================================================

    exportPlaylist() {
        const gameName = this.game.getGameName() || DEFAULT_GAME_NAME;
        const cartones = this.game.getCartones();
        const result = this.playlistFile.export(this.songs, this.songsFolder, gameName, cartones);

        if (result.success) {
            this.sounds.play(SOUND.CLICK);
            this.dialogs.showAlert(MSG.playlist.exportOk(result.message));
        } else {
            this.dialogs.showAlert(MSG.playlist.exportFailed(result.error));
        }
    }

    async importPlaylist(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!this.checkGameNotStarted(MSG.gameStarted.importList)) {
            this.clearFileInput(event);
            return;
        }

        const result = await this.playlistFile.read(file);

        if (!result.success) {
            this.dialogs.showAlert(MSG.playlist.importFailed(result.error));
            this.clearFileInput(event);
            return;
        }

        const duplicates = await this._applyImportedPlaylist(result.playlist);
        this._announceImportResult(duplicates);
        this.clearFileInput(event);
    }

    async _applyImportedPlaylist(playlist) {
        this.game.clearHistory();
        const {songs, duplicates} = await this.importer.loadSongs(playlist.songs);
        this.songs = songs;

        const gameName = playlist.name || '';
        this.game.setGameName(gameName);
        this.dom.game.gameNameInput.value = gameName;

        this._loadImportedCartones(playlist.cartones);
        this.refreshUI();

        return duplicates;
    }

    _loadImportedCartones(cartones) {
        if (Array.isArray(cartones) && cartones.length > 0) {
            this.game.setCartones(deserializeCartones(cartones, this.songs));
        } else {
            this.game.clearCartones();
        }
    }

    _announceImportResult(duplicates) {
        if (duplicates.length > 0) {
            this.sounds.play(SOUND.ERROR);
            this.dialogs.showAlert(MSG.playlist.importDuplicates(duplicates));
        }

        setTimeout(() => {
            if (this.songs.length === 0) {
                this.sounds.play(SOUND.ERROR);
                this.dialogs.showAlert(MSG.playlist.importNoSongs(this.songsFolder));
            } else {
                this.sounds.play(SOUND.WIN);
                this.dialogs.showAlert(MSG.playlist.importOk(this.songs.length, this.songsFolder));
            }
        }, duplicates.length > 0 ? IMPORT_MESSAGE_DELAY_MS : 0);
    }

    // ============================================================
    // GESTIÓN DE ICONOS
    // ============================================================

    async openIconPicker(songId) {
        if (!this.checkGameNotStarted(MSG.gameStarted.changeIcons)) {
            return;
        }

        if (!await this.cartonModals.confirmAndClear(TEXT.cartonActions.changeIcon)) {
            return;
        }

        const result = this.icons.openIconPicker(songId, this.songs, () => {
            this.songList.render();
        });

        if (!result.success) {
            this.dialogs.showAlert(result.alert);
        }
    }

    // ============================================================
    // GESTIÓN DE CANCIONES
    // ============================================================

    async addSongs(event) {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        if (!this.checkGameNotStarted(MSG.gameStarted.addSongs)) {
            this.clearFileInput(event);
            return;
        }

        if (!await this.cartonModals.confirmAndClear(TEXT.cartonActions.addSongs)) {
            this.clearFileInput(event);
            return;
        }

        const result = this.songManager.addSongsFromFiles(
            files,
            this.songs,
            (songs) => this.icons.getRandomAvailableIcon(songs)
        );

        if (result.newSongs.length > 0) {
            this.songs.push(...result.newSongs);
            this.sounds.play(SOUND.CLICK);
            this.refreshUI();
        }

        if (result.duplicates.length > 0) {
            this.dialogs.showAlert(MSG.songs.duplicatesNotAdded(result.duplicates));
        }

        this.clearFileInput(event);
    }

    async deleteSong(songId) {
        if (!this.checkGameNotStarted(MSG.gameStarted.deleteSong)) {
            return;
        }

        if (!await this.cartonModals.confirmAndClear(TEXT.cartonActions.deleteSong)) {
            return;
        }

        this.songs = this.songManager.deleteSong(this.songs, songId);
        this.sounds.play(SOUND.CLICK);
        this.refreshUI();
    }

    // ============================================================
    // RENDERIZADO Y UI
    // ============================================================

    updateUIState() {
        this.ui.updateUIState(
            this.game.isGameStarted(),
            this.game.isContinuousMode(),
            () => this.toggleContinuousMode()
        );

        const shouldDisableGameName = this.game.isGameStarted() || this.game.hasCartonesGenerated();
        this.dom.game.gameNameInput.disabled = shouldDisableGameName;

        if (shouldDisableGameName && this.dom.game.gameNameInput.title !== TEXT.gameName.locked) {
            this.dom.game.gameNameInput.title = TEXT.gameName.locked;
        } else if (!shouldDisableGameName) {
            this.dom.game.gameNameInput.title = TEXT.gameName.editHint(MAX_GAME_NAME_LENGTH);
        }
    }

    onSongIconClick(song) {
        if (song.played) {
            this.dialogs.showAlert(MSG.songs.iconLocked);
        } else {
            this.openIconPicker(song.id);
        }
    }

    onSongClick(song) {
        if (song.file && !this.game.isGameStarted()) {
            this.sounds.play(SOUND.CLICK);
            this.playSong(song.id);
        }
    }

    updateCounters() {
        const history = this.game.getHistory();
        this.ui.updateCounters(history.length, this.songManager.getTotalSongsWithFiles(this.songs));
    }

    // ============================================================
    // GESTIÓN DE PLAYLIST (ELIMINACIÓN)
    // ============================================================

    async deleteAllSongs() {
        if (!this.checkGameNotStarted(MSG.gameStarted.deleteAllSongs)) {
            return;
        }

        if (this.songs.length === 0) {
            this.dialogs.showAlert(MSG.songs.nothingToDelete);
            return;
        }

        const confirmed = await this.dialogs.showConfirm(MSG.songs.confirmDeleteAll(this.songs.length));

        if (confirmed) {
            this.songs = [];
            this.sounds.play(SOUND.CLICK);

            this.game.clearCartones();
            this.game.setGameName('');
            this.dom.game.gameNameInput.value = '';

            this.refreshUI();
            this.dialogs.showAlert(MSG.songs.allDeleted);
        }
    }

    toggleContinuousMode() {
        const continuousMode = this.game.toggleContinuousMode();
        if (continuousMode) this.sounds.play(SOUND.START);
        this._renderContinuousModeButton(continuousMode);
    }

    _renderContinuousModeButton(continuousMode) {
        const btn = this.dom.game.shuffleAllBtn;

        if (continuousMode) {
            btn.innerHTML = `<span aria-hidden="true">${TEXT.player.continuousOn.icon}</span> ${TEXT.player.continuousOn.text}`;
            btn.style.background = 'var(--danger-color)';
            btn.setAttribute('aria-pressed', 'true');
        } else {
            btn.innerHTML = `<span aria-hidden="true">${TEXT.player.continuousOff.icon}</span> ${TEXT.player.continuousOff.text}`;
            btn.style.background = 'var(--text-muted)';
            btn.setAttribute('aria-pressed', 'false');
        }
    }

    // ============================================================
    // REPRODUCCIÓN Y CONTROL DE AUDIO
    // ============================================================

    playRandomSong() {
        if (!this._ensureEnoughSongs()) return;

        if (!this.game.isGameStarted()) {
            this.game.startGame();
            this.updateUIState();
        }

        const randomSong = this.game.getRandomUnplayedSong(this.songs);

        if (!randomSong) {
            this.dialogs.showAlert(MSG.songs.noMoreSongs);
            return;
        }

        this.playSong(randomSong.id);
    }

    playSong(songId) {
        const song = this.songManager.findSongById(this.songs, songId);
        if (!song?.file) {
            this.dialogs.showAlert(MSG.songs.noAudioFile);
            return;
        }

        this._revealCurrentSong();

        song.hideTitle = true;
        song.hideIcon = true;

        this.audio.play(song.file, () => this._onSongStarted(song));
    }

    _onSongStarted(song) {
        this.game.setCurrentSong(song.id);
        this.updatePlayerUI(song);
        this.updateControls(true);

        if (this.game.markSongAsPlayed(song)) {
            this.addToHistory(song);
            this.updateCounters();
            this.sounds.play(SOUND.WIN);
        }

        this.songList.render();
        this._scheduleListReveal(song);
    }

    _scheduleListReveal(song) {
        if (!this.game.isGameStarted()) {
            this._revealSongInList(song);
            return;
        }

        this.listRevealTimers.push(
            setTimeout(() => {
                song.hideTitle = false;
                this.songList.reveal(song.id, 'title');
            }, this.game.getTitleRevealTime() * MS_PER_SECOND),
            setTimeout(() => {
                song.hideIcon = false;
                this.songList.reveal(song.id, 'icon');
            }, this.game.getIconRevealTime() * MS_PER_SECOND)
        );
    }

    _revealSongInList(song) {
        song.hideTitle = false;
        song.hideIcon = false;
    }

    _clearListRevealTimers() {
        for (const timer of this.listRevealTimers) clearTimeout(timer);
        this.listRevealTimers = [];
    }

    pauseSong() {
        const isNowPlaying = this.audio.pause();
        this.updateControls(isNowPlaying);
    }

    _revealCurrentSong() {
        this._clearListRevealTimers();
        const currentSong = this.songManager.findSongById(this.songs, this.game.getCurrentSong());
        if (currentSong) this._revealSongInList(currentSong);
    }

    stopSong() {
        this._revealCurrentSong();
        this.audio.stop();
        this.updateControls(false);
        this.dom.player.songIconContainer.classList.remove('playing');
        this.songList.render();
    }

    restartSong() {
        const currentSongId = this.game.getCurrentSong();
        if (currentSongId !== null) {
            this.audio.restart();
            this.updateControls(true);
            this.dom.player.songIconContainer.classList.add('playing');
        }
    }

    updatePlayerUI(song) {
        const titleRevealTime = this.game.getTitleRevealTime();
        const iconRevealTime = this.game.getIconRevealTime();
        const gameStarted = this.game.isGameStarted();
        this.ui.updatePlayerUI(song, titleRevealTime, iconRevealTime, gameStarted);
    }

    updateControls(playing) {
        const hasSongLoaded = this.audio.hasSongLoaded();
        const noSongsLeft = this.game.allSongsPlayed(this.songs);
        this.ui.updateControls(playing, this.game.isGameStarted(), hasSongLoaded, noSongsLeft);
    }

    onSongEnded() {
        this.dom.player.songIconContainer.classList.remove('playing');

        this._revealCurrentSong();

        if (this.game.isContinuousMode() && !this.game.isGameStarted()) {
            this.playRandomContinuousSong();
            return;
        }

        if (this.game.isGameStarted()) {
            if (this.game.allSongsPlayed(this.songs) && !this.game.isBingoCompleted()) {
                this.game.completeBingo();
                setTimeout(() => {
                    this.sounds.play(SOUND.COMPLETE);
                    this.dom.celebration.celebrationOverlay.classList.remove('hidden');
                }, CELEBRATION_DELAY_MS);
            }
        }

        this.updateControls(false);
    }

    playRandomContinuousSong() {
        setTimeout(() => {
            const randomSong = this.game.getRandomSong(this.songs);
            if (randomSong) {
                this.playSong(randomSong.id);
            } else {
                this.toggleContinuousMode();
            }
        }, CONTINUOUS_NEXT_SONG_DELAY_MS);
    }

    addToHistory(song) {
        const iconRevealTime = this.game.getIconRevealTime();
        const gameStarted = this.game.isGameStarted();
        const historyItem = this.ui.addToHistory(song, iconRevealTime, gameStarted);

        historyItem.addEventListener('click', () => {
            this.sounds.play(SOUND.CLICK);
            this.playSong(song.id);
        });
    }

    async reiniciarJuego() {
        this.sounds.play(SOUND.CLICK);

        const confirmed = await this.dialogs.showConfirm(MSG.game.confirmRestart);

        if (confirmed) {
            this.game.resetGame();
            this.songs = this.songManager.resetPlayedStatus(this.songs);

            this._clearListRevealTimers();
            this.songs.forEach(song => this._revealSongInList(song));

            this.dom.history.historyGrid.innerHTML = '';
            this.refreshUI();
            this.stopSong();

            this._renderContinuousModeButton(this.game.isContinuousMode());

            this.dom.player.currentIconImg.alt = TEXT.player.currentSongAlt;
            this.dom.player.currentIconImg.src = LOGO_PATH;

            this.ui.clearPlayerRevealTimers();
            this.dom.player.songTitleElement.style.opacity = '1';
            this.dom.player.currentIconImg.style.opacity = '1';
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new BingoMusical());
} else {
    new BingoMusical();
}