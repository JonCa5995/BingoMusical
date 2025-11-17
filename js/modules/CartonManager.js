/**
 * CartonManager Module
 * Gestiona la generación, vista previa y descarga de cartones de bingo
 */
export class CartonManager {
    constructor(dom, audio, cartonGenerator) {
        this.dom = dom;
        this.audio = audio;
        this.cartonGenerator = cartonGenerator;
    }

    /**
     * Actualiza la vista previa del cartón
     */
    updateCartonPreview(songs) {
        try {
            // Obtener configuración
            const config = {
                primaryColor: this.dom.cartonPrimaryColorInput.value,
                secondaryColor: this.dom.cartonSecondaryColorInput.value
            };
            
            // Generar un cartón de ejemplo
            const previewCarton = this.cartonGenerator.generateSingleCarton(songs, 1);
            
            // Renderizar vista previa
            this.dom.cartonPreviewContainer.innerHTML = this.generatePreviewHTML(previewCarton, config);
        } catch (error) {
            this.dom.cartonPreviewContainer.innerHTML = `
                <div class="carton-preview-placeholder">
                    <p>❌ Error al generar vista previa</p>
                    <p>${error.message}</p>
                </div>
            `;
            console.error(error);
        }
    }

    /**
     * Genera HTML para la vista previa del cartón
     */
    generatePreviewHTML(carton, config) {
        const { primaryColor, secondaryColor } = config;
        
        const cellsHTML = carton.rows.flatMap(row => 
            row.cells.map(cell => {
                const cellClass = cell.type === 'song' ? 'song' : 'decorative';
                let icon;
                
                if (cell.type === 'song' && cell.song) {
                    // Celda con canción
                    if (cell.song.iconType === 'image') {
                        icon = `<img src="${cell.song.icon}" alt="${cell.song.title}" style="max-width: 90%; max-height: 90%;">`;
                    } else {
                        icon = cell.song.icon;
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
                    <div class="preview-carton-title" style="color: ${primaryColor};">🎵 Bingo Musical</div>
                    <div class="preview-carton-number" style="background-color: ${secondaryColor};">#1</div>
                </div>
                <div class="preview-carton-grid">
                    ${cellsHTML}
                </div>
            </div>
        `;
    }

    /**
     * Genera y descarga cartones
     */
    async generateCartones(songs, format = 'html', maxCartones, minRequired, showAlertCallback) {
        const count = Number.parseInt(this.dom.cartonCountInput.value);

        if (Number.isNaN(count) || count < 1 || count > maxCartones) {
            showAlertCallback(
                `Por favor ingresa un número válido entre 1 y ${maxCartones}.`,
                'Número Inválido'
            );
            return false;
        }

        const totalSongs = songs.filter(s => s.file).length;
        if (totalSongs < minRequired) {
            showAlertCallback(
                `Necesitas al menos ${minRequired} canciones cargadas para poder generar cartones.`,
                'Canciones Insuficientes'
            );
            return false;
        }

        this.audio.playEffect('start');

        try {
            // Obtener configuración de personalización
            const config = {
                primaryColor: this.dom.cartonPrimaryColorInput.value,
                secondaryColor: this.dom.cartonSecondaryColorInput.value
            };
            
            const cartones = this.cartonGenerator.generateCartones(songs, count);
            
            if (format === 'pdf') {
                await this.cartonGenerator.downloadAsPDF(cartones, config);
                showAlertCallback(
                    `${count} cartón(es) generado(s) en PDF exitosamente.`,
                    'Cartones Generados'
                );
            } else {
                this.cartonGenerator.downloadAsHTML(cartones, config);
                showAlertCallback(
                    `${count} cartón(es) generado(s) exitosamente.\n\nEl archivo HTML está listo para imprimir.`,
                    'Cartones Generados'
                );
            }
            
            this.audio.playEffect('win');
            return true;
        } catch (error) {
            showAlertCallback(`Error al generar cartones: ${error.message}`, 'Error');
            return false;
        }
    }

    /**
     * Obtiene la configuración actual de colores
     */
    getCurrentConfig() {
        return {
            primaryColor: this.dom.cartonPrimaryColorInput.value,
            secondaryColor: this.dom.cartonSecondaryColorInput.value
        };
    }

    /**
     * Establece la configuración de colores
     */
    setConfig(config) {
        if (config.primaryColor) {
            this.dom.cartonPrimaryColorInput.value = config.primaryColor;
        }
        if (config.secondaryColor) {
            this.dom.cartonSecondaryColorInput.value = config.secondaryColor;
        }
    }

    /**
     * Obtiene el número de cartones a generar
     */
    getCartonCount() {
        return Number.parseInt(this.dom.cartonCountInput.value) || 1;
    }

    /**
     * Establece el número de cartones a generar
     */
    setCartonCount(count) {
        this.dom.cartonCountInput.value = count;
    }
}
