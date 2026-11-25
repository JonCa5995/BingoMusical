/**
 * CartonModals Module
 * Los tres modales de cartones, que forman un solo flujo:
 *   opciones -> generación (crear o añadir) o impresión, con borrado desde las opciones.
 * La lógica de generar, imprimir y la vista previa está en CartonManager.
 */
import {
    CARTON_MODE,
    DEFAULT_CARTON_COUNT,
    DEFAULT_GAME_NAME,
    DEFAULT_PRINT_PRIMARY_COLOR,
    DEFAULT_PRINT_SECONDARY_COLOR,
    MAX_CARTONS_GENERATED,
    MIN_SONGS_REQUIRED,
    PRINT_FORMAT,
    SOUND
} from '../constants.js';
import {MSG, TEXT} from '../messages.js';

export class CartonModals {
    /**
     * @param {Object} deps
     * @param {DOMElements} deps.dom
     * @param {GameManager} deps.game - Cartones guardados y nombre del juego
     * @param {CartonManager} deps.cartonManager - Generar, imprimir y vista previa
     * @param {ModalManager} deps.modals
     * @param {Dialogs} deps.dialogs
     * @param {SoundEffects} deps.sounds
     * @param {Function} deps.getSongs - Devuelve las canciones actuales
     * @param {Function} deps.onCartonesChanged - Se llama tras crear, añadir o borrar cartones (refresca la interfaz)
     */
    constructor({dom, game, cartonManager, modals, dialogs, sounds, getSongs, onCartonesChanged}) {
        this.dom = dom;
        this.game = game;
        this.cartonManager = cartonManager;
        this.modals = modals;
        this.dialogs = dialogs;
        this.sounds = sounds;
        this.getSongs = getSongs;
        this.onCartonesChanged = onCartonesChanged;
        this.mode = null;   // CARTON_MODE.NEW o ADD mientras está abierto el modal de generación
    }

