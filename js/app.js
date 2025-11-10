// Bingo Musical Application
class BingoMusical {
    static SRC_LOGO_PNG = 'icon.png';
    static MIN_SONGS_REQUIRED = 24;
    static MAX_CARTONS_GENERATED = 1500;
    constructor() {
        this.songs = [];
        this.playedSongs = [];
        this.currentSongIndex = null;
        this.isPlaying = false;
        this.continuousMode = false;
        this.effectsVolume = 0.7;
        this.musicVolume = 1;
        this.bingoCompleted = false;
        this.lineaCompleted = false;
        this.currentEditingSongId = null;
        this.gameStarted = false;
        this.confirmCallback = null;
        this.shouldRender = false;
        this.songId = 1;
        
        this.cartonGenerator = new BingoCartonGenerator();
        this.songsFolder = 'canciones/';
        this.initializeElements();
        this.initializeIcons();
        this.soundEffects = { start: null, win: null, click: null, complete: null, error: null };
        
        this.init();
    }

    initializeElements() {
        this.audioPlayer = document.getElementById('audio-player');
        this.playBtn = document.getElementById('play-btn');
        this.pauseBtn = document.getElementById('pause-btn');
        this.stopBtn = document.getElementById('stop-btn');
        this.addSongsInput = document.getElementById('add-songs');
        this.addSongsLabel = document.querySelector('label[for="add-songs"]');
        this.clearHistoryBtn = document.getElementById('clear-history');
        this.shuffleAllBtn = document.getElementById('shuffle-all');
        this.generateCartonesBtn = document.getElementById('generate-cartones');
        this.closeCartonModalBtn = document.getElementById('close-carton-modal');
        this.generateHtmlCartonesBtn = document.getElementById('generate-html-cartones');
        this.cartonModal = document.getElementById('carton-modal');
        this.exportListBtn = document.getElementById('export-list');
        this.importListBtn = document.getElementById('import-list');
        this.importFileInput = document.getElementById('import-file');
        this.lineaBtn = document.getElementById('linea-btn');
        this.bingoBtn = document.getElementById('bingo-btn');
        this.fullscreenBtn = document.getElementById('fullscreen-btn');
        this.musicVolumeSlider = document.getElementById('music-volume');
        this.musicVolumeValueSpan = document.getElementById('music-volume-value');
        this.effectsVolumeSlider = document.getElementById('effects-volume');
        this.effectsVolumeValueSpan = document.getElementById('effects-volume-value');
        this.progressBar = document.querySelector('.progress-bar');
        this.closeIconModalBtn = document.getElementById('close-modal');
        this.iconModal = document.getElementById('icon-modal');
        this.uploadCustomIconBtn = document.getElementById('upload-custom-icon-btn');
        this.customIconUploadInput = document.getElementById('custom-icon-upload');
        this.confirmCancelBtn = document.getElementById('confirm-cancel');
        this.confirmAcceptBtn = document.getElementById('confirm-accept');
        this.alertOkBtn = document.getElementById('alert-ok');
        this.lineaOverlay = document.getElementById('linea-overlay');
        this.continueLineaBtn = document.getElementById('continue-linea-btn');
        this.celebrationOverlay = document.getElementById('celebration-overlay');
        this.restartBtn = document.getElementById('restart-btn');
        this.alertTitle = document.getElementById('alert-title');
        this.alertMessage = document.getElementById('alert-message');
        this.alertModal = document.getElementById('alert-modal');
        this.confirmTitle = document.getElementById('confirm-title');
        this.confirmMessage = document.getElementById('confirm-message');
        this.confirmModal = document.getElementById('confirm-modal');
        this.songTitleElement = document.getElementById('song-title');
        this.currentIconImg = document.getElementById('current-icon');
        this.progressFill = document.getElementById('progress-fill');
        this.currentTimeSpan = document.getElementById('current-time');
        this.durationSpan = document.getElementById('duration');
        this.songIconContainer = document.querySelector('.song-icon');
        this.songsListElement = document.getElementById('songs-list');
        this.historyGrid = document.getElementById('history-grid');
        this.playedCounterSpan = document.getElementById('played-counter');
        this.totalCounterSpan = document.getElementById('total-counter');
        this.modalSongTitle = document.getElementById('modal-song-title');
        this.iconPickerContainer = document.querySelector('.icon-picker');
        this.cartonCountInput = document.getElementById('carton-count');
        this.songsSection = document.querySelector('.songs-section');
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
        this.generateSoundEffects();
        this.renderSongsList();
        this.updateCounters();
        this.updateControls(false);
    }

