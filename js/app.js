// Bingo Musical Application
import {BingoCartonGenerator} from "./bingoCartonGenerator.js";
import {DOMElements} from "./modules/DOMElements.js";
import {AudioManager} from "./modules/AudioManager.js";
import {StorageManager} from "./modules/StorageManager.js";
import {IconManager} from "./modules/IconManager.js";
import {SongManager} from "./modules/SongManager.js";
import {GameManager} from "./modules/GameManager.js";
import {UIManager} from "./modules/UIManager.js";
import {ModalManager} from "./modules/ModalManager.js";
import {SettingsManager} from "./modules/SettingsManager.js";
import {CartonManager} from "./modules/CartonManager.js";

export const MIN_SONGS_REQUIRED = 24;

class BingoMusical {
    static SRC_LOGO_PNG = 'icon.png';
    static MAX_CARTONS_GENERATED = 1500;

    constructor() {
        this.songs = [];
        this.continuousMode = false;
        
        this.cartonGenerator = new BingoCartonGenerator();
        this.songsFolder = 'canciones/';
        this.dom = new DOMElements();
        this.audio = new AudioManager(this.dom);
        this.storage = new StorageManager();
        this.icons = new IconManager(this.dom, this.audio, () => this.songs);
        this.songManager = new SongManager();
        this.game = new GameManager();
        this.ui = new UIManager(this.dom, MIN_SONGS_REQUIRED);
        this.modal = new ModalManager(this.dom, this.audio);
        this.settings = new SettingsManager(this.dom, this.audio, this.storage);
        this.carton = new CartonManager(this.dom, this.audio, this.cartonGenerator);
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.settings.loadThemePreference();
        this.setupDebouncing();
        this.renderSongsList();
        this.updateCounters();
        this.updateControls(false);
    }

