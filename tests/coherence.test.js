import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {recordingDocument} from './helpers/fakeDom.js';
import {MSG, SHORTCUTS} from '../js/messages.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const walk = (dir, extension) => fs.readdirSync(path.join(root, dir), {withFileTypes: true}).flatMap(entry => {
    const relative = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) return walk(relative, extension);
    return relative.endsWith(extension) ? [relative] : [];
});

const html = read('index.html');
const htmlIds = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]));

test('index.html no repite identificadores', () => {
    const all = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
    const repeated = all.filter((id, index) => all.indexOf(id) !== index);

    assert.deepEqual(repeated, []);
});

test('todos los elementos que busca DOMElements existen en index.html', async () => {
    const lookups = recordingDocument();
    const {DOMElements} = await import(pathToFileURL(path.join(root, 'js/modules/DOMElements.js')).href);

    new DOMElements();

    const missingIds = lookups.ids.filter(id => !htmlIds.has(id));
    assert.deepEqual(missingIds, [], `ids que no están en index.html: ${missingIds.join(', ')}`);

    const missingSelectors = lookups.selectors.filter(selector => {
        const label = selector.match(/^label\[for="([^"]+)"\]$/);
        if (label) return !new RegExp(`<label[^>]*\\sfor="${label[1]}"`).test(html);
        const className = selector.match(/^\.([\w-]+)$/);
        if (className) return !new RegExp(`class="[^"]*\\b${className[1]}\\b`).test(html);
        return true;
    });
    assert.deepEqual(missingSelectors, [], `selectores sin coincidencia: ${missingSelectors.join(', ')}`);

    for (const name of lookups.names) {
        assert.ok(html.includes(`name="${name}"`), `no hay elementos con name="${name}"`);
    }
});

test('todas las hojas de estilo importadas existen y ninguna queda sin importar', () => {
    const imports = [...read('css/style.css').matchAll(/@import\s+(?:url\()?['"]([^'"]+)['"]/g)].map(match => match[1]);
    const missing = imports.filter(file => !fs.existsSync(path.join(root, 'css', file)));
    const imported = new Set(imports.map(file => path.posix.join('css', file.replace(/^\.\//, ''))));
    const orphans = walk('css', '.css').filter(file => file !== 'css/style.css' && file !== 'css/projection.css' && !imported.has(file));

    assert.ok(imports.length > 0);
    assert.deepEqual(missing, []);
    assert.deepEqual(orphans, [], `hojas sin importar: ${orphans.join(', ')}`);
});

test('todos los import de JavaScript resuelven a un archivo', () => {
    const unresolved = [];

    for (const file of walk('js', '.js')) {
        for (const match of read(file).matchAll(/from\s+['"](\.[^'"]+)['"]/g)) {
            const target = path.join(root, path.dirname(file), match[1]);
            if (!fs.existsSync(target)) unresolved.push(`${file} -> ${match[1]}`);
        }
    }

    assert.deepEqual(unresolved, []);
});

test('los recursos locales que carga index.html existen', () => {
    const resources = [...html.matchAll(/\s(?:src|href)="([^"#:]+)"/g)].map(match => match[1]).filter(file => !file.startsWith('//'));
    const missing = resources.filter(file => !fs.existsSync(path.join(root, file)));

    assert.ok(resources.includes('js/app.js'));
    assert.deepEqual(missing, []);
});

test('los avisos fijos de MSG tienen título y mensaje', () => {
    const problems = [];
    const visit = (value, trail) => {
        if (typeof value === 'function') return;
        if (value && typeof value === 'object' && 'title' in value && 'message' in value) {
            if (!value.title || !value.message) problems.push(trail);
            return;
        }
        if (value && typeof value === 'object') {
            for (const [key, child] of Object.entries(value)) visit(child, `${trail}.${key}`);
        }
    };

    visit(MSG, 'MSG');

    assert.deepEqual(problems, []);
});

test('los atajos de teclado no repiten tecla y todos tienen descripción', () => {
    const labels = Object.values(SHORTCUTS).map(shortcut => shortcut.label);

    assert.equal(new Set(labels).size, labels.length);
    assert.ok(Object.values(SHORTCUTS).every(shortcut => shortcut.description));
});