    _setupPlayerEventListeners() {
        this.playBtn.addEventListener('click', () => this.playRandomSong());
        this.pauseBtn.addEventListener('click', () => this.pauseSong());
        this.stopBtn.addEventListener('click', () => this.stopSong());

        // Eventos del reproductor de audio
        this.audioPlayer.addEventListener('timeupdate', () => this.updateProgress());
        this.audioPlayer.addEventListener('ended', () => this.onSongEnded());
        this.audioPlayer.addEventListener('loadedmetadata', () => this.updateDuration());

        // Clic en barra de progreso
        this.progressBar.addEventListener('click', (e) => this.seekTo(e));
    }

    _setupSongManagementEventListeners() {
        this.addSongsInput.addEventListener('change', (e) => this.addSongs(e));
        this.clearHistoryBtn.addEventListener('click', () => this.reiniciarJuego());
        this.shuffleAllBtn.addEventListener('click', () => this.toggleContinuousMode());
    }

    _setupCartonEventListeners() {
        this.generateCartonesBtn.addEventListener('click', () => this.openCartonModal());
        this.closeCartonModalBtn.addEventListener('click', () => this.closeCartonModal());
        this.generateHtmlCartonesBtn.addEventListener('click', () => this.generateCartones());

        this.cartonModal.addEventListener('click', (e) => {
            if (e.target.id === 'carton-modal') {
                this.closeCartonModal();
            }
        });
    }

    setupEventListeners() {
        this._setupPlayerEventListeners();
        this._setupSongManagementEventListeners();
        this._setupCartonEventListeners();
        this._setupVolumeControls();
        this._setupModalEventListeners();
        this._setupCelebrationEventListeners();
        this._setupFullscreenEventListeners();

        this.exportListBtn.addEventListener('click', () => this.exportPlaylist());
        this.importListBtn.addEventListener('click', () => this.importFileInput.click());
        this.importFileInput.addEventListener('change', (e) => this.importPlaylist(e));
        this.lineaBtn.addEventListener('click', () => this.triggerLinea());
        this.bingoBtn.addEventListener('click', () => this.triggerBingo());
        this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
    }

    _setupVolumeControls() {
        this.musicVolumeSlider.addEventListener('input', (e) => {
            this.musicVolume = e.target.value / 100;
            this.audioPlayer.volume = this.musicVolume;
            this.musicVolumeValueSpan.textContent = `${e.target.value}%`;
            e.target.setAttribute('aria-valuenow', e.target.value);
        });

        this.effectsVolumeSlider.addEventListener('input', (e) => {
            this.effectsVolume = e.target.value / 100;
            this.effectsVolumeValueSpan.textContent = `${e.target.value}%`;
            e.target.setAttribute('aria-valuenow', e.target.value);
        });
    }

    _setupModalEventListeners() {
        this.closeIconModalBtn.addEventListener('click', () => this.closeIconModal());
        this.iconModal.addEventListener('click', (e) => {
            if (e.target.id === 'icon-modal') this.closeIconModal();
        });

        this.uploadCustomIconBtn.addEventListener('click', () => this.customIconUploadInput.click());
        this.customIconUploadInput.addEventListener('change', (e) => this.uploadCustomIcon(e));
        
        this.confirmCancelBtn.addEventListener('click', () => this.closeConfirmModal(false));
        this.confirmAcceptBtn.addEventListener('click', () => this.closeConfirmModal(true));
        this.alertOkBtn.addEventListener('click', () => this.closeAlertModal());
    }

