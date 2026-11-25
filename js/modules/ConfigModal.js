import {MAX_CLIP_SECONDS, MAX_REVEAL_TIME_SECONDS, SOUND} from '../constants.js';
import {MSG, TEXT} from '../messages.js';
import {downloadFile} from '../utils.js';
import {buildSettingsFile, parseSettingsFile} from './SettingsFile.js';

export class ConfigModal {
    constructor({elements, game, modals, dialogs, sounds, canOpen, getSettings, onSaved, onSettingsImported, download = downloadFile, now = () => new Date()}) {
        this.el = elements;
        this.game = game;
        this.modals = modals;
        this.dialogs = dialogs;
        this.sounds = sounds;
        this.canOpen = canOpen;
        this.getSettings = getSettings;
        this.onSaved = onSaved;
        this.onSettingsImported = onSettingsImported;
        this.download = download;
        this.now = now;
    }

    init() {
        const el = this.el;

        for (const [slider, label, seconds] of [
            [el.titleRevealTimeSlider, el.titleRevealValueSpan, this.game.getTitleRevealTime()],
            [el.iconRevealTimeSlider, el.iconRevealValueSpan, this.game.getIconRevealTime()]
        ]) {
            slider.max = MAX_REVEAL_TIME_SECONDS;
            this._showSeconds(slider, label, seconds);

            slider.addEventListener('input', (e) => {
                label.textContent = TEXT.seconds(e.target.value);
                this._refreshClipHint();
            });
        }

        el.clipSecondsSlider.max = MAX_CLIP_SECONDS;
        this.setClip(this.game.getClip());
        el.clipSecondsSlider.addEventListener('input', () => this._refreshClip());

        el.configBtn.addEventListener('click', () => this.open());
        this.modals.registerWithCloseButton(el.configModal, el.closeConfigModalBtn);
        el.saveConfigBtn.addEventListener('click', () => this.save());
        el.exportSettingsBtn.addEventListener('click', () => this.exportSettings());
        el.importSettingsBtn.addEventListener('click', () => el.importSettingsInput.click());
        el.importSettingsInput.addEventListener('change', (e) => this.importSettings(e));
    }

    _showSeconds(slider, label, seconds) {
        slider.value = seconds;
        label.textContent = TEXT.seconds(seconds);
    }

    setClip({seconds, randomStart}) {
        this.el.clipSecondsSlider.value = seconds;
        this.el.randomClipStartCheckbox.checked = randomStart;
        this._refreshClip();
    }

    _refreshClip() {
        const seconds = Number.parseInt(this.el.clipSecondsSlider.value);

        this.el.clipSecondsValueSpan.textContent = TEXT.clipSeconds(seconds);
        this.el.randomClipStartCheckbox.disabled = seconds === 0;
        this._refreshClipHint();
    }

    _refreshClipHint() {
        const clip = Number.parseInt(this.el.clipSecondsSlider.value);
        const reveal = Math.max(Number.parseInt(this.el.titleRevealTimeSlider.value), Number.parseInt(this.el.iconRevealTimeSlider.value));

        this.el.clipWarning.textContent = clip > 0 && clip <= reveal ? TEXT.clipWarning(clip, reveal) : '';
    }

    setRevealTimes(titleRevealTime, iconRevealTime) {
        this._showSeconds(this.el.titleRevealTimeSlider, this.el.titleRevealValueSpan, titleRevealTime);
        this._showSeconds(this.el.iconRevealTimeSlider, this.el.iconRevealValueSpan, iconRevealTime);
        this._refreshClipHint();
    }

    exportSettings() {
        const date = this.now();
        const fileName = `bingo-config-${date.toISOString().split('T')[0]}.json`;

        this.download(JSON.stringify(buildSettingsFile(this.getSettings(), date), null, 2), fileName, 'application/json', TEXT.settings.downloadLabel);
        this.dialogs.showAlert(MSG.settings.exported);
    }

    async importSettings(event) {
        const file = event.target.files[0];
        if (!file) return;

        let result;
        try {
            result = parseSettingsFile(await file.text());
        } catch (error) {
            result = {success: false, error: error.message};
        }
        event.target.value = '';

        if (!result.success) {
            this.dialogs.showAlert(MSG.settings.importFailed(result.error));
            return;
        }

        if (result.applied.length > 0) {
            this.onSettingsImported(result.values);
        }
        this.dialogs.showAlert(MSG.settings.imported(result.applied, result.discarded));
    }

    open() {
        if (!this.canOpen()) {
            return;
        }

        this.modals.openWithClick(this.el.configModal);
    }

    save() {
        const titleRevealTime = Number.parseInt(this.el.titleRevealTimeSlider.value);
        const iconRevealTime = Number.parseInt(this.el.iconRevealTimeSlider.value);
        const clipSeconds = Number.parseInt(this.el.clipSecondsSlider.value);
        const randomClipStart = this.el.randomClipStartCheckbox.checked;

        this.game.setTitleRevealTime(titleRevealTime);
        this.game.setIconRevealTime(iconRevealTime);
        this.game.setClip(clipSeconds, randomClipStart);
        this.onSaved({titleRevealTime, iconRevealTime, clipSeconds, randomClipStart});

        this.sounds.play(SOUND.WIN);
        this.dialogs.showAlert(MSG.config.saved(titleRevealTime, iconRevealTime, this.game.getClip()));
        this.modals.closeWithClick(this.el.configModal);
    }
}
