import test from 'node:test';
import assert from 'node:assert/strict';
import {ConfigModal} from '../js/modules/ConfigModal.js';
import {GameManager} from '../js/modules/GameManager.js';
import {defaultSettings} from '../js/modules/Settings.js';
import {MSG, TEXT} from '../js/messages.js';
import {mkDialog, mkEl} from './helpers/fakeDom.js';

const NAMES = ['configBtn', 'closeConfigModalBtn', 'saveConfigBtn', 'titleRevealTimeSlider', 'titleRevealValueSpan', 'iconRevealTimeSlider',
    'iconRevealValueSpan', 'exportSettingsBtn', 'importSettingsBtn', 'importSettingsInput', 'clipSecondsSlider', 'clipSecondsValueSpan',
    'randomClipStartCheckbox', 'clipWarning'];

const build = (settings = defaultSettings()) => {
    const elements = Object.fromEntries(NAMES.map(name => [name, mkEl(/Slider|Input|Checkbox/.test(name) ? 'input' : 'button')]));
    elements.configModal = mkDialog();
    const log = [];
    const game = new GameManager();
    const modal = new ConfigModal({
        elements, game,
        modals: {registerWithCloseButton() {}, openWithClick() {}, closeWithClick: () => log.push('cierra')},
        dialogs: {showAlert: (alert) => log.push(['aviso', alert])},
        sounds: {play: (name) => log.push('sonido:' + name)},
        canOpen: () => true,
        getSettings: () => settings,
        onSaved: (times) => log.push(['guardado', times]),
        onSettingsImported: (values) => log.push(['importado', values]),
        download: (...args) => log.push(['descarga', ...args]),
        now: () => new Date('2026-05-06T07:08:09.000Z')
    });
    modal.init();
    return {modal, elements, log, game};
};

const fileWith = (text) => ({files: [{text: async () => text}], value: 'ruta'});

test('init muestra los tiempos de revelado del juego en los controles', () => {
    const {elements, game} = build();

    assert.equal(elements.titleRevealTimeSlider.value, game.getTitleRevealTime());
    assert.equal(elements.iconRevealValueSpan.textContent, TEXT.seconds(game.getIconRevealTime()));
});

test('guardar aplica los tiempos al juego y los comunica para guardarlos', () => {
    const {elements, game, log} = build();
    elements.titleRevealTimeSlider.value = '7';
    elements.iconRevealTimeSlider.value = '3';

    elements.saveConfigBtn.fire('click');

    assert.equal(game.getTitleRevealTime(), 7);
    assert.equal(game.getIconRevealTime(), 3);
    assert.deepEqual(log[0], ['guardado', {titleRevealTime: 7, iconRevealTime: 3, clipSeconds: 0, randomClipStart: false}]);
});

test('setRevealTimes actualiza los controles', () => {
    const {modal, elements} = build();

    modal.setRevealTimes(12, 4);

    assert.equal(elements.titleRevealTimeSlider.value, 12);
    assert.equal(elements.iconRevealValueSpan.textContent, TEXT.seconds(4));
});

test('exportar descarga un JSON con la fecha en el nombre y avisa', () => {
    const settings = {...defaultSettings(), musicVolume: 0.25, gameName: 'Fiesta'};
    const {elements, log} = build(settings);

    elements.exportSettingsBtn.fire('click');

    const [, content, fileName, mime] = log.find(entry => entry[0] === 'descarga');
    assert.equal(fileName, 'bingo-config-2026-05-06.json');
    assert.equal(mime, 'application/json');
    assert.deepEqual(JSON.parse(content).settings, settings);
    assert.deepEqual(log.find(entry => entry[0] === 'aviso')[1], MSG.settings.exported);
});

test('importar un archivo válido aplica los ajustes y cuenta cuáles', async () => {
    const {elements, log} = build();
    const event = {target: fileWith(JSON.stringify({type: 'settings', version: 1, settings: {musicVolume: 0.3, theme: 'light', raro: 1}}))};

    await elements.importSettingsInput._listeners.change[0](event);

    assert.deepEqual(log[0], ['importado', {musicVolume: 0.3, theme: 'light'}]);
    assert.deepEqual(log[1], ['aviso', MSG.settings.imported(['musicVolume', 'theme'], ['raro'])]);
    assert.equal(event.target.value, '');
});

