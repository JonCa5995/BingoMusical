const CACHE_VERSION = 'bingo-musical-v1';

const PRECACHE = [
    './',
    'index.html',
    'projection.html',
    'manifest.webmanifest',
    'favicon.ico',
    'icon.png',
    'icon.svg',
    'img/icon-192.png',
    'img/icon-512.png',
    'img/icon-decorative.svg',
    'css/style.css',
    'css/projection.css',
    'css/base/reset.css',
    'css/base/typography.css',
    'css/base/variables.css',
    'css/components/buttons.css',
    'css/components/cards.css',
    'css/components/inputs.css',
    'css/components/modals.css',
    'css/components/player.css',
    'css/layout/container.css',
    'css/layout/grid.css',
    'css/layout/toolbar.css',
    'css/modules/carton-generator.css',
    'css/modules/celebrations.css',
    'css/modules/check-carton.css',
    'css/modules/history-panel.css',
    'css/modules/songs-list.css',
    'css/utilities/accessibility.css',
    'css/utilities/animations.css',
    'css/utilities/responsive.css',
    'js/app.js',
    'js/bingoCartonGenerator.js',
    'js/constants.js',
    'js/messages.js',
    'js/projection.js',
    'js/utils.js',
    'js/modules/AudioControlsView.js',
    'js/modules/AudioLinker.js',
    'js/modules/AudioManager.js',
    'js/modules/CartonCheckModal.js',
    'js/modules/CartonChecker.js',
    'js/modules/CartonExporter.js',
    'js/modules/CartonHtmlRenderer.js',
    'js/modules/CartonManager.js',
    'js/modules/CartonModals.js',
    'js/modules/CartonSerializer.js',
    'js/modules/ConfigModal.js',
    'js/modules/DOMElements.js',
    'js/modules/Dialogs.js',
    'js/modules/DragAndDropUploader.js',
    'js/modules/FullscreenManager.js',
    'js/modules/GameManager.js',
    'js/modules/GameSnapshot.js',
    'js/modules/GameStateStore.js',
    'js/modules/IconDictionary.js',
    'js/modules/IconManager.js',
    'js/modules/KeyboardShortcuts.js',
    'js/modules/ModalManager.js',
    'js/modules/PlaylistFile.js',
    'js/modules/PlaylistImporter.js',
    'js/modules/PreferencesStore.js',
    'js/modules/ProjectionChannel.js',
    'js/modules/ProjectionView.js',
    'js/modules/SavedGameController.js',
    'js/modules/ServiceWorkerRegistrar.js',
    'js/modules/Settings.js',
    'js/modules/SettingsFile.js',
    'js/modules/SongListView.js',
    'js/modules/SongManager.js',
    'js/modules/SoundEffects.js',
    'js/modules/ThemeManager.js',
    'js/modules/UIManager.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE_VERSION).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(key => key !== CACHE_VERSION).map(key => caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);

    if (request.method !== 'GET' || url.origin !== self.location.origin || request.headers.has('range')) return;

    event.respondWith(
        caches.match(request, {ignoreSearch: true}).then(cached => cached ?? fetch(request))
    );
});
