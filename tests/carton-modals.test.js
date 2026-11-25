import test from 'node:test';
import assert from 'node:assert/strict';
import {CartonModals} from '../js/modules/CartonModals.js';
import {GameManager} from '../js/modules/GameManager.js';
import {BingoCartonGenerator} from '../js/bingoCartonGenerator.js';
import {defaultSettings} from '../js/modules/Settings.js';
import {MSG, TEXT} from '../js/messages.js';
import {installDocument, mkDialog, mkEl} from './helpers/fakeDom.js';
import {makeSongs, seedRandom} from './helpers/seed.js';

installDocument();

const NAMES = ['generateCartonesBtn', 'closeCartonOptionsModalBtn', 'existingCartonesInfo', 'createNewCartonesBtn', 'addCartonesBtn', 'printExistingCartonesBtn',
    'deleteAllCartonesBtn', 'closeCartonModalBtn', 'cartonCountInput', 'generateSaveCartonesBtn', 'closePrintModalBtn', 'printCartonesInfo', 'printPrimaryColorInput',
    'printSecondaryColorInput', 'previewPrintBtn', 'printPdfBtn', 'printHtmlBtn', 'rangeInputsContainer', 'rangeFromInput', 'rangeToInput', 'printPreviewPrevBtn',
    'printPreviewNextBtn', 'printPreviewPosition'];

const build = ({cartones = 0, generateResult} = {}) => {
    const seed = seedRandom(51);
    const game = new GameManager();
    try {
        if (cartones > 0) game.setCartones(new BingoCartonGenerator().generateCartones(makeSongs(30), cartones));
    } finally {
        seed.restore();
    }

    const elements = Object.fromEntries(NAMES.map(name => [name, mkEl(/Input|Container$/.test(name) ? 'input' : 'button')]));
    Object.assign(elements, {cartonOptionsModal: mkDialog(), cartonModal: mkDialog(), printModal: mkDialog(), printRangeRadios: [Object.assign(mkEl('input'), {checked: true}), mkEl('input')]});

    const log = [];
    const previews = [];
    const cartonManager = {
        generate: (songs, count, existing) => { log.push(['genera', count, existing.length]); return generateResult; },
        updatePrintPreview: (carton, gameName, colors) => previews.push([carton?.id, gameName, colors]),
        printCartonesWithConfig: async () => ({success: true, count: 1})
    };
    const modals = {
        registerWithCloseButton() {},
        openWithClick: (modal) => log.push(['abre', modal === elements.printModal ? 'impresión' : 'otro']),
        closeWithClick: () => log.push('cierra')
    };
    const modal = new CartonModals({
        elements, game, cartonManager, modals,
        dialogs: {showAlert: (alert) => log.push(['aviso', alert]), showConfirm: async () => true},
        sounds: {play() {}}, getSongs: () => makeSongs(30), onCartonesChanged: () => log.push('cambian'),
        settings: defaultSettings(), onSettingsChanged: (partial) => log.push(['ajustes', partial])
    });
    modal.init();
    return {modal, elements, game, log, previews};
};

const fakeCartones = (count, firstId = 1) => Array.from({length: count}, (_, index) => ({id: firstId + index, rows: [], songs: []}));
const alerts = (log) => log.filter(entry => entry[0] === 'aviso').map(entry => entry[1]);

test('la vista previa muestra el primer cartón real al abrir la impresión y su posición', () => {
    const {modal, elements, game, previews} = build({cartones: 5});

    modal.openPrint();

    assert.deepEqual(previews.at(-1)[0], game.getCartones()[0].id);
    assert.equal(elements.printPreviewPosition.textContent, TEXT.cartones.previewPosition(1, 5));
    assert.equal(elements.printPreviewPrevBtn.disabled, true);
    assert.equal(elements.printPreviewNextBtn.disabled, false);
});

test('siguiente y anterior recorren los cartones reales y desactivan los extremos', () => {
    const {modal, elements, previews} = build({cartones: 3});
    modal.openPrint();

    elements.printPreviewNextBtn.fire('click');
    assert.equal(previews.at(-1)[0], 2);
    assert.equal(elements.printPreviewPosition.textContent, TEXT.cartones.previewPosition(2, 3));
    assert.equal(elements.printPreviewPrevBtn.disabled, false);

    elements.printPreviewNextBtn.fire('click');
    assert.equal(previews.at(-1)[0], 3);
    assert.equal(elements.printPreviewNextBtn.disabled, true);

    elements.printPreviewNextBtn.fire('click');
    assert.equal(previews.at(-1)[0], 3);

    elements.printPreviewPrevBtn.fire('click');
    elements.printPreviewPrevBtn.fire('click');
    assert.equal(previews.at(-1)[0], 1);
    assert.equal(elements.printPreviewPrevBtn.disabled, true);
});

