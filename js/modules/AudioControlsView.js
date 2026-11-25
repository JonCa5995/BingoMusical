/**
 * AudioControlsView Module
 * Pinta y escucha los controles del reproductor: barra de progreso, tiempos y
 * volúmenes de música y efectos. Lo que hay que hacer con cada cambio lo
 * deciden los callbacks que recibe.
 */
export class AudioControlsView {
    /**
     * @param {Object} deps
     * @param {HTMLAudioElement} deps.audioElement - Del que se leen tiempo y duración
     * @param {Object} deps.elements - progressBar, progressFill, currentTimeSpan, durationSpan,
     *   musicVolumeSlider, musicVolumeValueSpan, effectsVolumeSlider, effectsVolumeValueSpan
     * @param {Object} deps.handlers
     * @param {Function} deps.handlers.onSeek - (fracción de 0 a 1)
     * @param {Function} deps.handlers.onMusicVolume - (volumen de 0 a 1)
     * @param {Function} deps.handlers.onEffectsVolume - (volumen de 0 a 1)
     */
    constructor({audioElement, elements, handlers}) {
        this.audioElement = audioElement;
        this.el = elements;
        this.handlers = handlers;
    }

    /**
     * Empieza a escuchar el reproductor y los controles
     */
    bind() {
        // timeupdate también se dispara al cambiar currentTime (parar, reiniciar, saltar)
        this.audioElement.addEventListener('timeupdate', () => this.updateProgress());
        this.audioElement.addEventListener('loadedmetadata', () => this.updateDuration());

        this.el.progressBar.addEventListener('click', (e) => {
            const width = e.currentTarget.offsetWidth;
            if (width > 0) this.handlers.onSeek(e.offsetX / width);
        });

        this._bindVolumeSlider(this.el.musicVolumeSlider, this.el.musicVolumeValueSpan, this.handlers.onMusicVolume);
        this._bindVolumeSlider(this.el.effectsVolumeSlider, this.el.effectsVolumeValueSpan, this.handlers.onEffectsVolume);
    }

    _bindVolumeSlider(slider, valueSpan, onChange) {
        slider.addEventListener('input', (e) => {
            const value = e.target.value;
            valueSpan.textContent = `${value}%`;
            e.target.setAttribute('aria-valuenow', value);
            onChange(value / 100);
        });
    }

    /**
     * Actualiza la barra de progreso y el tiempo actual
     */
    updateProgress() {
        const {currentTime, duration} = this.audioElement;
        const progress = (currentTime / duration) * 100;
        if (!Number.isFinite(progress)) return;

        this.el.progressFill.value = progress;
        this.el.progressFill.setAttribute('aria-valuenow', Math.round(progress).toString());

        this.el.currentTimeSpan.textContent = formatTime(currentTime);
        this.el.currentTimeSpan.setAttribute('datetime', `PT${Math.floor(currentTime)}S`);
    }

    /**
     * Actualiza la duración total
     */
    updateDuration() {
        const duration = this.audioElement.duration;
        this.el.durationSpan.textContent = formatTime(duration);
        this.el.durationSpan.setAttribute('datetime', `PT${Number.isFinite(duration) ? Math.floor(duration) : 0}S`);
    }
}

/**
 * Formatea segundos a M:SS
 */
export function formatTime(seconds) {
    // NaN (sin metadatos) o Infinity (streams) no tienen duración representable
    if (!Number.isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
