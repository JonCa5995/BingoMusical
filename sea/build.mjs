import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ROOT_FILES = ['index.html', 'projection.html', 'manifest.webmanifest', 'sw.js', 'favicon.ico', 'icon.png', 'icon.svg'];
const FOLDERS = [['css', ['.css']], ['js', ['.js']], ['img', ['.png', '.svg']]];

export function listAppFiles(root = ROOT) {
    const walk = (folder, extensions) => fs.readdirSync(path.join(root, folder), {withFileTypes: true}).flatMap(entry => {
        const relative = path.posix.join(folder, entry.name);
        if (entry.isDirectory()) return walk(relative, extensions);

        return extensions.includes(path.extname(entry.name)) ? [relative] : [];
    });

    return [...ROOT_FILES, ...FOLDERS.flatMap(([folder, extensions]) => walk(folder, extensions))].sort();
}

export function buildSeaConfig(files, {root = ROOT, output = 'dist/BingoMusical.exe'} = {}) {
    return {
        main: path.join(root, 'sea', 'server.cjs'),
        output: path.join(root, output),
        disableExperimentalSEAWarning: true,
        assets: Object.fromEntries(files.map(file => [file, path.join(root, file)]))
    };
}

function build() {
    const files = listAppFiles();
    const missing = ROOT_FILES.filter(file => !fs.existsSync(path.join(ROOT, file)));
    if (missing.length > 0) throw new Error(`Faltan archivos de la aplicación: ${missing.join(', ')}`);

    const dist = path.join(ROOT, 'dist');
    fs.mkdirSync(dist, {recursive: true});
    const config = buildSeaConfig(files);
    const configFile = path.join(dist, 'sea-config.json');
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2));

    console.log(`Empaquetando ${files.length} archivos de la aplicación con Node ${process.version}...`);
    const result = spawnSync(process.execPath, ['--build-sea', configFile], {stdio: 'inherit'});
    if (result.status !== 0) throw new Error('Node no ha podido crear el ejecutable (hace falta Node 25.5 o superior).');

    const size = (fs.statSync(config.output).size / 1024 / 1024).toFixed(1);
    console.log(`Listo: ${path.relative(ROOT, config.output)} (${size} MB)`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    try {
        build();
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
}
