import { SOUND, DEFAULT_EFFECTS_VOLUME } from '../constants.js';

export const SOUND_EFFECTS = {
    [SOUND.START]: { type: 'sweep', startFreq: 400, endFreq: 800, duration: 0.3, volume: 1, waveType: 'sine' },
    [SOUND.CLICK]: { type: 'sweep', startFreq: 800, endFreq: 800, duration: 0.05, volume: 0.2, waveType: 'sine' },
    [SOUND.ERROR]: { type: 'sweep', startFreq: 600, endFreq: 100, duration: 0.6, volume: 0.6, waveType: 'square' },
    [SOUND.WIN]: {
        type: 'melody', notes: [523.25, 587.33, 659.25, 783.99],
        interval: 0.15, noteDuration: 0.15, volume: 0.3, waveType: 'sine'
    },
    [SOUND.COMPLETE]: {
        type: 'melody', notes: [523.25, 659.25, 783.99, 1046.5],
        interval: 0.1, noteDuration: 0.5, volume: 0.4, waveType: 'triangle'
    }
};

const createBrowserAudioContext = () => {
    const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
    return new AudioContextClass();
};

export class SoundEffects {
    constructor({ effects = SOUND_EFFECTS, createAudioContext = createBrowserAudioContext, volume = DEFAULT_EFFECTS_VOLUME } = {}) {
        this.effects = effects;
        this.createAudioContext = createAudioContext;
        this.volume = volume;
        this.audioContext = null;

        this.synthesizers = {
            sweep: (effect) => this._playSweep(effect),
            melody: (effect) => this._playMelody(effect)
        };
    }

    play(effectName) {
        const effect = this.effects[effectName];
        if (!effect || this.volume <= 0) return;

        try {
            this.synthesizers[effect.type](effect);
        } catch (error) {
            console.warn('Error al reproducir efecto:', error);
        }
    }

    setVolume(volume) {
        this.volume = volume;
    }

    _getAudioContext() {
        if (!this.audioContext || this.audioContext.state === 'closed') {
            this.audioContext = this.createAudioContext();
        }
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        return this.audioContext;
    }

    _playSweep({ startFreq, endFreq, duration, volume = 1, waveType = 'sine' }) {
        const audioCtx = this._getAudioContext();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = waveType;

        oscillator.frequency.setValueAtTime(startFreq, audioCtx.currentTime);
        if (startFreq !== endFreq) {
            oscillator.frequency.exponentialRampToValueAtTime(endFreq, audioCtx.currentTime + duration);
        }

        gainNode.gain.setValueAtTime(this.volume * volume, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + duration);
    }

    _playMelody({ notes, interval, noteDuration = 0.15, volume = 1, waveType = 'sine' }) {
        const audioCtx = this._getAudioContext();

        for (const [index, freq] of notes.entries()) {
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.type = waveType;
            oscillator.frequency.value = freq;

            const startTime = audioCtx.currentTime + (index * interval);

            gainNode.gain.setValueAtTime(this.volume * volume, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + noteDuration);

            oscillator.start(startTime);
            oscillator.stop(startTime + noteDuration);
        }
    }
}