    _setupCelebrationEventListeners() {
        this.continueLineaBtn.addEventListener('click', () => {
            this.lineaOverlay.classList.add('hidden');
        });

        this.restartBtn.addEventListener('click', () => {
            this.reiniciarJuego().then();
            this.bingoCompleted = false;
            this.lineaCompleted = false;
            this.celebrationOverlay.classList.add('hidden');
        });
    }

    _setupFullscreenEventListeners() {
        document.addEventListener('fullscreenchange', () => this.onFullscreenChange());
    }

    // Sistema de modales personalizados
    showAlert(message, title = 'Información') {
        this.alertTitle.textContent = title;
        this.alertMessage.textContent = message;
        this.alertModal.classList.remove('hidden');
        
        if (this.alertModal.showModal) {
            this.alertModal.showModal();
        }
        
        const isError = /error|inválido|insuficientes/i.test(title);
        this.playEffect(isError ? 'error' : 'click');
    }

    closeAlertModal() {
        if (this.shouldRender) {
            this.renderSongsList();
            this.shouldRender = false;
        }
        
        if (this.alertModal.close) {
            this.alertModal.close();
        }
        
        this.alertModal.classList.add('hidden');
    }

    showConfirm(message, title = 'Confirmar') {
        return new Promise((resolve) => {
            this.confirmTitle.textContent = title;
            this.confirmMessage.textContent = message;
            this.confirmModal.classList.remove('hidden');
            
            if (this.confirmModal.showModal) {
                this.confirmModal.showModal();
            }
            
            this.confirmCallback = resolve;
            this.playEffect('click');
        });
    }

    closeConfirmModal(result) {
        if (this.confirmModal.close) {
            this.confirmModal.close();
        }
        
        this.confirmModal.classList.add('hidden');
        
        if (this.confirmCallback) {
            this.confirmCallback(result);
            this.confirmCallback = null;
        }
    }

