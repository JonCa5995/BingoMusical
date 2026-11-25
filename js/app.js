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
import {CartonCheckModal} from "./modules/CartonCheckModal.js";
import {CartonManager} from "./modules/CartonManager.js";
import {KeyboardShortcuts} from "./modules/KeyboardShortcuts.js";
import {CartonHtmlRenderer} from "./modules/CartonHtmlRenderer.js";
import {CartonExporter} from "./modules/CartonExporter.js";
import {SongListView} from "./modules/SongListView.js";
import {PlaylistImporter} from "./modules/PlaylistImporter.js";
import {linkAudioFiles} from "./modules/AudioLinker.js";
import {SavedGameController} from "./modules/SavedGameController.js";
import {GameStateStore} from "./modules/GameStateStore.js";
import {ProjectionChannel, buildProjectionProgress, buildProjectionState} from "./modules/ProjectionChannel.js";
import {registerServiceWorker} from "./modules/ServiceWorkerRegistrar.js";
import {deserializeCartones} from "./modules/CartonSerializer.js";
import {
    CELEBRATION_DELAY_MS,
    CONTINUOUS_NEXT_SONG_DELAY_MS,
    DEFAULT_SONGS_FOLDER,
    GAME_FILE_TYPE,
    IMPORT_MESSAGE_DELAY_MS,
    LOGO_PATH,
    MAX_GAME_NAME_LENGTH,
    MIN_SONGS_REQUIRED,
    SOUND
} from "./constants.js";
import {MSG, SHORTCUTS, TEXT} from "./messages.js";
import {gameNameOrDefault, iconTextHtml} from "./utils.js";

export class BingoMusical {
    constructor() {
        this.preferences = new PreferencesStore();
        this.settings = this.preferences.loadSettings();
        this.songs = [];
        this.cartonGenerator = new BingoCartonGenerator();
        this.songsFolder = DEFAULT_SONGS_FOLDER;

        this._createAudio();
        this._createDialogsAndIcons();
        this._createGameAndUI();
        this._createShellFeatures();
        this._createCartones();
        this._createSongList();
        this._createSavedGame();
        this._createProjection();

        this.init();
    }

