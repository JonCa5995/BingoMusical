// Bingo Musical Application
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
import {CartonManager} from "./modules/CartonManager.js";
import {KeyboardShortcuts} from "./modules/KeyboardShortcuts.js";
import {CartonHtmlRenderer} from "./modules/CartonHtmlRenderer.js";
import {CartonExporter} from "./modules/CartonExporter.js";
import {SongListView} from "./modules/SongListView.js";
import {PlaylistImporter} from "./modules/PlaylistImporter.js";
import {deserializeCartones} from "./modules/CartonSerializer.js";
import {
    CARTON_MODE,
    CELEBRATION_DELAY_MS,
    CONTINUOUS_NEXT_SONG_DELAY_MS,
    DEFAULT_CARTON_COUNT,
    DEFAULT_EFFECTS_VOLUME,
    DEFAULT_GAME_NAME,
    DEFAULT_ICON_REVEAL_TIME,
    DEFAULT_MUSIC_VOLUME,
    DEFAULT_PRINT_PRIMARY_COLOR,
    DEFAULT_PRINT_SECONDARY_COLOR,
    DEFAULT_SONGS_FOLDER,
    DEFAULT_TITLE_REVEAL_TIME,
    IMPORT_MESSAGE_DELAY_MS,
    LOGO_PATH,
    MAX_CARTONS_GENERATED,
    MAX_GAME_NAME_LENGTH,
    MAX_REVEAL_TIME_SECONDS,
    MIN_SONGS_REQUIRED,
    MS_PER_SECOND,
    PRINT_FORMAT,
    SOUND
} from "./constants.js";
import {MSG, SHORTCUTS, TEXT} from "./messages.js";

