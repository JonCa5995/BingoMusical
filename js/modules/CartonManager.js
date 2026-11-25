/**
 * CartonManager Module
 * Gestiona la generación, vista previa y descarga de cartones de bingo
 */
import {CELL_TYPE, DEFAULT_GAME_NAME, ICON_TYPE, PRINT_FORMAT, SOUND} from '../constants.js';
import {escapeHTML} from '../utils.js';
import {DECORATIVE_ICON_HTML} from './CartonHtmlRenderer.js';
import {MSG, TEXT} from '../messages.js';

export class CartonManager {
    /**
     * @param {HTMLElement} previewContainer - Donde se pinta la vista previa de impresión (dom.cartones.printCartonPreview)
     * @param {SoundEffects} sounds - Efectos de sonido de cada acción
     * @param {BingoCartonGenerator} cartonGenerator - Genera los datos de los cartones
     * @param {CartonExporter} cartonExporter - Entrega los cartones (HTML/PDF)
     */
    constructor(previewContainer, sounds, cartonGenerator, cartonExporter) {
        this.previewContainer = previewContainer;
        this.sounds = sounds;
        this.cartonGenerator = cartonGenerator;

        // Exportadores por formato: añadir uno nuevo no requiere modificar printCartonesWithConfig
        this.exporters = new Map();
        this.registerExporter(PRINT_FORMAT.HTML, (cartones, config) => cartonExporter.downloadAsHTML(cartones, config));
        this.registerExporter(PRINT_FORMAT.PDF, (cartones, config) => cartonExporter.downloadAsPDF(cartones, config));
    }

    /**
     * Registra un formato de impresión
     * @param {string} format - Identificador del formato (el que se pasa a printCartonesWithConfig)
     * @param {Function} exporter - (cartones, config) => void | Promise<void>
     */
    registerExporter(format, exporter) {
        this.exporters.set(format, exporter);
    }


    /**
     * Actualiza vista previa de impresión (modal de imprimir)
     * @param {Array} songs - Canciones con las que se genera el cartón de ejemplo
     * @param {string} gameName
     * @param {{primaryColor: string, secondaryColor: string}} colors - Colores elegidos en el modal
     */
    updatePrintPreview(songs, gameName, colors) {
        try {
            // Generar un cartón de ejemplo
            const previewCarton = this.cartonGenerator.generateSingleCarton(songs, 1);

            // Renderizar vista previa
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

    /**
     * Genera HTML para la vista previa del cartón
     */
    generatePreviewHTML(carton, config, gameName = '') {
        const {primaryColor, secondaryColor} = config;
        const displayName = escapeHTML(gameName || DEFAULT_GAME_NAME);

        const cellsHTML = carton.rows.flatMap(row =>
            row.cells.map(cell => {
                const cellClass = cell.type === CELL_TYPE.SONG ? 'song' : 'decorative';
                let icon;

                if (cell.type === CELL_TYPE.SONG && cell.song) {
                    // Celda con canción
                    if (cell.song.iconType === ICON_TYPE.IMAGE) {
                        icon = `<img src="${escapeHTML(cell.song.icon)}" alt="${escapeHTML(cell.song.title)}" style="max-width: 90%; max-height: 90%;">`;
                    } else {
                        icon = escapeHTML(cell.song.icon);
                    }
                } else {
                    // Celda decorativa
                    icon = `<span class="decorative-icon">${DECORATIVE_ICON_HTML}</span>`;
                }

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


    /**
     * Imprime cartones con configuración personalizada del modal
     * @param {Array} cartones
     * @param {string} gameName
     * @param {string} format - PRINT_FORMAT.HTML o PRINT_FORMAT.PDF
     * @param {Object} options - Lo que el usuario eligió en el modal de impresión
     * @param {boolean} options.printAll - Imprimir todos los cartones (si no, solo el rango)
     * @param {number} options.from - Primer cartón del rango (NaN si el campo está vacío)
     * @param {number} options.to - Último cartón del rango (NaN si el campo está vacío)
     * @param {string} options.primaryColor
     * @param {string} options.secondaryColor
     */
    async printCartonesWithConfig(cartones, gameName, format = PRINT_FORMAT.HTML, options = {}) {
        const {printAll, from: rawFrom, to: rawTo, primaryColor, secondaryColor} = options;

        if (!cartones || cartones.length === 0) {
            return {success: false, error: TEXT.cartones.noneToPrint};
        }

        try {
            let cartonesToPrint = cartones;

            if (!printAll) {
                // Filtrar por rango
                const from = rawFrom || 1;
                const to = rawTo || cartones.length;

                // Validar rango
                if (from < 1 || from > cartones.length || to < 1 || to > cartones.length || from > to) {
                    return {
                        success: false,
                        error: TEXT.cartones.invalidRange(cartones.length)
                    };
                }

                // Filtrar cartones por índice (0-based)
                cartonesToPrint = cartones.slice(from - 1, to);
            }

            // Obtener configuración del modal de impresión
            const config = {
                primaryColor,
                secondaryColor,
                gameName: gameName || DEFAULT_GAME_NAME
            };

            const exporter = this.exporters.get(format);
            if (!exporter) {
                return {success: false, error: TEXT.cartones.unsupportedFormat(format)};
            }
            await exporter(cartonesToPrint, config);

            return {success: true, count: cartonesToPrint.length};
        } catch (error) {
            return {success: false, error: error.message};
        }
    }

    /**
     * Genera cartones sin descargarlos
     * @param {Array} songs
     * @param {number} count - Cuántos cartones se piden (NaN si el campo está vacío; se valida aquí)
     * @param {Array} existingCartones - Cartones ya existentes (solo en modo añadir): los nuevos no repiten sus filas
     */
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
