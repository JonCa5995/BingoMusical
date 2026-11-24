/**
 * CartonExporter Module
 * Entrega los cartones al usuario: descarga como HTML o abre el diálogo de impresión (PDF).
 * El HTML lo produce el renderer que recibe; aquí solo se decide cómo se entrega.
 */
import { DEFAULT_GAME_NAME } from '../constants.js';
import { downloadFile, slugify } from '../utils.js';

export class CartonExporter {
    /**
     * @param {{ generatePrintableHTML: (cartones: Array, config: Object) => string }} renderer
     * @param {Window} [win] - Ventana del navegador (inyectable para pruebas)
     */
    constructor(renderer, win = globalThis.window) {
        this.renderer = renderer;
        this.window = win;
    }

    /**
     * Descarga los cartones como archivo HTML imprimible
     */
    downloadAsHTML(cartones, config = {}) {
        const gameName = config.gameName || DEFAULT_GAME_NAME;
        const html = this.renderer.generatePrintableHTML(cartones, config);

        downloadFile(
            html,
            `cartones-${slugify(gameName)}.html`,
            'text/html;charset=utf-8',
            `Descargar ${cartones.length} cartones de bingo`
        );
    }

    /**
     * Abre los cartones en una ventana nueva y lanza el diálogo de impresión,
     * desde el que el usuario puede elegir "Guardar como PDF"
     */
    async downloadAsPDF(cartones, config = {}) {
        const html = this.renderer.generatePrintableHTML(cartones, config);
        const printWindow = this.window.open('', '_blank');

        if (!printWindow) {
            throw new Error('No se pudo abrir la ventana de impresión. Por favor, permite ventanas emergentes.');
        }

        printWindow.document.write(html);
        printWindow.document.close();

        // Esperar a que se cargue el contenido
        printWindow.onload = () => {
            printWindow.focus();
            setTimeout(() => printWindow.print(), 250);
        };
    }
}
