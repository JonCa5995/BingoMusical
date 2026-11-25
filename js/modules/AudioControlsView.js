export class AudioControlsView {
    constructor({audioElement, elements, handlers}) {
        this.audioElement = audioElement;
        this.el = elements;
        this.handlers = handlers;
    }

    bind() {
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

    updateProgress() {
        const {currentTime, duration} = this.audioElement;
        const progress = (currentTime / duration) * 100;
        if (!Number.isFinite(progress)) return;

        this.el.progressFill.value = progress;
        this.el.progressFill.setAttribute('aria-valuenow', Math.round(progress).toString());

        this.el.currentTimeSpan.textContent = formatTime(currentTime);
        this.el.currentTimeSpan.setAttribute('datetime', `PT${Math.floor(currentTime)}S`);
    }

    updateDuration() {
        const duration = this.audioElement.duration;
        this.el.durationSpan.textContent = formatTime(duration);
        this.el.durationSpan.setAttribute('datetime', `PT${Number.isFinite(duration) ? Math.floor(duration) : 0}S`);
    }
}

export function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
