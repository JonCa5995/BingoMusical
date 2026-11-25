import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSettingsFile, parseSettingsFile} from '../js/modules/SettingsFile.js';
import {defaultSettings} from '../js/modules/Settings.js';
import {SETTINGS_FILE_TYPE, SETTINGS_FILE_VERSION} from '../js/constants.js';
import {TEXT} from '../js/messages.js';

const now = new Date('2026-03-04T05:06:07.000Z');
const custom = {...defaultSettings(), musicVolume: 0.35, titleRevealTime: 12, gameName: 'Noche de bingo', theme: 'light', cartonCount: 40};

test('el archivo exportado lleva tipo, versión, fecha y todos los ajustes', () => {
    const file = buildSettingsFile(custom, now);

    assert.equal(file.type, SETTINGS_FILE_TYPE);
    assert.equal(file.version, SETTINGS_FILE_VERSION);
    assert.equal(file.date, '2026-03-04T05:06:07.000Z');
    assert.deepEqual(file.settings, custom);
});

test('exportar e importar devuelve exactamente los mismos ajustes', () => {
    const text = JSON.stringify(buildSettingsFile(custom, now));
    const result = parseSettingsFile(text);

    assert.equal(result.success, true);
    assert.deepEqual(result.values, custom);
    assert.deepEqual(result.discarded, []);
    assert.equal(result.applied.length, Object.keys(custom).length);
});

test('un archivo con solo algunos ajustes aplica solo esos', () => {
    const result = parseSettingsFile(JSON.stringify({type: 'settings', version: 1, settings: {musicVolume: 0.5}}));

    assert.deepEqual(result.values, {musicVolume: 0.5});
    assert.deepEqual(result.applied, ['musicVolume']);
});

test('ignora y avisa de los campos inválidos o desconocidos, y aplica el resto', () => {
    const result = parseSettingsFile(JSON.stringify({type: 'settings', version: 1, settings: {musicVolume: 0.5, effectsVolume: 7, nuevo: 'x'}}));

    assert.equal(result.success, true);
    assert.deepEqual(result.values, {musicVolume: 0.5});
    assert.deepEqual(result.discarded.sort(), ['effectsVolume', 'nuevo']);
});

test('rechaza lo que no es JSON', () => {
    assert.deepEqual(parseSettingsFile('esto no es json'), {success: false, error: TEXT.settings.invalidJson});
    assert.deepEqual(parseSettingsFile(''), {success: false, error: TEXT.settings.invalidJson});
});

test('rechaza archivos que no son de ajustes (otro tipo, lista de canciones, estructuras raras)', () => {
    const notSettings = {success: false, error: TEXT.settings.notSettings};

    assert.deepEqual(parseSettingsFile('null'), notSettings);
    assert.deepEqual(parseSettingsFile('[]'), notSettings);
    assert.deepEqual(parseSettingsFile('{"songs": []}'), notSettings);
    assert.deepEqual(parseSettingsFile('{"type": "game", "version": 1, "settings": {}}'), notSettings);
    assert.deepEqual(parseSettingsFile('{"type": "settings", "version": 1}'), notSettings);
    assert.deepEqual(parseSettingsFile('{"type": "settings", "version": 1, "settings": [1]}'), notSettings);
    assert.deepEqual(parseSettingsFile('{"type": "settings", "version": 1, "settings": null}'), notSettings);
    assert.deepEqual(parseSettingsFile('{"type": "settings", "version": "1", "settings": {}}'), notSettings);
    assert.deepEqual(parseSettingsFile('{"type": "settings", "version": 0, "settings": {}}'), notSettings);
});

test('rechaza una versión futura con un mensaje claro', () => {
    const result = parseSettingsFile(JSON.stringify({type: 'settings', version: SETTINGS_FILE_VERSION + 1, settings: {musicVolume: 0.5}}));

    assert.deepEqual(result, {success: false, error: TEXT.settings.newerVersion(SETTINGS_FILE_VERSION + 1)});
});
