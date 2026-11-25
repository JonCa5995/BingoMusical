/**
 * ConfigModal Module
 * Modal de configuración: tiempos de revelado del título y del icono.
 */
import {DEFAULT_ICON_REVEAL_TIME, DEFAULT_TITLE_REVEAL_TIME, MAX_REVEAL_TIME_SECONDS, SOUND} from '../constants.js';
import {MSG, TEXT} from '../messages.js';

export class ConfigModal {
    /**
     * @param {Object} deps
     * @param {DOMElements} deps.dom
     * @param {GameManager} deps.game - Donde se guardan los tiempos de revelado
     * @param {ModalManager} deps.modals
     * @param {Dialogs} deps.dialogs
     * @param {SoundEffects} deps.sounds
     * @param {Function} deps.canOpen - Devuelve false (y avisa) si ahora no se puede cambiar la configuración
     */
    constructor({dom, game, modals, dialogs, sounds, canOpen}) {
        this.dom = dom;
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
        const dom = this.dom;

        for (const [slider, label, seconds] of [
            [dom.titleRevealTimeSlider, dom.titleRevealValueSpan, DEFAULT_TITLE_REVEAL_TIME],
            [dom.iconRevealTimeSlider, dom.iconRevealValueSpan, DEFAULT_ICON_REVEAL_TIME]
        ]) {
            slider.max = MAX_REVEAL_TIME_SECONDS;
            slider.value = seconds;
            label.textContent = TEXT.seconds(seconds);

            // La etiqueta sigue al slider mientras se mueve
            slider.addEventListener('input', (e) => {
                label.textContent = TEXT.seconds(e.target.value);
            });
        }

        dom.configBtn.addEventListener('click', () => this.open());
        this.modals.registerWithCloseButton(dom.configModal, dom.closeConfigModalBtn);
        dom.saveConfigBtn.addEventListener('click', () => this.save());
    }

    open() {
        if (!this.canOpen()) {
            return;
        }

        this.modals.openWithClick(this.dom.configModal);
    }

    save() {
        const titleRevealTime = Number.parseInt(this.dom.titleRevealTimeSlider.value);
        const iconRevealTime = Number.parseInt(this.dom.iconRevealTimeSlider.value);

        this.game.setTitleRevealTime(titleRevealTime);
        this.game.setIconRevealTime(iconRevealTime);

        this.sounds.play(SOUND.WIN);
        this.dialogs.showAlert(MSG.config.saved(titleRevealTime, iconRevealTime));
        this.modals.closeWithClick(this.dom.configModal);
    }
}