test('importar un archivo inválido avisa y no cambia nada', async () => {
    const {elements, log} = build();

    for (const text of ['no es json', '{"songs": []}', '{"type": "settings", "version": 99, "settings": {}}']) {
        log.length = 0;
        await elements.importSettingsInput._listeners.change[0]({target: fileWith(text)});

        assert.equal(log.some(entry => entry[0] === 'importado'), false);
        assert.equal(log.length, 1);
        assert.equal(log[0][1].kind, 'error');
    }
});

test('importar un archivo sin ajustes válidos no cambia nada y lo dice', async () => {
    const {elements, log} = build();

    await elements.importSettingsInput._listeners.change[0]({target: fileWith(JSON.stringify({type: 'settings', version: 1, settings: {musicVolume: 50}}))});

    assert.equal(log.some(entry => entry[0] === 'importado'), false);
    assert.deepEqual(log[0], ['aviso', MSG.settings.imported([], ['musicVolume'])]);
});

test('si no se elige archivo no hace nada', async () => {
    const {elements, log} = build();

    await elements.importSettingsInput._listeners.change[0]({target: {files: [], value: ''}});

    assert.deepEqual(log, []);
});

test('si el archivo no se puede leer lo comunica como error', async () => {
    const {elements, log} = build();
    const unreadable = {files: [{text: async () => { throw new Error('sin permiso'); }}], value: 'ruta'};

    await elements.importSettingsInput._listeners.change[0]({target: unreadable});

    assert.deepEqual(log[0], ['aviso', MSG.settings.importFailed('sin permiso')]);
});

test('init muestra el fragmento del juego: sin fragmento, la canción completa y la casilla desactivada', () => {
    const {elements} = build();

    assert.equal(elements.clipSecondsSlider.value, 0);
    assert.equal(elements.clipSecondsValueSpan.textContent, TEXT.clipSeconds(0));
    assert.equal(elements.randomClipStartCheckbox.disabled, true);
    assert.equal(elements.clipWarning.textContent, '');
});

test('al mover el control del fragmento actualiza el texto y activa la casilla de inicio aleatorio', () => {
    const {elements} = build();

    elements.clipSecondsSlider.value = '30';
    elements.clipSecondsSlider.fire('input');

    assert.equal(elements.clipSecondsValueSpan.textContent, '30 segundos');
    assert.equal(elements.randomClipStartCheckbox.disabled, false);
});

test('avisa si el fragmento no supera el mayor tiempo de revelado, y deja de avisar si lo supera', () => {
    const {elements} = build();

    elements.clipSecondsSlider.value = '8';
    elements.clipSecondsSlider.fire('input');
    assert.equal(elements.clipWarning.textContent, TEXT.clipWarning(8, 10));

    elements.clipSecondsSlider.value = '11';
    elements.clipSecondsSlider.fire('input');
    assert.equal(elements.clipWarning.textContent, '');

    elements.titleRevealTimeSlider.value = '20';
    elements.titleRevealTimeSlider.fire('input', {target: elements.titleRevealTimeSlider});
    assert.equal(elements.clipWarning.textContent, TEXT.clipWarning(11, 20));
});

test('guardar aplica el fragmento al juego, lo comunica y lo menciona en el aviso', () => {
    const {elements, game, log} = build();
    elements.clipSecondsSlider.value = '25';
    elements.randomClipStartCheckbox.checked = true;

    elements.saveConfigBtn.fire('click');

    assert.deepEqual(game.getClip(), {seconds: 25, randomStart: true});
    assert.deepEqual(log[0][1].clipSeconds, 25);
    assert.deepEqual(log[0][1].randomClipStart, true);
    assert.ok(log.find(entry => entry[0] === 'aviso')[1].message.includes('Fragmento de 25 segundos (inicio aleatorio)'));
});

test('setClip refleja un fragmento en los controles', () => {
    const {modal, elements} = build();

    modal.setClip({seconds: 45, randomStart: true});

    assert.equal(elements.clipSecondsSlider.value, 45);
    assert.equal(elements.randomClipStartCheckbox.checked, true);
    assert.equal(elements.randomClipStartCheckbox.disabled, false);
    assert.equal(elements.clipSecondsValueSpan.textContent, '45 segundos');
});
