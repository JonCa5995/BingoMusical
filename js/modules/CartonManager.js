/**
 * CartonManager Module
 * Gestiona la generación, vista previa y descarga de cartones de bingo
 */
import { DEFAULT_GAME_NAME } from '../constants.js';
import { escapeHTML } from '../utils.js';

export class CartonManager {
    constructor(dom, audio, cartonGenerator) {
        this.dom = dom;
        this.audio = audio;
        this.cartonGenerator = cartonGenerator;
    }

    /**
     * Prepara cartones para impresión, reconstruyéndolos si es necesario
     * @param {Array} cartones - Cartones a preparar
     * @param {Array} songs - Lista de canciones para reconstrucción
     * @returns {Array} - Cartones listos para imprimir
     */
    prepareCartonesForPrint(cartones, songs) {
        const firstCell = cartones[0]?.rows?.[0]?.cells?.[0];
        const needsReconstruction = firstCell?.songId !== undefined && !firstCell?.song;

        return needsReconstruction
            ? this.reconstructCartones(cartones, songs)
            : cartones;
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
        const { primaryColor, secondaryColor } = config;
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
                    icon = `<span class="decorative-icon">${cell.icon || '🎵'}</span>`;
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
    async printCartonesWithConfig(cartones, songs, gameName, format = 'html') {
        if (!cartones || cartones.length === 0) {
            return { success: false, error: 'No hay cartones para imprimir' };
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

            const cartonesParaImprimir = this.prepareCartonesForPrint(cartonesToPrint, songs);

            // Obtener configuración del modal de impresión
            const config = {
                primaryColor: this.dom.printPrimaryColorInput.value,
                secondaryColor: this.dom.printSecondaryColorInput.value,
                gameName: gameName || DEFAULT_GAME_NAME
            };

            if (format === 'pdf') {
                await this.cartonGenerator.downloadAsPDF(cartonesParaImprimir, config);
            } else {
                this.cartonGenerator.downloadAsHTML(cartonesParaImprimir, config);
            }

            return { success: true, count: cartonesParaImprimir.length };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Genera cartones sin descargarlos
     */
    async generateCartones(songs, maxCartones, minRequired, showAlertCallback, mode = 'new', existingCartones = []) {
        const count = Number.parseInt(this.dom.cartonCountInput.value);

        if (Number.isNaN(count) || count < 1 || count > maxCartones) {
            showAlertCallback(
                `Por favor ingresa un número válido entre 1 y ${maxCartones}.`,
                'Número Inválido'
            );
            return { success: false };
        }

        const totalSongs = songs.filter(s => s.file).length;
        if (totalSongs < minRequired) {
            showAlertCallback(
                `Necesitas al menos ${minRequired} canciones cargadas para poder generar cartones.`,
                'Canciones Insuficientes'
            );
            return { success: false };
        }

        this.audio.playEffect('start');

        try {
            // Generar cartones pasando los existentes si estamos en modo añadir
            const cartonesToPass = mode === 'add' ? existingCartones : [];
            const cartones = this.cartonGenerator.generateCartones(songs, count, cartonesToPass);

            this.audio.playEffect('win');
            return { success: true, cartones };
        } catch (error) {
            showAlertCallback(`Error al generar cartones: ${error.message}`, 'Error');
            return { success: false };
        }
    }

    /**
     * Reconstruye cartones desde datos almacenados
     */
    reconstructCartones(cartonesData, songs) {
        // Crear mapa de canciones por ID (una sola vez para todos los cartones)
        const songMap = new Map(songs.map(s => [s.id, s]));

        return cartonesData.map(cartonData => {
            // Reconstruir filas con referencias a canciones actuales
            const rows = cartonData.rows.map(rowData => ({
                cells: rowData.cells.map(cellData => {
                    // Inferir tipo desde songId: si es null → decorativa, si tiene valor → song
                    if (cellData.songId !== null) {
                        const song = songMap.get(cellData.songId);

                        // Validar que la canción existe
                        if (!song) {
                            console.warn(`Canción con ID ${cellData.songId} no encontrada`);
                            // Convertir a celda decorativa si la canción no existe
                            return {
                                type: 'decorative',
                                position: cellData.position,
                                icon: this.cartonGenerator.emptyIcon
                            };
                        }

                        return {
                            type: 'song',
                            position: cellData.position,
                            song: song, // Esto incluye id, title, icon, iconType, etc.
                            marked: false // Siempre se inicializa en false (no se persiste)
                        };
                    } else {
                        return {
                            type: 'decorative',
                            position: cellData.position,
                            icon: this.cartonGenerator.emptyIcon
                        };
                    }
                })
            }));

            // Reconstruir lista de canciones del cartón
            const cartonSongs = cartonData.songs
                .map(songId => songMap.get(songId))
                .filter(Boolean); // Filtrar canciones que ya no existan

            return {
                id: cartonData.id,
                rows: rows,
                songs: cartonSongs,
                generatedAt: cartonData.generatedAt
            };
        });
    }
}