    /**
     * Deja los controles con sus valores iniciales y conecta los botones de los tres modales
     */
    init() {
        const dom = this.dom;

        // Valores iniciales: cantidad de cartones que propone la generación y colores de impresión
        dom.cartonCountInput.max = MAX_CARTONS_GENERATED;
        dom.cartonCountInput.value = DEFAULT_CARTON_COUNT;
        dom.printPrimaryColorInput.value = DEFAULT_PRINT_PRIMARY_COLOR;
        dom.printSecondaryColorInput.value = DEFAULT_PRINT_SECONDARY_COLOR;
        document.querySelector('.color-preview-print')?.style.setProperty('background-color', DEFAULT_PRINT_PRIMARY_COLOR);
        document.querySelector('.color-preview-print-secondary')?.style.setProperty('background-color', DEFAULT_PRINT_SECONDARY_COLOR);

        dom.generateCartonesBtn.addEventListener('click', () => this.openOptions());

        // Modal de opciones
        this.modals.registerWithCloseButton(dom.cartonOptionsModal, dom.closeCartonOptionsModalBtn);
        dom.createNewCartonesBtn.addEventListener('click', () => this.startGeneration(CARTON_MODE.NEW));
        dom.addCartonesBtn.addEventListener('click', () => this.startGeneration(CARTON_MODE.ADD));
        dom.printExistingCartonesBtn.addEventListener('click', () => this.printExisting());
        dom.deleteAllCartonesBtn.addEventListener('click', () => this.deleteAll());

        // Modal de generación (solo pide la cantidad)
        this.modals.registerWithCloseButton(dom.cartonModal, dom.closeCartonModalBtn);
        dom.generateSaveCartonesBtn.addEventListener('click', () => this.generate());

        // Modal de impresión (con personalización)
        this.modals.registerWithCloseButton(dom.printModal, dom.closePrintModalBtn);
        dom.printHtmlBtn.addEventListener('click', () => this.print(PRINT_FORMAT.HTML));
        dom.printPdfBtn.addEventListener('click', () => this.print(PRINT_FORMAT.PDF));
        dom.previewPrintBtn.addEventListener('click', () => this.updatePreview());

        // Selector de rango: los campos Desde/Hasta solo se ven con "rango"
        dom.printRangeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const showRange = e.target.value === 'range';
                dom.rangeInputsContainer.style.display = showRange ? 'block' : 'none';
            });
        });

        // La vista previa sigue a los colores elegidos
        dom.printPrimaryColorInput.addEventListener('input', (e) => {
            document.querySelector('.color-preview-print').style.backgroundColor = e.target.value;
            this.updatePreview();
        });
        dom.printSecondaryColorInput.addEventListener('input', (e) => {
            document.querySelector('.color-preview-print-secondary').style.backgroundColor = e.target.value;
            this.updatePreview();
        });
    }

    /**
     * Verifica si hay cartones existentes, pide confirmación y los borra si el usuario acepta.
     * La usan las operaciones de canciones e iconos, que dejarían los cartones desfasados.
     * @param {string} action - Qué se va a hacer (encaja en "Al ..., se borrarán TODOS los cartones")
     * @returns {Promise<boolean>} true si no hay cartones o el usuario confirmó, false si canceló
     */
    async confirmAndClear(action) {
        const cartonesCount = this.game.getCartonesCount();
        if (cartonesCount > 0) {
            const confirmed = await this.dialogs.showConfirm(MSG.cartones.existing(cartonesCount, action));

            if (!confirmed) {
                return false;
            }

            this.game.clearCartones();
            this.onCartonesChanged();
        }
        return true;
    }

    // ============================================================
    // OPCIONES
    // ============================================================

    openOptions() {
        const existingCount = this.game.getCartonesCount();

        // Mostrar información de cartones existentes
        if (existingCount > 0) {
            this.dom.existingCartonesInfo.textContent = TEXT.cartones.optionsInfo(existingCount);
            this.dom.printExistingCartonesBtn.disabled = false;
            this.dom.deleteAllCartonesBtn.disabled = false;
        } else {
            this.dom.existingCartonesInfo.textContent = TEXT.cartones.noneInfo;
            this.dom.printExistingCartonesBtn.disabled = true;
            this.dom.deleteAllCartonesBtn.disabled = true;
        }

        this.modals.openWithClick(this.dom.cartonOptionsModal);
    }

    /**
     * Pasa del modal de opciones al de generación (solo pide la cantidad)
     * @param {'new'|'add'} mode - Crear cartones nuevos o añadir a los existentes
     */
    startGeneration(mode) {
        this.mode = mode;
        this.modals.closeWithClick(this.dom.cartonOptionsModal);
        this.modals.openWithClick(this.dom.cartonModal);
    }

    printExisting() {
        if (this.game.getCartonesCount() === 0) {
            this.dialogs.showAlert(MSG.cartones.noneToPrint);
            return;
        }

        this.modals.closeWithClick(this.dom.cartonOptionsModal);

        // Abrir modal de impresión con personalización
        this.openPrint();
    }

    async deleteAll() {
        const existingCount = this.game.getCartonesCount();

        if (existingCount === 0) {
            this.dialogs.showAlert(MSG.cartones.noneToDelete);
            return;
        }

        const confirmed = await this.dialogs.showConfirm(MSG.cartones.confirmDelete(existingCount));

        if (confirmed) {
            this.game.clearCartones();
            this.sounds.play(SOUND.CLICK);
            this.onCartonesChanged();
            this.modals.closeWithClick(this.dom.cartonOptionsModal);
            this.dialogs.showAlert(MSG.cartones.deleted);
        }
    }

    // ============================================================
    // GENERACIÓN
    // ============================================================

    async generate() {
        const mode = this.mode || CARTON_MODE.NEW;
        const existingCartones = mode === CARTON_MODE.ADD ? this.game.getCartones() : [];

        const result = await this.cartonManager.generateCartones(
            this.getSongs(),
            MAX_CARTONS_GENERATED,
            MIN_SONGS_REQUIRED,
            (alert) => this.dialogs.showAlert(alert),
            existingCartones
        );

        if (result.success) {
            const count = result.cartones.length;

            // Guardar o añadir cartones según el modo
            if (mode === CARTON_MODE.NEW) {
                this.game.setCartones(result.cartones);
                this.dialogs.showAlert(MSG.cartones.generated(count));
            } else if (mode === CARTON_MODE.ADD) {
                this.game.addCartones(result.cartones);
                this.dialogs.showAlert(MSG.cartones.added(count, this.game.getCartonesCount()));
            }

            this.onCartonesChanged();
            this.modals.closeWithClick(this.dom.cartonModal);
            this.mode = null;
        }
    }

    // ============================================================
    // IMPRESIÓN
    // ============================================================

    openPrint() {
        const count = this.game.getCartonesCount();

        // Actualizar información
        this.dom.printCartonesInfo.textContent = TEXT.cartones.printInfo(count);

        // Configurar valores de rango
        this.dom.rangeFromInput.max = count;
        this.dom.rangeToInput.max = count;
        this.dom.rangeToInput.value = count;

        // Resetear a "todos"
        this.dom.printRangeRadios[0].checked = true;
        this.dom.rangeInputsContainer.style.display = 'none';

        // Generar vista previa inicial
        this.updatePreview();

        this.modals.openWithClick(this.dom.printModal);
    }

    async print(format = PRINT_FORMAT.HTML) {
        const gameName = this.game.getGameName() || DEFAULT_GAME_NAME;

        this.sounds.play(SOUND.START);

        const result = await this.cartonManager.printCartonesWithConfig(this.game.getCartones(), gameName, format);

        if (result.success) {
            this.sounds.play(SOUND.WIN);
            this.dialogs.showAlert(MSG.cartones.printed(result.count, format));
            this.modals.closeWithClick(this.dom.printModal);
        } else {
            this.dialogs.showAlert(MSG.cartones.printFailed(result.error));
        }
    }

    updatePreview() {
        const gameName = this.game.getGameName() || DEFAULT_GAME_NAME;
        this.cartonManager.updatePrintPreview(this.getSongs(), gameName);
    }
}