class BingoMusical {
    constructor() {
        this.songs = [];
        this.listRevealTimers = [];

        this.cartonGenerator = new BingoCartonGenerator();
        this.songsFolder = DEFAULT_SONGS_FOLDER;
        this.dom = new DOMElements();
        this.sounds = new SoundEffects();
        this.audio = new AudioManager(this.dom.audioPlayer, this.sounds);
        this.audioControls = new AudioControlsView({
            audioElement: this.dom.audioPlayer,
            elements: {
                progressBar: this.dom.progressBar,
                progressFill: this.dom.progressFill,
                currentTimeSpan: this.dom.currentTimeSpan,
                durationSpan: this.dom.durationSpan,
                musicVolumeSlider: this.dom.musicVolumeSlider,
                musicVolumeValueSpan: this.dom.musicVolumeValueSpan,
                effectsVolumeSlider: this.dom.effectsVolumeSlider,
                effectsVolumeValueSpan: this.dom.effectsVolumeValueSpan
            },
            handlers: {
                onSeek: (fraction) => this.audio.seekToFraction(fraction),
                onMusicVolume: (volume) => this.audio.setVolume(volume),
                onEffectsVolume: (volume) => this.sounds.setVolume(volume)
            }
        });
        this.playlistFile = new PlaylistFile();
        this.icons = new IconManager(this.dom, this.sounds, () => this.songs);
        this.songManager = new SongManager();
        this.game = new GameManager();
        this.ui = new UIManager(this.dom, MIN_SONGS_REQUIRED);
        this.modal = new ModalManager(this.dom, this.sounds);
        this.theme = new ThemeManager({
            preferences: new PreferencesStore(),
            toggleButton: this.dom.themeToggleBtn,
            icon: this.dom.themeIcon,
            onToggle: () => this.sounds.play(SOUND.CLICK)
        });
        this.fullscreen = new FullscreenManager({
            button: this.dom.fullscreenBtn,
            onToggle: () => this.sounds.play(SOUND.CLICK)
        });
        this.dragAndDrop = new DragAndDropUploader({
            zones: [...document.querySelectorAll('.file-label'), this.dom.songsSection],
            fileInput: this.dom.addSongsInput,
            isEnabled: () => !this.game.isGameStarted()
        });
        this.carton = new CartonManager(this.dom, this.sounds, this.cartonGenerator,
            new CartonExporter(new CartonHtmlRenderer())
        );
        this.importer = new PlaylistImporter({
            songsFolder: this.songsFolder,
            songManager: this.songManager,
            getRandomIcon: (songs) => this.icons.getRandomAvailableIcon(songs)
        });
        this.songList = new SongListView({
            ui: this.ui,
            songManager: this.songManager,
            filterControls: {
                searchInput: this.dom.searchInput,
                filterStatus: this.dom.filterStatus,
                sortOrder: this.dom.sortOrder
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

        this.init();
    }

    init() {
        this._applyConfigToDom();
        this.setupEventListeners();
        this.audioControls.bind();
        this.dragAndDrop.init();
        this.theme.init();
        this.fullscreen.init();
        this.songList.render();
        this.updateCounters();
        this.updateControls(false);
    }

    /**
     * Escribe en los controles los valores de constants.js que index.html también trae escritos,
     * para que haya una sola fuente de verdad. Si coinciden (lo normal) no se nota nada.
     */
    _applyConfigToDom() {
        const dom = this.dom;

        // Nombre del juego
        dom.gameNameInput.maxLength = MAX_GAME_NAME_LENGTH;
        dom.gameNameInput.title = TEXT.gameName.editHint(MAX_GAME_NAME_LENGTH);

        // Cantidad de cartones que propone el modal de generación
        dom.cartonCountInput.max = MAX_CARTONS_GENERATED;
        dom.cartonCountInput.value = DEFAULT_CARTON_COUNT;

        // Tiempos de revelado (en segundos)
        for (const [slider, label, seconds] of [
            [dom.titleRevealTimeSlider, dom.titleRevealValueSpan, DEFAULT_TITLE_REVEAL_TIME],
            [dom.iconRevealTimeSlider, dom.iconRevealValueSpan, DEFAULT_ICON_REVEAL_TIME]
        ]) {
            slider.max = MAX_REVEAL_TIME_SECONDS;
            slider.value = seconds;
            label.textContent = TEXT.seconds(seconds);
        }

        // Volúmenes iniciales (los sliders van de 0 a 100)
        for (const [slider, label, volume] of [
            [dom.musicVolumeSlider, dom.musicVolumeValueSpan, DEFAULT_MUSIC_VOLUME],
            [dom.effectsVolumeSlider, dom.effectsVolumeValueSpan, DEFAULT_EFFECTS_VOLUME]
        ]) {
            const percent = Math.round(volume * 100);
            slider.value = percent;
            slider.setAttribute('aria-valuenow', percent);
            label.textContent = `${percent}%`;
        }

        // Colores de impresión
        dom.printPrimaryColorInput.value = DEFAULT_PRINT_PRIMARY_COLOR;
        dom.printSecondaryColorInput.value = DEFAULT_PRINT_SECONDARY_COLOR;
        document.querySelector('.color-preview-print')?.style.setProperty('background-color', DEFAULT_PRINT_PRIMARY_COLOR);
        document.querySelector('.color-preview-print-secondary')?.style.setProperty('background-color', DEFAULT_PRINT_SECONDARY_COLOR);
    }

    _setupPlayerEventListeners() {
        this.dom.playBtn.addEventListener('click', () => this.playRandomSong());
        this.dom.pauseBtn.addEventListener('click', () => this.pauseSong());
        this.dom.stopBtn.addEventListener('click', () => this.restartSong());

        // Evento cuando termina una canción
        this.dom.audioPlayer.addEventListener('ended', () => this.onSongEnded());

        // Si el navegador rechaza la reproducción, reflejar en los controles que no suena
        this.dom.audioPlayer.addEventListener('playbackfailed', () => this.updateControls(false));
    }

    _setupSongManagementEventListeners() {
        // Interceptar click en el label para verificar cartones antes de abrir selector
        this.dom.addSongsLabel.addEventListener('click', async (e) => {
            if (this.game.getCartonesCount() > 0) {
                e.preventDefault();
                if (await this.confirmAndClearCartones(TEXT.cartonActions.addSongs)) {
                    this.dom.addSongsInput.click();
                }
            }
        });

        this.dom.addSongsInput.addEventListener('change', (e) => this.addSongs(e));
        this.dom.clearHistoryBtn.addEventListener('click', () => this.reiniciarJuego());
        this.dom.shuffleAllBtn.addEventListener('click', () => this.toggleContinuousMode());

        // Búsqueda, filtro y orden de la lista
        this.songList.bindFilterControls();

        // Event listener para eliminar todas las canciones
        this.dom.deleteAllBtn.addEventListener('click', () => this.deleteAllSongs());
    }

    _setupCartonEventListeners() {
        this.dom.generateCartonesBtn.addEventListener('click', () => this.openCartonOptionsModal());

        // Modal de opciones
        this._registerModal(this.dom.cartonOptionsModal, this.dom.closeCartonOptionsModalBtn);
        this.dom.createNewCartonesBtn.addEventListener('click', () => this._startCartonGeneration(CARTON_MODE.NEW));
        this.dom.addCartonesBtn.addEventListener('click', () => this._startCartonGeneration(CARTON_MODE.ADD));
        this.dom.printExistingCartonesBtn.addEventListener('click', () => this.handlePrintExistingCartones());
        this.dom.deleteAllCartonesBtn.addEventListener('click', () => this.handleDeleteAllCartones());

        // Modal de generación (simplificado - solo cantidad)
        this._registerModal(this.dom.cartonModal, this.dom.closeCartonModalBtn);
        this.dom.generateSaveCartonesBtn.addEventListener('click', () => this.generateCartones());

        // Modal de impresión (con personalización)
        this._registerModal(this.dom.printModal, this.dom.closePrintModalBtn);
        this.dom.printHtmlBtn.addEventListener('click', () => this.printCartones(PRINT_FORMAT.HTML));
        this.dom.printPdfBtn.addEventListener('click', () => this.printCartones(PRINT_FORMAT.PDF));
        this.dom.previewPrintBtn.addEventListener('click', () => this.updatePrintPreview());

        // Event listeners para selector de rango
        this.dom.printRangeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const showRange = e.target.value === 'range';
                this.dom.rangeInputsContainer.style.display = showRange ? 'block' : 'none';
            });
        });