test('reabrir la impresión vuelve al primer cartón', () => {
    const {modal, elements, previews} = build({cartones: 4});
    modal.openPrint();
    elements.printPreviewNextBtn.fire('click');
    elements.printPreviewNextBtn.fire('click');

    modal.openPrint();

    assert.equal(previews.at(-1)[0], 1);
});

test('cambiar un color actualiza la vista previa del mismo cartón, sin moverse', () => {
    const {modal, elements, previews} = build({cartones: 4});
    modal.openPrint();
    elements.printPreviewNextBtn.fire('click');

    elements.printPrimaryColorInput.value = '#abcdef';
    elements.printPrimaryColorInput.fire('input', {target: elements.printPrimaryColorInput});

    assert.equal(previews.at(-1)[0], 2);
    assert.equal(previews.at(-1)[2].primaryColor, '#abcdef');
});

test('con un solo cartón, los dos botones quedan desactivados', () => {
    const {modal, elements} = build({cartones: 1});

    modal.openPrint();

    assert.equal(elements.printPreviewPrevBtn.disabled, true);
    assert.equal(elements.printPreviewNextBtn.disabled, true);
});

test('sin cartones, actualizar la vista previa no hace nada', () => {
    const {modal, previews} = build({cartones: 0});

    modal.updatePreview();

    assert.deepEqual(previews, []);
});

test('generar cartones completos guarda y avisa con el mensaje de siempre', async () => {
    const {modal, elements, game, log} = build({generateResult: {success: true, cartones: fakeCartones(5), requested: 5, missing: 0}});
    elements.cartonCountInput.value = '5';

    await modal.generate();

    assert.equal(game.getCartonesCount(), 5);
    assert.deepEqual(alerts(log), [MSG.cartones.generated(5)]);
    assert.ok(log.some(entry => entry[0] === 'ajustes' && entry[1].cartonCount === 5));
});

test('si solo caben algunos cartones, guarda los posibles y avisa de cuántos faltan', async () => {
    const {modal, elements, game, log} = build({generateResult: {success: true, cartones: fakeCartones(7), requested: 10, missing: 3}});
    elements.cartonCountInput.value = '10';

    await modal.generate();

    assert.equal(game.getCartonesCount(), 7);
    assert.deepEqual(alerts(log), [MSG.cartones.generatedPartial(7, 10)]);
    assert.ok(log.includes('cambian'));
    assert.ok(log.includes('cierra'));
});

test('en modo añadir, los posibles se suman a los existentes y el aviso da el total', async () => {
    const {modal, elements, game, log} = build({cartones: 4, generateResult: {success: true, cartones: fakeCartones(2, 5), requested: 6, missing: 4}});
    modal.mode = 'add';
    elements.cartonCountInput.value = '6';

    await modal.generate();

    assert.equal(game.getCartonesCount(), 6);
    assert.deepEqual(alerts(log), [MSG.cartones.addedPartial(2, 6, 6)]);
});

test('si no cabe ninguno, avisa y no cambia nada ni cierra la ventana', async () => {
    const {modal, elements, game, log} = build({cartones: 3, generateResult: {success: true, cartones: [], requested: 5, missing: 5}});
    modal.mode = 'add';
    elements.cartonCountInput.value = '5';

    await modal.generate();

    assert.equal(game.getCartonesCount(), 3);
    assert.deepEqual(alerts(log), [MSG.cartones.noMoreUnique]);
    assert.equal(log.includes('cierra'), false);
    assert.equal(log.includes('cambian'), false);
    assert.equal(log.some(entry => entry[0] === 'ajustes'), false);
});

test('un fallo de generación se muestra tal cual y no cambia nada', async () => {
    const {modal, game, log} = build({cartones: 2, generateResult: {success: false, alert: MSG.cartones.invalidCount(1500)}});

    await modal.generate();

    assert.deepEqual(alerts(log), [MSG.cartones.invalidCount(1500)]);
    assert.equal(game.getCartonesCount(), 2);
});
