// Bingo Musical Application
import {BingoCartonGenerator} from "./bingoCartonGenerator.js";
import {DOMElements} from "./modules/DOMElements.js";
import {AudioManager} from "./modules/AudioManager.js";
import {StorageManager} from "./modules/StorageManager.js";

export const MIN_SONGS_REQUIRED = 24;

class BingoMusical {
    static SRC_LOGO_PNG = 'icon.png';
    static MAX_CARTONS_GENERATED = 1500;

    constructor() {
        this.songs = [];
        this.playedSongs = [];
        this.currentSongIndex = null;
        this.continuousMode = false;
        this.bingoCompleted = false;
        this.lineaCompleted = false;
        this.currentEditingSongId = null;
        this.gameStarted = false;
        this.confirmCallback = null;
        this.shouldRender = false;
        this.songId = 1;
        
        this.cartonGenerator = new BingoCartonGenerator();
        this.songsFolder = 'canciones/';
        this.dom = new DOMElements();
        this.audio = new AudioManager(this.dom);
        this.storage = new StorageManager();
        this.initializeIcons();
        
        this.init();
    }

    initializeIcons() {
        this.availableIcons = [
            // 🎵 Música y sonido (28)
            '🎵', '🎶', '🎼', '🎹', '🎤', '🎧', '🎸', '🎺', '🎻', '🥁', '🎷', '🪕',
            '🪗', '📯', '🎙️', '📻', '💿', '🎚️', '🎛️', '🔊', '🔇', '🔔', '🔕', '📢',
            '📣', '🪘', '🪇', '🪈',

            // 🎉 Entretenimiento y celebración (32)
            '🎉', '🎊', '🎈', '🎁', '🎂', '🍰', '🍾', '🥂', '🍷', '🍸', '🍹', '🍺',
            '🎇', '✨', '💫', '🎭', '🎪', '🎬', '🎮', '🕹️', '🎯', '🎲',
            '🃏', '🎰', '🏆', '🥇', '🥈', '🥉', '🎖️', '🏅', '🎟️', '🎫',

            // 😀 Emociones y expresiones (32)
            '😀', '😁', '😂', '😅', '😊', '😍', '🥰', '😘', '😎', '🤩', '🤗',
            '😇', '🥳', '🤪', '😜', '🤓', '😏', '😌', '😴', '😢', '😭', '😡', '🤬',
            '😱', '😳', '🤯', '🤔', '🤨', '🙄', '😆', '😋', '😺',

            // 🌿 Naturaleza y colores (22)
            '🌞', '🌝', '🌙', '⭐', '🌟', '🌠', '🌌', '🌈', '🔥', '💧', '❄️', '🍀',
            '🌹', '🌻', '🌸', '🌷', '🌼', '🌳', '🌴', '🌵', '🍂', '🍁',

            // 👥 Personas y gente (56)
            '👶', '🧒', '👦', '👧', '🧑', '👩', '👨', '👵', '🧓', '👴', '👩‍🎤', '👩‍🏫',
            '👩‍🍳', '👩‍🚀', '👩‍⚕️', '👩‍💻', '👩‍🎨', '👩‍🔧', '👩‍🚒', '👩‍✈️', '👩‍⚖️', '👩‍🌾', '👩‍🔬',
            '👫', '🤝', '👏', '👍', '🙌', '🙏', '🤟', '✌️', '👸', '🤴', '👰', '🤵',
            '👼', '🎅', '🤶', '🧙', '🧚', '🧛', '🧜', '🧝', '🧞', '🧟', '🧌', '🦸',
            '🦹', '👯', '👨‍👩‍👧', '👨‍👩‍👦', '👨‍👩‍👧‍👦', '👪', '👨‍👦', '👩‍👧',

            // ✝️ Iglesias y religión / espiritualidad (23)
            '⛪', '🕌', '🛕', '🕍', '⛩️', '🏛️', '✝️', '✡️', '🕎', '☦️', '🛐', '📿',
            '🕊️', '🔔', '🕯️', '📖', '📜', '💒', '☁️', '🌅',
            '🌄', '🙏', '🧎',

            // 🍔 Comida y bebida (24)
            '🍎', '🍊', '🍌', '🍉', '🍇', '🍓', '🍒', '🍍', '🥭', '🥝', '🍑', '🍋',
            '🥑', '🥦', '🥕', '🌽', '🥔', '🍞', '🥐', '🥨', '🍔', '🍕', '🍟', '🌭',

            // 🚗 Transporte y viajes (21)
            '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🚚',
            '🚜', '🚲', '🛵', '🏍️', '🚂', '✈️', '🚀', '🛸', '⛵', '🚢',

            // 💻 Tecnología (17)
            '💻', '🖨️', '⌨️', '🖱️', '📱', '☎️', '📞', '📟', '📠', '📺',
            '📷', '🎥', '🎞️', '📹', '💾', '🖲️', '🔋',

            // ⚽ Deportes y actividades (24)
            '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸', '🥊',
            '🥋', '🥅', '⛳', '⛸️', '🎿', '🛷', '🥌', '🏒', '🏑', '🏏', '🤿', '🏹'
        ];
    }

