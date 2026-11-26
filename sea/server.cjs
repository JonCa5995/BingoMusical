'use strict';

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const {spawn} = require('node:child_process');
const sea = require('node:sea');

const DEFAULT_PORT = 8123;
const PORT_ATTEMPTS = 8;
const HOST = '127.0.0.1';
const MARKER_HEADER = 'x-bingo-musical';
const SONGS_PREFIX = '/canciones/';

const CONTENT_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.webmanifest': 'application/manifest+json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.ico': 'image/x-icon',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.m4a': 'audio/mp4',
    '.aac': 'audio/aac',
    '.flac': 'audio/flac',
    '.opus': 'audio/ogg'
};

function contentTypeOf(file) {
    return CONTENT_TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream';
}

function decodePath(url) {
    try {
        return decodeURIComponent(new URL(url, 'http://localhost').pathname);
    } catch {
        return null;
    }
}

function parseRange(header, size) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(header ?? '');
    if (!match || (match[1] === '' && match[2] === '')) return null;

    let start = match[1] === '' ? size - Number(match[2]) : Number(match[1]);
    let end = match[1] === '' || match[2] === '' ? size - 1 : Number(match[2]);
    end = Math.min(end, size - 1);
    start = Math.max(start, 0);

    return start > end || start >= size ? {invalid: true} : {start, end};
}

function send(response, status, headers, body, method) {
    response.writeHead(status, {'cache-control': 'no-cache', [MARKER_HEADER]: '1', ...headers});
    response.end(method === 'HEAD' ? undefined : body);
}

function createAppServer({readAsset, songsDir}) {
    function sendSong(request, response, relative) {
        const file = path.resolve(songsDir, relative);
        const inside = file === songsDir || file.startsWith(songsDir + path.sep);

        if (!inside || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
            send(response, 404, {'content-type': 'text/plain; charset=utf-8'}, 'No encontrado', request.method);
            return;
        }

        const size = fs.statSync(file).size;
        const range = parseRange(request.headers.range, size);
        const base = {'content-type': contentTypeOf(file), 'accept-ranges': 'bytes', 'cache-control': 'no-cache', [MARKER_HEADER]: '1'};

        if (range?.invalid) {
            response.writeHead(416, {...base, 'content-range': `bytes */${size}`});
            response.end();
            return;
        }

        if (range) {
            response.writeHead(206, {...base, 'content-range': `bytes ${range.start}-${range.end}/${size}`, 'content-length': range.end - range.start + 1});
        } else {
            response.writeHead(200, {...base, 'content-length': size});
        }

        if (request.method === 'HEAD') {
            response.end();
            return;
        }

        fs.createReadStream(file, range ? {start: range.start, end: range.end} : {}).pipe(response);
    }

    return http.createServer((request, response) => {
        if (request.method !== 'GET' && request.method !== 'HEAD') {
            send(response, 405, {'content-type': 'text/plain; charset=utf-8', allow: 'GET, HEAD'}, 'Método no permitido', request.method);
            return;
        }

        const pathname = decodePath(request.url);
        if (pathname === null || pathname.includes('\0')) {
            send(response, 400, {'content-type': 'text/plain; charset=utf-8'}, 'Petición no válida', request.method);
            return;
        }

        if (pathname.startsWith(SONGS_PREFIX)) {
            sendSong(request, response, pathname.slice(SONGS_PREFIX.length));
            return;
        }

        const name = pathname === '/' ? 'index.html' : pathname.slice(1);
        const body = name.split('/').includes('..') ? null : readAsset(name);

        if (body === null) {
            send(response, 404, {'content-type': 'text/plain; charset=utf-8'}, 'No encontrado', request.method);
            return;
        }

        send(response, 200, {'content-type': contentTypeOf(name), 'content-length': body.length}, body, request.method);
    });
}

