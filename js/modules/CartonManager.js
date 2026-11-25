import {CELL_TYPE, DEFAULT_GAME_NAME, ICON_TYPE, PRINT_FORMAT, SOUND} from '../constants.js';
import {escapeHTML} from '../utils.js';
import {DECORATIVE_ICON_HTML} from './CartonHtmlRenderer.js';
import {MSG, TEXT} from '../messages.js';

export class CartonManager {
    constructor(previewContainer, sounds, cartonGenerator, cartonExporter) {
        this.previewContainer = previewContainer;
        this.sounds = sounds;
        this.cartonGenerator = cartonGenerator;

        this.exporters = new Map();
        this.registerExporter(PRINT_FORMAT.HTML, (cartones, config) => cartonExporter.downloadAsHTML(cartones, config));
        this.registerExporter(PRINT_FORMAT.PDF, (cartones, config) => cartonExporter.downloadAsPDF(cartones, config));
    }

    registerExporter(format, exporter) {
        this.exporters.set(format, exporter);
    }

    updatePrintPreview(songs, gameName, colors) {
        try {
            const previewCarton = this.cartonGenerator.generateSingleCarton(songs, 1);

            this.previewContainer.innerHTML = this.generatePreviewHTML(previewCarton, colors, gameName);
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

    generatePreviewHTML(carton, config, gameName = '') {
        const {primaryColor, secondaryColor} = config;
        const displayName = escapeHTML(gameName || DEFAULT_GAME_NAME);

        const cellsHTML = carton.rows.flatMap(row =>
            row.cells.map(cell => {
                const cellClass = cell.type === CELL_TYPE.SONG ? 'song' : 'decorative';
                const icon = this._previewCellIcon(cell);

                return `<div class="preview-cell ${cellClass}">
                    ${icon}
                </div>`;
            })
        ).join('');

        return `
            <div class="preview-carton" style="color: ${primaryColor}; border-color: ${primaryColor};">
                <div class="preview-carton-header" style="border-color: ${primaryColor};">
                    <div class="preview-carton-title" style="color: ${primaryColor};">${TEXT.document.cartonTitle(displayName)}</div>
                    <div class="preview-carton-number" style="background-color: ${secondaryColor};">#1</div>
                </div>
                <div class="preview-carton-grid">
                    ${cellsHTML}
                </div>
            </div>
        `;
    }

    _previewCellIcon(cell) {
        if (cell.type === CELL_TYPE.SONG && cell.song) {
            if (cell.song.iconType === ICON_TYPE.IMAGE) {
                return `<img src="${escapeHTML(cell.song.icon)}" alt="${escapeHTML(cell.song.title)}" style="max-width: 90%; max-height: 90%;">`;
            }
            return escapeHTML(cell.song.icon);
        }
        return `<span class="decorative-icon">${DECORATIVE_ICON_HTML}</span>`;
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

            await exporter(cartonesToPrint, {primaryColor, secondaryColor, gameName: gameName || DEFAULT_GAME_NAME});

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

    async generateCartones(songs, count, maxCartones, minRequired, showAlertCallback, existingCartones = []) {
        if (Number.isNaN(count) || count < 1 || count > maxCartones) {
            showAlertCallback(MSG.cartones.invalidCount(maxCartones));
            return {success: false};
        }

        const totalSongs = songs.filter(s => s.file).length;
        if (totalSongs < minRequired) {
            showAlertCallback(MSG.cartones.notEnoughSongs(minRequired));
            return {success: false};
        }

        this.sounds.play(SOUND.START);

        try {
            const cartones = this.cartonGenerator.generateCartones(songs, count, existingCartones);

            this.sounds.play(SOUND.WIN);
            return {success: true, cartones};
        } catch (error) {
            showAlertCallback(MSG.cartones.generateFailed(error.message));
            return {success: false};
        }
    }
}
