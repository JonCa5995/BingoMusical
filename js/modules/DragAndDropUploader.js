/**
 * DragAndDropUploader Module
 * Permite soltar archivos de audio sobre las zonas indicadas. Los pasa al
 * <input type="file"> de añadir canciones, así que siguen el mismo camino que
 * si se eligieran con el botón.
 */
export class DragAndDropUploader {
    /**
     * @param {Object} deps
     * @param {HTMLElement[]} deps.zones - Zonas donde se puede soltar
     * @param {HTMLInputElement} deps.fileInput - Input que recibe los archivos
     * @param {Function} deps.isEnabled - Devuelve false cuando no se admiten archivos (partida iniciada)
     */
    constructor({zones, fileInput, isEnabled}) {
        this.zones = zones;
        this.fileInput = fileInput;
        this.isEnabled = isEnabled;
    }

    init() {
        for (const zone of this.zones) {
            // Evitar que el navegador abra el archivo
            for (const eventName of ['dragenter', 'dragover', 'dragleave', 'drop']) {
                zone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                });
            }

            // Resaltar la zona mientras se arrastra encima
            for (const eventName of ['dragenter', 'dragover']) {
                zone.addEventListener(eventName, () => {
                    if (this.isEnabled()) zone.classList.add('dragover');
                });
            }
            for (const eventName of ['dragleave', 'drop']) {
                zone.addEventListener(eventName, () => zone.classList.remove('dragover'));
            }

            zone.addEventListener('drop', (e) => {
                if (!this.isEnabled()) return;
                this.fileInput.files = e.dataTransfer.files;
                this.fileInput.dispatchEvent(new Event('change', {bubbles: true}));
            });
        }
    }
}
