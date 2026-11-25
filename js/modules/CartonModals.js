import {
    CARTON_MODE,
    MAX_CARTONS_GENERATED,
    PRINT_FORMAT,
    SOUND
} from '../constants.js';
import {MSG, TEXT} from '../messages.js';
import {gameNameOrDefault} from '../utils.js';

export class CartonModals {
    constructor({elements, game, cartonManager, modals, dialogs, sounds, getSongs, onCartonesChanged, settings, onSettingsChanged}) {
        this.el = elements;
        this.game = game;
        this.cartonManager = cartonManager;
        this.modals = modals;
        this.dialogs = dialogs;
        this.sounds = sounds;
        this.getSongs = getSongs;
        this.onCartonesChanged = onCartonesChanged;
        this.initialSettings = settings;
        this.onSettingsChanged = onSettingsChanged;
        this.mode = null;
        this.previewIndex = 0;
    }

    init() {
        this._applyDefaults();
        this.el.generateCartonesBtn.addEventListener('click', () => this.openOptions());
        this._bindOptionsModal();
        this._bindGenerationModal();
        this._bindPrintModal();
    }

    _applyDefaults() {
        const el = this.el;

        el.cartonCountInput.max = MAX_CARTONS_GENERATED;
        this.applySettings(this.initialSettings);
    }

    applySettings(settings) {
        const el = this.el;

        if ('cartonCount' in settings) {
            el.cartonCountInput.value = settings.cartonCount;
        }
        if ('printPrimaryColor' in settings) {
            el.printPrimaryColorInput.value = settings.printPrimaryColor;
            document.querySelector('.color-preview-print')?.style.setProperty('background-color', settings.printPrimaryColor);
        }
        if ('printSecondaryColor' in settings) {
            el.printSecondaryColorInput.value = settings.printSecondaryColor;
            document.querySelector('.color-preview-print-secondary')?.style.setProperty('background-color', settings.printSecondaryColor);
        }
    }

    getSettings() {
        return {
            cartonCount: Number.parseInt(this.el.cartonCountInput.value),
            printPrimaryColor: this.el.printPrimaryColorInput.value,
            printSecondaryColor: this.el.printSecondaryColorInput.value
        };
    }

    _bindOptionsModal() {
        const el = this.el;

        this.modals.registerWithCloseButton(el.cartonOptionsModal, el.closeCartonOptionsModalBtn);
        el.createNewCartonesBtn.addEventListener('click', () => this.startGeneration(CARTON_MODE.NEW));
        el.addCartonesBtn.addEventListener('click', () => this.startGeneration(CARTON_MODE.ADD));
        el.printExistingCartonesBtn.addEventListener('click', () => this.printExisting());
        el.deleteAllCartonesBtn.addEventListener('click', () => this.deleteAll());
    }

    _bindGenerationModal() {
        const el = this.el;

        this.modals.registerWithCloseButton(el.cartonModal, el.closeCartonModalBtn);
        el.generateSaveCartonesBtn.addEventListener('click', () => this.generate());
    }

