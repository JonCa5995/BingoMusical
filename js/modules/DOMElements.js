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
        'filterStatus', 'sortOrder', 'exportListBtn', 'importListBtn', 'importFileInput', 'linkAudioBtn', 'linkAudioInput'
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
        'titleRevealValueSpan', 'iconRevealTimeSlider', 'iconRevealValueSpan', 'exportSettingsBtn', 'importSettingsBtn',
        'importSettingsInput', 'clipSecondsSlider', 'clipSecondsValueSpan', 'randomClipStartCheckbox', 'clipWarning'
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

const IDS = {
    gameNameInput: 'game-name-input',

    audioPlayer: 'audio-player',
    playBtn: 'play-btn',
    pauseBtn: 'pause-btn',
    stopBtn: 'stop-btn',
    progressFill: 'progress-fill',
    currentTimeSpan: 'current-time',
    durationSpan: 'duration',

    songTitleElement: 'song-title',
    currentIconImg: 'current-icon',

    addSongsInput: 'add-songs',
    songsListElement: 'songs-list',
    deleteAllBtn: 'delete-all-btn',

    searchInput: 'song-search',
    filterStatus: 'filter-status',
    sortOrder: 'sort-order',

    historyGrid: 'history-grid',
    playedCounterSpan: 'played-counter',
    totalCounterSpan: 'total-counter',
    clearHistoryBtn: 'clear-history',

    shuffleAllBtn: 'shuffle-all',
    lineaBtn: 'linea-btn',
    bingoBtn: 'bingo-btn',

    musicVolumeSlider: 'music-volume',
    musicVolumeValueSpan: 'music-volume-value',
    effectsVolumeSlider: 'effects-volume',
    effectsVolumeValueSpan: 'effects-volume-value',

    iconModal: 'icon-modal',
    closeIconModalBtn: 'close-modal',
    modalSongTitle: 'modal-song-title',
    iconSearchInput: 'icon-search',
    uploadCustomIconBtn: 'upload-custom-icon-btn',
    customIconUploadInput: 'custom-icon-upload',

    cartonModal: 'carton-modal',
    closeCartonModalBtn: 'close-carton-modal',
    generateCartonesBtn: 'generate-cartones',
    cartonCountInput: 'carton-count',
    generateSaveCartonesBtn: 'generate-save-cartones-btn',

    printModal: 'print-modal',
    closePrintModalBtn: 'close-print-modal',
    printCartonesInfo: 'print-cartones-info',
    printPrimaryColorInput: 'print-primary-color',
    printSecondaryColorInput: 'print-secondary-color',
    printCartonPreview: 'print-carton-preview',
    previewPrintBtn: 'preview-print-btn',
    printPdfBtn: 'print-pdf-btn',
    printHtmlBtn: 'print-html-btn',
    rangeInputsContainer: 'range-inputs',
    rangeFromInput: 'range-from',
    rangeToInput: 'range-to',

    cartonOptionsModal: 'carton-options-modal',
    closeCartonOptionsModalBtn: 'close-carton-options-modal',
    existingCartonesInfo: 'existing-cartones-info',
    createNewCartonesBtn: 'create-new-cartones-btn',
    addCartonesBtn: 'add-cartones-btn',
    printExistingCartonesBtn: 'print-existing-cartones-btn',
    deleteAllCartonesBtn: 'delete-all-cartones-btn',

    configBtn: 'config-btn',
    configModal: 'config-modal',
    closeConfigModalBtn: 'close-config-modal',
    titleRevealTimeSlider: 'title-reveal-time',
    titleRevealValueSpan: 'title-reveal-value',
    iconRevealTimeSlider: 'icon-reveal-time',
    iconRevealValueSpan: 'icon-reveal-value',
    saveConfigBtn: 'save-config-btn',
    clipSecondsSlider: 'clip-seconds',
    clipSecondsValueSpan: 'clip-seconds-value',
    randomClipStartCheckbox: 'random-clip-start',
    clipWarning: 'clip-warning',
    exportSettingsBtn: 'export-settings-btn',
    importSettingsBtn: 'import-settings-btn',
    importSettingsInput: 'import-settings-input',

    confirmModal: 'confirm-modal',
    confirmTitle: 'confirm-title',
    confirmMessage: 'confirm-message',
    confirmCancelBtn: 'confirm-cancel',
    confirmAcceptBtn: 'confirm-accept',

    alertModal: 'alert-modal',
    alertTitle: 'alert-title',
    alertMessage: 'alert-message',
    alertOkBtn: 'alert-ok',

    lineaOverlay: 'linea-overlay',
    continueLineaBtn: 'continue-linea-btn',
    celebrationOverlay: 'celebration-overlay',
    restartBtn: 'restart-btn',

    exportListBtn: 'export-list',
    linkAudioBtn: 'link-audio-btn',
    linkAudioInput: 'link-audio-input',
    importListBtn: 'import-list',
    importFileInput: 'import-file',

    fullscreenBtn: 'fullscreen-btn',
    shortcutsHelpBtn: 'shortcuts-help-btn',
    themeToggleBtn: 'theme-toggle-btn',
    themeIcon: 'theme-icon'
};

const SELECTORS = {
    progressBar: '.progress-bar',
    songIconContainer: '.song-icon',
    addSongsLabel: 'label[for="add-songs"]',
    songsSection: '.songs-section',
    iconPickerContainer: '.icon-picker'
};

const RANGE_RADIOS_NAME = 'print-range';

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

    _lookupAll() {
        const all = {};

        for (const [name, id] of Object.entries(IDS)) {
            all[name] = document.getElementById(id);
        }
        for (const [name, selector] of Object.entries(SELECTORS)) {
            all[name] = document.querySelector(selector);
        }
        all.printRangeRadios = document.getElementsByName(RANGE_RADIOS_NAME);

        return all;
    }
}
