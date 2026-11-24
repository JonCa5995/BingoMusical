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
import {
    MIN_SONGS_REQUIRED,
    MAX_CARTONS_GENERATED,
    DEFAULT_SONGS_FOLDER,
    LOGO_PATH,
    DEFAULT_GAME_NAME
} from "./constants.js";

class BingoMusical {
    constructor() {
        this.songs = [];
        this.continuousMode = false;
        this.listRevealTimers = [];

        this.cartonGenerator = new BingoCartonGenerator();
        this.songsFolder = DEFAULT_SONGS_FOLDER;
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
        this.dom.stopBtn.addEventListener('click', () => this.restartSong());

        // Evento cuando termina una canción
        this.dom.audioPlayer.addEventListener('ended', () => this.onSongEnded());

        // Si el navegador rechaza la reproducción, reflejar en los controles que no suena
        this.dom.audioPlayer.addEventListener('playbackfailed', () => this.updateControls(false));

        // Clic en barra de progreso
        this.dom.progressBar.addEventListener('click', (e) => this.audio.seekTo(e));
    }

    _setupSongManagementEventListeners() {
        // Interceptar click en el label para verificar cartones antes de abrir selector
        this.dom.addSongsLabel.addEventListener('click', async (e) => {
            if (this.game.getCartonesCount() > 0) {
                e.preventDefault();
                if (await this.confirmAndClearCartones('añadir canciones')) {
                    this.dom.addSongsInput.click();
                }
            }
        });

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
        this.dom.generateCartonesBtn.addEventListener('click', () => this.openCartonOptionsModal());

        // Modal de opciones
        this.dom.closeCartonOptionsModalBtn.addEventListener('click', () => this.closeCartonOptionsModal());
        this.dom.createNewCartonesBtn.addEventListener('click', () => this.handleCreateNewCartones());
        this.dom.addCartonesBtn.addEventListener('click', () => this.handleAddCartones());
        this.dom.printExistingCartonesBtn.addEventListener('click', () => this.handlePrintExistingCartones());
        this.dom.deleteAllCartonesBtn.addEventListener('click', () => this.handleDeleteAllCartones());

        // Cerrar modales al hacer click fuera
        this.modal.setupOutsideClickClose(this.dom.cartonOptionsModal, () => this.closeCartonOptionsModal());

        // Modal de generación (simplificado - solo cantidad)
        this.dom.closeCartonModalBtn.addEventListener('click', () => this.closeCartonModal());
        this.dom.generateSaveCartonesBtn.addEventListener('click', () => this.generateCartones());

        this.modal.setupOutsideClickClose(this.dom.cartonModal, () => this.closeCartonModal());

        // Modal de impresión (con personalización)
        this.dom.closePrintModalBtn.addEventListener('click', () => this.closePrintModal());
        this.dom.printHtmlBtn.addEventListener('click', () => this.printCartones('html'));
        this.dom.printPdfBtn.addEventListener('click', () => this.printCartones('pdf'));
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

        this.modal.setupOutsideClickClose(this.dom.printModal, () => this.closePrintModal());
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
        this._setupFullscreenEventListeners();
        this._setupKeyboardShortcuts();
        this._setupGameNameEventListeners();

        this.dom.exportListBtn.addEventListener('click', () => this.exportPlaylist());
        this.dom.importListBtn.addEventListener('click', () => this.dom.importFileInput.click());
        this.dom.importFileInput.addEventListener('change', (e) => this.importPlaylist(e));
        this.dom.lineaBtn.addEventListener('click', () => this.triggerLinea());
        this.dom.bingoBtn.addEventListener('click', () => this.triggerBingo());
        this.dom.fullscreenBtn.addEventListener('click', () => this.settings.toggleFullscreen());
        this.dom.shortcutsHelpBtn.addEventListener('click', () => this.showKeyboardShortcutsHelp());
        this.dom.themeToggleBtn.addEventListener('click', () => this.settings.toggleTheme());
    }