    _bindPrintModal() {
        const el = this.el;

        this.modals.registerWithCloseButton(el.printModal, el.closePrintModalBtn);
        el.printHtmlBtn.addEventListener('click', () => this.print(PRINT_FORMAT.HTML));
        el.printPdfBtn.addEventListener('click', () => this.print(PRINT_FORMAT.PDF));
        el.previewPrintBtn.addEventListener('click', () => this.updatePreview());
        el.printPreviewPrevBtn.addEventListener('click', () => this.stepPreview(-1));
        el.printPreviewNextBtn.addEventListener('click', () => this.stepPreview(1));

        el.printRangeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const showRange = e.target.value === 'range';
                el.rangeInputsContainer.style.display = showRange ? 'block' : 'none';
            });
        });

        el.printPrimaryColorInput.addEventListener('input', (e) => {
            document.querySelector('.color-preview-print').style.backgroundColor = e.target.value;
            this.onSettingsChanged({printPrimaryColor: e.target.value});
            this.updatePreview();
        });
        el.printSecondaryColorInput.addEventListener('input', (e) => {
            document.querySelector('.color-preview-print-secondary').style.backgroundColor = e.target.value;
            this.onSettingsChanged({printSecondaryColor: e.target.value});
            this.updatePreview();
        });
    }

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
        const hasCartones = existingCount > 0;

        this.el.existingCartonesInfo.textContent = hasCartones ? TEXT.cartones.optionsInfo(existingCount) : TEXT.cartones.noneInfo;
        this.el.printExistingCartonesBtn.disabled = !hasCartones;
        this.el.deleteAllCartonesBtn.disabled = !hasCartones;

        this.modals.openWithClick(this.el.cartonOptionsModal);
    }

    startGeneration(mode) {
        this.mode = mode;
        this.modals.closeWithClick(this.el.cartonOptionsModal);
        this.modals.openWithClick(this.el.cartonModal);
    }

    printExisting() {
        if (this.game.getCartonesCount() === 0) {
            this.dialogs.showAlert(MSG.cartones.noneToPrint);
            return;
        }

        this.modals.closeWithClick(this.el.cartonOptionsModal);

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
            this.modals.closeWithClick(this.el.cartonOptionsModal);
            this.dialogs.showAlert(MSG.cartones.deleted);
        }
    }

    // ============================================================
    // GENERACIÓN
    // ============================================================

    async generate() {
        const mode = this.mode || CARTON_MODE.NEW;
        const existingCartones = mode === CARTON_MODE.ADD ? this.game.getCartones() : [];

        const requestedCount = Number.parseInt(this.el.cartonCountInput.value);
        const result = this.cartonManager.generate(this.getSongs(), requestedCount, existingCartones);

        if (!result.success) {
            this.dialogs.showAlert(result.alert);
            return;
        }

        const count = result.cartones.length;

        if (count === 0) {
            this.dialogs.showAlert(MSG.cartones.noMoreUnique);
            return;
        }

        const partial = result.missing > 0;
        this.onSettingsChanged({cartonCount: requestedCount});

        if (mode === CARTON_MODE.NEW) {
            this.game.setCartones(result.cartones);
            this.dialogs.showAlert(partial ? MSG.cartones.generatedPartial(count, result.requested) : MSG.cartones.generated(count));
        } else if (mode === CARTON_MODE.ADD) {
            this.game.addCartones(result.cartones);
            const total = this.game.getCartonesCount();
            this.dialogs.showAlert(partial ? MSG.cartones.addedPartial(count, result.requested, total) : MSG.cartones.added(count, total));
        }

        this.onCartonesChanged();
        this.modals.closeWithClick(this.el.cartonModal);
        this.mode = null;
    }

    // ============================================================
    // IMPRESIÓN
    // ============================================================

    openPrint() {
        const count = this.game.getCartonesCount();

        this.el.printCartonesInfo.textContent = TEXT.cartones.printInfo(count);

        this.el.rangeFromInput.max = count;
        this.el.rangeToInput.max = count;
        this.el.rangeToInput.value = count;

        this.el.printRangeRadios[0].checked = true;
        this.el.rangeInputsContainer.style.display = 'none';

        this.previewIndex = 0;
        this.updatePreview();

        this.modals.openWithClick(this.el.printModal);
    }

    async print(format = PRINT_FORMAT.HTML) {
        const gameName = gameNameOrDefault(this.game.getGameName());

        this.sounds.play(SOUND.START);

        const result = await this.cartonManager.printCartonesWithConfig(this.game.getCartones(), gameName, format, this._printOptions());

        if (result.success) {
            this.sounds.play(SOUND.WIN);
            this.dialogs.showAlert(MSG.cartones.printed(result.count, format));
            this.modals.closeWithClick(this.el.printModal);
        } else {
            this.dialogs.showAlert(MSG.cartones.printFailed(result.error));
        }
    }

    updatePreview() {
        const cartones = this.game.getCartones();
        if (cartones.length === 0) return;

        this.previewIndex = Math.min(Math.max(this.previewIndex, 0), cartones.length - 1);
        this.cartonManager.updatePrintPreview(cartones[this.previewIndex], gameNameOrDefault(this.game.getGameName()), this._printColors());

        this.el.printPreviewPosition.textContent = TEXT.cartones.previewPosition(this.previewIndex + 1, cartones.length);
        this.el.printPreviewPrevBtn.disabled = this.previewIndex === 0;
        this.el.printPreviewNextBtn.disabled = this.previewIndex === cartones.length - 1;
    }

    stepPreview(offset) {
        this.previewIndex += offset;
        this.updatePreview();
    }

    _printColors() {
        return {
            primaryColor: this.el.printPrimaryColorInput.value,
            secondaryColor: this.el.printSecondaryColorInput.value
        };
    }

    _printOptions() {
        return {
            printAll: this.el.printRangeRadios[0].checked,
            from: Number.parseInt(this.el.rangeFromInput.value),
            to: Number.parseInt(this.el.rangeToInput.value),
            ...this._printColors()
        };
    }
}