    setupDebouncing() {
        let debounceTimer;
        this.debouncedFilterAndSort = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => this.filterAndSortSongs(), 300);
        };
    }

    _setupPlayerEventListeners() {
        this.dom.playBtn.addEventListener('click', () => this.playRandomSong());
        this.dom.pauseBtn.addEventListener('click', () => this.pauseSong());
        this.dom.stopBtn.addEventListener('click', () => this.stopSong());

        // Evento cuando termina una canción
        this.dom.audioPlayer.addEventListener('ended', () => this.onSongEnded());

        // Clic en barra de progreso
        this.dom.progressBar.addEventListener('click', (e) => this.audio.seekTo(e));
    }

    _setupSongManagementEventListeners() {
        this.dom.addSongsInput.addEventListener('change', (e) => this.addSongs(e));
        this.dom.clearHistoryBtn.addEventListener('click', () => this.reiniciarJuego());
        this.dom.shuffleAllBtn.addEventListener('click', () => this.toggleContinuousMode());
        
        // Event listeners para búsqueda y filtrado con debouncing
        this.dom.searchInput.addEventListener('input', () => this.debouncedFilterAndSort());
        this.dom.filterStatus.addEventListener('change', () => this.filterAndSortSongs());
        this.dom.sortOrder.addEventListener('change', () => this.filterAndSortSongs());
        
        // Event listener para eliminar todas las canciones
        this.dom.deleteAllBtn.addEventListener('click', () => this.deleteAllSongs());
    }

    _setupCartonEventListeners() {
        this.dom.generateCartonesBtn.addEventListener('click', () => this.openCartonModal());
        this.dom.closeCartonModalBtn.addEventListener('click', () => this.closeCartonModal());
        this.dom.generateHtmlCartonesBtn.addEventListener('click', () => this.generateCartones('html'));
        this.dom.generatePdfCartonesBtn.addEventListener('click', () => this.generateCartones('pdf'));
        this.dom.previewCartonBtn.addEventListener('click', () => this.updateCartonPreview());
        
        // Actualizar preview al cambiar configuración
        this.dom.cartonPrimaryColorInput.addEventListener('input', (e) => {
            document.querySelector('.color-preview').style.backgroundColor = e.target.value;
            this.updateCartonPreview();
        });
        this.dom.cartonSecondaryColorInput.addEventListener('input', (e) => {
            document.querySelectorAll('.color-preview')[1].style.backgroundColor = e.target.value;
            this.updateCartonPreview();
        });

        this.dom.cartonModal.addEventListener('click', (e) => {
            if (e.target.id === 'carton-modal') {
                this.closeCartonModal();
            }
        });
    }

    // ============================================================
    // CONFIGURACIÓN DE EVENT LISTENERS
    // ============================================================

    setupEventListeners() {
        this._setupPlayerEventListeners();
        this._setupSongManagementEventListeners();
        this._setupCartonEventListeners();
        this._setupModalEventListeners();
        this._setupCelebrationEventListeners();
        this._setupFullscreenEventListeners();
        this._setupKeyboardShortcuts();

        this.dom.exportListBtn.addEventListener('click', () => this.exportPlaylist());
        this.dom.importListBtn.addEventListener('click', () => this.dom.importFileInput.click());
        this.dom.importFileInput.addEventListener('change', (e) => this.importPlaylist(e));
        this.dom.lineaBtn.addEventListener('click', () => this.triggerLinea());
        this.dom.bingoBtn.addEventListener('click', () => this.triggerBingo());
        this.dom.fullscreenBtn.addEventListener('click', () => this.settings.toggleFullscreen());
        this.dom.shortcutsHelpBtn.addEventListener('click', () => this.showKeyboardShortcutsHelp());
        this.dom.themeToggleBtn.addEventListener('click', () => this.settings.toggleTheme());
    }



    _setupModalEventListeners() {
        this.dom.confirmCancelBtn.addEventListener('click', () => this.closeConfirmModal(false));
        this.dom.confirmAcceptBtn.addEventListener('click', () => this.closeConfirmModal(true));
        this.dom.alertOkBtn.addEventListener('click', () => this.closeAlertModal());
    }

    _setupCelebrationEventListeners() {
        this.dom.continueLineaBtn.addEventListener('click', () => {
            this.dom.lineaOverlay.classList.add('hidden');
        });

        this.dom.restartBtn.addEventListener('click', () => {
            this.reiniciarJuego().then();
            this.dom.celebrationOverlay.classList.add('hidden');
        });
    }

    _setupFullscreenEventListeners() {
        document.addEventListener('fullscreenchange', () => this.settings.onFullscreenChange());
    }

    checkOpenModals() {
        return this.modal.checkOpenModals();
    }

    closeModalsOnEscape() {
        this.modal.closeModalsOnEscape(() => this.icons.closeIconModal());
    }

    playPauseOnSpace() {
        if (this.audio.isPlaying) {
            this.pauseSong();
        } else if (this.game.currentSongIndex !== null) {
            this.pauseSong(); // Esto actúa como resume
        } else if (this.songs.length >= MIN_SONGS_REQUIRED) {
            this.playRandomSong();
        }
    }

    nextSongOnN() {
        if (this.game.isGameStarted()) {
            if (!this.game.bingoCompleted) {
                this.playRandomSong();
            }
        } else {
            this.playRandomContinuousSong();
        }
    }

    _setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ignorar atajos si estamos escribiendo en un input o textarea
            const tagName = e.target.tagName.toLowerCase();
            if (tagName === 'input' || tagName === 'textarea' || e.target.isContentEditable) {
                return;
            }

            // Ignorar si hay un modal abierto (excepto para Escape)
            const hasModalOpen = this.checkOpenModals();
            
            if (hasModalOpen && e.key !== 'Escape') {
                return;
            }

            const key = e.key.toLowerCase();

            switch (key) {
                case ' ': // Espacio → Play/Pause
                    e.preventDefault();
                    this.playPauseOnSpace();
                    break;

                case 'r': // R → Reiniciar canción
                    e.preventDefault();
                    if (this.game.currentSongIndex !== null) {
                        this.stopSong();
                    }
                    break;

                case 'n': // N → Siguiente canción
                    e.preventDefault();
                    this.nextSongOnN();
                    break;

                case 'f': // F → Pantalla completa
                    e.preventDefault();
                    this.settings.toggleFullscreen();
                    break;

                case 'l': // L → Cantar línea
                    e.preventDefault();
                    if (!this.dom.lineaBtn.disabled) {
                        this.triggerLinea().then();
                    }
                    break;

                case 'b': // B → Cantar bingo
                    e.preventDefault();
                    if (!this.dom.bingoBtn.disabled) {
                        this.triggerBingo().then();
                    }
                    break;

                case 'escape': // ESC → Cerrar modales
                    this.closeModalsOnEscape();
                    break;

                case '?': // ? → Mostrar ayuda de atajos
                    e.preventDefault();
                    this.showKeyboardShortcutsHelp();
                    break;
            }
        });
    }

    // ============================================================
    // SISTEMA DE TEMAS
    // ============================================================

    showKeyboardShortcutsHelp() {
        const helpMessage = this.settings.getKeyboardShortcutsHelp();
        this.showAlert(helpMessage, '⌨️ Atajos de Teclado');
    }

    // ============================================================
    // SISTEMA DE MODALES
    // ============================================================

    showAlert(message, title = 'Información') {
        this.modal.showAlert(message, title);
    }

    closeAlertModal() {
        this.modal.closeAlertModal(() => this.renderSongsList());
    }

    showConfirm(message, title = 'Confirmar') {
        return this.modal.showConfirm(message, title);
    }

    closeConfirmModal(result) {
        this.modal.closeConfirmModal(result);
    }

    // ============================================================
    // CONFIGURACIÓN Y DRAG & DROP
    // ============================================================

    setupDragAndDrop() {
        this.settings.setupDragAndDrop(
            () => this.game.isGameStarted(),
            null
        );
    }

    // ============================================================
    // VALIDACIONES Y UTILIDADES
    // ============================================================

    getTotalSongsWithFiles() {
        return this.songManager.getTotalSongsWithFiles(this.songs);
    }

    // ============================================================
    // GESTIÓN DE JUEGO (LÍNEA Y BINGO)
    // ============================================================

    async triggerLinea() {
        // Validar con GameManager
        const validation = this.game.validateMinSongs(this.getTotalSongsWithFiles(), MIN_SONGS_REQUIRED);
        if (!validation.valid) {
            this.showAlert(validation.error, validation.title);
            return;
        }

        const canCall = this.game.canCallLinea();
        if (!canCall.valid) {
            this.showAlert(canCall.error, canCall.title);
            return;
        }

        this.game.completeLinea();
        this.audio.playEffect('win');
        setTimeout(() => this.dom.lineaOverlay.classList.remove('hidden'), 500);
    }

    async triggerBingo() {
        // Validar con GameManager
        const validation = this.game.validateMinSongs(this.getTotalSongsWithFiles(), MIN_SONGS_REQUIRED);
        if (!validation.valid) {
            this.showAlert(validation.error, validation.title);
            return;
        }

        const canCall = this.game.canCallBingo();
        if (!canCall.valid) {
            this.showAlert(canCall.error, canCall.title);
            return;
        }

        this.game.completeBingo();
        this.audio.playEffect('complete');
        setTimeout(() => this.dom.celebrationOverlay.classList.remove('hidden'), 500);
    }

    // ============================================================
    // GESTIÓN DE PLAYLIST (EXPORTAR/IMPORTAR)
    // ============================================================

    exportPlaylist() {
        const result = this.storage.exportPlaylist(this.songs, this.songsFolder);
        
        if (result.success) {
            this.audio.playEffect('click');
            this.showAlert(result.message, 'Exportación Exitosa');
        } else {
            this.showAlert(result.error, 'Error al Exportar');
        }
    }

    async importPlaylist(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (this.game.isGameStarted()) {
            const message = 'No puedes importar una lista una vez que el juego ha iniciado. Debes reiniciar el juego primero.';
            this.showAlert(message, 'Juego Iniciado');
            event.target.value = '';
            return;
        }

        // Usar StorageManager para leer el archivo
        const result = await this.storage.importPlaylist(file);
        
        if (!result.success) {
            this.showAlert(`Error al importar la lista: ${result.error}`, 'Error de Importación');
            event.target.value = '';
            return;
        }

        const playlist = result.playlist;

        // Reset lists for replacement behavior
        this.songs = [];
        this.game.playedSongs = [];
        this.songManager.resetIdCounter();

        const duplicates = [];
        const newSongs = [];
        const titlesAdded = new Set();
        const usedIcons = new Set();

        for (const songData of playlist.songs) {
            const title = songData.title;

            if (titlesAdded.has(title)) {
                duplicates.push(title);
                continue;
            }

            let {icon, iconType = 'emoji'} = songData;

            if (!icon || usedIcons.has(icon)) {
                icon = this.icons.getRandomAvailableIcon(this.songs);
            }

            usedIcons.add(icon);
            titlesAdded.add(title);

            const audioPath = this.songsFolder + title + '.mp3';
            const exists = await fetch(audioPath, {method: 'HEAD'})
                .then(response => response.ok)
                .catch(() => false);

            if (exists) {
                const resp = await fetch(audioPath);
                const blob = await resp.blob();

                newSongs.push({
                    id: this.songManager.getNextId(),
                    title: title,
                    icon,
                    iconType,
                    audioPath,
                    file: blob,
                    played: false
                });
            } else {
                console.warn(`Archivo no encontrado: ${audioPath}`);
            }
        }

        this.songs = newSongs;

        this.renderSongsList();
        this.updateCounters();
        this.updateUIState();

        // Show duplicate warning first, if any
        if (duplicates.length > 0) {
            this.audio.playEffect('error');
            const message = `Se omitieron las siguientes canciones duplicadas:\n\n- ${duplicates.join('\n- ')}`;
            this.showAlert(message, 'Canciones Duplicadas Omitidas');
        }

        // Then, show the main success/error message
        setTimeout(() => {
            let message;
            let messageTitle;
            if (this.songs.length === 0) {
                this.audio.playEffect('error');
                message = `Se han importado 0 canciones.\n\nRevisa que los archivos de audio estén en: ${this.songsFolder}\ny que los nombres coincidan con los títulos.`;
                messageTitle = 'Error al Importar';
            } else {
                this.audio.playEffect('win');
                message = `Lista importada con ${this.songs.length} canciones.\n\nLos archivos de audio deben estar en: ${this.songsFolder}`;
                messageTitle = 'Importación Exitosa';
            }
            this.showAlert(message, messageTitle);
        }, duplicates.length > 0 ? 2000 : 0);
        
        event.target.value = '';
    }

    // ============================================================
    // GESTIÓN DE ICONOS
    // ============================================================

    openIconPicker(songId) {
        if (this.game.isGameStarted()) {
            const message = 'No puedes cambiar iconos una vez que el juego ha iniciado.';
            this.showAlert(message, 'Juego Iniciado');
            return;
        }

        const result = this.icons.openIconPicker(songId, this.songs, () => {
            this.renderSongsList();
        });

        if (!result.success) {
            this.showAlert(result.error, result.title || 'Error');
        }
    }

    // ============================================================
    // GESTIÓN DE CANCIONES
    // ============================================================

    addSongs(event) {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        if (this.game.isGameStarted()) {
            this.showAlert('No puedes agregar canciones una vez que el juego ha iniciado. Debes reiniciar el juego primero.', 'Juego Iniciado');
            event.target.value = '';
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
            this.audio.playEffect('click');
            this.renderSongsList();
            this.updateCounters();
            this.updateUIState();
        }

        if (result.duplicates.length > 0) {
            const message = `Las siguientes canciones ya existen y no se han añadido:\n\n- ${result.duplicates.join('\n- ')}`;
            this.showAlert(message, 'Canciones Duplicadas');
        }

        event.target.value = '';
    }

    deleteSong(songId) {
        if (this.game.isGameStarted()) {
            this.showAlert('No puedes eliminar canciones una vez que el juego ha iniciado. Debes limpiar el historial primero.', 'Juego Iniciado');
        } else {
            this.songs = this.songManager.deleteSong(this.songs, songId);
            this.renderSongsList();
            this.updateCounters();
            this.audio.playEffect('click');
            this.updateUIState();
        }
    }

    // ============================================================
    // RENDERIZADO Y UI
    // ============================================================

    updateUIState() {
        this.ui.updateUIState(
            this.game.isGameStarted(),
            this.continuousMode,
            () => this.toggleContinuousMode()
        );
    }



    setRenderSongIconTitle(song) {
        return this.ui.getSongIconTitle(song, this.game.isGameStarted());
    }

    setRenderSongIconHtml(song) {
        return this.ui.getSongIconHtml(song);
    }

    createSongItemElement(song) {
        const li = document.createElement('li');
        li.className = `song-item ${song.played ? 'played' : ''} ${this.game.getCurrentSong() === song.id ? 'playing' : ''}`;
        li.setAttribute('role', 'listitem');

        const iconTitle = this.setRenderSongIconTitle(song);
        const iconCursor = (song.played || this.game.isGameStarted()) ? 'not-allowed' : 'pointer';
        const iconHtml = this.setRenderSongIconHtml(song);
        const iconDisabled = (song.played || this.game.isGameStarted()) ? 'disabled' : '';

        let songStateLabel = this.ui.getSongStateLabel(song);

        // Usar template fragment para mejor rendimiento
        document.createDocumentFragment();
        
        const iconBtn = document.createElement('button');
        iconBtn.type = 'button';
        iconBtn.className = 'song-item-icon';
        iconBtn.dataset.songId = song.id;
        iconBtn.title = iconTitle;
        iconBtn.style.cursor = iconCursor;
        iconBtn.setAttribute('aria-label', `Cambiar icono de ${song.title}`);
        if (iconDisabled) iconBtn.disabled = true;
        iconBtn.innerHTML = iconHtml;
        
        const infoDiv = document.createElement('div');
        infoDiv.className = 'song-item-info';
        infoDiv.innerHTML = `
            <strong class="song-item-title">${song.title}</strong>
            <div class="song-item-status" role="status" aria-live="polite">${songStateLabel}</div>
        `;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'song-item-delete';
        deleteBtn.title = 'Eliminar canción';
        deleteBtn.setAttribute('aria-label', `Eliminar ${song.title}`);
        deleteBtn.innerHTML = '<span aria-hidden="true">❌</span>';

        // Delegación de eventos optimizada
        iconBtn.onclick = (e) => {
            e.stopPropagation();
            if (!song.played && !this.game.isGameStarted()) {
                this.openIconPicker(song.id);
            } else if (this.game.isGameStarted()) {
                this.showAlert('No puedes cambiar iconos una vez que el juego ha iniciado.', 'Juego Iniciado');
            } else {
                this.showAlert('No puedes cambiar el icono de una canción que ya fue reproducida.', 'Canción Ya Reproducida');
            }
        };

        li.onclick = () => {
            if (song.file && !this.game.isGameStarted()) {
                this.audio.playEffect('click');
                this.playSong(song.id);
            }
        };

        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            this.deleteSong(song.id);
        };

        li.appendChild(iconBtn);
        li.appendChild(infoDiv);
        li.appendChild(deleteBtn);

        return li;
    }

    renderSongsList() {
        this.ui.renderSongsList(
            this.songs,
            this.getTotalSongsWithFiles(),
            (song) => this.createSongItemElement(song)
        );
    }

    filterAndSortSongs() {
        // Usar SongManager para filtrar y ordenar
        const filters = {
            searchTerm: this.dom.searchInput.value,
            filterStatus: this.dom.filterStatus.value,
            sortOrder: this.dom.sortOrder.value
        };

        const filteredSongs = this.songManager.filterAndSort(this.songs, filters);
        this.renderFilteredSongsList(filteredSongs);
    }

    renderFilteredSongsList(songsToShow) {
        this.ui.renderFilteredSongsList(
            songsToShow,
            this.getTotalSongsWithFiles(),
            (song) => this.createSongItemElement(song)
        );
    }

    updateCounters() {
        const history = this.game.getHistory();
        this.ui.updateCounters(history.length, this.getTotalSongsWithFiles());
    }

    // Gestión de playlist
    // ============================================================
    // GESTIÓN DE PLAYLIST (ELIMINACIÓN)
    // ============================================================

    async deleteAllSongs() {
        if (this.game.isGameStarted()) {
            this.showAlert('No puedes eliminar canciones una vez iniciado el juego.', 'Juego Iniciado');
            return;
        }
        
        if (this.songs.length === 0) {
            this.showAlert('No hay canciones para eliminar.', 'Lista Vacía');
            return;
        }
        
        const confirmed = await this.showConfirm(
            `¿Estás seguro de eliminar TODAS las ${this.songs.length} canciones de la lista?`,
            'Confirmar Eliminación Total'
        );
        
        if (confirmed) {
            this.songs = this.songManager.deleteAllSongs();
            this.audio.playEffect('click');
            this.filterAndSortSongs();
            this.updateCounters();
            this.updateUIState();
            this.showAlert('Todas las canciones han sido eliminadas.', 'Lista Vacía');
        }
    }

    toggleContinuousMode() {
        this.continuousMode = this.game.toggleContinuousMode();
        const btn = this.dom.shuffleAllBtn;

        if (this.continuousMode) {
            btn.innerHTML = '<span aria-hidden="true">⏸</span> Detener Modo Continuo';
            btn.style.background = 'var(--danger-color)';
            btn.setAttribute('aria-pressed', 'true');
            this.audio.playEffect('start');
        } else {
            btn.innerHTML = '<span aria-hidden="true">🔄</span> Modo Continuo';
            btn.style.background = 'var(--text-muted)';
            btn.setAttribute('aria-pressed', 'false');
        }
    }

    // ============================================================
    // REPRODUCCIÓN Y CONTROL DE AUDIO
    // ============================================================

    playRandomSong() {
        // Validar con GameManager
        const validation = this.game.validateMinSongs(this.getTotalSongsWithFiles(), MIN_SONGS_REQUIRED);
        if (!validation.valid) {
            this.showAlert(validation.error, validation.title);
            return;
        }

        // Iniciar juego si no ha comenzado
        if (!this.game.isGameStarted()) {
            this.game.startGame();
            this.updateUIState();
        }

        // Obtener canción aleatoria no reproducida
        const randomSong = this.game.getRandomUnplayedSong(this.songs);
        
        if (!randomSong) {
            this.showAlert('No hay más canciones disponibles. Limpia el historial para volver a empezar', 'Sin Canciones');
            return;
        }

        if (this.game.onlyOneSongLeft(this.songs)) {
            this.dom.playBtn.disabled = true;
        }

        this.playSong(randomSong.id);
    }

    playSong(songId) {
        const song = this.songs.find(s => s.id === songId);
        if (!song?.file) {
            this.showAlert('Esta canción no tiene archivo de audio.', 'Sin Archivo');
            return;
        }

        // Usar AudioManager para reproducir
        this.audio.play(song.file, () => {
            this.game.setCurrentSong(songId);
            this.updatePlayerUI(song);
            this.updateControls(true);

            // Marcar como reproducida usando GameManager
            if (this.game.markSongAsPlayed(song)) {
                this.addToHistory(song);
                this.updateCounters();
                this.audio.playEffect('win');
            }

            // Always re-render the list to show the current playing song
            this.renderSongsList();
        });
    }

    pauseSong() {
        const isNowPlaying = this.audio.pause();
        this.updateControls(isNowPlaying);
    }

    stopSong() {
        this.audio.stop();
        this.updateControls(false);
        this.dom.songIconContainer.classList.remove('playing');
        this.renderSongsList();
    }

    updatePlayerUI(song) {
        this.ui.updatePlayerUI(song);
    }

    updateControls(playing) {
        this.ui.updateControls(playing, this.game.currentSongIndex, this.game.isGameStarted());
    }

    onSongEnded() {
        this.audio.isPlaying = false;
        this.dom.songIconContainer.classList.remove('playing');

        // Handle continuous PREVIEW mode
        if (this.continuousMode && !this.game.isGameStarted()) {
            this.playRandomContinuousSong();
            return; // End execution here for this case
        }

        // Handle song ending during the game
        if (this.game.isGameStarted()) {
            if (this.game.allSongsPlayed(this.songs) && !this.game.bingoCompleted) {
                // All songs have been played, trigger BINGO automatically
                this.game.completeBingo();
                setTimeout(() => {
                    this.audio.playEffect('complete');
                    this.dom.celebrationOverlay.classList.remove('hidden');
                }, 500);
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
        }, 1000);
    }

    addToHistory(song) {
        const historyItem = this.ui.addToHistory(song);
        
        // Agregar evento click para reproducir
        historyItem.addEventListener('click', () => {
            this.audio.playEffect('click');
            this.playSong(song.id);
        });
    }

    async reiniciarJuego() {
        this.audio.playEffect('click');

        const confirmed = await this.showConfirm(
            '¿Estás seguro de que quieres reiniciar el juego? Esto limpiará el historial y el progreso actual.',
            'Confirmar Reinicio'
        );

        if (confirmed) {
            this.game.resetGame();
            this.songs = this.songManager.resetPlayedStatus(this.songs);
            this.dom.historyGrid.innerHTML = '';
            this.renderSongsList();
            this.updateCounters();
            this.updateUIState();
            this.stopSong();

            if (this.continuousMode) {
                this.toggleContinuousMode();
            }
            
            this.dom.currentIconImg.alt = 'Canción actual';
            this.dom.currentIconImg.src = BingoMusical.SRC_LOGO_PNG;
        }
    }

    // ============================================================
    // GENERACIÓN DE CARTONES
    // ============================================================

    openCartonModal() {
        this.modal.openCartonModal(
            this.getTotalSongsWithFiles(),
            MIN_SONGS_REQUIRED,
            () => this.carton.updateCartonPreview(this.songs)
        );
    }

    closeCartonModal() {
        this.modal.closeCartonModal();
    }

    async generateCartones(format = 'html') {
        const success = await this.carton.generateCartones(
            this.songs,
            BingoMusical.MAX_CARTONS_GENERATED,
            MIN_SONGS_REQUIRED,
            (message, title) => this.showAlert(message, title),
            format
        );
        
        if (success) {
            this.closeCartonModal();
        }
    }
    
    updateCartonPreview() {
        this.carton.updateCartonPreview(this.songs);
    }
}

// Inicializar la aplicación cuando el DOM esté listo
let app;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app = new BingoMusical();
    });
} else {
    app = new BingoMusical();
}