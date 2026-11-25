export class DragAndDropUploader {
    constructor({zones, fileInput, isEnabled}) {
        this.zones = zones;
        this.fileInput = fileInput;
        this.isEnabled = isEnabled;
    }

    init() {
        for (const zone of this.zones) {
            for (const eventName of ['dragenter', 'dragover', 'dragleave', 'drop']) {
                zone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                });
            }

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
