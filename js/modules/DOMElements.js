/**
 * DOMElements Module
 * Busca una sola vez los elementos del DOM y los reparte en grupos por zona.
 * Cada módulo recibe solo el grupo que necesita (dom.dialogs, dom.config...), no todos los elementos.
 * Un mismo elemento puede estar en varios grupos: es la misma referencia.
 */

/** Grupos de elementos por zona de la interfaz */
const GROUPS = {
    player: [
        'audioPlayer', 'playBtn', 'pauseBtn', 'stopBtn', 'progressBar', 'progressFill', 'currentTimeSpan',
        'durationSpan', 'songTitleElement', 'currentIconImg', 'songIconContainer'
    ],
    volume: [
        'musicVolumeSlider', 'musicVolumeValueSpan', 'effectsVolumeSlider', 'effectsVolumeValueSpan'
    ],
    songs: [
        'addSongsInput', 'addSongsLabel', 'songsListElement', 'songsSection', 'deleteAllBtn', 'searchInput',
        'filterStatus', 'sortOrder', 'exportListBtn', 'importListBtn', 'importFileInput'
    ],
    history: [
        'historyGrid', 'playedCounterSpan', 'totalCounterSpan', 'clearHistoryBtn'
    ],
    game: [
        'gameNameInput', 'shuffleAllBtn', 'lineaBtn', 'bingoBtn'
    ],
    celebration: [
        'lineaOverlay', 'continueLineaBtn', 'celebrationOverlay', 'restartBtn'
    ],
    toolbar: [
        'themeToggleBtn', 'themeIcon', 'fullscreenBtn', 'shortcutsHelpBtn'
    ],
    iconPicker: [
        'iconModal', 'closeIconModalBtn', 'modalSongTitle', 'iconPickerContainer', 'iconSearchInput',
        'uploadCustomIconBtn', 'customIconUploadInput'
    ],
    config: [
        'configBtn', 'configModal', 'closeConfigModalBtn', 'saveConfigBtn', 'titleRevealTimeSlider',
        'titleRevealValueSpan', 'iconRevealTimeSlider', 'iconRevealValueSpan'
    ],
    dialogs: [
        'confirmModal', 'confirmTitle', 'confirmMessage', 'confirmCancelBtn', 'confirmAcceptBtn', 'alertModal',
        'alertTitle', 'alertMessage', 'alertOkBtn'
    ],
    cartones: [
        'generateCartonesBtn', 'cartonOptionsModal', 'closeCartonOptionsModalBtn', 'existingCartonesInfo',
        'createNewCartonesBtn', 'addCartonesBtn', 'printExistingCartonesBtn', 'deleteAllCartonesBtn',
        'cartonModal', 'closeCartonModalBtn', 'cartonCountInput', 'generateSaveCartonesBtn', 'printModal',
        'closePrintModalBtn', 'printCartonesInfo', 'printPrimaryColorInput', 'printSecondaryColorInput',
        'printCartonPreview', 'previewPrintBtn', 'printPdfBtn', 'printHtmlBtn', 'printRangeRadios',
        'rangeInputsContainer', 'rangeFromInput', 'rangeToInput'
    ],
    ui: [
        'songsListElement', 'songTitleElement', 'currentIconImg', 'pauseBtn', 'stopBtn', 'songIconContainer',
        'playBtn', 'playedCounterSpan', 'totalCounterSpan', 'addSongsInput', 'addSongsLabel', 'importListBtn',
        'clearHistoryBtn', 'shuffleAllBtn', 'configBtn', 'historyGrid'
    ]
};

/** Toma de `all` los elementos indicados; falla en voz alta si un nombre no existe (evita errores de tipeo en los grupos) */
const pick = (all, names) => Object.fromEntries(names.map(name => {
    if (!(name in all)) throw new Error(`DOMElements: el elemento "${name}" no está definido`);
    return [name, all[name]];
}));

export class DOMElements {
    constructor() {
        const all = this._lookupAll();

        for (const [group, names] of Object.entries(GROUPS)) {
            this[group] = pick(all, names);
        }
    }