    setupDragAndDrop() {
        const dropZones = [
            ...document.querySelectorAll('.file-label'),
            this.songsSection
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

                this.addSongsInput.files = e.dataTransfer.files;
                this.addSongsInput.dispatchEvent(new Event('change', { bubbles: true }));
            }, false);
        }
    }

    generateSoundEffects() {
        if (!globalThis.AudioContext) {
            console.warn('Web Audio API no soportada');
            return;
        }

        this.soundEffects.start = () => this._createSoundEffect(400, 800, 0.3);
        this.soundEffects.win = () => this._createMelody([523.25, 587.33, 659.25, 783.99], 0.15, 0.3);
        this.soundEffects.click = () => this._createSoundEffect(800, 800, 0.05, 0.2);
        this.soundEffects.complete = () => this._createMelody([523.25, 659.25, 783.99, 1046.5], 0.1, 0.4, 'triangle');
        this.soundEffects.error = () => this._createSoundEffect(600, 100, 0.6, 0.6, 'square');
    }

    _createSoundEffect(startFreq, endFreq, duration, volumeMultiplier = 1, waveType = 'sine') {
        const audioCtx = new AudioContext();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = waveType;

        oscillator.frequency.setValueAtTime(startFreq, audioCtx.currentTime);
        if (startFreq !== endFreq) {
            oscillator.frequency.exponentialRampToValueAtTime(endFreq, audioCtx.currentTime + duration);
        }

        gainNode.gain.setValueAtTime(this.effectsVolume * volumeMultiplier, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + duration);
    }

    _createMelody(notes, interval, volumeMultiplier, waveType = 'sine') {
        const audioCtx = new AudioContext();
        
        for (const [index, freq] of notes.entries()) {
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.type = waveType;
            oscillator.frequency.value = freq;

            const startTime = audioCtx.currentTime + (index * interval);
            const duration = waveType === 'triangle' ? 0.5 : 0.15;
            
            gainNode.gain.setValueAtTime(this.effectsVolume * volumeMultiplier, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        }
    }

    playEffect(effectName) {
        if (this.soundEffects[effectName] && this.effectsVolume > 0) {
            try {
                this.soundEffects[effectName]();
            } catch (error) {
                console.warn('Error al reproducir efecto:', error);
            }
        }
    }

    getTotalSongsWithFiles() {
        return this.songs.filter(s => s.file).length;
    }

    async triggerLinea() {
        const totalSongs = this.getTotalSongsWithFiles();
        if (totalSongs < BingoMusical.MIN_SONGS_REQUIRED) {
            const message = `Necesitas al menos ${BingoMusical.MIN_SONGS_REQUIRED} ` +
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
        this.playEffect('win');
        setTimeout(() => this.lineaOverlay.classList.remove('hidden'), 500);
    }

    async triggerBingo() {
        const totalSongs = this.getTotalSongsWithFiles();
        if (totalSongs < BingoMusical.MIN_SONGS_REQUIRED) {
            const message = `Necesitas al menos ${BingoMusical.MIN_SONGS_REQUIRED} ` +
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
        this.playEffect('complete');
        setTimeout(() => this.celebrationOverlay.classList.remove('hidden'), 500);
    }

    exportPlaylist() {
        if (this.songs.length === 0) {
            this.showAlert('No hay canciones para exportar.', 'Lista Vacía');
            return;
        }

        const playlist = {
            version: '1.0',
            date: new Date().toISOString(),
            songs: this.songs.map(song => ({
                id: song.id,
                title: song.title,
                icon: song.icon,
                iconType: song.iconType || 'emoji',
            }))
        };

        const dataStr = JSON.stringify(playlist, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        const date = new Date().toISOString().split('T')[0];
        link.href = url;
        link.download = `bingo-musical-${date}.json`;
        link.setAttribute('aria-label', 'Descargar lista de canciones en formato JSON');
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
        this.playEffect('click');
        
        const message = `Lista de canciones exportada correctamente.\n\n` +
                       `Coloca el archivo JSON en la carpeta raíz del proyecto.\n` +
                       `Coloca los archivos de audio en: ${this.songsFolder}`;
        this.showAlert(message, 'Exportación Exitosa');
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

        try {
            const text = await file.text();
            const playlist = JSON.parse(text);

            if (!playlist.songs || !Array.isArray(playlist.songs)) {
                throw new Error('Formato de archivo inválido');
            }

            // Reset lists for replacement behavior
            this.songs = [];
            this.playedSongs = [];
            this.songId = 1; // Reset song ID counter for the new list

            const duplicates = [];
            const newSongs = [];
            const titlesAdded = new Set();
            const usedIcons = new Set();

            for (const songData of playlist.songs) {
                const title = songData.title;

                if (titlesAdded.has(title)) {
                    duplicates.push(title);
                    continue; // Skip duplicate within the same file
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
                        id: this.songId++, // Use class-level counter
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

            this.songs = newSongs; // Assign the filtered list

            this.renderSongsList();
            this.updateCounters();
            this.updateUIState();

            // Show duplicate warning first, if any
            if (duplicates.length > 0) {
                this.playEffect('error');
                const message = `Se omitieron las siguientes canciones duplicadas:\n\n- ${duplicates.join('\n- ')}`;
                this.showAlert(message, 'Canciones Duplicadas Omitidas');
            }

            // Then, show the main success/error message
            // Use a timeout to ensure the duplicate alert is seen first if both are shown
            setTimeout(() => {
                let message;
                let messageTitle;
                if (this.songs.length === 0) {
                    this.playEffect('error');
                    message = `Se han importado 0 canciones.\n\nRevisa que los archivos de audio estén en: ${this.songsFolder}\ny que los nombres coincidan con los títulos.`;
                    messageTitle = 'Error al Importar';
                } else {
                    this.playEffect('win');
                    message = `Lista importada con ${this.songs.length} canciones.\n\nLos archivos de audio deben estar en: ${this.songsFolder}`;
                    messageTitle = 'Importación Exitosa';
                }
                this.showAlert(message, messageTitle);
            }, duplicates.length > 0 ? 2000 : 0);

        } catch (error) {
            console.error(error);
            const message = `Error al importar la lista: ${error.message}`;
            this.showAlert(message, 'Error de Importación');
        }
        
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
        this.modalSongTitle.textContent = song.title;
        this.iconPickerContainer.innerHTML = '';

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
                iconOption.addEventListener('click', () => {
                    if (!isUsed || isCurrentSongIcon) {
                        this.selectIcon(icon);
                    }
                });
            }

            iconOption.textContent = icon;
            this.iconPickerContainer.appendChild(iconOption);
        }

        this.iconModal.classList.remove('hidden');
        
        if (this.iconModal.showModal) {
            this.iconModal.showModal();
        }
        
        this.playEffect('click');
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
            this.playEffect('click');
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
            this.playEffect('click');

            for (const opt of document.querySelectorAll('.icon-option')) {
                const isSelected = opt.textContent === icon;
                opt.classList.toggle('selected', isSelected);
                opt.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
            }

            setTimeout(() => this.closeIconModal(), 300);
        }
    }

    closeIconModal() {
        if (this.iconModal.close) {
            this.iconModal.close();
        }
        
        this.iconModal.classList.add('hidden');
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
            this.playEffect('click');
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
            this.playEffect('click');
            this.updateUIState();
        }
    }

    updateUIState() {
        const isDisabled = this.gameStarted;

        this.addSongsInput.disabled = isDisabled;
        this.addSongsLabel.style.opacity = isDisabled ? '0.5' : '1';
        this.addSongsLabel.style.cursor = isDisabled ? 'not-allowed' : 'pointer';
        this.addSongsLabel.style.pointerEvents = isDisabled ? 'none' : 'auto';

        this.importListBtn.disabled = isDisabled;
        this.importListBtn.style.cursor = isDisabled ? 'not-allowed' : 'pointer';

        this.clearHistoryBtn.disabled = !isDisabled; // Habilitar solo si el juego ha iniciado
        this.clearHistoryBtn.style.opacity = isDisabled ? '1' : '0.5';
        this.clearHistoryBtn.style.cursor = isDisabled ? 'pointer' : 'not-allowed';

        this.shuffleAllBtn.disabled = isDisabled;
        this.shuffleAllBtn.style.opacity = isDisabled ? '0.5' : '1';
        this.shuffleAllBtn.style.cursor = isDisabled ? 'not-allowed' : 'pointer';
        if (isDisabled && this.continuousMode) {
            this.toggleContinuousMode();
        }

        if (this.gameStarted) {
            this.playBtn.innerHTML = '<span aria-hidden="true">🔀</span> Canción Aleatoria';
            this.playBtn.setAttribute('aria-label', 'Canción Aleatoria');
        } else {
            this.playBtn.innerHTML = '<span aria-hidden="true">▶️</span> Iniciar Juego';
            this.playBtn.setAttribute('aria-label', 'Iniciar Juego');
        }
    }

    showMissingSongsWarning(songsList) {
        const totalSongs = this.getTotalSongsWithFiles();
        if (totalSongs < BingoMusical.MIN_SONGS_REQUIRED) {
            const warning = document.createElement('li');
            warning.setAttribute('role', 'alert');
            warning.style.cssText = 'text-align:center;padding:1rem;margin-bottom:1rem;background:rgba(245,158,11,0.1);border-radius:8px;color:var(--warning-color);list-style:none;';
            warning.innerHTML = `<strong>⚠️ Tienes ${totalSongs}/${BingoMusical.MIN_SONGS_REQUIRED} canciones.</strong> Necesitas al menos ${BingoMusical.MIN_SONGS_REQUIRED} para jugar.`;
            songsList.appendChild(warning);
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

    renderSongsList() {
        this.songsListElement.innerHTML = '';

        if (this.songs.length === 0) {
            this.songsListElement.innerHTML = `
      <li role="listitem" style="text-align:center;padding:2rem;color:var(--text-muted);list-style:none;">
        <strong style="font-size:1.2rem;margin-bottom:0.5rem;display:block;">No hay canciones cargadas</strong>
        <p style="font-size:0.9rem;margin:0.5rem 0;">Arrastra archivos de audio o usa el botón "Agregar Canciones"</p>
        <p role="alert" style="font-size:0.85rem;margin-top:1rem;color:var(--warning-color);"><strong>⚠️ Necesitas al menos ${BingoMusical.MIN_SONGS_REQUIRED} canciones para jugar</strong></p>
      </li>
    `;
            return;
        }

        this.showMissingSongsWarning(this.songsListElement);

        for (const song of this.songs) {
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

            li.innerHTML = `
              <button type="button" class="song-item-icon" data-song-id="${song.id}" title="${iconTitle}" style="cursor:${iconCursor};" aria-label="Cambiar icono de ${song.title}" ${iconDisabled}>${iconHtml}</button>
              <div class="song-item-info">
                <strong class="song-item-title">${song.title}</strong>
                <div class="song-item-status" role="status" aria-live="polite">${songStateLabel}</div>
              </div>
              <button type="button" class="song-item-delete" title="Eliminar canción" aria-label="Eliminar ${song.title}"><span aria-hidden="true">❌</span></button>
            `;

            const iconEl = li.querySelector('.song-item-icon');
            iconEl.addEventListener('click', (e) => {
                e.stopPropagation();
                if (!song.played && !this.gameStarted) {
                    this.openIconPicker(song.id);
                } else if (this.gameStarted) {
                    this.showAlert('No puedes cambiar iconos una vez que el juego ha iniciado.', 'Juego Iniciado');
                } else {
                    this.showAlert('No puedes cambiar el icono de una canción que ya fue reproducida.', 'Canción Ya Reproducida');
                }
            });

            li.addEventListener('click', () => {
                if (song.file && !this.gameStarted) {
                    this.playEffect('click');
                    this.playSong(song.id);
                }
            });

            li.querySelector('.song-item-delete').addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteSong(song.id);
            });

            this.songsListElement.appendChild(li);
        }
    }

    updateCounters() {
        this.playedCounterSpan.textContent = this.playedSongs.length.toString();
        this.totalCounterSpan.textContent = this.getTotalSongsWithFiles();
    }

    toggleContinuousMode() {
        this.continuousMode = !this.continuousMode;
        const btn = this.shuffleAllBtn;

        if (this.continuousMode) {
            btn.innerHTML = '<span aria-hidden="true">⏸</span> Detener Modo Continuo';
            btn.style.background = 'var(--danger-color)';
            btn.setAttribute('aria-pressed', 'true');
            this.playEffect('start');
        } else {
            btn.innerHTML = '<span aria-hidden="true">🔄</span> Modo Continuo';
            btn.style.background = 'var(--text-muted)';
            btn.setAttribute('aria-pressed', 'false');
        }
    }

    playRandomSong() {
        const totalSongs = this.getTotalSongsWithFiles();
        if (totalSongs < BingoMusical.MIN_SONGS_REQUIRED) {
            this.showAlert(`Necesitas al menos ${BingoMusical.MIN_SONGS_REQUIRED} canciones cargadas para poder comenzar a jugar.`, 'Canciones Insuficientes');
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
            this.playBtn.disabled = true;
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

        this.playEffect('start');
        this.audioPlayer.pause();
        this.audioPlayer.src = URL.createObjectURL(song.file);
        this.audioPlayer.volume = this.musicVolume;
        this.audioPlayer.play();

        this.currentSongIndex = songId;
        this.isPlaying = true;

        this.updatePlayerUI(song);
        this.updateControls(true);

        // Only do game logic if the game has started
        if (this.gameStarted && !song.played) {
            song.played = true;
            this.playedSongs.push(song);
            this.addToHistory(song);
            this.updateCounters();
            this.playEffect('win');
        }

        // Always re-render the list to show the current playing song
        this.renderSongsList();
    }

    pauseSong() {
        this.playEffect('click');

        if (this.isPlaying) {
            this.audioPlayer.pause();
            this.isPlaying = false;
            this.updateControls(false);
        } else {
            this.audioPlayer.play();
            this.isPlaying = true;
            this.updateControls(true);
        }
    }

    stopSong() {
        this.playEffect('click');
        this.audioPlayer.pause();
        this.audioPlayer.currentTime = 0;
        this.isPlaying = false;
        this.updateControls(false);

        this.progressFill.value = 0;
        this.progressFill.setAttribute('aria-valuenow', '0');
        this.songIconContainer.classList.remove('playing');
        this.renderSongsList();
    }

    updatePlayerUI(song) {
        this.songTitleElement.textContent = song.title;
        this.currentIconImg.alt = song.title;

        if (song.iconType === 'image' && song.icon) {
            this.currentIconImg.src = song.icon;
        } else {
            const canvas = document.createElement('canvas');
            canvas.width = 200;
            canvas.height = 200;
            const ctx = canvas.getContext('2d');
            ctx.font = '140px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(song.icon, 100, 100);
            this.currentIconImg.src = canvas.toDataURL();
        }

        this.songIconContainer.classList.add('playing');
    }

    updateControls(playing) {
        const noSongSelected = this.currentSongIndex === null;

        this.playBtn.disabled = playing && this.gameStarted;
        this.pauseBtn.disabled = noSongSelected;
        this.stopBtn.disabled = noSongSelected;

        if (noSongSelected) {
            this.pauseBtn.innerHTML = '<span aria-hidden="true">▶</span> Reproducir';
            this.pauseBtn.setAttribute('aria-label', 'Reproducir');
            return;
        }

        if (playing) {
            this.pauseBtn.innerHTML = '<span aria-hidden="true">⏸</span> Pausar';
            this.pauseBtn.setAttribute('aria-label', 'Pausar reproducción');
        } else if (this.audioPlayer.currentTime > 0) {
            this.pauseBtn.innerHTML = '<span aria-hidden="true">▶</span> Reanudar';
            this.pauseBtn.setAttribute('aria-label', 'Reanudar reproducción');
        } else {
            this.pauseBtn.innerHTML = '<span aria-hidden="true">▶</span> Reproducir';
            this.pauseBtn.setAttribute('aria-label', 'Reproducir canción seleccionada');
        }
    }

    updateProgress() {
        const progress = (this.audioPlayer.currentTime / this.audioPlayer.duration) * 100;
        if (Number.isFinite(progress)) {
            this.progressFill.value = progress;
            this.progressFill.setAttribute('aria-valuenow', Math.round(progress).toString());

            this.currentTimeSpan.textContent = this.formatTime(this.audioPlayer.currentTime);
            this.currentTimeSpan.setAttribute('datetime', `PT${Math.floor(this.audioPlayer.currentTime)}S`);
        }
    }

    updateDuration() {
        this.durationSpan.textContent = this.formatTime(this.audioPlayer.duration);
        this.durationSpan.setAttribute('datetime', `PT${Math.floor(this.audioPlayer.duration)}S`);
    }

    formatTime(seconds) {
        if (Number.isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    seekTo(event) {
        if (!this.audioPlayer.src) return;

        const progressBar = event.currentTarget;
        const clickX = event.offsetX;
        const width = progressBar.offsetWidth;
        const percentage = clickX / width;

        this.audioPlayer.currentTime = percentage * this.audioPlayer.duration;
        this.playEffect('click');
    }

    onSongEnded() {
        this.isPlaying = false;
        this.songIconContainer.classList.remove('playing');

        // Handle continuous PREVIEW mode
        if (this.continuousMode && !this.gameStarted) {
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
            return; // End execution here for this case
        }

        // Handle song ending during the game
        if (this.gameStarted) {
            const unplayedSongs = this.songs.filter(song => !song.played && song.file);
            if (unplayedSongs.length === 0 && !this.bingoCompleted) {
                // All songs have been played, trigger BINGO automatically
                this.bingoCompleted = true;
                setTimeout(() => {
                    this.playEffect('complete');
                    this.celebrationOverlay.classList.remove('hidden');
                }, 500);
            }
        }

        // Default behavior: update controls to show song has stopped
        this.updateControls(false);
    }

    addToHistory(song) {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.title = song.title;
        historyItem.setAttribute('role', 'img');
        historyItem.setAttribute('aria-label', `Canción reproducida: ${song.title}`);

        historyItem.addEventListener('click', () => {
            this.playEffect('click');
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
        this.historyGrid.appendChild(historyItem);
        this.historyGrid.scrollTop = this.historyGrid.scrollHeight;
    }

    async reiniciarJuego() {
        this.playEffect('click');

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
            this.historyGrid.innerHTML = '';
            this.renderSongsList();
            this.updateCounters();
            this.updateUIState();
            this.stopSong();

            if (this.continuousMode) {
                this.toggleContinuousMode();
            }
            
            this.currentIconImg.alt = 'Canción actual';
            this.currentIconImg.src = BingoMusical.SRC_LOGO_PNG;
        }
    }

    toggleFullscreen() {
        this.playEffect('click');

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
            this.fullscreenBtn.innerHTML = '<span class="fullscreen-icon" aria-hidden="true">⊗</span> Salir Pantalla Completa';
            this.fullscreenBtn.setAttribute('aria-label', 'Salir de pantalla completa');
        } else {
            document.body.classList.remove('fullscreen');
            this.fullscreenBtn.innerHTML = '<span class="fullscreen-icon" aria-hidden="true">⛶</span> Pantalla Completa';
            this.fullscreenBtn.setAttribute('aria-label', 'Activar pantalla completa');
        }
    }

    openCartonModal() {
        const totalSongs = this.getTotalSongsWithFiles();

        if (totalSongs < BingoMusical.MIN_SONGS_REQUIRED) {
            this.showAlert(`Necesitas al menos ${BingoMusical.MIN_SONGS_REQUIRED} canciones cargadas para poder generar cartones.`, 'Canciones Insuficientes');
            return;
        }

        this.cartonModal.classList.remove('hidden');
        
        if (this.cartonModal.showModal) {
            this.cartonModal.showModal();
        }
        
        this.playEffect('click');
    }

    closeCartonModal() {
        if (this.cartonModal.close) {
            this.cartonModal.close();
        }
        
        this.cartonModal.classList.add('hidden');
    }

    async generateCartones() {
        const count = Number.parseInt(this.cartonCountInput.value);

        if (Number.isNaN(count) || count < 1 || count > BingoMusical.MAX_CARTONS_GENERATED) {
            this.showAlert(`Por favor ingresa un número válido entre 1 y ${BingoMusical.MAX_CARTONS_GENERATED}.`, 'Número Inválido');
            return;
        }

        const totalSongs = this.getTotalSongsWithFiles();
        if (totalSongs < BingoMusical.MIN_SONGS_REQUIRED) {
            this.showAlert(`Necesitas al menos ${BingoMusical.MIN_SONGS_REQUIRED} canciones cargadas para poder generar cartones.`, 'Canciones Insuficientes');
            return;
        }

        this.playEffect('start');

        try {
            const cartones = this.cartonGenerator.generateCartones(this.songs, count);
            this.cartonGenerator.downloadAsHTML(cartones);
            this.showAlert(`${count} cartón(es) generado(s) exitosamente.\n\nEl archivo HTML está listo para imprimir.`, 'Cartones Generados');
            this.playEffect('win');
            this.closeCartonModal();
        } catch (error) {
            this.showAlert(`Error al generar cartones: ${error.message}`, 'Error');
        }
    }
}

// Inicializar la aplicación cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new BingoMusical();
    });
} else {
    new BingoMusical();
}