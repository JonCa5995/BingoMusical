import {PRINT_DIALOG_DELAY_MS} from '../constants.js';
import {downloadFile, gameNameOrDefault, slugify} from '../utils.js';
import {TEXT} from '../messages.js';

export class CartonExporter {
    constructor(renderer, win = globalThis.window) {
        this.renderer = renderer;
        this.window = win;
    }

    downloadAsHTML(cartones, config = {}) {
        const gameName = gameNameOrDefault(config.gameName);
        const html = this.renderer.generatePrintableHTML(cartones, config);

        downloadFile(
            html,
            `cartones-${slugify(gameName)}.html`,
            'text/html;charset=utf-8',
            TEXT.cartones.downloadLabel(cartones.length)
        );
    }

    async downloadAsPDF(cartones, config = {}) {
        const html = this.renderer.generatePrintableHTML(cartones, config);
        const url = URL.createObjectURL(new Blob([html], {type: 'text/html;charset=utf-8'}));
        const printWindow = this.window.open(url, '_blank');

        if (!printWindow) {
            URL.revokeObjectURL(url);
            throw new Error(TEXT.cartones.popupBlocked);
        }

        printWindow.onload = () => {
            URL.revokeObjectURL(url);
            printWindow.focus();
            setTimeout(() => printWindow.print(), PRINT_DIALOG_DELAY_MS);
        };
    }
}
