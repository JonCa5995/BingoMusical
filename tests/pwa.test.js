import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {registerServiceWorker, shouldRegisterServiceWorker} from '../js/modules/ServiceWorkerRegistrar.js';
import {SERVICE_WORKER_FILE} from '../js/constants.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const walk = (dir, extensions) => fs.readdirSync(path.join(root, dir), {withFileTypes: true}).flatMap(entry => {
    const relative = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) return walk(relative, extensions);
    return extensions.some(extension => relative.endsWith(extension)) ? [relative] : [];
});

const loadServiceWorker = () => {
    const listeners = {};
    const cacheStore = {opened: [], added: [], deleted: [], matched: []};
    const self = {
        location: {origin: 'https://bingo.example'},
        addEventListener: (type, listener) => { listeners[type] = listener; },
        skipWaiting: () => Promise.resolve(),
        clients: {claim: () => Promise.resolve()}
    };
    const caches = {
        open: async (name) => { cacheStore.opened.push(name); return {addAll: async (files) => { cacheStore.added.push(...files); }}; },
        keys: async () => ['bingo-musical-v0', 'otro', 'bingo-musical-v1'],
        delete: async (key) => { cacheStore.deleted.push(key); return true; },
        match: async (request, options) => { cacheStore.matched.push([request.url, options]); return request.url.endsWith('/index.html') ? {cached: true} : undefined; }
    };
    const context = vm.createContext({self, caches, URL, fetch: async (request) => ({network: request.url})});
    vm.runInContext(read('sw.js'), context);
    const precache = [...vm.runInContext('PRECACHE', context)];
    const version = vm.runInContext('CACHE_VERSION', context);
    return {listeners, cacheStore, precache, version};
};

const fetchEvent = (url, {method = 'GET', headers = {}} = {}) => {
    const event = {request: {url, method, headers: {has: (name) => name in headers}}, response: undefined, respondWith(promise) { event.response = promise; }};
    return event;
};

test('el service worker precachea todos los archivos de la aplicación y solo archivos que existen', () => {
    const {precache} = loadServiceWorker();
    const normalized = precache.map(file => file === './' ? 'index.html' : file);
    const required = [
        'index.html', 'projection.html', 'manifest.webmanifest', 'favicon.ico', 'icon.png', 'icon.svg',
        ...walk('css', ['.css']), ...walk('js', ['.js']), ...walk('img', ['.png', '.svg'])
    ];

    const missingFromList = required.filter(file => !normalized.includes(file));
    const notOnDisk = normalized.filter(file => !fs.existsSync(path.join(root, file)));

    assert.deepEqual(missingFromList, [], `faltan en la lista de precache: ${missingFromList.join(', ')}`);
    assert.deepEqual(notOnDisk, [], `en la lista pero no existen: ${notOnDisk.join(', ')}`);
    assert.equal(new Set(precache).size, precache.length, 'hay entradas repetidas');
});