    /** Busca cada elemento una sola vez */
    _lookupAll() {
        const byId = (id) => document.getElementById(id);
        const query = (selector) => document.querySelector(selector);

        return {
            // Nombre del juego
            gameNameInput: byId('game-name-input'),

            // Audio y reproductor
            audioPlayer: byId('audio-player'),
            playBtn: byId('play-btn'),
            pauseBtn: byId('pause-btn'),
            stopBtn: byId('stop-btn'),
            progressBar: query('.progress-bar'),
            progressFill: byId('progress-fill'),
            currentTimeSpan: byId('current-time'),
            durationSpan: byId('duration'),

            // Información de canción actual
            songTitleElement: byId('song-title'),
            currentIconImg: byId('current-icon'),
            songIconContainer: query('.song-icon'),

            // Lista de canciones
            addSongsInput: byId('add-songs'),
            addSongsLabel: query('label[for="add-songs"]'),
            songsListElement: byId('songs-list'),
            songsSection: query('.songs-section'),
            deleteAllBtn: byId('delete-all-btn'),

            // Búsqueda y filtrado
            searchInput: byId('song-search'),
            filterStatus: byId('filter-status'),
            sortOrder: byId('sort-order'),

            // Historial
            historyGrid: byId('history-grid'),
            playedCounterSpan: byId('played-counter'),
            totalCounterSpan: byId('total-counter'),
            clearHistoryBtn: byId('clear-history'),

            // Control de juego
            shuffleAllBtn: byId('shuffle-all'),
            lineaBtn: byId('linea-btn'),
            bingoBtn: byId('bingo-btn'),

            // Volumen
            musicVolumeSlider: byId('music-volume'),
            musicVolumeValueSpan: byId('music-volume-value'),
            effectsVolumeSlider: byId('effects-volume'),
            effectsVolumeValueSpan: byId('effects-volume-value'),

            // Modal de iconos
            iconModal: byId('icon-modal'),
            closeIconModalBtn: byId('close-modal'),
            modalSongTitle: byId('modal-song-title'),
            iconPickerContainer: query('.icon-picker'),
            iconSearchInput: byId('icon-search'),
            uploadCustomIconBtn: byId('upload-custom-icon-btn'),
            customIconUploadInput: byId('custom-icon-upload'),

            // Modal de cartones (generación simplificada)
            cartonModal: byId('carton-modal'),
            closeCartonModalBtn: byId('close-carton-modal'),
            generateCartonesBtn: byId('generate-cartones'),
            cartonCountInput: byId('carton-count'),
            generateSaveCartonesBtn: byId('generate-save-cartones-btn'),

            // Modal de impresión (con personalización)
            printModal: byId('print-modal'),
            closePrintModalBtn: byId('close-print-modal'),
            printCartonesInfo: byId('print-cartones-info'),
            printPrimaryColorInput: byId('print-primary-color'),
            printSecondaryColorInput: byId('print-secondary-color'),
            printCartonPreview: byId('print-carton-preview'),
            previewPrintBtn: byId('preview-print-btn'),
            printPdfBtn: byId('print-pdf-btn'),
            printHtmlBtn: byId('print-html-btn'),
            printRangeRadios: document.getElementsByName('print-range'),
            rangeInputsContainer: byId('range-inputs'),
            rangeFromInput: byId('range-from'),
            rangeToInput: byId('range-to'),

            // Modal de opciones de cartones
            cartonOptionsModal: byId('carton-options-modal'),
            closeCartonOptionsModalBtn: byId('close-carton-options-modal'),
            existingCartonesInfo: byId('existing-cartones-info'),
            createNewCartonesBtn: byId('create-new-cartones-btn'),
            addCartonesBtn: byId('add-cartones-btn'),
            printExistingCartonesBtn: byId('print-existing-cartones-btn'),
            deleteAllCartonesBtn: byId('delete-all-cartones-btn'),

            // Modal de configuración
            configBtn: byId('config-btn'),
            configModal: byId('config-modal'),
            closeConfigModalBtn: byId('close-config-modal'),
            titleRevealTimeSlider: byId('title-reveal-time'),
            titleRevealValueSpan: byId('title-reveal-value'),
            iconRevealTimeSlider: byId('icon-reveal-time'),
            iconRevealValueSpan: byId('icon-reveal-value'),
            saveConfigBtn: byId('save-config-btn'),

            // Modal de confirmación
            confirmModal: byId('confirm-modal'),
            confirmTitle: byId('confirm-title'),
            confirmMessage: byId('confirm-message'),
            confirmCancelBtn: byId('confirm-cancel'),
            confirmAcceptBtn: byId('confirm-accept'),

            // Modal de alerta
            alertModal: byId('alert-modal'),
            alertTitle: byId('alert-title'),
            alertMessage: byId('alert-message'),
            alertOkBtn: byId('alert-ok'),

            // Overlays de celebración
            lineaOverlay: byId('linea-overlay'),
            continueLineaBtn: byId('continue-linea-btn'),
            celebrationOverlay: byId('celebration-overlay'),
            restartBtn: byId('restart-btn'),

            // Importar/Exportar
            exportListBtn: byId('export-list'),
            importListBtn: byId('import-list'),
            importFileInput: byId('import-file'),

            // Configuración general
            fullscreenBtn: byId('fullscreen-btn'),
            shortcutsHelpBtn: byId('shortcuts-help-btn'),
            themeToggleBtn: byId('theme-toggle-btn'),
            themeIcon: byId('theme-icon')
        };
    }
}