    _setupGameNameEventListeners() {
        // Actualizar el nombre del juego cuando cambia el input
        this.dom.gameNameInput.addEventListener('input', (e) => {
            this.game.setGameName(e.target.value.trim());
        });

        // Validar al hacer blur
        this.dom.gameNameInput.addEventListener('blur', (e) => {
            const name = e.target.value.trim();
            if (name.length > 50) {
                this.showAlert('El nombre del juego no puede tener más de 50 caracteres.', 'Nombre muy largo');
                e.target.value = name.substring(0, 50);
                this.game.setGameName(e.target.value);
            }
        });
    }

    _setupConfigEventListeners() {
        this.dom.configBtn.addEventListener('click', () => this.openConfigModal());
        this.dom.closeConfigModalBtn.addEventListener('click', () => this.closeConfigModal());
        this.dom.saveConfigBtn.addEventListener('click', () => this.saveConfig());
        
        // Actualizar valores en tiempo real
        this.dom.titleRevealTimeSlider.addEventListener('input', (e) => {
            this.dom.titleRevealValueSpan.textContent = `${e.target.value} segundos`;
        });
        
        this.dom.iconRevealTimeSlider.addEventListener('input', (e) => {
            this.dom.iconRevealValueSpan.textContent = `${e.target.value} segundos`;
        });

        // Cerrar modal al hacer clic fuera
        this.modal.setupOutsideClickClose(this.dom.configModal, () => this.closeConfigModal());
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
                        this.restartSong();
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
        // Las acciones que cambian canciones ya repintan la lista; cerrar una alerta no cambia nada
        this.modal.closeAlertModal();
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

    /**
     * Verifica si el juego ha iniciado y muestra alerta si es así
     * @param {string} errorMessage - Mensaje de error a mostrar
     * @returns {boolean} - true si el juego NO ha iniciado (se puede continuar), false si ha iniciado
     */
    checkGameNotStarted(errorMessage) {
        if (this.game.isGameStarted()) {
            this.showAlert(errorMessage, 'Juego Iniciado');
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
            const confirmed = await this.showConfirm(
                `Tienes ${cartonesCount} cartón(es) generado(s). Al ${action}, se borrarán TODOS los cartones.\n\n¿Deseas continuar?`,
                'Cartones Existentes'
            );

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
        this.renderSongsList();
        this.updateCounters();
        this.updateUIState();
    }

    // ============================================================
    // GESTIÓN DE JUEGO (LÍNEA Y BINGO)
    // ============================================================

    async triggerLinea() {
        // Validar con SongManager
        const validation = this.songManager.validateMinSongs(this.songs, MIN_SONGS_REQUIRED);
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
        // Validar con SongManager
        const validation = this.songManager.validateMinSongs(this.songs, MIN_SONGS_REQUIRED);
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
    // GESTIÓN DE CONFIGURACIÓN
    // ============================================================

    openConfigModal() {
        if (!this.checkGameNotStarted('No puedes cambiar la configuración una vez que el juego ha iniciado.')) {
            return;
        }
        
        this.audio.playEffect('click');
        this.modal.openModal(this.dom.configModal);
    }

    closeConfigModal() {
        this.audio.playEffect('click');
        this.modal.closeModal(this.dom.configModal);
    }

    saveConfig() {
        const titleRevealTime = Number.parseInt(this.dom.titleRevealTimeSlider.value);
        const iconRevealTime = Number.parseInt(this.dom.iconRevealTimeSlider.value);

        this.game.setTitleRevealTime(titleRevealTime);
        this.game.setIconRevealTime(iconRevealTime);
        
        this.audio.playEffect('win');
        this.showAlert(
            `Configuración guardada:\n\n` +
            `• Tiempo para revelar título: ${titleRevealTime} segundos\n` +
            `• Tiempo para revelar icono: ${iconRevealTime} segundos`,
            'Configuración Guardada'
        );
        this.closeConfigModal();
    }

    // ============================================================
    // GESTIÓN DE PLAYLIST (EXPORTAR/IMPORTAR)
    // ============================================================

    exportPlaylist() {
        const gameName = this.game.getGameName() || 'Bingo Musical';
        const cartones = this.game.getCartones();
        const result = this.storage.exportPlaylist(this.songs, this.songsFolder, gameName, cartones);

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

        if (!this.checkGameNotStarted('No puedes importar una lista una vez que el juego ha iniciado. Debes reiniciar el juego primero.')) {
            this.clearFileInput(event);
            return;
        }

        // Usar StorageManager para leer el archivo
        const result = await this.storage.importPlaylist(file);
        
        if (!result.success) {
            this.showAlert(`Error al importar la lista: ${result.error}`, 'Error de Importación');
            this.clearFileInput(event);
            return;
        }

        const playlist = result.playlist;

        // Reset lists for replacement behavior
        this.songs = [];
        this.game.playedSongs = [];
        this.songManager.resetIdCounter();

        const duplicates = [];
        const candidates = [];
        const titlesAdded = new Set();
        const usedIcons = new Set();
        const usedIds = new Set();

        // 1) Preparar los datos de cada canción (síncrono)
        for (const songData of playlist.songs) {
            const title = songData.title;

            if (titlesAdded.has(title)) {
                duplicates.push(title);
                continue;
            }

            let {icon, iconType = 'emoji'} = songData;

            if (!icon || usedIcons.has(icon)) {
                // this.songs está vacío durante la importación: excluir los iconos ya asignados
                const assigned = [...usedIcons].map(usedIcon => ({icon: usedIcon, iconType: 'emoji'}));
                icon = this.icons.getRandomAvailableIcon(assigned);
                iconType = 'emoji';
            }

            usedIcons.add(icon);
            titlesAdded.add(title);

            // Conservar el ID original para que los cartones importados
            // sigan apuntando a la misma canción
            const hasValidId = Number.isInteger(songData.id) && !usedIds.has(songData.id);
            const id = hasValidId ? songData.id : null;
            if (hasValidId) usedIds.add(id);

            candidates.push({id, title, icon, iconType, audioPath: this.songsFolder + title + '.mp3'});
        }

        // 2) Descargar todos los audios en paralelo, con una sola petición por canción
        const loaded = await Promise.all(candidates.map(async candidate => {
            try {
                const url = this.songsFolder + encodeURIComponent(candidate.title) + '.mp3';
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return {...candidate, file: await response.blob(), played: false};
            } catch {
                console.warn(`Archivo no encontrado: ${candidate.audioPath}`);
                return null;
            }
        }));
        const newSongs = loaded.filter(Boolean);

        // Asignar IDs nuevos solo a las canciones sin ID válido, sin colisionar con los conservados
        this.songManager.assignMissingIds(newSongs);
        this.songs = newSongs;

        // Cargar el nombre del juego desde el playlist
        const gameName = playlist.name || '';
        this.game.setGameName(gameName);
        this.dom.gameNameInput.value = gameName;

        // Cargar cartones del playlist (o limpiar los anteriores, que apuntan a canciones ya descartadas)
        if (Array.isArray(playlist.cartones) && playlist.cartones.length > 0) {
            // Reconstruir cartones con referencias a las canciones actuales
            const reconstructedCartones = this.carton.reconstructCartones(playlist.cartones, this.songs);
            this.game.setCartones(reconstructedCartones);
        } else {
            this.game.clearCartones();
        }

        this.refreshUI();

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
        
        this.clearFileInput(event);
    }

    // ============================================================
    // GESTIÓN DE ICONOS
    // ============================================================

    async openIconPicker(songId) {
        if (!this.checkGameNotStarted('No puedes cambiar iconos una vez que el juego ha iniciado.')) {
            return;
        }

        if (!await this.confirmAndClearCartones('cambiar el icono')) {
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

    async addSongs(event) {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        if (!this.checkGameNotStarted('No puedes agregar canciones una vez que el juego ha iniciado. Debes reiniciar el juego primero.')) {
            this.clearFileInput(event);
            return;
        }

        // Verificar si existen cartones (para drag & drop)
        if (!await this.confirmAndClearCartones('añadir canciones')) {
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
            this.audio.playEffect('click');
            this.refreshUI();
        }

        if (result.duplicates.length > 0) {
            const message = `Las siguientes canciones ya existen y no se han añadido:\n\n- ${result.duplicates.join('\n- ')}`;
            this.showAlert(message, 'Canciones Duplicadas');
        }

        this.clearFileInput(event);
    }

    async deleteSong(songId) {
        if (!this.checkGameNotStarted('No puedes eliminar canciones una vez que el juego ha iniciado. Debes limpiar el historial primero.')) {
            return;
        }

        if (!await this.confirmAndClearCartones('eliminar esta canción')) {
            return;
        }

        this.songs = this.songManager.deleteSong(this.songs, songId);
        this.audio.playEffect('click');
        this.refreshUI();
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

        // Deshabilitar el input del nombre si el juego ha iniciado o se generaron cartones
        const shouldDisableGameName = this.game.isGameStarted() || this.game.hasCartonesGenerated();
        this.dom.gameNameInput.disabled = shouldDisableGameName;

        if (shouldDisableGameName && !this.dom.gameNameInput.title.includes('bloqueado')) {
            this.dom.gameNameInput.title = 'Nombre del juego bloqueado (juego iniciado o cartones generados)';
        } else if (!shouldDisableGameName) {
            this.dom.gameNameInput.title = 'Edita el nombre del juego (máx. 50 caracteres)';
        }
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
        
        // Si es la canción actualmente reproduciéndose y el juego ha iniciado, ocultar el icono hasta revelarlo
        if (this.game.getCurrentSong() === song.id && this.game.isGameStarted() && song.hideIcon) {
            iconBtn.style.opacity = '0';
        }
        
        const infoDiv = document.createElement('div');
        infoDiv.className = 'song-item-info';
        
        const titleStrong = document.createElement('strong');
        titleStrong.className = 'song-item-title';
        titleStrong.dataset.songId = song.id;
        titleStrong.textContent = song.title;
        
        // Si es la canción actualmente reproduciéndose y el juego ha iniciado, ocultar el título hasta revelarlo
        if (this.game.getCurrentSong() === song.id && this.game.isGameStarted() && song.hideTitle) {
            titleStrong.style.opacity = '0';
        }
        
        const statusDiv = document.createElement('div');
        statusDiv.className = 'song-item-status';
        statusDiv.setAttribute('role', 'status');
        statusDiv.setAttribute('aria-live', 'polite');
        statusDiv.textContent = songStateLabel;
        
        infoDiv.appendChild(titleStrong);
        infoDiv.appendChild(statusDiv);
        
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'song-item-delete';
        deleteBtn.title = 'Eliminar canción';
        deleteBtn.setAttribute('aria-label', `Eliminar ${song.title}`);
        deleteBtn.innerHTML = '<span aria-hidden="true">❌</span>';

        // Delegación de eventos optimizada
        iconBtn.onclick = (e) => {
            e.stopPropagation();
            if (song.played) {
                this.showAlert('No puedes cambiar el icono de una canción que ya fue reproducida.', 'Canción Ya Reproducida');
            } else {
                this.openIconPicker(song.id);
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
        // Verificar si hay filtros activos
        const hasSearchTerm = this.dom.searchInput.value.trim() !== '';
        const hasFilterStatus = this.dom.filterStatus.value !== 'all';
        const hasSortOrder = this.dom.sortOrder.value !== 'default';
        
        // Si hay filtros activos, usar filterAndSortSongs en lugar de renderizar todo
        if (hasSearchTerm || hasFilterStatus || hasSortOrder) {
            this.filterAndSortSongs();
        } else {
            // Si no hay filtros, renderizar toda la lista
            this.ui.renderSongsList(
                this.songs,
                this.getTotalSongsWithFiles(),
                (song) => this.createSongItemElement(song)
            );
        }
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
        if (!this.checkGameNotStarted('No puedes eliminar canciones una vez iniciado el juego.')) {
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

            // Resetear el flag de cartones generados, el nombre del juego y los cartones
            this.game.clearCartones();
            this.game.setGameName('');
            this.dom.gameNameInput.value = '';

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
            btn.innerHTML = '<span aria-hidden="true">⏸</span> Manual';
            btn.style.background = 'var(--danger-color)';
            btn.setAttribute('aria-pressed', 'true');
            this.audio.playEffect('start');
        } else {
            btn.innerHTML = '<span aria-hidden="true">🔄</span> Automático';
            btn.style.background = 'var(--text-muted)';
            btn.setAttribute('aria-pressed', 'false');
        }
    }

    // ============================================================
    // REPRODUCCIÓN Y CONTROL DE AUDIO
    // ============================================================

    playRandomSong() {
        // Validar con SongManager
        const validation = this.songManager.validateMinSongs(this.songs, MIN_SONGS_REQUIRED);
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
        const song = this.songManager.findSongById(this.songs, songId);
        if (!song?.file) {
            this.showAlert('Esta canción no tiene archivo de audio.', 'Sin Archivo');
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
                this.audio.playEffect('win');
            }

            // Always re-render the list to show the current playing song
            this.renderSongsList();

            // Programar la revelación del título e icono en la lista después del tiempo configurado
            // Solo si el juego ha iniciado
            if (this.game.isGameStarted()) {
                // Los elementos se buscan al dispararse el temporizador porque la lista
                // puede haberse vuelto a pintar entretanto (filtros, cierre de alertas...)
                this.listRevealTimers.push(
                    setTimeout(() => {
                        song.hideTitle = false;
                        this._fadeIn(`.song-item-title[data-song-id="${songId}"]`);
                    }, this.game.getTitleRevealTime() * 1000),
                    setTimeout(() => {
                        song.hideIcon = false;
                        this._fadeIn(`.song-item-icon[data-song-id="${songId}"]`);
                    }, this.game.getIconRevealTime() * 1000)
                );
            } else {
                // Si el juego no ha iniciado, mostrar todo inmediatamente
                this._revealSongInList(song);
            }
        });
    }

    _fadeIn(selector) {
        const element = document.querySelector(selector);
        if (element) {
            element.style.transition = 'opacity 1s ease-in';
            element.style.opacity = '1';
        }
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
        this.renderSongsList();
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
        const hasSongLoaded = this.dom.audioPlayer.src && this.dom.audioPlayer.src !== '';
        this.ui.updateControls(playing, this.game.isGameStarted(), hasSongLoaded);
    }

    onSongEnded() {
        this.audio.isPlaying = false;
        this.dom.songIconContainer.classList.remove('playing');
        
        // La canción que terminó ya no debe ocultarse en la lista
        this._revealCurrentSong();

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
        const iconRevealTime = this.game.getIconRevealTime();
        const gameStarted = this.game.isGameStarted();
        const historyItem = this.ui.addToHistory(song, iconRevealTime, gameStarted);
        
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
            
            // Ninguna canción debe quedar oculta tras el reinicio
            this._clearListRevealTimers();
            this.songs.forEach(song => this._revealSongInList(song));
            
            this.dom.historyGrid.innerHTML = '';
            this.refreshUI();
            this.stopSong();

            if (this.continuousMode) {
                this.toggleContinuousMode();
            }
            
            this.dom.currentIconImg.alt = 'Canción actual';
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
            this.dom.existingCartonesInfo.textContent =
                `Tienes ${existingCount} cartón(es) guardado(s). ¿Qué deseas hacer?`;
            this.dom.printExistingCartonesBtn.disabled = false;
            this.dom.deleteAllCartonesBtn.disabled = false;
        } else {
            this.dom.existingCartonesInfo.textContent =
                `No tienes cartones guardados. Selecciona "Crear Nuevos" para generar.`;
            this.dom.printExistingCartonesBtn.disabled = true;
            this.dom.deleteAllCartonesBtn.disabled = true;
        }

        // Abrir modal de opciones
        this.audio.playEffect('click');
        this.modal.openModal(this.dom.cartonOptionsModal);
    }

    closeCartonOptionsModal() {
        this.audio.playEffect('click');
        this.modal.closeModal(this.dom.cartonOptionsModal);
    }

    handleCreateNewCartones() {
        this.cartonMode = 'new';
        this.closeCartonOptionsModal();
        this.openCartonGenerationModal();
    }

    handleAddCartones() {
        this.cartonMode = 'add';
        this.closeCartonOptionsModal();
        this.openCartonGenerationModal();
    }

    async handlePrintExistingCartones() {
        const existingCartones = this.game.getCartones();

        if (existingCartones.length === 0) {
            this.showAlert('No hay cartones guardados para imprimir.', 'Sin Cartones');
            return;
        }

        this.closeCartonOptionsModal();

        // Abrir modal de impresión con personalización
        this.openPrintModal();
    }

    async handleDeleteAllCartones() {
        const existingCount = this.game.getCartonesCount();

        if (existingCount === 0) {
            this.showAlert('No hay cartones para eliminar.', 'Sin Cartones');
            return;
        }

        const confirmed = await this.showConfirm(
            `¿Estás seguro de eliminar los ${existingCount} cartón(es) guardado(s)?`,
            'Confirmar Eliminación'
        );

        if (confirmed) {
            this.game.clearCartones();
            this.audio.playEffect('click');
            this.updateUIState();
            this.closeCartonOptionsModal();
            this.showAlert('Todos los cartones han sido eliminados.', 'Cartones Eliminados');
        }
    }

    openCartonGenerationModal() {
        // Modal simplificado - solo cantidad
        this.audio.playEffect('click');
        this.modal.openModal(this.dom.cartonModal);
    }

    closeCartonModal() {
        this.audio.playEffect('click');
        this.modal.closeModal(this.dom.cartonModal);
    }

    async generateCartones() {
        const mode = this.cartonMode || 'new';
        const existingCartones = mode === 'add' ? this.game.getCartones() : [];

        const result = await this.carton.generateCartones(
            this.songs,
            MAX_CARTONS_GENERATED,
            MIN_SONGS_REQUIRED,
            (message, title) => this.showAlert(message, title),
            mode,
            existingCartones
        );
        
        if (result.success) {
            const count = result.cartones.length;

            // Guardar o añadir cartones según el modo
            if (mode === 'new') {
                this.game.setCartones(result.cartones);
                this.showAlert(
                    `${count} cartón(es) generado(s) y guardado(s) exitosamente.\n\nUsa "Imprimir Existentes" para descargarlos.`,
                    'Cartones Generados'
                );
            } else if (mode === 'add') {
                this.game.addCartones(result.cartones);
                this.showAlert(
                    `${count} cartón(es) añadido(s) exitosamente.\n\nTotal de cartones: ${this.game.getCartonesCount()}`,
                    'Cartones Añadidos'
                );
            }

            this.updateUIState();
            this.closeCartonModal();
            this.cartonMode = null;
        }
    }

    openPrintModal() {
        const count = this.game.getCartonesCount();

        // Actualizar información
        this.dom.printCartonesInfo.textContent = `Tienes ${count} cartón(es) guardado(s) listo(s) para imprimir.`;

        // Configurar valores de rango
        this.dom.rangeFromInput.max = count;
        this.dom.rangeToInput.max = count;
        this.dom.rangeToInput.value = count;

        // Resetear a "todos"
        this.dom.printRangeRadios[0].checked = true;
        this.dom.rangeInputsContainer.style.display = 'none';

        // Generar vista previa inicial
        this.updatePrintPreview();

        this.audio.playEffect('click');
        this.modal.openModal(this.dom.printModal);
    }

    closePrintModal() {
        this.audio.playEffect('click');
        this.modal.closeModal(this.dom.printModal);
    }

    async printCartones(format = 'html') {
        const gameName = this.game.getGameName() || 'Bingo Musical';
        const existingCartones = this.game.getCartones();

        this.audio.playEffect('start');

        const result = await this.carton.printCartonesWithConfig(
            existingCartones,
            this.songs,
            gameName,
            format
        );

        if (result.success) {
            this.audio.playEffect('win');
            this.showAlert(
                `${result.count} cartón(es) descargado(s) en ${format.toUpperCase()} exitosamente.`,
                'Cartones Impresos'
            );
            this.closePrintModal();
        } else {
            this.showAlert(`Error al imprimir cartones: ${result.error}`, 'Error');
        }
    }

    updatePrintPreview() {
        const gameName = this.game.getGameName() || DEFAULT_GAME_NAME;
        this.carton.updatePrintPreview(this.songs, gameName);
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