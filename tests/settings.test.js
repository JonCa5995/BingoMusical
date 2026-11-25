import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultSettings, sanitizeSettings, SETTING_KEYS} from '../js/modules/Settings.js';
import {MAX_CARTONS_GENERATED, MAX_GAME_NAME_LENGTH, MAX_REVEAL_TIME_SECONDS, THEME} from '../js/constants.js';

test('los valores por defecto superan su propia validación', () => {
    const defaults = defaultSettings();
    const {values, discarded} = sanitizeSettings(defaults);

    assert.deepEqual(values, defaults);
    assert.deepEqual(discarded, []);
    assert.deepEqual(Object.keys(defaults), [...SETTING_KEYS]);
});

test('acepta valores válidos en sus límites', () => {
    const input = {
        theme: THEME.LIGHT, musicVolume: 0, effectsVolume: 1, titleRevealTime: MAX_REVEAL_TIME_SECONDS, iconRevealTime: 0,
        gameName: 'x'.repeat(MAX_GAME_NAME_LENGTH), printPrimaryColor: '#ABCDEF', printSecondaryColor: '#000000', cartonCount: MAX_CARTONS_GENERATED
    };
    const {values, applied, discarded} = sanitizeSettings(input);

    assert.deepEqual(discarded, []);
    assert.equal(applied.length, SETTING_KEYS.length);
    assert.equal(values.printPrimaryColor, '#abcdef');
});

test('descarta lo que está fuera de rango, con el tipo equivocado o es desconocido', () => {
    const {values, applied, discarded} = sanitizeSettings({
        theme: 'rosa', musicVolume: 1.5, effectsVolume: -0.1, titleRevealTime: 31, iconRevealTime: 2.5, gameName: 12,
        printPrimaryColor: 'rojo', printSecondaryColor: '#fff', cartonCount: 0, otraCosa: true
    });

    assert.deepEqual(values, {});
    assert.deepEqual(applied, []);
    assert.equal(discarded.length, 10);
});

test('rechaza NaN, infinitos, textos numéricos y nulos', () => {
    const {values} = sanitizeSettings({musicVolume: NaN, effectsVolume: Infinity, titleRevealTime: '5', iconRevealTime: null, cartonCount: '10'});

    assert.deepEqual(values, {});
});

test('recorta el nombre del juego a su longitud máxima y quita los espacios', () => {
    const {values} = sanitizeSettings({gameName: `  ${'a'.repeat(80)}  `});

    assert.equal(values.gameName.length, MAX_GAME_NAME_LENGTH);
    assert.equal(sanitizeSettings({gameName: '   '}).values.gameName, '');
});

test('no se deja engañar por claves como __proto__ o constructor', () => {
    const {values, discarded} = sanitizeSettings(JSON.parse('{"__proto__": {"musicVolume": 0.1}, "constructor": 1, "toString": 2}'));

    assert.deepEqual(values, {});
    assert.equal(discarded.length, 3);
    assert.equal({}.musicVolume, undefined);
});

test('lo que no es un objeto no aplica nada', () => {
    for (const raw of [null, undefined, 5, 'texto', [], [1, 2]]) {
        assert.deepEqual(sanitizeSettings(raw), {values: {}, applied: [], discarded: []});
    }
});
