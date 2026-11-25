import test from 'node:test';
import assert from 'node:assert/strict';
import {CartonManager} from '../js/modules/CartonManager.js';
import {CartonHtmlRenderer} from '../js/modules/CartonHtmlRenderer.js';
import {BingoCartonGenerator} from '../js/bingoCartonGenerator.js';
import {DEFAULT_GAME_NAME, MAX_CARTONS_GENERATED, MIN_SONGS_REQUIRED} from '../js/constants.js';
import {MSG, TEXT} from '../js/messages.js';
import {makeSongs, seedRandom} from './helpers/seed.js';

const build = ({failGenerate = false} = {}) => {
    const log = [];
    const generator = {
        generateCartones: (songs, count, existing) => {
            log.push(['genera', songs.length, count, existing.length]);
            if (failGenerate) throw new Error('boom <x>');
            return Array.from({length: count}, (_, index) => ({id: index + 1}));
        },
        generateSingleCarton: (songs, number) => new BingoCartonGenerator().generateSingleCarton(songs, number)
    };
    const sounds = {play: (name) => log.push('sonido:' + name)};
    const exporter = {
        downloadAsHTML: (cartones, config) => log.push(['html', cartones.length, config]),
        downloadAsPDF: (cartones, config) => log.push(['pdf', cartones.length, config])
    };
    const container = {innerHTML: ''};
    const manager = new CartonManager(container, sounds, generator, exporter, new CartonHtmlRenderer());
    return {manager, log, container};
};

test('generate devuelve los cartones y suena START antes y WIN después', () => {
    const {manager, log} = build();
    const result = manager.generate(makeSongs(30), 5);

    assert.equal(result.success, true);
    assert.equal(result.cartones.length, 5);
    assert.deepEqual(log, ['sonido:start', ['genera', 30, 5, 0], 'sonido:win']);
});

test('generate rechaza cantidades inválidas con el aviso, sin sonar ni generar', () => {
    for (const count of [NaN, 0, -1, MAX_CARTONS_GENERATED + 1]) {
        const {manager, log} = build();
        const result = manager.generate(makeSongs(30), count);

        assert.deepEqual(result, {success: false, alert: MSG.cartones.invalidCount(MAX_CARTONS_GENERATED)});
        assert.deepEqual(log, []);
    }
    assert.equal(build().manager.generate(makeSongs(30), MAX_CARTONS_GENERATED).success, true);
});

test('generate cuenta y pasa solo las canciones con archivo', () => {
    const {manager, log} = build();

    assert.deepEqual(manager.generate(makeSongs(MIN_SONGS_REQUIRED - 1), 3),
        {success: false, alert: MSG.cartones.notEnoughSongs(MIN_SONGS_REQUIRED)});
    assert.deepEqual(manager.generate(makeSongs(40, {withFile: MIN_SONGS_REQUIRED - 1}), 3).success, false);

    const result = manager.generate(makeSongs(34, {withFile: MIN_SONGS_REQUIRED}), 3);
    assert.equal(result.success, true);
    assert.deepEqual(log.find(entry => Array.isArray(entry)), ['genera', MIN_SONGS_REQUIRED, 3, 0]);
});

test('generate devuelve el error del generador como aviso', () => {
    const {manager} = build({failGenerate: true});

    assert.deepEqual(manager.generate(makeSongs(30), 3), {success: false, alert: MSG.cartones.generateFailed('boom <x>')});
});

test('generate pasa los cartones existentes al generador', () => {
    const {manager, log} = build();

    manager.generate(makeSongs(30), 2, [{id: 1}, {id: 2}, {id: 3}]);

    assert.deepEqual(log.find(entry => Array.isArray(entry)), ['genera', 30, 2, 3]);
});

test('printCartonesWithConfig valida, recorta el rango y exporta en el formato elegido', async () => {
    const {manager, log} = build();
    const cartones = Array.from({length: 10}, (_, index) => ({id: index + 1}));
    const options = {primaryColor: '#111', secondaryColor: '#222'};

    assert.deepEqual(await manager.printCartonesWithConfig([], 'x'), {success: false, error: TEXT.cartones.noneToPrint});
    assert.deepEqual(await manager.printCartonesWithConfig(cartones, 'Fiesta', 'html', {...options, printAll: true}), {success: true, count: 10});
    assert.deepEqual(await manager.printCartonesWithConfig(cartones, '', 'pdf', {...options, from: 2, to: 4}), {success: true, count: 3});
    assert.deepEqual(await manager.printCartonesWithConfig(cartones, 'x', 'html', {from: 4, to: 2}),
        {success: false, error: TEXT.cartones.invalidRange(10)});
    assert.deepEqual(await manager.printCartonesWithConfig(cartones, 'x', 'html', {from: 1, to: 11}),
        {success: false, error: TEXT.cartones.invalidRange(10)});
    assert.deepEqual(await manager.printCartonesWithConfig(cartones, 'x', 'doc', {printAll: true}),
        {success: false, error: TEXT.cartones.unsupportedFormat('doc')});

    assert.deepEqual(log[0], ['html', 10, {primaryColor: '#111', secondaryColor: '#222', gameName: 'Fiesta'}]);
    assert.deepEqual(log[1], ['pdf', 3, {primaryColor: '#111', secondaryColor: '#222', gameName: DEFAULT_GAME_NAME}]);
});

test('un exportador que falla devuelve su mensaje en lugar de lanzar', async () => {
    const {manager} = build();
    manager.registerExporter('html', async () => { throw new Error('sin permiso'); });

    assert.deepEqual(await manager.printCartonesWithConfig([{id: 1}], 'x', 'html', {printAll: true}), {success: false, error: 'sin permiso'});
});

test('updatePrintPreview escribe la vista previa o el error en el contenedor', () => {
    const seed = seedRandom(8);
    const originalError = console.error;
    console.error = () => {};
    try {
        const {manager, container} = build();

        manager.updatePrintPreview(makeSongs(30), 'Fiesta <b>', {primaryColor: '#123456', secondaryColor: '#654321'});
        assert.ok(container.innerHTML.includes('preview-carton'));
        assert.ok(container.innerHTML.includes('#123456'));
        assert.equal(container.innerHTML.includes('Fiesta <b>'), false);

        manager.updatePrintPreview(null, '', {primaryColor: '#000', secondaryColor: '#fff'});
        assert.ok(container.innerHTML.includes('carton-preview-placeholder'));
    } finally {
        console.error = originalError;
        seed.restore();
    }
});
