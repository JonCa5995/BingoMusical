import test from 'node:test';
import assert from 'node:assert/strict';
import {installDocument} from './helpers/fakeDom.js';

const dom = installDocument();
const originalWarn = console.warn;
const originalError = console.error;
console.warn = () => {};
console.error = () => {};

await import('../js/app.js');

const {get, radios, documentListeners} = dom;
const click = (id) => get(id).fire('click');
const isOpen = (id) => !get(id)._cls.has('hidden');

test.after(() => {
    console.warn = originalWarn;
    console.error = originalError;
});

test('al arrancar pinta la lista de canciones vacía', () => {
    assert.ok(get('#songs-list').children.length > 0);
});

test('iniciar el juego sin canciones muestra una alerta que se cierra con su botón', () => {
    click('#play-btn');
    assert.equal(isOpen('#alert-modal'), true);
    click('#alert-ok');
    assert.equal(isOpen('#alert-modal'), false);
});

test('la configuración se abre, se guarda con aviso y se cierra', () => {
    click('#config-btn');
    assert.equal(isOpen('#config-modal'), true);
    click('#save-config-btn');
    assert.equal(isOpen('#config-modal'), false);
    assert.equal(isOpen('#alert-modal'), true);
    click('#alert-ok');
});

test('las opciones de cartones se abren y se cierran', () => {
    click('#generate-cartones');
    assert.equal(isOpen('#carton-options-modal'), true);
    click('#close-carton-options-modal');
    assert.equal(isOpen('#carton-options-modal'), false);
});

test('generar cartones sin canciones avisa de que faltan', () => {
    click('#generate-cartones');
    click('#create-new-cartones-btn');
    click('#generate-save-cartones-btn');
    assert.equal(isOpen('#alert-modal'), true);
    click('#alert-ok');
    click('#close-carton-modal');
});

test('imprimir sin cartones avisa', () => {
    click('#generate-cartones');
    click('#print-existing-cartones-btn');
    assert.equal(isOpen('#alert-modal'), true);
    click('#alert-ok');
    click('#close-carton-options-modal');
    assert.equal(isOpen('#carton-options-modal'), false);
});

test('el selector de rango, los colores, el tema y la pantalla completa responden', () => {
    assert.doesNotThrow(() => {
        radios[1].fire('change', {target: {value: 'range'}});
        get('#print-primary-color').fire('input', {target: {value: '#123456'}});
        click('#theme-toggle-btn');
        click('#fullscreen-btn');
    });
});

test('la tecla ? abre la ayuda de atajos', () => {
    (documentListeners.keydown || []).forEach(listener => listener({key: '?', target: {tagName: 'BODY'}, preventDefault() {}}));
    assert.equal(isOpen('#alert-modal'), true);
    click('#alert-ok');
});

test('el nombre del juego recorta lo que supera el máximo', () => {
    const input = get('#game-name-input');
    const event = {target: {value: 'x'.repeat(80)}};

    input.fire('blur', event);

    assert.equal(event.target.value.length, 50);
    assert.equal(isOpen('#alert-modal'), true);
    click('#alert-ok');
});

test('añadir canciones sin archivos, exportar sin canciones y borrar todo no fallan', () => {
    assert.doesNotThrow(() => {
        get('#add-songs').fire('change');
        click('#export-list');
        click('#alert-ok');
        click('#delete-all-btn');
        click('#alert-ok');
    });
});
