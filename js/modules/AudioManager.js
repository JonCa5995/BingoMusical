import {DEFAULT_MUSIC_VOLUME, SOUND} from '../constants.js';

export class AudioManager {
    constructor(audioElement, sounds, {urlApi = globalThis.URL} = {}) {
        this.audioElement = audioElement;
        this.sounds = sounds;
        this.urlApi = urlApi;
        this.isPlaying = false;
        this.musicVolume = DEFAULT_MUSIC_VOLUME;
        this.currentObjectUrl = null;

        this.audioElement.addEventListener('ended', () => {
            this.isPlaying = false;
        });
    }

    hasSongLoaded() {
        return Boolean(this.audioElement.src);
    }

    setVolume(volume) {
        this.musicVolume = volume;
        this.audioElement.volume = volume;
    }

    play(audioFile, onPlayCallback) {
        this.sounds.play(SOUND.START);
        this.audioElement.pause();

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

    _startPlayback() {
        this.isPlaying = true;
        const playPromise = this.audioElement.play();
        playPromise?.catch(error => {
            if (error.name === 'AbortError') return;
            console.warn('No se pudo reproducir el audio:', error);
            this.isPlaying = false;
            this.audioElement.dispatchEvent(new Event('playbackfailed'));
        });
    }

    stop() {
        this.sounds.play(SOUND.CLICK);
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
        this.isPlaying = false;
    }

    restart() {
        this.sounds.play(SOUND.CLICK);
        this.audioElement.currentTime = 0;
        this._startPlayback();
    }

    seekToFraction(fraction) {
        if (!this.hasSongLoaded() || !Number.isFinite(this.audioElement.duration)) return;

        const clamped = Math.min(Math.max(fraction, 0), 1);
        this.audioElement.currentTime = clamped * this.audioElement.duration;
        this.sounds.play(SOUND.CLICK);
    }
}
