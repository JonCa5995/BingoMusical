import {DEFAULT_ICON_REVEAL_TIME, DEFAULT_TITLE_REVEAL_TIME, MAX_REVEAL_TIME_SECONDS, SOUND} from '../constants.js';
import {MSG, TEXT} from '../messages.js';

export class ConfigModal {
    constructor({elements, game, modals, dialogs, sounds, canOpen}) {
        this.el = elements;
        this.game = game;
        this.modals = modals;
        this.dialogs = dialogs;
        this.sounds = sounds;
        this.canOpen = canOpen;
    }

    init() {
        const el = this.el;

        for (const [slider, label, seconds] of [
            [el.titleRevealTimeSlider, el.titleRevealValueSpan, DEFAULT_TITLE_REVEAL_TIME],
            [el.iconRevealTimeSlider, el.iconRevealValueSpan, DEFAULT_ICON_REVEAL_TIME]
        ]) {
            slider.max = MAX_REVEAL_TIME_SECONDS;
            slider.value = seconds;
            label.textContent = TEXT.seconds(seconds);

            slider.addEventListener('input', (e) => {
                label.textContent = TEXT.seconds(e.target.value);
            });
        }

        el.configBtn.addEventListener('click', () => this.open());
        this.modals.registerWithCloseButton(el.configModal, el.closeConfigModalBtn);
        el.saveConfigBtn.addEventListener('click', () => this.save());
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

        this.game.setTitleRevealTime(titleRevealTime);
        this.game.setIconRevealTime(iconRevealTime);

        this.sounds.play(SOUND.WIN);
        this.dialogs.showAlert(MSG.config.saved(titleRevealTime, iconRevealTime));
        this.modals.closeWithClick(this.el.configModal);
    }
}
