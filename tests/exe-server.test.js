import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {buildSeaConfig, listAppFiles} from '../sea/build.mjs';

const require = createRequire(import.meta.url);
const {createAppServer, parseRange, parseArguments, startOnFreePort, contentTypeOf, DEFAULT_PORT, MARKER_HEADER} = require('../sea/server.cjs');

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const assets = {
    'index.html': Buffer.from('<h1>hola</h1>'),
    'js/app.js': Buffer.from('export {};'),
    'css/style.css': Buffer.from('body{}'),
    'manifest.webmanifest': Buffer.from('{}'),
    'icon.png': Buffer.from([1, 2, 3, 4])
};

const songsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bingo-songs-'));
fs.writeFileSync(path.join(songsDir, 'Mi canción.mp3'), Buffer.from('0123456789'));
fs.mkdirSync(path.join(songsDir, 'carpeta'));
fs.writeFileSync(path.join(path.dirname(songsDir), 'secreto.txt'), 'no debe verse');

const server = createAppServer({readAsset: (name) => assets[name] ?? null, songsDir});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;

test.after(() => {
    server.close();
    fs.rmSync(songsDir, {recursive: true, force: true});
    fs.rmSync(path.join(path.dirname(songsDir), 'secreto.txt'), {force: true});
});

const request = (urlPath, {method = 'GET', headers = {}} = {}) => new Promise((resolve, reject) => {
    const req = http.request({host: '127.0.0.1', port, path: urlPath, method, headers}, (response) => {
        const chunks = [];
        response.on('data', chunk => chunks.push(chunk));
        response.on('end', () => resolve({status: response.statusCode, headers: response.headers, body: Buffer.concat(chunks)}));
    });
    req.on('error', reject);
    req.end();
});

test('la raíz sirve index.html y el resto de archivos de la aplicación con su tipo', async () => {
    const home = await request('/');
    assert.equal(home.status, 200);
    assert.equal(home.body.toString(), '<h1>hola</h1>');
    assert.match(home.headers['content-type'], /text\/html/);

    assert.match((await request('/js/app.js')).headers['content-type'], /text\/javascript/);
    assert.match((await request('/css/style.css')).headers['content-type'], /text\/css/);
    assert.match((await request('/manifest.webmanifest')).headers['content-type'], /application\/manifest\+json/);
    assert.equal((await request('/icon.png')).headers['content-type'], 'image/png');
});

test('todas las respuestas llevan la marca que permite reconocer el servidor y no se cachean', async () => {
    for (const urlPath of ['/', '/no-existe', '/canciones/Mi%20canci%C3%B3n.mp3']) {
        const response = await request(urlPath);
        assert.equal(response.headers[MARKER_HEADER], '1', urlPath);
        assert.equal(response.headers['cache-control'], 'no-cache', urlPath);
    }
});

test('lo que no existe da 404 y no se sirve nada fuera de la lista de archivos de la aplicación', async () => {
    assert.equal((await request('/no-existe.js')).status, 404);
    assert.equal((await request('/package.json')).status, 404);
    assert.equal((await request('/sea/server.cjs')).status, 404);
});

test('los intentos de salir de las carpetas dan 404 en la aplicación y en las canciones', async () => {
    for (const urlPath of ['/../package.json', '/js/../index.html', '/%2e%2e/package.json', '/canciones/../secreto.txt', '/canciones/%2e%2e/secreto.txt', '/canciones/..%2fsecreto.txt']) {
        const response = await request(urlPath);
        assert.ok([404, 400].includes(response.status) || response.body.toString() !== 'no debe verse', urlPath);
        assert.notEqual(response.body.toString(), 'no debe verse', urlPath);
    }
});

test('una ruta con caracteres no válidos da 400 y solo se aceptan GET y HEAD', async () => {
    assert.equal((await request('/%E0%A4%A')).status, 400);
    assert.equal((await request('/', {method: 'POST'})).status, 405);
    assert.equal((await request('/', {method: 'PUT'})).status, 405);
});

test('HEAD devuelve las cabeceras sin cuerpo', async () => {
    const response = await request('/', {method: 'HEAD'});

    assert.equal(response.status, 200);
    assert.equal(response.body.length, 0);
    assert.equal(response.headers['content-length'], String(assets['index.html'].length));
});

test('las canciones de la carpeta se sirven con su tipo de audio y aceptan rangos', async () => {
    const whole = await request('/canciones/Mi%20canci%C3%B3n.mp3');
    assert.equal(whole.status, 200);
    assert.equal(whole.headers['content-type'], 'audio/mpeg');
    assert.equal(whole.headers['accept-ranges'], 'bytes');
    assert.equal(whole.body.toString(), '0123456789');

    const part = await request('/canciones/Mi%20canci%C3%B3n.mp3', {headers: {Range: 'bytes=2-5'}});
    assert.equal(part.status, 206);
    assert.equal(part.headers['content-range'], 'bytes 2-5/10');
    assert.equal(part.body.toString(), '2345');

    const tail = await request('/canciones/Mi%20canci%C3%B3n.mp3', {headers: {Range: 'bytes=7-'}});
    assert.equal(tail.body.toString(), '789');

    const last = await request('/canciones/Mi%20canci%C3%B3n.mp3', {headers: {Range: 'bytes=-3'}});
    assert.equal(last.body.toString(), '789');
});

