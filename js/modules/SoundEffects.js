/**
 * SoundEffects Module
 * Sintetiza los efectos de sonido (clic, victoria, error...) con Web Audio.
 * No sabe nada de la música ni de la interfaz.
 */

/**
 * Definición de los efectos de sonido (datos, no código).
 * - sweep: un tono que va de startFreq a endFreq
 * - melody: una secuencia de notas separadas por `interval` segundos
 */
export const SOUND_EFFECTS = {
    start: { type: 'sweep', startFreq: 400, endFreq: 800, duration: 0.3, volume: 1, waveType: 'sine' },
    click: { type: 'sweep', startFreq: 800, endFreq: 800, duration: 0.05, volume: 0.2, waveType: 'sine' },
    error: { type: 'sweep', startFreq: 600, endFreq: 100, duration: 0.6, volume: 0.6, waveType: 'square' },
    win: {
        type: 'melody', notes: [523.25, 587.33, 659.25, 783.99],
        interval: 0.15, noteDuration: 0.15, volume: 0.3, waveType: 'sine'
    },
    complete: {
        type: 'melody', notes: [523.25, 659.25, 783.99, 1046.5],
        interval: 0.1, noteDuration: 0.5, volume: 0.4, waveType: 'triangle'
    }
};

/** Crea el AudioContext del navegador */
const createBrowserAudioContext = () => {
    const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;
    return new AudioContextClass();
};

export class SoundEffects {
    /**
     * @param {Object} [options]
     * @param {Object} [options.effects=SOUND_EFFECTS] - Tabla de efectos disponibles
     * @param {Function} [options.createAudioContext] - Fábrica del AudioContext (inyectable para pruebas)
     * @param {number} [options.volume=0.7] - Volumen inicial (0 a 1)
     */
    constructor({ effects = SOUND_EFFECTS, createAudioContext = createBrowserAudioContext, volume = 0.7 } = {}) {
        this.effects = effects;
        this.createAudioContext = createAudioContext;
        this.volume = volume;
        this.audioContext = null;

        // Cada tipo de efecto sabe cómo sintetizarse; añadir un efecto es añadir datos en SOUND_EFFECTS
        this.synthesizers = {
            sweep: (effect) => this._playSweep(effect),
            melody: (effect) => this._playMelody(effect)
        };
    }

    /**
     * Reproduce un efecto por nombre. Un nombre desconocido o el volumen a 0 no hacen nada.
     */
    play(effectName) {
        const effect = this.effects[effectName];
        if (!effect || this.volume <= 0) return;

        try {
            this.synthesizers[effect.type](effect);
        } catch (error) {
            console.warn('Error al reproducir efecto:', error);
        }
    }

    /**
     * @param {number} volume - De 0 a 1
     */
    setVolume(volume) {
        this.volume = volume;
    }

    /**
     * Obtiene o crea el AudioContext (se crea en el primer sonido)
     */
    _getAudioContext() {
        if (!this.audioContext || this.audioContext.state === 'closed') {
            this.audioContext = this.createAudioContext();
        }
        // Reanudar si está suspendido (política de autoplay de navegadores)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        return this.audioContext;
    }

    /**
     * Un tono que va de startFreq a endFreq
     */
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

    /**
     * Una secuencia de notas
     */
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
