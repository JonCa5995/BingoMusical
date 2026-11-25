/**
 * AudioManager Module
 * Reproduce la música: cargar, reproducir, pausar, parar, reiniciar, saltar y volumen.
 * Los efectos de sonido los sintetiza SoundEffects y la barra de progreso y los
 * controles de volumen los pinta AudioControlsView.
 */
import {DEFAULT_MUSIC_VOLUME, SOUND} from '../constants.js';

export class AudioManager {
    /**
     * @param {HTMLAudioElement} audioElement - Elemento <audio> de la música
     * @param {SoundEffects} sounds - Para el sonido de cada acción del reproductor
     * @param {Object} [options]
     * @param {{createObjectURL: Function, revokeObjectURL: Function}} [options.urlApi] - Inyectable para pruebas
     */
    constructor(audioElement, sounds, {urlApi = globalThis.URL} = {}) {
        this.audioElement = audioElement;
        this.sounds = sounds;
        this.urlApi = urlApi;
        this.isPlaying = false;
        this.musicVolume = DEFAULT_MUSIC_VOLUME;
        this.currentObjectUrl = null;

        // El propio AudioManager lleva su estado: nadie más debe escribir isPlaying
        this.audioElement.addEventListener('ended', () => {
            this.isPlaying = false;
        });
    }

    /**
     * Indica si hay una canción cargada en el reproductor
     */
    hasSongLoaded() {
        return Boolean(this.audioElement.src);
    }

    /**
     * @param {number} volume - De 0 a 1
     */
    setVolume(volume) {
        this.musicVolume = volume;
        this.audioElement.volume = volume;
    }

    /**
     * Reproduce una canción
     * @param {File|Blob} audioFile - Archivo de audio a reproducir
     * @param {Function} onPlayCallback - Callback cuando empiece a reproducir
     */
    play(audioFile, onPlayCallback) {
        this.sounds.play(SOUND.START);
        this.audioElement.pause();

        // Liberar la URL de la canción anterior para no acumular blobs en memoria
        if (this.currentObjectUrl) {
            this.urlApi.revokeObjectURL(this.currentObjectUrl);
        }
        this.currentObjectUrl = this.urlApi.createObjectURL(audioFile);

        this.audioElement.src = this.currentObjectUrl;
        this.audioElement.volume = this.musicVolume;
        this._startPlayback();

        if (onPlayCallback) {
            onPlayCallback();
        }
    }

    /**
     * Pausa o reanuda la reproducción
     * @returns {boolean} true si queda sonando
     */
    pause() {
        this.sounds.play(SOUND.CLICK);

        if (this.isPlaying) {
            this.audioElement.pause();
            this.isPlaying = false;
            return false;
        }

        this._startPlayback();
        return true;
    }

    /**
     * Inicia la reproducción gestionando el rechazo de play()
     * (p. ej. bloqueo de autoplay o formato no soportado)
     */
    _startPlayback() {
        this.isPlaying = true;
        const playPromise = this.audioElement.play();
        playPromise?.catch(error => {
            // AbortError: se interrumpió porque se cargó otra canción; no es un fallo
            if (error.name === 'AbortError') return;
            console.warn('No se pudo reproducir el audio:', error);
            this.isPlaying = false;
            this.audioElement.dispatchEvent(new Event('playbackfailed'));
        });
    }

    /**
     * Detiene la reproducción y vuelve al principio
     */
    stop() {
        this.sounds.play(SOUND.CLICK);
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
        this.isPlaying = false;
    }

    /**
     * Vuelve al principio y reproduce
     */
    restart() {
        this.sounds.play(SOUND.CLICK);
        this.audioElement.currentTime = 0;
        this._startPlayback();
    }

    /**
     * Salta a un punto de la canción
     * @param {number} fraction - De 0 (inicio) a 1 (final)
     */
    seekToFraction(fraction) {
        if (!this.hasSongLoaded() || !Number.isFinite(this.audioElement.duration)) return;

        const clamped = Math.min(Math.max(fraction, 0), 1);
        this.audioElement.currentTime = clamped * this.audioElement.duration;
        this.sounds.play(SOUND.CLICK);
    }
}
