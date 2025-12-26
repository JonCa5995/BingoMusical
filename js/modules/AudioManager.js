/**
 * AudioManager Module
 * Gestiona la reproducción de audio, efectos de sonido y controles de volumen
 */
export class AudioManager {
    constructor(dom) {
        this.dom = dom;
        this.isPlaying = false;
        this.musicVolume = 1;
        this.effectsVolume = 0.7;
        this.soundEffects = { start: null, win: null, click: null, complete: null, error: null };
        this.audioContext = null;

        this.init();
    }

    init() {
        this.setupAudioEventListeners();
        this.setupVolumeControls();
        this.loadSoundEffects();
    }

    /**
     * Obtiene o crea el AudioContext (lazy initialization)
     */
    getAudioContext() {
        if (!this.audioContext || this.audioContext.state === 'closed') {
            const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
            this.audioContext = new AudioContextClass();
        }
        // Reanudar si está suspendido (política de autoplay de navegadores)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        return this.audioContext;
    }

    /**
     * Configura los event listeners del reproductor de audio
     */
    setupAudioEventListeners() {
        this.dom.audioPlayer.addEventListener('timeupdate', () => this.updateProgress());
        this.dom.audioPlayer.addEventListener('loadedmetadata', () => this.updateDuration());
    }

    /**
     * Configura los controles de volumen
     */
    setupVolumeControls() {
        this.dom.musicVolumeSlider.addEventListener('input', (e) => {
            this.musicVolume = e.target.value / 100;
            this.dom.audioPlayer.volume = this.musicVolume;
            this.dom.musicVolumeValueSpan.textContent = `${e.target.value}%`;
            e.target.setAttribute('aria-valuenow', e.target.value);
        });

        this.dom.effectsVolumeSlider.addEventListener('input', (e) => {
            this.effectsVolume = e.target.value / 100;
            this.dom.effectsVolumeValueSpan.textContent = `${e.target.value}%`;
            e.target.setAttribute('aria-valuenow', e.target.value);
        });
    }

    /**
     * Carga los efectos de sonido usando Web Audio API
     */
    loadSoundEffects() {
        this.soundEffects.start = () => this._createSoundEffect(400, 800, 0.3);
        this.soundEffects.win = () => this._createMelody([523.25, 587.33, 659.25, 783.99], 0.15, 0.3);
        this.soundEffects.click = () => this._createSoundEffect(800, 800, 0.05, 0.2);
        this.soundEffects.complete = () => this._createMelody([523.25, 659.25, 783.99, 1046.5], 0.1, 0.4, 'triangle');
        this.soundEffects.error = () => this._createSoundEffect(600, 100, 0.6, 0.6, 'square');
    }

    /**
     * Crea un efecto de sonido simple
     */
    _createSoundEffect(startFreq, endFreq, duration, volumeMultiplier = 1, waveType = 'sine') {
        const audioCtx = this.getAudioContext();
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

    /**
     * Crea una melodía con múltiples notas
     */
    _createMelody(notes, interval, volumeMultiplier, waveType = 'sine') {
        const audioCtx = this.getAudioContext();

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

    /**
     * Reproduce un efecto de sonido por nombre
     */
    playEffect(effectName) {
        if (this.soundEffects[effectName] && this.effectsVolume > 0) {
            try {
                this.soundEffects[effectName]();
            } catch (error) {
                console.warn('Error al reproducir efecto:', error);
            }
        }
    }

    /**
     * Reproduce una canción
     * @param {File} audioFile - Archivo de audio a reproducir
     * @param {Function} onPlayCallback - Callback cuando empiece a reproducir
     */
    play(audioFile, onPlayCallback) {
        this.playEffect('start');
        this.dom.audioPlayer.pause();
        this.dom.audioPlayer.src = URL.createObjectURL(audioFile);
        this.dom.audioPlayer.volume = this.musicVolume;
        this.dom.audioPlayer.play();

        this.isPlaying = true;

        if (onPlayCallback) {
            onPlayCallback();
        }
    }

    /**
     * Pausa o reanuda la reproducción
     */
    pause() {
        this.playEffect('click');

        if (this.isPlaying) {
            this.dom.audioPlayer.pause();
            this.isPlaying = false;
            return false; // Indica que está pausado
        } else {
            this.dom.audioPlayer.play();
            this.isPlaying = true;
            return true; // Indica que está reproduciendo
        }
    }

    /**
     * Detiene la reproducción y reinicia al principio
     */
    stop() {
        this.playEffect('click');
        this.dom.audioPlayer.pause();
        this.dom.audioPlayer.currentTime = 0;
        this.isPlaying = false;

        this.dom.progressFill.value = 0;
        this.dom.progressFill.setAttribute('aria-valuenow', '0');
    }

    /**
     * Reinicia la canción al inicio y la reproduce
     */
    restart() {
        this.playEffect('click');
        this.dom.audioPlayer.currentTime = 0;
        this.dom.audioPlayer.play();
        this.isPlaying = true;

        this.dom.progressFill.value = 0;
        this.dom.progressFill.setAttribute('aria-valuenow', '0');
    }

    /**
     * Actualiza la barra de progreso
     */
    updateProgress() {
        const progress = (this.dom.audioPlayer.currentTime / this.dom.audioPlayer.duration) * 100;
        if (Number.isFinite(progress)) {
            this.dom.progressFill.value = progress;
            this.dom.progressFill.setAttribute('aria-valuenow', Math.round(progress).toString());

            this.dom.currentTimeSpan.textContent = this.formatTime(this.dom.audioPlayer.currentTime);
            this.dom.currentTimeSpan.setAttribute('datetime', `PT${Math.floor(this.dom.audioPlayer.currentTime)}S`);
        }
    }

    /**
     * Actualiza la duración total
     */
    updateDuration() {
        this.dom.durationSpan.textContent = this.formatTime(this.dom.audioPlayer.duration);
        this.dom.durationSpan.setAttribute('datetime', `PT${Math.floor(this.dom.audioPlayer.duration)}S`);
    }

    /**
     * Formatea segundos a formato MM:SS
     */
    formatTime(seconds) {
        if (Number.isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Salta a una posición específica de la canción
     */
    seekTo(event) {
        if (!this.dom.audioPlayer.src) return;

        const progressBar = event.currentTarget;
        const clickX = event.offsetX;
        const width = progressBar.offsetWidth;
        const percentage = clickX / width;

        this.dom.audioPlayer.currentTime = percentage * this.dom.audioPlayer.duration;
        this.playEffect('click');
    }
}
