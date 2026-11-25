import {MAX_CARTONS_GENERATED, MIN_SONGS_REQUIRED, PRINT_FORMAT, SOUND} from '../constants.js';
import {escapeHTML, gameNameOrDefault} from '../utils.js';
import {MSG, TEXT} from '../messages.js';

export class CartonManager {
    constructor(previewContainer, sounds, cartonGenerator, cartonExporter, renderer) {
        this.previewContainer = previewContainer;
        this.sounds = sounds;
        this.cartonGenerator = cartonGenerator;
        this.renderer = renderer;

        this.exporters = new Map();
        this.registerExporter(PRINT_FORMAT.HTML, (cartones, config) => cartonExporter.downloadAsHTML(cartones, config));
        this.registerExporter(PRINT_FORMAT.PDF, (cartones, config) => cartonExporter.downloadAsPDF(cartones, config));
    }

    registerExporter(format, exporter) {
        this.exporters.set(format, exporter);
    }

    updatePrintPreview(carton, gameName, colors) {
        try {
            this.previewContainer.innerHTML = this.renderer.generatePreviewHTML(carton, colors, gameName);
        } catch (error) {
            this.previewContainer.innerHTML = `
                <div class="carton-preview-placeholder">
                    <p>${TEXT.cartones.previewError}</p>
                    <p>${escapeHTML(error.message)}</p>
                </div>
            `;
            console.error(error);
        }
    }

    async printCartonesWithConfig(cartones, gameName, format = PRINT_FORMAT.HTML, options = {}) {
        const {printAll, from, to, primaryColor, secondaryColor} = options;

        if (!cartones || cartones.length === 0) {
            return {success: false, error: TEXT.cartones.noneToPrint};
        }

        try {
            const cartonesToPrint = printAll ? cartones : this._selectRange(cartones, from, to);
            if (!cartonesToPrint) {
                return {success: false, error: TEXT.cartones.invalidRange(cartones.length)};
            }

            const exporter = this.exporters.get(format);
            if (!exporter) {
                return {success: false, error: TEXT.cartones.unsupportedFormat(format)};
            }

            await exporter(cartonesToPrint, {primaryColor, secondaryColor, gameName: gameNameOrDefault(gameName)});

            return {success: true, count: cartonesToPrint.length};
        } catch (error) {
            return {success: false, error: error.message};
        }
    }

    _selectRange(cartones, rawFrom, rawTo) {
        const from = rawFrom || 1;
        const to = rawTo || cartones.length;

        if (from < 1 || from > cartones.length || to < 1 || to > cartones.length || from > to) {
            return null;
        }

        return cartones.slice(from - 1, to);
    }

    generate(songs, count, existingCartones = []) {
        if (Number.isNaN(count) || count < 1 || count > MAX_CARTONS_GENERATED) {
            return {success: false, alert: MSG.cartones.invalidCount(MAX_CARTONS_GENERATED)};
        }

        const playableSongs = songs.filter(song => song.file);
        if (playableSongs.length < MIN_SONGS_REQUIRED) {
            return {success: false, alert: MSG.cartones.notEnoughSongs(MIN_SONGS_REQUIRED)};
        }

        this.sounds.play(SOUND.START);

        try {
            const {cartones, missing} = this.cartonGenerator.generateAsMany(playableSongs, count, existingCartones);

            this.sounds.play(SOUND.WIN);
            return {success: true, cartones, requested: count, missing};
        } catch (error) {
            return {success: false, alert: MSG.cartones.generateFailed(error.message)};
        }
    }
}
