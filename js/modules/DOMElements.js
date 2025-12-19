/**
 * DOMElements Module
 * Centraliza todas las referencias a elementos DOM de la aplicación
 */
export class DOMElements {
    constructor() {
        this.initializeElements();
    }

    initializeElements() {
        // Nombre del juego
        this.gameNameInput = document.getElementById('game-name-input');

        // Audio y reproductor
        this.audioPlayer = document.getElementById('audio-player');
        this.playBtn = document.getElementById('play-btn');
        this.pauseBtn = document.getElementById('pause-btn');
        this.stopBtn = document.getElementById('stop-btn');
        this.progressBar = document.querySelector('.progress-bar');
        this.progressFill = document.getElementById('progress-fill');
        this.currentTimeSpan = document.getElementById('current-time');
        this.durationSpan = document.getElementById('duration');
        
        // Información de canción actual
        this.songTitleElement = document.getElementById('song-title');
        this.currentIconImg = document.getElementById('current-icon');
        this.songIconContainer = document.querySelector('.song-icon');
        
        // Lista de canciones
        this.addSongsInput = document.getElementById('add-songs');
        this.addSongsLabel = document.querySelector('label[for="add-songs"]');
        this.songsListElement = document.getElementById('songs-list');
        this.songsSection = document.querySelector('.songs-section');
        this.deleteAllBtn = document.getElementById('delete-all-btn');
        
        // Búsqueda y filtrado
        this.searchInput = document.getElementById('song-search');
        this.filterStatus = document.getElementById('filter-status');
        this.sortOrder = document.getElementById('sort-order');
        
        // Historial
        this.historyGrid = document.getElementById('history-grid');
        this.playedCounterSpan = document.getElementById('played-counter');
        this.totalCounterSpan = document.getElementById('total-counter');
        this.clearHistoryBtn = document.getElementById('clear-history');
        
        // Control de juego
        this.shuffleAllBtn = document.getElementById('shuffle-all');
        this.lineaBtn = document.getElementById('linea-btn');
        this.bingoBtn = document.getElementById('bingo-btn');
        
        // Volumen
        this.musicVolumeSlider = document.getElementById('music-volume');
        this.musicVolumeValueSpan = document.getElementById('music-volume-value');
        this.effectsVolumeSlider = document.getElementById('effects-volume');
        this.effectsVolumeValueSpan = document.getElementById('effects-volume-value');
        
        // Modal de iconos
        this.iconModal = document.getElementById('icon-modal');
        this.closeIconModalBtn = document.getElementById('close-modal');
        this.modalSongTitle = document.getElementById('modal-song-title');
        this.iconPickerContainer = document.querySelector('.icon-picker');
        this.uploadCustomIconBtn = document.getElementById('upload-custom-icon-btn');
        this.customIconUploadInput = document.getElementById('custom-icon-upload');
        
        // Modal de cartones
        this.cartonModal = document.getElementById('carton-modal');
        this.closeCartonModalBtn = document.getElementById('close-carton-modal');
        this.generateCartonesBtn = document.getElementById('generate-cartones');
        this.generateHtmlCartonesBtn = document.getElementById('generate-html-cartones');
        this.generatePdfCartonesBtn = document.getElementById('generate-pdf-cartones');
        this.previewCartonBtn = document.getElementById('preview-carton-btn');
        this.cartonCountInput = document.getElementById('carton-count');
        this.cartonPrimaryColorInput = document.getElementById('carton-primary-color');
        this.cartonSecondaryColorInput = document.getElementById('carton-secondary-color');
        this.cartonPreviewContainer = document.getElementById('carton-preview');
        
        // Modal de opciones de cartones
        this.cartonOptionsModal = document.getElementById('carton-options-modal');
        this.closeCartonOptionsModalBtn = document.getElementById('close-carton-options-modal');
        this.existingCartonesInfo = document.getElementById('existing-cartones-info');
        this.createNewCartonesBtn = document.getElementById('create-new-cartones-btn');
        this.addCartonesBtn = document.getElementById('add-cartones-btn');
        this.printExistingCartonesBtn = document.getElementById('print-existing-cartones-btn');

        // Modal de configuración
        this.configBtn = document.getElementById('config-btn');
        this.configModal = document.getElementById('config-modal');
        this.closeConfigModalBtn = document.getElementById('close-config-modal');
        this.titleRevealTimeSlider = document.getElementById('title-reveal-time');
        this.titleRevealValueSpan = document.getElementById('title-reveal-value');
        this.iconRevealTimeSlider = document.getElementById('icon-reveal-time');
        this.iconRevealValueSpan = document.getElementById('icon-reveal-value');
        this.saveConfigBtn = document.getElementById('save-config-btn');
        
        // Modal de confirmación
        this.confirmModal = document.getElementById('confirm-modal');
        this.confirmTitle = document.getElementById('confirm-title');
        this.confirmMessage = document.getElementById('confirm-message');
        this.confirmCancelBtn = document.getElementById('confirm-cancel');
        this.confirmAcceptBtn = document.getElementById('confirm-accept');
        
        // Modal de alerta
        this.alertModal = document.getElementById('alert-modal');
        this.alertTitle = document.getElementById('alert-title');
        this.alertMessage = document.getElementById('alert-message');
        this.alertOkBtn = document.getElementById('alert-ok');
        
        // Overlays de celebración
        this.lineaOverlay = document.getElementById('linea-overlay');
        this.continueLineaBtn = document.getElementById('continue-linea-btn');
        this.celebrationOverlay = document.getElementById('celebration-overlay');
        this.restartBtn = document.getElementById('restart-btn');
        
        // Importar/Exportar
        this.exportListBtn = document.getElementById('export-list');
        this.importListBtn = document.getElementById('import-list');
        this.importFileInput = document.getElementById('import-file');
        
        // Configuración general
        this.fullscreenBtn = document.getElementById('fullscreen-btn');
        this.shortcutsHelpBtn = document.getElementById('shortcuts-help-btn');
        this.themeToggleBtn = document.getElementById('theme-toggle-btn');
        this.themeIcon = document.getElementById('theme-icon');
    }
    
    /**
     * Verifica que todos los elementos críticos estén presentes
     * @returns {boolean} true si todos los elementos están presentes
     */
    validateElements() {
        const criticalElements = [
            'audioPlayer', 'playBtn', 'pauseBtn', 'stopBtn',
            'songsListElement', 'historyGrid', 'songTitleElement'
        ];
        
        for (const elementName of criticalElements) {
            if (!this[elementName]) {
                console.error(`Elemento crítico no encontrado: ${elementName}`);
                return false;
            }
        }
        
        return true;
    }
}
