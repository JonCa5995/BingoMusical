/**
 * CartonManager Module
 * Gestiona la generación, vista previa y descarga de cartones de bingo
 */
import {DEFAULT_GAME_NAME} from '../constants.js';
import {escapeHTML} from '../utils.js';
import {DECORATIVE_ICON_HTML} from './CartonHtmlRenderer.js';

export class CartonManager {
    /**
     * @param {DOMElements} dom
     * @param {SoundEffects} sounds - Efectos de sonido de cada acción
     * @param {BingoCartonGenerator} cartonGenerator - Genera los datos de los cartones
     * @param {CartonExporter} cartonExporter - Entrega los cartones (HTML/PDF)
     */
    constructor(dom, sounds, cartonGenerator, cartonExporter) {
        this.dom = dom;
        this.sounds = sounds;
        this.cartonGenerator = cartonGenerator;

        // Exportadores por formato: añadir uno nuevo no requiere modificar printCartonesWithConfig
        this.exporters = new Map();
        this.registerExporter('html', (cartones, config) => cartonExporter.downloadAsHTML(cartones, config));
        this.registerExporter('pdf', (cartones, config) => cartonExporter.downloadAsPDF(cartones, config));
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
     */
    updatePrintPreview(songs, gameName = '') {
        try {
            const config = {
                primaryColor: this.dom.printPrimaryColorInput.value,
                secondaryColor: this.dom.printSecondaryColorInput.value
            };

            // Generar un cartón de ejemplo
            const previewCarton = this.cartonGenerator.generateSingleCarton(songs, 1);

            // Renderizar vista previa
            this.dom.printCartonPreview.innerHTML = this.generatePreviewHTML(previewCarton, config, gameName);
        } catch (error) {
            this.dom.printCartonPreview.innerHTML = `
                <div class="carton-preview-placeholder">
                    <p>❌ Error al generar vista previa</p>
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
                const cellClass = cell.type === 'song' ? 'song' : 'decorative';
                let icon;

                if (cell.type === 'song' && cell.song) {
                    // Celda con canción
                    if (cell.song.iconType === 'image') {
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
                    <div class="preview-carton-title" style="color: ${primaryColor};">🎵 ${displayName}</div>
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
     */
    async printCartonesWithConfig(cartones, gameName, format = 'html') {
        if (!cartones || cartones.length === 0) {
            return {success: false, error: 'No hay cartones para imprimir'};
        }

        try {
            // Obtener selección de rango
            const printAll = this.dom.printRangeRadios[0].checked;
            let cartonesToPrint = cartones;

            if (!printAll) {
                // Filtrar por rango
                const from = Number.parseInt(this.dom.rangeFromInput.value) || 1;
                const to = Number.parseInt(this.dom.rangeToInput.value) || cartones.length;

                // Validar rango
                if (from < 1 || from > cartones.length || to < 1 || to > cartones.length || from > to) {
                    return {
                        success: false,
                        error: `Rango inválido. Debe ser entre 1 y ${cartones.length}, y "Desde" debe ser menor o igual que "Hasta".`
                    };
                }

                // Filtrar cartones por índice (0-based)
                cartonesToPrint = cartones.slice(from - 1, to);
            }

            // Obtener configuración del modal de impresión
            const config = {
                primaryColor: this.dom.printPrimaryColorInput.value,
                secondaryColor: this.dom.printSecondaryColorInput.value,
                gameName: gameName || DEFAULT_GAME_NAME
            };

            const exporter = this.exporters.get(format);
            if (!exporter) {
                return {success: false, error: `Formato de impresión no soportado: ${format}`};
            }
            await exporter(cartonesToPrint, config);

            return {success: true, count: cartonesToPrint.length};
        } catch (error) {
            return {success: false, error: error.message};
        }
    }

    /**
     * Genera cartones sin descargarlos
     * @param {Array} existingCartones - Cartones ya existentes (solo en modo añadir): los nuevos no repiten sus filas
     */
    async generateCartones(songs, maxCartones, minRequired, showAlertCallback, existingCartones = []) {
        const count = Number.parseInt(this.dom.cartonCountInput.value);

        if (Number.isNaN(count) || count < 1 || count > maxCartones) {
            showAlertCallback(
                `Por favor ingresa un número válido entre 1 y ${maxCartones}.`,
                'Número Inválido'
            );
            return {success: false};
        }

        const totalSongs = songs.filter(s => s.file).length;
        if (totalSongs < minRequired) {
            showAlertCallback(
                `Necesitas al menos ${minRequired} canciones cargadas para poder generar cartones.`,
                'Canciones Insuficientes'
            );
            return {success: false};
        }

        this.sounds.play('start');

        try {
            const cartones = this.cartonGenerator.generateCartones(songs, count, existingCartones);

            this.sounds.play('win');
            return {success: true, cartones};
        } catch (error) {
            showAlertCallback(`Error al generar cartones: ${error.message}`, 'Error');
            return {success: false};
        }
    }

}