test('un rango fuera del archivo da 416, y HEAD de una canción no envía cuerpo', async () => {
    const out = await request('/canciones/Mi%20canci%C3%B3n.mp3', {headers: {Range: 'bytes=50-60'}});
    assert.equal(out.status, 416);
    assert.equal(out.headers['content-range'], 'bytes */10');

    const head = await request('/canciones/Mi%20canci%C3%B3n.mp3', {method: 'HEAD'});
    assert.equal(head.status, 200);
    assert.equal(head.body.length, 0);
    assert.equal(head.headers['content-length'], '10');
});

test('una canción inexistente, o una carpeta en lugar de un archivo, da 404', async () => {
    assert.equal((await request('/canciones/nada.mp3')).status, 404);
    assert.equal((await request('/canciones/carpeta')).status, 404);
    assert.equal((await request('/canciones/')).status, 404);
});

test('parseRange entiende los formatos habituales y rechaza lo raro', () => {
    assert.deepEqual(parseRange('bytes=0-9', 100), {start: 0, end: 9});
    assert.deepEqual(parseRange('bytes=90-', 100), {start: 90, end: 99});
    assert.deepEqual(parseRange('bytes=-10', 100), {start: 90, end: 99});
    assert.deepEqual(parseRange('bytes=0-999', 100), {start: 0, end: 99});
    assert.deepEqual(parseRange('bytes=200-300', 100), {invalid: true});
    assert.deepEqual(parseRange('bytes=9-2', 100), {invalid: true});
    assert.equal(parseRange('bytes=-', 100), null);
    assert.equal(parseRange('items=0-9', 100), null);
    assert.equal(parseRange(undefined, 100), null);
});

test('contentTypeOf conoce los formatos de la aplicación y los de audio, y cae en binario si no conoce el resto', () => {
    assert.equal(contentTypeOf('a.MP3'), 'audio/mpeg');
    assert.equal(contentTypeOf('a.wav'), 'audio/wav');
    assert.equal(contentTypeOf('a.svg'), 'image/svg+xml');
    assert.equal(contentTypeOf('favicon.ico'), 'image/x-icon');
    assert.equal(contentTypeOf('a.xyz'), 'application/octet-stream');
});

test('parseArguments: puerto por defecto, --port, variable de entorno, valores no válidos y --no-open', () => {
    assert.deepEqual(parseArguments([], {}), {port: DEFAULT_PORT, open: true});
    assert.equal(parseArguments(['--port=9000'], {}).port, 9000);
    assert.equal(parseArguments([], {BINGO_PORT: '9100'}).port, 9100);
    assert.equal(parseArguments(['--port=abc'], {}).port, DEFAULT_PORT);
    assert.equal(parseArguments(['--port=70000'], {}).port, DEFAULT_PORT);
    assert.equal(parseArguments(['--no-open'], {}).open, false);
    assert.equal(parseArguments([], {BINGO_NO_OPEN: '1'}).open, false);
});

test('si el puerto está ocupado por otra aplicación prueba el siguiente; si es este mismo servidor, lo reutiliza', async () => {
    const stranger = http.createServer((req, res) => res.end('otro'));
    await new Promise(resolve => stranger.listen(0, '127.0.0.1', resolve));
    const strangerPort = stranger.address().port;

    const mine = createAppServer({readAsset: () => null, songsDir});
    const started = await startOnFreePort(mine, strangerPort);
    assert.equal(started.reused, false);
    assert.equal(started.port, strangerPort + 1);

    const again = createAppServer({readAsset: () => null, songsDir});
    const reused = await startOnFreePort(again, strangerPort + 1);
    assert.deepEqual(reused, {port: strangerPort + 1, reused: true});

    mine.close();
    stranger.close();
});

test('la lista de archivos del ejecutable incluye todo lo que necesitan las dos páginas, sin audios ni pruebas', () => {
    const files = listAppFiles(root);

    for (const required of ['index.html', 'projection.html', 'manifest.webmanifest', 'sw.js', 'icon.png', 'icon.svg', 'favicon.ico', 'img/icon-192.png', 'css/style.css', 'css/projection.css', 'js/app.js', 'js/projection.js']) {
        assert.ok(files.includes(required), required);
    }
    assert.ok(files.every(file => !/^(tests|sea|dist|canciones|\.claude|node_modules)\//.test(file)));
    assert.equal(new Set(files).size, files.length);
    assert.ok(files.every(file => fs.existsSync(path.join(root, file))));
});

test('el ejecutable lleva los archivos que precachea el service worker más el propio sw.js', () => {
    const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
    const precache = [...sw.match(/const PRECACHE = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map(match => match[1]).filter(file => file !== './');

    assert.deepEqual(listAppFiles(root), [...precache, 'sw.js'].sort());
});

test('buildSeaConfig apunta al servidor, a un único ejecutable y a un recurso por archivo', () => {
    const config = buildSeaConfig(['index.html', 'js/app.js'], {root: '/proyecto', output: 'dist/App.exe'});

    assert.match(config.main, /sea[\\/]server\.cjs$/);
    assert.match(config.output, /dist[\\/]App\.exe$/);
    assert.deepEqual(Object.keys(config.assets), ['index.html', 'js/app.js']);
    assert.match(config.assets['js/app.js'], /proyecto[\\/]js[\\/]app\.js$/);
    assert.equal(config.disableExperimentalSEAWarning, true);
});