    init() {
        this.setupEventListeners();
        this.setupDragAndDrop();
        this.loadThemePreference();
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
        this.dom.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        this.dom.shortcutsHelpBtn.addEventListener('click', () => this.showKeyboardShortcutsHelp());
        this.dom.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
    }



    _setupModalEventListeners() {
        this.dom.closeIconModalBtn.addEventListener('click', () => this.closeIconModal());
        this.dom.iconModal.addEventListener('click', (e) => {
            if (e.target.id === 'icon-modal') this.closeIconModal();
        });

        this.dom.uploadCustomIconBtn.addEventListener('click', () => this.dom.customIconUploadInput.click());
        this.dom.customIconUploadInput.addEventListener('change', (e) => this.uploadCustomIcon(e));
        
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
            this.bingoCompleted = false;
            this.lineaCompleted = false;
            this.dom.celebrationOverlay.classList.add('hidden');
        });
    }

    _setupFullscreenEventListeners() {
        document.addEventListener('fullscreenchange', () => this.onFullscreenChange());
    }

    checkOpenModals() {
        return !this.dom.iconModal.classList.contains('hidden') ||
            !this.dom.cartonModal.classList.contains('hidden') ||
            !this.dom.confirmModal.classList.contains('hidden') ||
            !this.dom.alertModal.classList.contains('hidden');
    }

    closeModalsOnEscape() {
        if (!this.dom.iconModal.classList.contains('hidden')) {
            this.closeIconModal();
        } else if (!this.dom.cartonModal.classList.contains('hidden')) {
            this.closeCartonModal();
        } else if (!this.dom.confirmModal.classList.contains('hidden')) {
            this.closeConfirmModal(false);
        } else if (!this.dom.alertModal.classList.contains('hidden')) {
            this.closeAlertModal();
        }
    }

    playPauseOnSpace() {
        if (this.audio.isPlaying) {
            this.pauseSong();
        } else if (this.currentSongIndex !== null) {
            this.pauseSong(); // Esto actúa como resume
        } else if (this.songs.length >= MIN_SONGS_REQUIRED) {
            this.playRandomSong();
        }
    }

    nextSongOnN() {
        if (this.gameStarted) {
            if (!this.bingoCompleted) {
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
                    if (this.currentSongIndex !== null) {
                        this.stopSong();
                    }
                    break;

                case 'n': // N → Siguiente canción
                    e.preventDefault();
                    this.nextSongOnN();
                    break;

                case 'f': // F → Pantalla completa
                    e.preventDefault();
                    this.toggleFullscreen();
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

    showKeyboardShortcutsHelp() {
        const helpMessage = `
ATAJOS DE TECLADO DISPONIBLES:<br><br>

▶ ESPACIO → Reproducir/Pausar<br>
🔄 R → Reiniciar canción actual<br>
⏭ N → Siguiente canción (en modo continuo)<br>
⛶ F → Pantalla completa<br>
📏 L → Cantar LÍNEA<br>
🎉 B → Cantar BINGO<br>
❌ ESC → Cerrar modal<br>
❓ ? → Mostrar esta ayuda
        `.trim();
        
        this.showAlert(helpMessage, '⌨️ Atajos de Teclado');
    }

    // Sistema de temas (claro/oscuro)
    loadThemePreference() {
        const savedTheme = this.storage.loadTheme('dark');
        this.applyTheme(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.dataset.theme || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
        this.storage.saveTheme(newTheme);
        this.audio.playEffect('click');
    }

    applyTheme(theme) {
        document.documentElement.dataset.theme = theme;
        this.dom.themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
        this.dom.themeToggleBtn.setAttribute('title', 
            theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'
        );
    }

    // Sistema de modales personalizados
    showAlert(message, title = 'Información') {
        this.dom.alertTitle.textContent = title;
        this.dom.alertMessage.innerHTML = message;
        this.dom.alertModal.classList.remove('hidden');
        
        if (this.dom.alertModal.showModal) {
            this.dom.alertModal.showModal();
        }
        
        const isError = /error|inválido|insuficientes/i.test(title);
        this.audio.playEffect(isError ? 'error' : 'click');
    }

    closeAlertModal() {
        if (this.shouldRender) {
            this.renderSongsList();
            this.shouldRender = false;
        }
        
        if (this.dom.alertModal.close) {
            this.dom.alertModal.close();
        }
        
        this.dom.alertModal.classList.add('hidden');
    }

    showConfirm(message, title = 'Confirmar') {
        return new Promise((resolve) => {
            this.dom.confirmTitle.textContent = title;
            this.dom.confirmMessage.textContent = message;
            this.dom.confirmModal.classList.remove('hidden');
            
            if (this.dom.confirmModal.showModal) {
                this.dom.confirmModal.showModal();
            }
            
            this.confirmCallback = resolve;
            this.audio.playEffect('click');
        });
    }

    closeConfirmModal(result) {
        if (this.dom.confirmModal.close) {
            this.dom.confirmModal.close();
        }
        
        this.dom.confirmModal.classList.add('hidden');
        
        if (this.confirmCallback) {
            this.confirmCallback(result);
            this.confirmCallback = null;
        }
    }

    setupDragAndDrop() {
        const dropZones = [
            ...document.querySelectorAll('.file-label'),
            this.dom.songsSection
        ];

        const events = {
            prevent: ['dragenter', 'dragover', 'dragleave', 'drop'],
            highlight: ['dragenter', 'dragover'],
            unhighlight: ['dragleave', 'drop']
        };

        for (const zone of dropZones) {
            for (const eventName of events.prevent) {
                zone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }, false);
            }

            for (const eventName of events.highlight) {
                zone.addEventListener(eventName, () => {
                    if (!this.gameStarted) {
                        zone.classList.add('dragover');
                    }
                }, false);
            }

            for (const eventName of events.unhighlight) {
                zone.addEventListener(eventName, () => zone.classList.remove('dragover'), false);
            }

            zone.addEventListener('drop', (e) => {
                if (this.gameStarted) return;

                this.dom.addSongsInput.files = e.dataTransfer.files;
                this.dom.addSongsInput.dispatchEvent(new Event('change', { bubbles: true }));
            }, false);
        }
    }

    getTotalSongsWithFiles() {
        return this.songs.filter(s => s.file).length;
    }

    async triggerLinea() {
        const totalSongs = this.getTotalSongsWithFiles();
        if (totalSongs < MIN_SONGS_REQUIRED) {
            const message = `Necesitas al menos ${MIN_SONGS_REQUIRED} ` +
                          `canciones cargadas para poder jugar.`;
            this.showAlert(message, 'Canciones Insuficientes');
            return;
        }

        if (this.lineaCompleted) {
            const message = 'La línea ya fue cantada. ' +
                          'Solo puedes cantar línea una vez por juego.';
            this.showAlert(message, 'Línea Ya Cantada');
            return;
        }

        if (this.playedSongs.length < 4) {
            const message = 'Debes reproducir al menos 4 canciones ' +
                          'antes de cantar LÍNEA.';
            this.showAlert(message, 'Canciones Insuficientes');
            return;
        }

        this.lineaCompleted = true;
        this.audio.playEffect('win');
        setTimeout(() => this.dom.lineaOverlay.classList.remove('hidden'), 500);
    }

    async triggerBingo() {
        const totalSongs = this.getTotalSongsWithFiles();
        if (totalSongs < MIN_SONGS_REQUIRED) {
            const message = `Necesitas al menos ${MIN_SONGS_REQUIRED} ` +
                          `canciones cargadas para poder jugar.`;
            this.showAlert(message, 'Canciones Insuficientes');
            return;
        }

        if (this.bingoCompleted) {
            const message = 'El bingo ya fue completado. ' +
                          'Reinicia el juego para comenzar de nuevo.';
            this.showAlert(message, 'Bingo Ya Completado');
            return;
        }

        if (this.playedSongs.length < 12) {
            const message = 'Debes reproducir al menos 12 canciones ' +
                          'antes de cantar BINGO.';
            this.showAlert(message, 'Canciones Insuficientes');
            return;
        }

        this.bingoCompleted = true;
        this.audio.playEffect('complete');
        setTimeout(() => this.dom.celebrationOverlay.classList.remove('hidden'), 500);
    }

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

        if (this.gameStarted) {
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
        this.playedSongs = [];
        this.songId = 1;

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
                const availableIcon = this.availableIcons.find(i => !usedIcons.has(i));
                const randomIndex = Math.floor(Math.random() * this.availableIcons.length);
                icon = availableIcon || this.availableIcons[randomIndex] || '🎵';
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
                    id: this.songId++,
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

    getAvailableIcons() {
        const usedIcons = new Set(
            this.songs
                .filter(song => song.iconType === 'emoji' && song.icon != null)
                .map(song => song.icon)
        );
        return this.availableIcons.filter(icon => !usedIcons.has(icon));
    }

    isIconUsed(icon) {
        return this.songs.some(s => 
            s.icon === icon && 
            s.iconType === 'emoji' && 
            s.id !== this.currentEditingSongId
        );
    }

    openIconPicker(songId) {
        const song = this.songs.find(s => s.id === songId);
        if (!song) return;

        if (song.played) {
            const message = 'No puedes cambiar el icono de una canción ' +
                          'que ya fue reproducida.';
            this.showAlert(message, 'Canción Ya Reproducida');
            return;
        }

        if (this.gameStarted) {
            const message = 'No puedes cambiar iconos una vez que ' +
                          'el juego ha iniciado.';
            this.showAlert(message, 'Juego Iniciado');
            return;
        }

        this.currentEditingSongId = songId;
        this.dom.modalSongTitle.textContent = song.title;

        // Usar DocumentFragment para renderizado en batch
        const fragment = document.createDocumentFragment();

        for (const icon of this.availableIcons) {
            const iconOption = document.createElement('button');
            iconOption.type = 'button';
            iconOption.className = 'icon-option';
            iconOption.setAttribute('aria-label', `Seleccionar icono ${icon}`);

            const isUsed = this.isIconUsed(icon);
            const isCurrentSongIcon = icon === song.icon;

            if (isCurrentSongIcon) {
                iconOption.classList.add('selected');
                iconOption.setAttribute('aria-pressed', 'true');
            } else {
                iconOption.setAttribute('aria-pressed', 'false');
            }

            if (isUsed && !isCurrentSongIcon) {
                iconOption.style.opacity = '0.3';
                iconOption.style.cursor = 'not-allowed';
                iconOption.title = 'Este icono ya está en uso';
                iconOption.disabled = true;
            } else {
                iconOption.onclick = () => {
                    if (!isUsed || isCurrentSongIcon) {
                        this.selectIcon(icon);
                    }
                };
            }

            iconOption.textContent = icon;
            fragment.appendChild(iconOption);
        }

        // Una sola operación DOM
        this.dom.iconPickerContainer.innerHTML = '';
        this.dom.iconPickerContainer.appendChild(fragment);

        this.dom.iconModal.classList.remove('hidden');
        
        if (this.dom.iconModal.showModal) {
            this.dom.iconModal.showModal();
        }
        
        this.audio.playEffect('click');
    }

    async uploadCustomIcon(e) {
        const file = e.target.files[0];
        if (!file) return;

        const song = this.songs.find(s => s.id === this.currentEditingSongId);
        if (!song) return;

        const reader = new FileReader();

        const handleUpdate = () => {
            song.iconType = 'image';
            this.renderSongsList();
            this.audio.playEffect('click');
            this.closeIconModal();
            this.showAlert('Icono personalizado cargado correctamente.', 'Icono Actualizado');
        };

        reader.onload = (event) => {
            if (file.type === 'image/png') {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = 200;
                    canvas.height = 200;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, 200, 200);
                    song.icon = canvas.toDataURL('image/png');
                    handleUpdate(); // Call update logic after canvas is ready
                };
                img.src = event.target.result;
            } else {
                song.icon = event.target.result;
                handleUpdate(); // Call update logic directly for SVG
            }
        };

        reader.readAsDataURL(file);
    }

    selectIcon(icon, iconType = 'emoji') {
        if (this.currentEditingSongId === null) return;

        const song = this.songs.find(s => s.id === this.currentEditingSongId);
        if (song && !song.played) {
            song.icon = icon;
            song.iconType = iconType;

            this.renderSongsList();
            this.audio.playEffect('click');

            for (const opt of document.querySelectorAll('.icon-option')) {
                const isSelected = opt.textContent === icon;
                opt.classList.toggle('selected', isSelected);
                opt.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
            }

            setTimeout(() => this.closeIconModal(), 300);
        }
    }

    closeIconModal() {
        if (this.dom.iconModal.close) {
            this.dom.iconModal.close();
        }
        
        this.dom.iconModal.classList.add('hidden');
        this.currentEditingSongId = null;
    }

    addSongs(event) {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        if (this.gameStarted) {
            this.showAlert('No puedes agregar canciones una vez que el juego ha iniciado. Debes reiniciar el juego primero.', 'Juego Iniciado');
            event.target.value = '';
            return;
        }

        const duplicates = [];
        const newSongs = [];
        const existingTitles = new Set(this.songs.map(s => s.title));

        for (const file of files) {
            const fileName = file.name.replace(/\.[^/.]+$/, "");

            if (existingTitles.has(fileName)) {
                duplicates.push(fileName);
                continue;
            }

            const availableIconsList = this.getAvailableIcons();
            const randomIcon = availableIconsList.length > 0
                ? availableIconsList[Math.floor(Math.random() * availableIconsList.length)]
                : this.availableIcons[Math.floor(Math.random() * this.availableIcons.length)];

            newSongs.push({
                id: this.songId++,
                title: fileName,
                icon: randomIcon,
                iconType: 'emoji',
                audioPath: this.songsFolder + file.name, // Use original file.name
                file: file,
                played: false
            });
            existingTitles.add(fileName); // Avoid duplicates within the same batch
        }

        if (newSongs.length > 0) {
            this.songs.push(...newSongs);
            this.audio.playEffect('click');
            this.renderSongsList();
            this.updateCounters();
            this.updateUIState();
        }

        if (duplicates.length > 0) {
            const message = `Las siguientes canciones ya existen y no se han añadido:\n\n- ${duplicates.join('\n- ')}`;
            this.showAlert(message, 'Canciones Duplicadas');
        }

        event.target.value = '';
    }

    deleteSong(songId) {
        if (this.gameStarted) {
            this.showAlert('No puedes eliminar canciones una vez que el juego ha iniciado. Debes limpiar el historial primero.', 'Juego Iniciado');
        } else {
            this.songs = this.songs.filter(s => s.id !== songId);
            this.renderSongsList();
            this.updateCounters();
            this.audio.playEffect('click');
            this.updateUIState();
        }
    }

    updateUIState() {
        const isDisabled = this.gameStarted;

        this.dom.addSongsInput.disabled = isDisabled;
        this.dom.addSongsLabel.style.opacity = isDisabled ? '0.5' : '1';
        this.dom.addSongsLabel.style.cursor = isDisabled ? 'not-allowed' : 'pointer';
        this.dom.addSongsLabel.style.pointerEvents = isDisabled ? 'none' : 'auto';

        this.dom.importListBtn.disabled = isDisabled;
        this.dom.importListBtn.style.cursor = isDisabled ? 'not-allowed' : 'pointer';

        this.dom.clearHistoryBtn.disabled = !isDisabled; // Habilitar solo si el juego ha iniciado
        this.dom.clearHistoryBtn.style.opacity = isDisabled ? '1' : '0.5';
        this.dom.clearHistoryBtn.style.cursor = isDisabled ? 'pointer' : 'not-allowed';

        this.dom.shuffleAllBtn.disabled = isDisabled;
        this.dom.shuffleAllBtn.style.opacity = isDisabled ? '0.5' : '1';
        this.dom.shuffleAllBtn.style.cursor = isDisabled ? 'not-allowed' : 'pointer';
        if (isDisabled && this.continuousMode) {
            this.toggleContinuousMode();
        }

        if (this.gameStarted) {
            this.dom.playBtn.innerHTML = '<span aria-hidden="true">🔀</span> Canción Aleatoria';
            this.dom.playBtn.setAttribute('aria-label', 'Canción Aleatoria');
        } else {
            this.dom.playBtn.innerHTML = '<span aria-hidden="true">▶️</span> Iniciar Juego';
            this.dom.playBtn.setAttribute('aria-label', 'Iniciar Juego');
        }
    }



    setRenderSongIconTitle(song) {
        if (song.played) return 'Icono bloqueado (canción ya reproducida)';
        return this.gameStarted ? 'Icono bloqueado (juego iniciado)' : 'Click para cambiar icono';
    }

    setRenderSongIconHtml(song) {
        if (song.iconType === 'image') {
            return `<img src="${song.icon}" alt="${song.title}" style="width:1.75rem;aspect-ratio:1;object-fit:contain;">`;
        }
        return `<span role="img" aria-label="${song.title}">${song.icon}</span>`;
    }

    createSongItemElement(song) {
        const li = document.createElement('li');
        li.className = `song-item ${song.played ? 'played' : ''} ${this.currentSongIndex === song.id ? 'playing' : ''}`;
        li.setAttribute('role', 'listitem');

        const iconTitle = this.setRenderSongIconTitle(song);
        const iconCursor = (song.played || this.gameStarted) ? 'not-allowed' : 'pointer';
        const iconHtml = this.setRenderSongIconHtml(song);
        const iconDisabled = (song.played || this.gameStarted) ? 'disabled' : '';

        let songStateLabel;
        if (song.played) {
            songStateLabel = '✓ Ya reproducida';
        } else if (song.file) {
            songStateLabel = '○ Pendiente';
        } else {
            songStateLabel = '⚠ Sin archivo';
        }

        // Usar template fragment para mejor rendimiento
        const fragment = document.createDocumentFragment();
        
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
            if (!song.played && !this.gameStarted) {
                this.openIconPicker(song.id);
            } else if (this.gameStarted) {
                this.showAlert('No puedes cambiar iconos una vez que el juego ha iniciado.', 'Juego Iniciado');
            } else {
                this.showAlert('No puedes cambiar el icono de una canción que ya fue reproducida.', 'Canción Ya Reproducida');
            }
        };

        li.onclick = () => {
            if (song.file && !this.gameStarted) {
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
        // Usar DocumentFragment para renderizado en batch
        const fragment = document.createDocumentFragment();

        if (this.songs.length === 0) {
            const emptyLi = document.createElement('li');
            emptyLi.setAttribute('role', 'listitem');
            emptyLi.style.cssText = 'text-align:center;padding:2rem;color:var(--text-muted);list-style:none;';
            emptyLi.innerHTML = `
                <strong style="font-size:1.2rem;margin-bottom:0.5rem;display:block;">No hay canciones cargadas</strong>
                <p style="font-size:0.9rem;margin:0.5rem 0;">Arrastra archivos de audio o usa el botón "Agregar Canciones"</p>
                <p role="alert" style="font-size:0.85rem;margin-top:1rem;color:var(--warning-color);"><strong>⚠️ Necesitas al menos ${MIN_SONGS_REQUIRED} canciones para jugar</strong></p>
            `;
            fragment.appendChild(emptyLi);
            this.dom.songsListElement.innerHTML = '';
            this.dom.songsListElement.appendChild(fragment);
            return;
        }

        const totalSongs = this.getTotalSongsWithFiles();
        if (totalSongs < MIN_SONGS_REQUIRED) {
            const warning = document.createElement('li');
            warning.setAttribute('role', 'alert');
            warning.style.cssText = 'text-align:center;padding:1rem;margin-bottom:1rem;background:rgba(245,158,11,0.1);border-radius:8px;color:var(--warning-color);list-style:none;';
            warning.innerHTML = `<strong>⚠️ Tienes ${totalSongs}/${MIN_SONGS_REQUIRED} canciones.</strong> Necesitas al menos ${MIN_SONGS_REQUIRED} para jugar.`;
            fragment.appendChild(warning);
        }

        // Renderizar todas las canciones en un solo batch
        for (const song of this.songs) {
            const li = this.createSongItemElement(song);
            fragment.appendChild(li);
        }

        // Una sola operación DOM
        this.dom.songsListElement.innerHTML = '';
        this.dom.songsListElement.appendChild(fragment);
    }

    filterAndSortSongs() {
        // Obtener valores de filtros
        const searchTerm = this.dom.searchInput.value.toLowerCase().trim();
        const filterStatus = this.dom.filterStatus.value;
        const sortOrder = this.dom.sortOrder.value;

        // Filtrar canciones
        let filteredSongs = [...this.songs];

        // Filtro por búsqueda
        if (searchTerm) {
            filteredSongs = filteredSongs.filter(song => 
                song.title.toLowerCase().includes(searchTerm)
            );
        }

        // Filtro por estado
        if (filterStatus === 'played') {
            filteredSongs = filteredSongs.filter(song => song.played);
        } else if (filterStatus === 'pending') {
            filteredSongs = filteredSongs.filter(song => !song.played);
        }

        // Ordenamiento
        switch (sortOrder) {
            case 'alphabetical':
                filteredSongs.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'alphabetical-reverse':
                filteredSongs.sort((a, b) => b.title.localeCompare(a.title));
                break;
            case 'played-first':
                filteredSongs.sort((a, b) => {
                    if (a.played === b.played) return 0;
                    return a.played ? -1 : 1;
                });
                break;
            case 'pending-first':
                filteredSongs.sort((a, b) => {
                    if (a.played === b.played) return 0;
                    return a.played ? 1 : -1;
                });
                break;
            // 'default' mantiene el orden original
        }

        // Renderizar lista filtrada
        this.renderFilteredSongsList(filteredSongs);
    }

    renderFilteredSongsList(songsToShow) {
        // Usar DocumentFragment para renderizado en batch
        const fragment = document.createDocumentFragment();

        if (songsToShow.length === 0) {
            const emptyLi = document.createElement('li');
            emptyLi.setAttribute('role', 'listitem');
            emptyLi.style.cssText = 'text-align:center;padding:2rem;color:var(--text-muted);list-style:none;';
            emptyLi.innerHTML = `
                <strong style="font-size:1.2rem;margin-bottom:0.5rem;display:block;">No se encontraron canciones</strong>
                <p style="font-size:0.9rem;margin:0.5rem 0;">Intenta con otro término de búsqueda o cambia los filtros</p>
            `;
            fragment.appendChild(emptyLi);
            this.dom.songsListElement.innerHTML = '';
            this.dom.songsListElement.appendChild(fragment);
            return;
        }

        const totalSongs = this.getTotalSongsWithFiles();
        if (totalSongs < MIN_SONGS_REQUIRED) {
            const warning = document.createElement('li');
            warning.setAttribute('role', 'alert');
            warning.style.cssText = 'text-align:center;padding:1rem;margin-bottom:1rem;background:rgba(245,158,11,0.1);border-radius:8px;color:var(--warning-color);list-style:none;';
            warning.innerHTML = `<strong>⚠️ Tienes ${totalSongs}/${MIN_SONGS_REQUIRED} canciones.</strong> Necesitas al menos ${MIN_SONGS_REQUIRED} para jugar.`;
            fragment.appendChild(warning);
        }

        // Renderizar todas las canciones en un solo batch
        for (const song of songsToShow) {
            const li = this.createSongItemElement(song);
            fragment.appendChild(li);
        }

        // Una sola operación DOM
        this.dom.songsListElement.innerHTML = '';
        this.dom.songsListElement.appendChild(fragment);
    }

    updateCounters() {
        this.dom.playedCounterSpan.textContent = this.playedSongs.length.toString();
        this.dom.totalCounterSpan.textContent = this.getTotalSongsWithFiles();
    }

    // Gestión de playlist
    async deleteAllSongs() {
        if (this.gameStarted) {
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
            this.songs = [];
            this.audio.playEffect('click');
            this.filterAndSortSongs();
            this.updateCounters();
            this.updateUIState();
            this.showAlert('Todas las canciones han sido eliminadas.', 'Lista Vacía');
        }
    }

    toggleContinuousMode() {
        this.continuousMode = !this.continuousMode;
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

    playRandomSong() {
        const totalSongs = this.getTotalSongsWithFiles();
        if (totalSongs < MIN_SONGS_REQUIRED) {
            this.showAlert(`Necesitas al menos ${MIN_SONGS_REQUIRED} canciones cargadas para poder comenzar a jugar.`, 'Canciones Insuficientes');
            return;
        }

        // This is now the official start of the game
        if (!this.gameStarted) {
            this.gameStarted = true;
            this.updateUIState();
        }

        const unplayedSongs = this.songs.filter(song => !song.played && song.file);

        if (unplayedSongs.length === 0) {
            this.showAlert('No hay más canciones disponibles. Limpia el historial para volver a empezar', 'Sin Canciones');
            return;
        }

        if (unplayedSongs.length === 1) {
            this.dom.playBtn.disabled = true;
        }

        const randomSong = unplayedSongs[Math.floor(Math.random() * unplayedSongs.length)];
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
            this.currentSongIndex = songId;
            this.updatePlayerUI(song);
            this.updateControls(true);

            // Only do game logic if the game has started
            if (this.gameStarted && !song.played) {
                song.played = true;
                this.playedSongs.push(song);
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
        this.dom.songTitleElement.textContent = song.title;
        this.dom.currentIconImg.alt = song.title;

        if (song.iconType === 'image' && song.icon) {
            this.dom.currentIconImg.src = song.icon;
        } else {
            const canvas = document.createElement('canvas');
            canvas.width = 200;
            canvas.height = 200;
            const ctx = canvas.getContext('2d');
            ctx.font = '140px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(song.icon, 100, 100);
            this.dom.currentIconImg.src = canvas.toDataURL();
        }

        this.dom.songIconContainer.classList.add('playing');
    }

    updateControls(playing) {
        const noSongSelected = this.currentSongIndex === null;

        this.dom.playBtn.disabled = playing && this.gameStarted;
        this.dom.pauseBtn.disabled = noSongSelected;
        this.dom.stopBtn.disabled = noSongSelected;

        if (noSongSelected) {
            this.dom.pauseBtn.innerHTML = '<span aria-hidden="true">▶</span> Reproducir';
            this.dom.pauseBtn.setAttribute('aria-label', 'Reproducir');
            return;
        }

        if (playing) {
            this.dom.pauseBtn.innerHTML = '<span aria-hidden="true">⏸</span> Pausar';
            this.dom.pauseBtn.setAttribute('aria-label', 'Pausar reproducción');
        } else if (this.dom.audioPlayer.currentTime > 0) {
            this.dom.pauseBtn.innerHTML = '<span aria-hidden="true">▶</span> Reanudar';
            this.dom.pauseBtn.setAttribute('aria-label', 'Reanudar reproducción');
        } else {
            this.dom.pauseBtn.innerHTML = '<span aria-hidden="true">▶</span> Reproducir';
            this.dom.pauseBtn.setAttribute('aria-label', 'Reproducir canción seleccionada');
        }
    }

    onSongEnded() {
        this.audio.isPlaying = false;
        this.dom.songIconContainer.classList.remove('playing');

        // Handle continuous PREVIEW mode
        if (this.continuousMode && !this.gameStarted) {
            this.playRandomContinuousSong();
            return; // End execution here for this case
        }

        // Handle song ending during the game
        if (this.gameStarted) {
            const unplayedSongs = this.songs.filter(song => !song.played && song.file);
            if (unplayedSongs.length === 0 && !this.bingoCompleted) {
                // All songs have been played, trigger BINGO automatically
                this.bingoCompleted = true;
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
            const availableSongs = this.songs.filter(song => song.file);
            if (availableSongs.length > 0) {
                const randomSong = availableSongs[Math.floor(Math.random() * availableSongs.length)];
                this.playSong(randomSong.id);
            } else {
                // No songs to play, turn off the mode
                this.toggleContinuousMode();
            }
        }, 1000);
    }

    addToHistory(song) {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.title = song.title;
        historyItem.setAttribute('role', 'img');
        historyItem.setAttribute('aria-label', `Canción reproducida: ${song.title}`);

        historyItem.addEventListener('click', () => {
            this.audio.playEffect('click');
            this.playSong(song.id);
        });

        const img = document.createElement('img');

        if (song.iconType === 'image' && song.icon) {
            img.src = song.icon;
        } else {
            const canvas = document.createElement('canvas');
            canvas.width = 120;
            canvas.height = 120;
            const ctx = canvas.getContext('2d');
            ctx.font = '80px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(song.icon, 60, 60);
            img.src = canvas.toDataURL();
        }

        img.alt = song.title;
        historyItem.appendChild(img);
        this.dom.historyGrid.appendChild(historyItem);
        this.dom.historyGrid.scrollTop = this.dom.historyGrid.scrollHeight;
    }

    async reiniciarJuego() {
        this.audio.playEffect('click');

        const confirmed = await this.showConfirm(
            '¿Estás seguro de que quieres reiniciar el juego? Esto limpiará el historial y el progreso actual.',
            'Confirmar Reinicio'
        );

        if (confirmed) {
            this.playedSongs = [];
            this.bingoCompleted = false;
            this.lineaCompleted = false;
            this.gameStarted = false;
            
            for (const song of this.songs) {
                song.played = false;
            }
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

    toggleFullscreen() {
        this.audio.playEffect('click');

        if (document.fullscreenElement) {
            document.exitFullscreen().then();
        } else {
            document.documentElement.requestFullscreen().catch(err => {
                console.warn('Error al entrar en pantalla completa:', err);
            });
        }
    }

    onFullscreenChange() {
        const isFullscreen = !!document.fullscreenElement;

        if (isFullscreen) {
            document.body.classList.add('fullscreen');
            this.dom.fullscreenBtn.innerHTML = '<span class="fullscreen-icon" aria-hidden="true">⊗</span> Salir Pantalla Completa';
            this.dom.fullscreenBtn.setAttribute('aria-label', 'Salir de pantalla completa');
        } else {
            document.body.classList.remove('fullscreen');
            this.dom.fullscreenBtn.innerHTML = '<span class="fullscreen-icon" aria-hidden="true">⛶</span> Pantalla Completa';
            this.dom.fullscreenBtn.setAttribute('aria-label', 'Activar pantalla completa');
        }
    }

    openCartonModal() {
        const totalSongs = this.getTotalSongsWithFiles();

        if (totalSongs < MIN_SONGS_REQUIRED) {
            this.showAlert(`Necesitas al menos ${MIN_SONGS_REQUIRED} canciones cargadas para poder generar cartones.`, 'Canciones Insuficientes');
            return;
        }

        this.dom.cartonModal.classList.remove('hidden');
        
        if (this.dom.cartonModal.showModal) {
            this.dom.cartonModal.showModal();
        }
        
        // Generar vista previa inicial
        this.updateCartonPreview();
        
        this.audio.playEffect('click');
    }

    closeCartonModal() {
        if (this.dom.cartonModal.close) {
            this.dom.cartonModal.close();
        }
        
        this.dom.cartonModal.classList.add('hidden');
    }

    async generateCartones(format = 'html') {
        const count = Number.parseInt(this.dom.cartonCountInput.value);

        if (Number.isNaN(count) || count < 1 || count > BingoMusical.MAX_CARTONS_GENERATED) {
            this.showAlert(`Por favor ingresa un número válido entre 1 y ${BingoMusical.MAX_CARTONS_GENERATED}.`, 'Número Inválido');
            return;
        }

        const totalSongs = this.getTotalSongsWithFiles();
        if (totalSongs < MIN_SONGS_REQUIRED) {
            this.showAlert(`Necesitas al menos ${MIN_SONGS_REQUIRED} canciones cargadas para poder generar cartones.`, 'Canciones Insuficientes');
            return;
        }

        this.audio.playEffect('start');

        try {
            // Obtener configuración de personalización
            const config = {
                primaryColor: this.dom.cartonPrimaryColorInput.value,
                secondaryColor: this.dom.cartonSecondaryColorInput.value
            };
            
            const cartones = this.cartonGenerator.generateCartones(this.songs, count);
            
            if (format === 'pdf') {
                await this.cartonGenerator.downloadAsPDF(cartones, config);
                this.showAlert(`${count} cartón(es) generado(s) en PDF exitosamente.`, 'Cartones Generados');
            } else {
                this.cartonGenerator.downloadAsHTML(cartones, config);
                this.showAlert(`${count} cartón(es) generado(s) exitosamente.\n\nEl archivo HTML está listo para imprimir.`, 'Cartones Generados');
            }
            
            this.audio.playEffect('win');
            this.closeCartonModal();
        } catch (error) {
            this.showAlert(`Error al generar cartones: ${error.message}`, 'Error');
        }
    }
    
    updateCartonPreview() {
        try {
            // Obtener configuración
            const config = {
                primaryColor: this.dom.cartonPrimaryColorInput.value,
                secondaryColor: this.dom.cartonSecondaryColorInput.value
            };
            
            // Generar un cartón de ejemplo
            const previewCarton = this.cartonGenerator.generateSingleCarton(this.songs, 1);
            
            // Renderizar vista previa
            this.dom.cartonPreviewContainer.innerHTML = this.generatePreviewHTML(previewCarton, config);
        } catch (error) {
            this.dom.cartonPreviewContainer.innerHTML = `
                <div class="carton-preview-placeholder">
                    <p>❌ Error al generar vista previa</p>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }
    
    generatePreviewHTML(carton, config) {
        const { primaryColor, secondaryColor } = config;
        
        const cellsHTML = carton.rows.flatMap(row => 
            row.cells.map(cell => {
                const cellClass = cell.type === 'song' ? 'song' : 'decorative';
                let icon;
                if (cell.song.iconType === 'image') {
                    icon = cell.type === 'song'
                        ? `<img src="${cell.song.icon}" alt="${cell.song.title}" style="max-width: 90%; max-height: 90%;">`
                        : `<span class="decorative-icon">${cell.icon}</span>`;
                } else {
                    icon = cell.type === 'song'
                        ? cell.song.icon
                        : `<span class="decorative-icon">${cell.icon}</span>`;
                }
                    
                return `<div class="preview-cell ${cellClass}">
                    ${icon}
                </div>`;
            })
        ).join('');
        
        return `
            <div class="preview-carton" style="color: ${primaryColor}; border-color: ${primaryColor};">
                <div class="preview-carton-header" style="border-color: ${primaryColor};">
                    <div class="preview-carton-title" style="color: ${primaryColor};">🎵 Bingo Musical</div>
                    <div class="preview-carton-number" style="background-color: ${secondaryColor};">#1</div>
                </div>
                <div class="preview-carton-grid">
                    ${cellsHTML}
                </div>
            </div>
        `;
    }
}

// Inicializar la aplicación cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new BingoMusical());
} else {
    new BingoMusical();
}