        // Actualizar preview al cambiar colores
        this.dom.printPrimaryColorInput.addEventListener('input', (e) => {
            document.querySelector('.color-preview-print').style.backgroundColor = e.target.value;
            this.updatePrintPreview();
        });
        this.dom.printSecondaryColorInput.addEventListener('input', (e) => {
            document.querySelector('.color-preview-print-secondary').style.backgroundColor = e.target.value;
            this.updatePrintPreview();
        });
    }

    /**
     * Registra un modal (Escape, atajos bloqueados y cierre al hacer clic fuera) y conecta su botón de cerrar.
     * Todos los cierres suenan con el clic.
     */
    _registerModal(modalElement, closeButton) {
        const close = () => this._closeModal(modalElement);
        closeButton.addEventListener('click', close);
        this.modal.registerModal(modalElement, close);
    }

    /** Abre un modal con el sonido de clic */
    _openModal(modalElement) {
        this.sounds.play(SOUND.CLICK);
        this.modal.openModal(modalElement);
    }

    /** Cierra un modal con el sonido de clic */
    _closeModal(modalElement) {
        this.sounds.play(SOUND.CLICK);
        this.modal.closeModal(modalElement);
    }

    // ============================================================
    // CONFIGURACIÓN DE EVENT LISTENERS
    // ============================================================

    setupEventListeners() {
        this._setupPlayerEventListeners();
        this._setupSongManagementEventListeners();
        this._setupCartonEventListeners();
        this._setupConfigEventListeners();
        this._setupModalEventListeners();
        this._setupCelebrationEventListeners();
        this._setupKeyboardShortcuts();
        this._setupGameNameEventListeners();

        this.dom.exportListBtn.addEventListener('click', () => this.exportPlaylist());
        this.dom.importListBtn.addEventListener('click', () => this.dom.importFileInput.click());
        this.dom.importFileInput.addEventListener('change', (e) => this.importPlaylist(e));
        this.dom.lineaBtn.addEventListener('click', () => this.triggerLinea());
        this.dom.bingoBtn.addEventListener('click', () => this.triggerBingo());
        this.dom.shortcutsHelpBtn.addEventListener('click', () => this.showKeyboardShortcutsHelp());
    }

    _setupGameNameEventListeners() {
        // Actualizar el nombre del juego cuando cambia el input
        this.dom.gameNameInput.addEventListener('input', (e) => {
            this.game.setGameName(e.target.value.trim());
        });

        // Validar al hacer blur
        this.dom.gameNameInput.addEventListener('blur', (e) => {
            const name = e.target.value.trim();
            if (name.length > MAX_GAME_NAME_LENGTH) {
                this.modal.showAlert(MSG.game.nameTooLong(MAX_GAME_NAME_LENGTH));
                e.target.value = name.substring(0, MAX_GAME_NAME_LENGTH);
                this.game.setGameName(e.target.value);
            }
        });
    }

    _setupConfigEventListeners() {
        this.dom.configBtn.addEventListener('click', () => this.openConfigModal());
        this._registerModal(this.dom.configModal, this.dom.closeConfigModalBtn);
        this.dom.saveConfigBtn.addEventListener('click', () => this.saveConfig());

        // Actualizar valores en tiempo real
        this.dom.titleRevealTimeSlider.addEventListener('input', (e) => {
            this.dom.titleRevealValueSpan.textContent = TEXT.seconds(e.target.value);
        });

        this.dom.iconRevealTimeSlider.addEventListener('input', (e) => {
            this.dom.iconRevealValueSpan.textContent = TEXT.seconds(e.target.value);
        });
    }

    _setupModalEventListeners() {
        this.dom.confirmCancelBtn.addEventListener('click', () => this.modal.closeConfirmModal(false));
        this.dom.confirmAcceptBtn.addEventListener('click', () => this.modal.closeConfirmModal(true));
        this.dom.alertOkBtn.addEventListener('click', () => this.modal.closeAlertModal());

        this.modal.registerModal(this.dom.iconModal, () => this.icons.closeIconModal());
    }

    _setupCelebrationEventListeners() {
        this.dom.continueLineaBtn.addEventListener('click', () => {
            this.dom.lineaOverlay.classList.add('hidden');
        });

        this.dom.restartBtn.addEventListener('click', () => {
            this.reiniciarJuego();
            this.dom.celebrationOverlay.classList.add('hidden');
        });
    }

    playPauseOnSpace() {
        if (this.audio.isPlaying || this.game.getCurrentSong() !== null) {
            this.pauseSong(); // Pausa, o reanuda si estaba en pausa
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
                    if (!this.dom.lineaBtn.disabled) this.triggerLinea();
                }
            })
            .register('b', {
                ...SHORTCUTS.bingo,
                action: () => {
                    if (!this.dom.bingoBtn.disabled) this.triggerBingo();
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
        this.modal.showAlert({title: TEXT.shortcuts.helpTitle, message: this.shortcuts.getHelpText()});
    }

    // ============================================================
    // VALIDACIONES Y UTILIDADES
    // ============================================================

    /**
     * Verifica si el juego ha iniciado y muestra alerta si es así
     * @returns {boolean} - true si el juego NO ha iniciado (se puede continuar), false si ha iniciado
     * @param gameStartedMessage
     */
    checkGameNotStarted(gameStartedMessage) {
        if (this.game.isGameStarted()) {
            this.modal.showAlert(gameStartedMessage);
            return false;
        }
        return true;
    }

    /**
     * Verifica si hay cartones existentes, pide confirmación y los borra si el usuario acepta
     * @param {string} action - Descripción de la acción que se va a realizar
     * @returns {Promise<boolean>} - true si no hay cartones o el usuario confirmó, false si canceló
     */
    async confirmAndClearCartones(action) {
        const cartonesCount = this.game.getCartonesCount();
        if (cartonesCount > 0) {
            const confirmed = await this.modal.showConfirm(MSG.cartones.existing(cartonesCount, action));

            if (!confirmed) {
                return false;
            }

            this.game.clearCartones();
            this.updateUIState();
        }
        return true;
    }

    /**
     * Limpia el valor de un input file para permitir seleccionar el mismo archivo de nuevo
     * Esto es necesario porque el evento 'change' solo se dispara si el valor cambia
     * @param {Event} event - Evento del input file
     */
    clearFileInput(event) {
        event.target.value = '';
    }

    /**
     * Actualiza toda la UI: lista de canciones, contadores y estado
     */
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
            overlay: this.dom.lineaOverlay
        });
    }

    triggerBingo() {
        this._callGame({
            canCall: () => this.game.canCallBingo(),
            complete: () => this.game.completeBingo(),
            sound: SOUND.COMPLETE,
            overlay: this.dom.celebrationOverlay
        });
    }

    /**
     * Canta LÍNEA o BINGO: valida, lo marca como cantado, suena y enseña la celebración
     */
    _callGame({canCall, complete, sound, overlay}) {
        if (!this._ensureEnoughSongs()) return;

        const check = canCall();
        if (!check.valid) {
            this.modal.showAlert(check.alert);
            return;
        }

        complete();
        this.sounds.play(sound);
        setTimeout(() => overlay.classList.remove('hidden'), CELEBRATION_DELAY_MS);
    }

    /**
     * Comprueba que hay canciones suficientes para jugar y, si no, avisa
     * @returns {boolean} true si se puede continuar
     */
    _ensureEnoughSongs() {
        const validation = this.songManager.validateMinSongs(this.songs, MIN_SONGS_REQUIRED);
        if (!validation.valid) {
            this.modal.showAlert(validation.alert);
        }
        return validation.valid;
    }

    // ============================================================
    // GESTIÓN DE CONFIGURACIÓN
    // ============================================================

    openConfigModal() {
        if (!this.checkGameNotStarted(MSG.gameStarted.changeConfig)) {
            return;
        }

        this._openModal(this.dom.configModal);
    }

    saveConfig() {
        const titleRevealTime = Number.parseInt(this.dom.titleRevealTimeSlider.value);
        const iconRevealTime = Number.parseInt(this.dom.iconRevealTimeSlider.value);

        this.game.setTitleRevealTime(titleRevealTime);
        this.game.setIconRevealTime(iconRevealTime);

        this.sounds.play(SOUND.WIN);
        this.modal.showAlert(MSG.config.saved(titleRevealTime, iconRevealTime));
        this._closeModal(this.dom.configModal);
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
            this.modal.showAlert(MSG.playlist.exportOk(result.message));
        } else {
            this.modal.showAlert(MSG.playlist.exportFailed(result.error));
        }
    }

    async importPlaylist(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!this.checkGameNotStarted(MSG.gameStarted.importList)) {
            this.clearFileInput(event);
            return;
        }

        // Leer y validar el archivo JSON
        const result = await this.playlistFile.read(file);

        if (!result.success) {
            this.modal.showAlert(MSG.playlist.importFailed(result.error));
            this.clearFileInput(event);
            return;
        }

        const playlist = result.playlist;

        // La importación reemplaza la lista actual
        this.game.clearHistory();
        const {songs, duplicates} = await this.importer.loadSongs(playlist.songs);
        this.songs = songs;

        // Cargar el nombre del juego desde el playlist
        const gameName = playlist.name || '';
        this.game.setGameName(gameName);
        this.dom.gameNameInput.value = gameName;

        // Cargar cartones del playlist (o limpiar los anteriores, que apuntan a canciones ya descartadas)
        if (Array.isArray(playlist.cartones) && playlist.cartones.length > 0) {
            // Pasar de la forma guardada a la de memoria, enlazando con las canciones actuales
            this.game.setCartones(deserializeCartones(playlist.cartones, this.songs));
        } else {
            this.game.clearCartones();
        }

        this.refreshUI();

        // Show duplicate warning first, if any
        if (duplicates.length > 0) {
            this.sounds.play(SOUND.ERROR);
            this.modal.showAlert(MSG.playlist.importDuplicates(duplicates));
        }

        // Then, show the main success/error message
        setTimeout(() => {
            if (this.songs.length === 0) {
                this.sounds.play(SOUND.ERROR);
                this.modal.showAlert(MSG.playlist.importNoSongs(this.songsFolder));
            } else {
                this.sounds.play(SOUND.WIN);
                this.modal.showAlert(MSG.playlist.importOk(this.songs.length, this.songsFolder));
            }
        }, duplicates.length > 0 ? IMPORT_MESSAGE_DELAY_MS : 0);

        this.clearFileInput(event);
    }

    // ============================================================
    // GESTIÓN DE ICONOS
    // ============================================================

    async openIconPicker(songId) {
        if (!this.checkGameNotStarted(MSG.gameStarted.changeIcons)) {
            return;
        }

        if (!await this.confirmAndClearCartones(TEXT.cartonActions.changeIcon)) {
            return;
        }


        const result = this.icons.openIconPicker(songId, this.songs, () => {
            this.songList.render();
        });

        if (!result.success) {
            this.modal.showAlert(result.alert);
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

        // Verificar si existen cartones (para drag & drop)
        if (!await this.confirmAndClearCartones(TEXT.cartonActions.addSongs)) {
            this.clearFileInput(event);
            return;
        }

        // Usar SongManager para procesar las canciones
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
            this.modal.showAlert(MSG.songs.duplicatesNotAdded(result.duplicates));
        }

        this.clearFileInput(event);
    }

    async deleteSong(songId) {
        if (!this.checkGameNotStarted(MSG.gameStarted.deleteSong)) {
            return;
        }

        if (!await this.confirmAndClearCartones(TEXT.cartonActions.deleteSong)) {
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

        // Deshabilitar el input del nombre si el juego ha iniciado o se generaron cartones
        const shouldDisableGameName = this.game.isGameStarted() || this.game.hasCartonesGenerated();
        this.dom.gameNameInput.disabled = shouldDisableGameName;

        if (shouldDisableGameName && this.dom.gameNameInput.title !== TEXT.gameName.locked) {
            this.dom.gameNameInput.title = TEXT.gameName.locked;
        } else if (!shouldDisableGameName) {
            this.dom.gameNameInput.title = TEXT.gameName.editHint(MAX_GAME_NAME_LENGTH);
        }
    }


    // Qué ocurre al interactuar con una canción de la lista (SongListView solo avisa)
    onSongIconClick(song) {
        if (song.played) {
            this.modal.showAlert(MSG.songs.iconLocked);
        } else {
            this.openIconPicker(song.id);
        }
    }

    onSongClick(song) {
        // Fuera de partida, pulsar una canción la escucha
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
            this.modal.showAlert(MSG.songs.nothingToDelete);
            return;
        }

        const confirmed = await this.modal.showConfirm(MSG.songs.confirmDeleteAll(this.songs.length));

        if (confirmed) {
            this.songs = [];
            this.sounds.play(SOUND.CLICK);

            // Resetear el flag de cartones generados, el nombre del juego y los cartones
            this.game.clearCartones();
            this.game.setGameName('');
            this.dom.gameNameInput.value = '';

            this.refreshUI();
            this.modal.showAlert(MSG.songs.allDeleted);
        }
    }

    toggleContinuousMode() {
        const continuousMode = this.game.toggleContinuousMode();
        if (continuousMode) this.sounds.play(SOUND.START);
        this._renderContinuousModeButton(continuousMode);
    }

    _renderContinuousModeButton(continuousMode) {
        const btn = this.dom.shuffleAllBtn;

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

        // Iniciar juego si no ha comenzado
        if (!this.game.isGameStarted()) {
            this.game.startGame();
            this.updateUIState();
        }

        // Obtener canción aleatoria no reproducida
        const randomSong = this.game.getRandomUnplayedSong(this.songs);

        if (!randomSong) {
            this.modal.showAlert(MSG.songs.noMoreSongs);
            return;
        }

        this.playSong(randomSong.id);
    }

    playSong(songId) {
        const song = this.songManager.findSongById(this.songs, songId);
        if (!song?.file) {
            this.modal.showAlert(MSG.songs.noAudioFile);
            return;
        }

        // Cancelar revelados pendientes de la canción anterior y mostrarla del todo
        this._clearListRevealTimers();
        const previousSong = this.songManager.findSongById(this.songs, this.game.getCurrentSong());
        if (previousSong) this._revealSongInList(previousSong);

        // Ocultar título e icono de la canción en la lista hasta que se revelen
        song.hideTitle = true;
        song.hideIcon = true;

        // Usar AudioManager para reproducir
        this.audio.play(song.file, () => {
            this.game.setCurrentSong(songId);
            this.updatePlayerUI(song);
            this.updateControls(true);

            // Marcar como reproducida usando GameManager
            if (this.game.markSongAsPlayed(song)) {
                this.addToHistory(song);
                this.updateCounters();
                this.sounds.play(SOUND.WIN);
            }

            // Always re-render the list to show the current playing song
            this.songList.render();

            // Programar la revelación del título e icono en la lista después del tiempo configurado
            // Solo si el juego ha iniciado
            if (this.game.isGameStarted()) {
                // Los elementos se buscan al dispararse el temporizador porque la lista
                // puede haberse vuelto a pintar entretanto (filtros, cierre de alertas...)
                this.listRevealTimers.push(
                    setTimeout(() => {
                        song.hideTitle = false;
                        this.songList.reveal(songId, 'title');
                    }, this.game.getTitleRevealTime() * MS_PER_SECOND),
                    setTimeout(() => {
                        song.hideIcon = false;
                        this.songList.reveal(songId, 'icon');
                    }, this.game.getIconRevealTime() * MS_PER_SECOND)
                );
            } else {
                // Si el juego no ha iniciado, mostrar todo inmediatamente
                this._revealSongInList(song);
            }
        });
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

    /**
     * Cancela los revelados pendientes y muestra la canción actual sin ocultar
     */
    _revealCurrentSong() {
        this._clearListRevealTimers();
        const currentSong = this.songManager.findSongById(this.songs, this.game.getCurrentSong());
        if (currentSong) this._revealSongInList(currentSong);
    }

    stopSong() {
        this._revealCurrentSong();
        this.audio.stop();
        this.updateControls(false);
        this.dom.songIconContainer.classList.remove('playing');
        this.songList.render();
    }

    restartSong() {
        const currentSongId = this.game.getCurrentSong();
        if (currentSongId !== null) {
            this.audio.restart();
            this.updateControls(true);
            this.dom.songIconContainer.classList.add('playing');
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
        this.dom.songIconContainer.classList.remove('playing');

        // La canción que terminó ya no debe ocultarse en la lista
        this._revealCurrentSong();

        // Handle continuous PREVIEW mode
        if (this.game.isContinuousMode() && !this.game.isGameStarted()) {
            this.playRandomContinuousSong();
            return; // End execution here for this case
        }

        // Handle song ending during the game
        if (this.game.isGameStarted()) {
            if (this.game.allSongsPlayed(this.songs) && !this.game.isBingoCompleted()) {
                // All songs have been played, trigger BINGO automatically
                this.game.completeBingo();
                setTimeout(() => {
                    this.sounds.play(SOUND.COMPLETE);
                    this.dom.celebrationOverlay.classList.remove('hidden');
                }, CELEBRATION_DELAY_MS);
            }
        }

        // Default behavior: update controls to show song has stopped
        this.updateControls(false);
    }

    playRandomContinuousSong() {
        setTimeout(() => {
            const randomSong = this.game.getRandomSong(this.songs);
            if (randomSong) {
                this.playSong(randomSong.id);
            } else {
                // No songs to play, turn off the mode
                this.toggleContinuousMode();
            }
        }, CONTINUOUS_NEXT_SONG_DELAY_MS);
    }

    addToHistory(song) {
        const iconRevealTime = this.game.getIconRevealTime();
        const gameStarted = this.game.isGameStarted();
        const historyItem = this.ui.addToHistory(song, iconRevealTime, gameStarted);

        // Agregar evento click para reproducir
        historyItem.addEventListener('click', () => {
            this.sounds.play(SOUND.CLICK);
            this.playSong(song.id);
        });
    }

    async reiniciarJuego() {
        this.sounds.play(SOUND.CLICK);

        const confirmed = await this.modal.showConfirm(MSG.game.confirmRestart);

        if (confirmed) {
            this.game.resetGame();
            this.songs = this.songManager.resetPlayedStatus(this.songs);

            // Ninguna canción debe quedar oculta tras el reinicio
            this._clearListRevealTimers();
            this.songs.forEach(song => this._revealSongInList(song));

            this.dom.historyGrid.innerHTML = '';
            this.refreshUI();
            this.stopSong();

            // resetGame ya desactiva el modo continuo: reflejarlo en el botón
            this._renderContinuousModeButton(this.game.isContinuousMode());

            this.dom.currentIconImg.alt = TEXT.player.currentSongAlt;
            this.dom.currentIconImg.src = LOGO_PATH;

            // Restaurar opacidad de título e icono del reproductor
            this.ui.clearPlayerRevealTimers();
            this.dom.songTitleElement.style.opacity = '1';
            this.dom.currentIconImg.style.opacity = '1';
        }
    }

    // ============================================================
    // GENERACIÓN DE CARTONES
    // ============================================================

    openCartonOptionsModal() {
        const existingCount = this.game.getCartonesCount();

        // Mostrar información de cartones existentes
        if (existingCount > 0) {
            this.dom.existingCartonesInfo.textContent = TEXT.cartones.optionsInfo(existingCount);
            this.dom.printExistingCartonesBtn.disabled = false;
            this.dom.deleteAllCartonesBtn.disabled = false;
        } else {
            this.dom.existingCartonesInfo.textContent = TEXT.cartones.noneInfo;
            this.dom.printExistingCartonesBtn.disabled = true;
            this.dom.deleteAllCartonesBtn.disabled = true;
        }

        this._openModal(this.dom.cartonOptionsModal);
    }

    /**
     * Pasa del modal de opciones al de generación (solo pide la cantidad)
     * @param {'new'|'add'} mode - Crear cartones nuevos o añadir a los existentes
     */
    _startCartonGeneration(mode) {
        this.cartonMode = mode;
        this._closeModal(this.dom.cartonOptionsModal);
        this._openModal(this.dom.cartonModal);
    }

    handlePrintExistingCartones() {
        if (this.game.getCartonesCount() === 0) {
            this.modal.showAlert(MSG.cartones.noneToPrint);
            return;
        }

        this._closeModal(this.dom.cartonOptionsModal);

        // Abrir modal de impresión con personalización
        this.openPrintModal();
    }

    async handleDeleteAllCartones() {
        const existingCount = this.game.getCartonesCount();

        if (existingCount === 0) {
            this.modal.showAlert(MSG.cartones.noneToDelete);
            return;
        }

        const confirmed = await this.modal.showConfirm(MSG.cartones.confirmDelete(existingCount));

        if (confirmed) {
            this.game.clearCartones();
            this.sounds.play(SOUND.CLICK);
            this.updateUIState();
            this._closeModal(this.dom.cartonOptionsModal);
            this.modal.showAlert(MSG.cartones.deleted);
        }
    }

    async generateCartones() {
        const mode = this.cartonMode || CARTON_MODE.NEW;
        const existingCartones = mode === CARTON_MODE.ADD ? this.game.getCartones() : [];

        const result = await this.carton.generateCartones(
            this.songs,
            MAX_CARTONS_GENERATED,
            MIN_SONGS_REQUIRED,
            (alert) => this.modal.showAlert(alert),
            existingCartones
        );

        if (result.success) {
            const count = result.cartones.length;

            // Guardar o añadir cartones según el modo
            if (mode === CARTON_MODE.NEW) {
                this.game.setCartones(result.cartones);
                this.modal.showAlert(MSG.cartones.generated(count));
            } else if (mode === CARTON_MODE.ADD) {
                this.game.addCartones(result.cartones);
                this.modal.showAlert(MSG.cartones.added(count, this.game.getCartonesCount()));
            }

            this.updateUIState();
            this._closeModal(this.dom.cartonModal);
            this.cartonMode = null;
        }
    }

    openPrintModal() {
        const count = this.game.getCartonesCount();

        // Actualizar información
        this.dom.printCartonesInfo.textContent = TEXT.cartones.printInfo(count);

        // Configurar valores de rango
        this.dom.rangeFromInput.max = count;
        this.dom.rangeToInput.max = count;
        this.dom.rangeToInput.value = count;

        // Resetear a "todos"
        this.dom.printRangeRadios[0].checked = true;
        this.dom.rangeInputsContainer.style.display = 'none';

        // Generar vista previa inicial
        this.updatePrintPreview();

        this._openModal(this.dom.printModal);
    }

    async printCartones(format = PRINT_FORMAT.HTML) {
        const gameName = this.game.getGameName() || DEFAULT_GAME_NAME;

        this.sounds.play(SOUND.START);

        const result = await this.carton.printCartonesWithConfig(this.game.getCartones(), gameName, format);

        if (result.success) {
            this.sounds.play(SOUND.WIN);
            this.modal.showAlert(MSG.cartones.printed(result.count, format));
            this._closeModal(this.dom.printModal);
        } else {
            this.modal.showAlert(MSG.cartones.printFailed(result.error));
        }
    }

    updatePrintPreview() {
        const gameName = this.game.getGameName() || DEFAULT_GAME_NAME;
        this.carton.updatePrintPreview(this.songs, gameName);
    }
}

// Inicializar la aplicación cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new BingoMusical());
} else {
    new BingoMusical();
}