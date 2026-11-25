/**
 * ConfigModal Module
 * Modal de configuración: tiempos de revelado del título y del icono.
 */
import {DEFAULT_ICON_REVEAL_TIME, DEFAULT_TITLE_REVEAL_TIME, MAX_REVEAL_TIME_SECONDS, SOUND} from '../constants.js';
import {MSG, TEXT} from '../messages.js';

export class ConfigModal {
    /**
     * @param {Object} deps
     * @param {Object} deps.elements - Los elementos del modal (el.config)
     * @param {GameManager} deps.game - Donde se guardan los tiempos de revelado
     * @param {ModalManager} deps.modals
     * @param {Dialogs} deps.dialogs
     * @param {SoundEffects} deps.sounds
     * @param {Function} deps.canOpen - Devuelve false (y avisa) si ahora no se puede cambiar la configuración
     */
    constructor({elements, game, modals, dialogs, sounds, canOpen}) {
        this.el = elements;
        this.game = game;
        this.modals = modals;
        this.dialogs = dialogs;
        this.sounds = sounds;
        this.canOpen = canOpen;
    }

    /**
     * Deja los sliders con sus valores iniciales y conecta los botones del modal
     */
    init() {
        const el = this.el;

        for (const [slider, label, seconds] of [
            [el.titleRevealTimeSlider, el.titleRevealValueSpan, DEFAULT_TITLE_REVEAL_TIME],
            [el.iconRevealTimeSlider, el.iconRevealValueSpan, DEFAULT_ICON_REVEAL_TIME]
        ]) {
            slider.max = MAX_REVEAL_TIME_SECONDS;
            slider.value = seconds;
            label.textContent = TEXT.seconds(seconds);

            // La etiqueta sigue al slider mientras se mueve
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