    _createAudio() {
        this.dom = new DOMElements();
        this.sounds = new SoundEffects();
        this.audio = new AudioManager(this.dom.player.audioPlayer, this.sounds);
        this.audioControls = new AudioControlsView({
            audioElement: this.dom.player.audioPlayer,
            getTimeline: () => this.audio.getTimeline(),
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
                onMusicVolume: (volume) => {
                    this.audio.setVolume(volume);
                    this._saveSettings({musicVolume: volume});
                },
                onEffectsVolume: (volume) => {
                    this.sounds.setVolume(volume);
                    this._saveSettings({effectsVolume: volume});
                }
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
            preferences: this.preferences,
            toggleButton: this.dom.toolbar.themeToggleBtn,
            icon: this.dom.toolbar.themeIcon,
            onToggle: () => { this.sounds.play(SOUND.CLICK); this.projection.schedulePublish(); }
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
        const renderer = new CartonHtmlRenderer();
        this.carton = new CartonManager(this.dom.cartones.printCartonPreview, this.sounds, this.cartonGenerator,
            new CartonExporter(renderer), renderer
        );
        this.configModal = new ConfigModal({
            elements: this.dom.config,
            game: this.game,
            modals: this.modal,
            dialogs: this.dialogs,
            sounds: this.sounds,
            canOpen: () => this.checkGameNotStarted(MSG.gameStarted.changeConfig),
            getSettings: () => this._currentSettings(),
            onSaved: (revealTimes) => this._saveSettings(revealTimes),
            onSettingsImported: (values) => this._applyImportedSettings(values)
        });
        this.cartonModals = new CartonModals({
            elements: this.dom.cartones,
            game: this.game,
            cartonManager: this.carton,
            modals: this.modal,
            dialogs: this.dialogs,
            sounds: this.sounds,
            getSongs: () => this.songs,
            onCartonesChanged: () => this._onCartonesChanged(),
            settings: this.settings,
            onSettingsChanged: (partial) => this._saveSettings(partial)
        });
        this.cartonCheck = new CartonCheckModal({
            elements: this.dom.checkCarton,
            openButton: this.dom.toolbar.openCheckCartonBtn,
            game: this.game,
            modals: this.modal,
            dialogs: this.dialogs,
            sounds: this.sounds
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

    _createProjection() {
        this.songStartedAt = null;
        this.waitingForProjection = false;
        this.projection = new ProjectionChannel({
            getState: () => buildProjectionState({
                songs: this.songs,
                game: this.game,
                theme: this.theme.getCurrent(),
                startedAt: this.songStartedAt
            }),
            getProgress: () => buildProjectionProgress({
                timeline: this.audio.getTimeline(),
                playing: !this.dom.player.audioPlayer.paused
            })
        });

        for (const type of ['timeupdate', 'play', 'pause', 'seeked', 'loadedmetadata', 'ended']) {
            this.dom.player.audioPlayer.addEventListener(type, () => this.projection.publishProgress());
        }
    }

    _onGameChanged() {
        this.savedGame.scheduleAutosave();
        this.projection.schedulePublish();
    }

    _createSavedGame() {
        this.initialPlayerTitle = this.dom.player.songTitleElement.textContent;
        this.savedGame = new SavedGameController({
            game: this.game,
            songManager: this.songManager,
            store: new GameStateStore(),
            dialogs: this.dialogs,
            sounds: this.sounds,
            getSongs: () => this.songs,
            setSongs: (songs) => { this.songs = songs; },
            getSettings: () => this._currentSettings(),
            applySettings: (values) => this._applyImportedSettings(values),
            renderRestored: (state) => this._renderRestoredGame(state)
        });
    }

    init() {
        this._applyBootSettings();
        this.setupEventListeners();
        this.configModal.init();
        this.cartonModals.init();
        this.cartonCheck.init();
        this.dom.toolbar.openProjectionBtn.addEventListener('click', () => this.projection.open());
        this.audioControls.bind();
        this.dragAndDrop.init();
        this.theme.init();
        this.fullscreen.init();
        this.songList.render();
        this.updateCounters();
        this.updateControls(false);
        this.savedGame.offerSavedGame();
        registerServiceWorker();
    }

    _applyBootSettings() {
        const dom = this.dom;
        const settings = this.settings;

        dom.game.gameNameInput.maxLength = MAX_GAME_NAME_LENGTH;
        dom.game.gameNameInput.title = TEXT.gameName.editHint(MAX_GAME_NAME_LENGTH);

        this.audio.setVolume(settings.musicVolume);
        this.sounds.setVolume(settings.effectsVolume);
        this.audioControls.setVolumes(settings.musicVolume, settings.effectsVolume);

        this.game.setTitleRevealTime(settings.titleRevealTime);
        this.game.setIconRevealTime(settings.iconRevealTime);
        this.game.setClip(settings.clipSeconds, settings.randomClipStart);

        if (settings.gameName) {
            this._setGameName(settings.gameName);
        }
    }

    _currentSettings() {
        return {
            theme: this.theme.getCurrent(),
            musicVolume: this.audio.musicVolume,
            effectsVolume: this.sounds.volume,
            titleRevealTime: this.game.getTitleRevealTime(),
            iconRevealTime: this.game.getIconRevealTime(),
            clipSeconds: this.game.getClip().seconds,
            randomClipStart: this.game.getClip().randomStart,
            gameName: this.game.getGameName(),
            ...this.cartonModals.getSettings()
        };
    }

    _applyImportedSettings(values) {
        if ('musicVolume' in values || 'effectsVolume' in values) {
            const musicVolume = values.musicVolume ?? this.audio.musicVolume;
            const effectsVolume = values.effectsVolume ?? this.sounds.volume;

            this.audio.setVolume(musicVolume);
            this.sounds.setVolume(effectsVolume);
            this.audioControls.setVolumes(musicVolume, effectsVolume);
        }

        if ('titleRevealTime' in values || 'iconRevealTime' in values) {
            this.game.setTitleRevealTime(values.titleRevealTime ?? this.game.getTitleRevealTime());
            this.game.setIconRevealTime(values.iconRevealTime ?? this.game.getIconRevealTime());
            this.configModal.setRevealTimes(this.game.getTitleRevealTime(), this.game.getIconRevealTime());
        }

        if ('clipSeconds' in values || 'randomClipStart' in values) {
            const clip = this.game.getClip();

            this.game.setClip(values.clipSeconds ?? clip.seconds, values.randomClipStart ?? clip.randomStart);
            this.configModal.setClip(this.game.getClip());
        }

        if ('gameName' in values) {
            this._setGameName(values.gameName);
        }
        if ('theme' in values) {
            this.theme.apply(values.theme);
        }

        this.cartonModals.applySettings(values);
        this._saveSettings(values);
    }

    _saveSettings(partial) {
        this.preferences.saveSettings(partial);

        if ('gameName' in partial) {
            this.savedGame?.scheduleAutosave();
        }
    }

    _onCartonesChanged() {
        this.updateUIState();
        this._onGameChanged();
    }

    _renderRestoredGame({playedSongs, currentSong}) {
        if (this.audio.hasSongLoaded()) {
            this.stopSong();
        }

        this.dom.history.historyGrid.innerHTML = '';
        playedSongs.forEach(song => this.addToHistory(song));

        this._showPlayerFor(currentSong);
        this._renderContinuousModeButton(false);
        this.refreshUI();
        this.updateControls(false);
    }

    _showPlayerFor(song) {
        if (song) {
            this.ui.updatePlayerUI(song);
            return;
        }

        this.dom.player.songTitleElement.textContent = this.initialPlayerTitle;
        this.dom.player.currentIconImg.alt = TEXT.player.currentSongAlt;
        this.dom.player.currentIconImg.src = LOGO_PATH;
        this.dom.player.songTitleElement.style.opacity = '1';
        this.dom.player.currentIconImg.style.opacity = '1';
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
        this.dom.songs.exportGameBtn.addEventListener('click', () => this.savedGame.exportGame());
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') this.savedGame.flush();
        });
        this.dom.songs.linkAudioBtn.addEventListener('click', () => this.dom.songs.linkAudioInput.click());
        this.dom.songs.linkAudioInput.addEventListener('change', (e) => this.linkAudio(e));
        this.dom.songs.importListBtn.addEventListener('click', () => this.dom.songs.importFileInput.click());
        this.dom.songs.importFileInput.addEventListener('change', (e) => this.importPlaylist(e));
        this.dom.game.lineaBtn.addEventListener('click', () => this.triggerLinea());
        this.dom.game.bingoBtn.addEventListener('click', () => this.triggerBingo());
        this.dom.toolbar.shortcutsHelpBtn.addEventListener('click', () => this.showKeyboardShortcutsHelp());
    }

    _setupGameNameEventListeners() {
        this.dom.game.gameNameInput.addEventListener('input', (e) => {
            const name = e.target.value.trim();
            this.game.setGameName(name);
            this._saveSettings({gameName: name});
        });

        this.dom.game.gameNameInput.addEventListener('blur', (e) => {
            const name = e.target.value.trim();
            if (name.length > MAX_GAME_NAME_LENGTH) {
                this.dialogs.showAlert(MSG.game.nameTooLong(MAX_GAME_NAME_LENGTH));
                e.target.value = name.substring(0, MAX_GAME_NAME_LENGTH);
                this.game.setGameName(e.target.value);
                this._saveSettings({gameName: e.target.value});
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
            .register('c', {
                ...SHORTCUTS.check,
                action: () => this.cartonCheck.open()
            })
            .register('p', {
                ...SHORTCUTS.projection,
                action: () => this.projection.open()
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

    async _canChangeSongs(startedMessage, cartonAction) {
        if (!this.checkGameNotStarted(startedMessage)) {
            return false;
        }
        return this.cartonModals.confirmAndClear(cartonAction);
    }

    _setGameName(name) {
        this.game.setGameName(name);
        this.dom.game.gameNameInput.value = name;
        this._saveSettings({gameName: name});
    }

    clearFileInput(event) {
        event.target.value = '';
    }

    refreshUI() {
        this.songList.render();
        this.updateCounters();
        this.updateUIState();
        this._onGameChanged();
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
        this._onGameChanged();
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
        const gameName = gameNameOrDefault(this.game.getGameName());
        const cartones = this.game.getCartones();
        const result = this.playlistFile.export(this.songs, this.songsFolder, gameName, cartones);

        if (result.success) {
            this.sounds.play(SOUND.CLICK);
            this.dialogs.showAlert(MSG.playlist.exportOk(result.message));
        } else {
            this.dialogs.showAlert(MSG.playlist.exportFailed(result.error));
        }
    }

    linkAudio(event) {
        const files = Array.from(event.target.files);
        this.clearFileInput(event);

        if (files.length === 0) return;

        if (this.songs.length === 0) {
            this.dialogs.showAlert(MSG.audio.noSongsToLink);
            return;
        }

        const result = linkAudioFiles(this.songs, files);

        if (result.pendingCount === 0) {
            this.dialogs.showAlert(MSG.audio.allLinked);
        } else if (result.linked.length === 0) {
            this.dialogs.showAlert(MSG.audio.noMatches(result.pendingCount, result.audioFiles));
        } else {
            this.sounds.play(SOUND.WIN);
            this.refreshUI();
            this.updateControls(this.audio.isPlaying);
            this.dialogs.showAlert(MSG.audio.linked(result));
        }
    }

    async importPlaylist(event) {
        const file = event.target.files[0];
        if (!file) return;

        const result = await this.playlistFile.read(file);

        if (!result.success) {
            this.dialogs.showAlert(MSG.playlist.importFailed(result.error));
            this.clearFileInput(event);
            return;
        }

        if (result.playlist.type === GAME_FILE_TYPE) {
            await this.savedGame.importGame(result.playlist);
            this.clearFileInput(event);
            return;
        }

        if (!this.checkGameNotStarted(MSG.gameStarted.importList)) {
            this.clearFileInput(event);
            return;
        }

        const {duplicates, missing} = await this._applyImportedPlaylist(result.playlist);
        this._announceImportResult(duplicates, missing);
        this.clearFileInput(event);
    }

    async _applyImportedPlaylist(playlist) {
        this.game.clearHistory();
        const {songs, duplicates, missing} = await this.importer.loadSongs(playlist.songs);
        this.songs = songs;

        this._setGameName(playlist.name || '');

        this._loadImportedCartones(playlist.cartones);
        this.refreshUI();

        return {duplicates, missing};
    }

    _loadImportedCartones(cartones) {
        if (Array.isArray(cartones) && cartones.length > 0) {
            this.game.setCartones(deserializeCartones(cartones, this.songs));
        } else {
            this.game.clearCartones();
        }
    }

    _announceImportResult(duplicates, missing) {
        if (duplicates.length > 0) {
            this.sounds.play(SOUND.ERROR);
            this.dialogs.showAlert(MSG.playlist.importDuplicates(duplicates));
        }

        setTimeout(() => {
            if (this.songs.length === 0) {
                this.sounds.play(SOUND.ERROR);
                this.dialogs.showAlert(MSG.playlist.importNoSongs);
            } else {
                this.sounds.play(SOUND.WIN);
                this.dialogs.showAlert(MSG.playlist.importOk(this.songs.length, this.songsFolder, missing.length));
            }
        }, duplicates.length > 0 ? IMPORT_MESSAGE_DELAY_MS : 0);
    }

    // ============================================================
    // GESTIÓN DE ICONOS
    // ============================================================

    async openIconPicker(songId) {
        if (!await this._canChangeSongs(MSG.gameStarted.changeIcons, TEXT.cartonActions.changeIcon)) {
            return;
        }

        const result = this.icons.openIconPicker(songId, this.songs, () => {
            this.songList.render();
            this._onGameChanged();
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

        if (!await this._canChangeSongs(MSG.gameStarted.addSongs, TEXT.cartonActions.addSongs)) {
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
        if (!await this._canChangeSongs(MSG.gameStarted.deleteSong, TEXT.cartonActions.deleteSong)) {
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

        this.dom.toolbar.openCheckCartonBtn.disabled = !this.game.hasCartonesGenerated();

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
            this._setGameName('');

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

        btn.innerHTML = iconTextHtml(continuousMode ? TEXT.player.continuousOn : TEXT.player.continuousOff);
        btn.style.background = continuousMode ? 'var(--danger-color)' : 'var(--text-muted)';
        btn.setAttribute('aria-pressed', continuousMode ? 'true' : 'false');
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

        if (this.game.getCurrentSong() === null && this.projection.hasListener()) {
            this._startFirstSongAfterProjection(song);
            return;
        }

        this._startSong(song);
    }

    _startFirstSongAfterProjection(song) {
        if (this.waitingForProjection) return;

        this.waitingForProjection = true;
        this.projection.dockLogo().finally(() => {
            this.waitingForProjection = false;
            this._startSong(song);
        });
    }

    _startSong(song) {
        this.audio.play(song.file, () => this._onSongStarted(song), this.game.getClip());
    }

    _onSongStarted(song) {
        this.game.setCurrentSong(song.id);
        this.songStartedAt = Date.now();
        this.updatePlayerUI(song);
        this.updateControls(true);

        if (this.game.markSongAsPlayed(song)) {
            this.addToHistory(song);
            this.updateCounters();
            this.sounds.play(SOUND.WIN);
        }

        this.songList.render();
        this._onGameChanged();
    }

    pauseSong() {
        const isNowPlaying = this.audio.pause();
        this.updateControls(isNowPlaying);
    }

    stopSong() {
        this.audio.stop();
        this.updateControls(false);
        this.songList.render();
    }

    restartSong() {
        const currentSongId = this.game.getCurrentSong();
        if (currentSongId !== null) {
            this.audio.restart();
            this.updateControls(true);
        }
    }

    updatePlayerUI(song) {
        this.ui.updatePlayerUI(song);
    }

    updateControls(playing) {
        const hasSongLoaded = this.audio.hasSongLoaded();
        const noSongsLeft = this.game.allSongsPlayed(this.songs);
        this.ui.updateControls(playing, this.game.isGameStarted(), hasSongLoaded, noSongsLeft);
    }

    onSongEnded() {
        if (this.game.isContinuousMode() && !this.game.isGameStarted()) {
            this.playRandomContinuousSong();
            return;
        }

        if (this.game.isGameStarted()) {
            if (this.game.allSongsPlayed(this.songs) && !this.game.isBingoCompleted()) {
                this.game.completeBingo();
                this._onGameChanged();
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
        const historyItem = this.ui.addToHistory(song);

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

            this.dom.history.historyGrid.innerHTML = '';
            this.refreshUI();
            this.stopSong();

            this._renderContinuousModeButton(this.game.isContinuousMode());

            this.dom.player.currentIconImg.alt = TEXT.player.currentSongAlt;
            this.dom.player.currentIconImg.src = LOGO_PATH;

        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new BingoMusical());
} else {
    new BingoMusical();
}