function listen(server, port) {
    return new Promise((resolve, reject) => {
        const onError = (error) => reject(error);
        server.once('error', onError);
        server.listen(port, HOST, () => {
            server.off('error', onError);
            resolve(server.address().port);
        });
    });
}

function isOurServer(port) {
    return new Promise((resolve) => {
        const request = http.request({host: HOST, port, method: 'HEAD', path: '/', timeout: 1500}, (response) => {
            response.resume();
            resolve(response.headers[MARKER_HEADER] === '1');
        });
        request.on('error', () => resolve(false));
        request.on('timeout', () => { request.destroy(); resolve(false); });
        request.end();
    });
}

async function startOnFreePort(server, firstPort) {
    for (let attempt = 0; attempt < PORT_ATTEMPTS; attempt++) {
        const port = firstPort + attempt;

        try {
            return {port: await listen(server, port), reused: false};
        } catch (error) {
            if (error.code !== 'EADDRINUSE') throw error;
            if (await isOurServer(port)) return {port, reused: true};
        }
    }

    throw new Error(`No hay ningún puerto libre entre ${firstPort} y ${firstPort + PORT_ATTEMPTS - 1}.`);
}

function openBrowser(url) {
    let command = 'xdg-open';
    let args = [url];

    if (process.platform === 'win32') {
        command = 'cmd';
        args = ['/c', 'start', '', url];
    } else if (process.platform === 'darwin') {
        command = 'open';
    }

    spawn(command, args, {detached: true, stdio: 'ignore'}).on('error', () => {}).unref();
}

function parseArguments(argv, env) {
    const portArgument = argv.find(argument => argument.startsWith('--port='));
    const port = Number(portArgument?.slice('--port='.length) ?? env.BINGO_PORT ?? DEFAULT_PORT);

    return {
        port: Number.isInteger(port) && port > 0 && port < 65536 ? port : DEFAULT_PORT,
        open: !argv.includes('--no-open') && env.BINGO_NO_OPEN !== '1'
    };
}

function appAssetReader() {
    if (sea.isSea()) {
        const keys = new Set(sea.getAssetKeys());
        return (name) => (keys.has(name) ? Buffer.from(sea.getAsset(name)) : null);
    }

    const root = path.resolve(__dirname, '..');
    return (name) => {
        const file = path.resolve(root, name);
        const allowed = ['index.html', 'projection.html', 'manifest.webmanifest', 'sw.js', 'favicon.ico', 'icon.png', 'icon.svg'].includes(name)
            || ['css', 'js', 'img'].some(folder => file.startsWith(path.join(root, folder) + path.sep));

        return allowed && fs.existsSync(file) && fs.statSync(file).isFile() ? fs.readFileSync(file) : null;
    };
}

function songsFolder() {
    const base = sea.isSea() ? path.dirname(process.execPath) : path.resolve(__dirname, '..');
    return path.join(base, 'canciones');
}

async function main() {
    const options = parseArguments(process.argv.slice(2), process.env);
    const server = createAppServer({readAsset: appAssetReader(), songsDir: songsFolder()});
    const {port, reused} = await startOnFreePort(server, options.port);
    const url = `http://localhost:${port}/`;

    if (reused) {
        console.log(`Bingo Musical ya está abierto en ${url}`);
        if (options.open) openBrowser(url);
        process.exit(0);
    }

    console.log('Bingo Musical');
    console.log(`  Dirección: ${url}`);
    console.log(`  Canciones: ${songsFolder()} (opcional, también puedes arrastrar o vincular tus audios)`);
    console.log('  Cierra esta ventana para salir.');
    if (options.open) openBrowser(url);

    process.on('SIGINT', () => process.exit(0));
}

module.exports = {createAppServer, parseRange, parseArguments, startOnFreePort, contentTypeOf, DEFAULT_PORT, MARKER_HEADER};

if (sea.isSea() || require.main === module) {
    main().catch((error) => {
        console.error(error.message);
        process.exit(1);
    });
}