test('lo que cargan las dos páginas HTML está en la lista de precache', () => {
    const {precache} = loadServiceWorker();
    const listed = new Set(precache);

    for (const page of ['index.html', 'projection.html']) {
        const html = read(page);
        const referenced = [...html.matchAll(/(?:href|src)="([^"#?]+)"/g)].map(match => match[1]).filter(ref => !/^(https?:)?\/\//.test(ref));
        const missing = referenced.filter(ref => !listed.has(ref));

        assert.ok(referenced.length > 0);
        assert.deepEqual(missing, [], `${page}: ${missing.join(', ')}`);
    }
});

test('el service worker no precachea las canciones del usuario', () => {
    const {precache} = loadServiceWorker();

    assert.equal(precache.some(file => /canciones|\.(mp3|wav|ogg|m4a)$/i.test(file)), false);
});

test('al instalar abre la caché versionada y guarda la lista', async () => {
    const {listeners, cacheStore, precache, version} = loadServiceWorker();
    const event = {waitUntil(promise) { event.done = promise; }};

    listeners.install(event);
    await event.done;

    assert.deepEqual(cacheStore.opened, [version]);
    assert.deepEqual(cacheStore.added, precache);
});

test('al activar borra las cachés de otras versiones y conserva la actual', async () => {
    const {listeners, cacheStore} = loadServiceWorker();
    const event = {waitUntil(promise) { event.done = promise; }};

    listeners.activate(event);
    await event.done;

    assert.deepEqual(cacheStore.deleted.sort(), ['bingo-musical-v0', 'otro']);
});

test('sirve de la caché lo precacheado y va a la red con lo demás', async () => {
    const {listeners} = loadServiceWorker();

    const cached = fetchEvent('https://bingo.example/index.html');
    listeners.fetch(cached);
    assert.deepEqual(await cached.response, {cached: true});

    const other = fetchEvent('https://bingo.example/canciones/Mi%20cancion.mp3');
    listeners.fetch(other);
    assert.deepEqual(await other.response, {network: other.request.url});
});

test('no interviene en peticiones que no son GET, de otro origen o con Range (audio)', () => {
    const {listeners} = loadServiceWorker();

    for (const event of [
        fetchEvent('https://bingo.example/index.html', {method: 'POST'}),
        fetchEvent('https://otro.example/index.html'),
        fetchEvent('https://bingo.example/canciones/a.mp3', {headers: {range: 'bytes=0-'}})
    ]) {
        listeners.fetch(event);
        assert.equal(event.response, undefined);
    }
});

test('el manifiesto es válido y sus iconos existen con el tamaño declarado', () => {
    const manifest = JSON.parse(read('manifest.webmanifest'));

    for (const key of ['name', 'short_name', 'start_url', 'scope', 'display', 'background_color', 'theme_color', 'icons']) {
        assert.ok(manifest[key], `falta ${key}`);
    }
    assert.equal(manifest.display, 'standalone');
    assert.ok(fs.existsSync(path.join(root, manifest.start_url)));

    for (const icon of manifest.icons) {
        const file = path.join(root, icon.src);
        assert.ok(fs.existsSync(file), icon.src);
        if (icon.type === 'image/png') {
            const bytes = fs.readFileSync(file);
            const [width, height] = icon.sizes.split('x').map(Number);
            assert.equal(bytes.readUInt32BE(16), width);
            assert.equal(bytes.readUInt32BE(20), height);
        }
    }
    assert.ok(manifest.icons.some(icon => icon.sizes === '192x192'));
    assert.ok(manifest.icons.some(icon => icon.sizes === '512x512'));
});

test('index.html enlaza el manifiesto', () => {
    assert.match(read('index.html'), /<link rel="manifest" href="manifest\.webmanifest">/);
});

const location = (hostname, search = '') => ({hostname, search});

test('shouldRegisterServiceWorker: en un servidor real sí, en localhost no salvo ?sw=1, y sin soporte nunca', () => {
    assert.equal(shouldRegisterServiceWorker({location: location('bingo.example'), hasServiceWorker: true}), true);
    assert.equal(shouldRegisterServiceWorker({location: location('localhost'), hasServiceWorker: true}), false);
    assert.equal(shouldRegisterServiceWorker({location: location('127.0.0.1', '?x=1'), hasServiceWorker: true}), false);
    assert.equal(shouldRegisterServiceWorker({location: location('localhost', '?sw=1'), hasServiceWorker: true}), true);
    assert.equal(shouldRegisterServiceWorker({location: location('localhost', '?sw=0'), hasServiceWorker: true}), false);
    assert.equal(shouldRegisterServiceWorker({location: location('bingo.example'), hasServiceWorker: false}), false);
});

test('registerServiceWorker registra sw.js cuando toca y devuelve true', async () => {
    const registered = [];
    const navigatorRef = {serviceWorker: {register: async (file) => { registered.push(file); }}};

    const result = await registerServiceWorker({navigatorRef, location: location('bingo.example')});

    assert.equal(result, true);
    assert.deepEqual(registered, [SERVICE_WORKER_FILE]);
});

test('registerServiceWorker no registra en localhost, sin soporte ni sin location', async () => {
    const registered = [];
    const navigatorRef = {serviceWorker: {register: async (file) => { registered.push(file); }}};

    assert.equal(await registerServiceWorker({navigatorRef, location: location('localhost')}), false);
    assert.equal(await registerServiceWorker({navigatorRef: {}, location: location('bingo.example')}), false);
    assert.equal(await registerServiceWorker({navigatorRef: undefined, location: location('bingo.example')}), false);
    assert.equal(await registerServiceWorker({navigatorRef, location: undefined}), false);
    assert.deepEqual(registered, []);
});

test('un fallo al registrar no rompe la app: devuelve false y avisa al callback', async () => {
    const errors = [];
    const navigatorRef = {serviceWorker: {register: async () => { throw new Error('sin permiso'); }}};

    const result = await registerServiceWorker({navigatorRef, location: location('bingo.example'), onError: (error) => errors.push(error.message)});

    assert.equal(result, false);
    assert.deepEqual(errors, ['sin permiso']);
});
