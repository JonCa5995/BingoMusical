import {DEFAULT_MUSIC_VOLUME, SOUND} from '../constants.js';

export class AudioManager {
    constructor(audioElement, sounds, {urlApi = globalThis.URL} = {}) {
        this.audioElement = audioElement;
        this.sounds = sounds;
        this.urlApi = urlApi;
        this.isPlaying = false;
        this.musicVolume = DEFAULT_MUSIC_VOLUME;
        this.currentObjectUrl = null;

        this.clip = null;
        this.pendingClip = null;

        this.audioElement.addEventListener('ended', () => {
            this.isPlaying = false;
        });
        this.audioElement.addEventListener('loadedmetadata', () => this._applyClip());
        this.audioElement.addEventListener('timeupdate', () => this._endClipIfReached());
    }

    _applyClip() {
        const pending = this.pendingClip;
        this.pendingClip = null;
        this.clip = null;

        const duration = this.audioElement.duration;
        if (!pending || !Number.isFinite(duration) || duration <= pending.seconds) return;

        const start = pending.randomStart ? Math.random() * (duration - pending.seconds) : 0;
        this.clip = {start, end: start + pending.seconds};

        if (start > 0) {
            this.audioElement.currentTime = start;
        }
    }

    _endClipIfReached() {
        if (!this.clip || this.audioElement.paused === true || this.audioElement.currentTime < this.clip.end) return;

        this.audioElement.pause();
        this.audioElement.dispatchEvent(new Event('ended'));
    }

    getTimeline() {
        const {currentTime, duration} = this.audioElement;
        if (!this.clip) return {currentTime, duration};

        return {currentTime: Math.max(0, currentTime - this.clip.start), duration: this.clip.end - this.clip.start};
    }

    hasSongLoaded() {
        return Boolean(this.audioElement.src);
    }

    setVolume(volume) {
        this.musicVolume = volume;
        this.audioElement.volume = volume;
    }

    play(audioFile, onPlayCallback, clip = null) {
        this.sounds.play(SOUND.START);
        this.audioElement.pause();

        if (this.currentObjectUrl) {
            this.urlApi.revokeObjectURL(this.currentObjectUrl);
        }
        this.currentObjectUrl = this.urlApi.createObjectURL(audioFile);

        this.audioElement.src = this.currentObjectUrl;
        this.audioElement.volume = this.musicVolume;
        this.clip = null;
        this.pendingClip = clip?.seconds > 0 ? clip : null;
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
        this.audioElement.currentTime = this.clip?.start ?? 0;
        this.isPlaying = false;
    }

    restart() {
        this.sounds.play(SOUND.CLICK);
        this.audioElement.currentTime = this.clip?.start ?? 0;
        this._startPlayback();
    }

    seekToFraction(fraction) {
        if (!this.hasSongLoaded() || !Number.isFinite(this.audioElement.duration)) return;

        const clamped = Math.min(Math.max(fraction, 0), 1);
        const {start, length} = this.clip
            ? {start: this.clip.start, length: this.clip.end - this.clip.start}
            : {start: 0, length: this.audioElement.duration};
        this.audioElement.currentTime = start + clamped * length;
        this.sounds.play(SOUND.CLICK);
    }
}
