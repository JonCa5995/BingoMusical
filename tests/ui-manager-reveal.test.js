import test from 'node:test';
import assert from 'node:assert/strict';
import {UIManager} from '../js/modules/UIManager.js';
import {installDocument, mkEl} from './helpers/fakeDom.js';

installDocument();

const build = () => {
    const container = mkEl();
    container.scrollTo = () => {};
    const historyGrid = mkEl();
    historyGrid.parentElement = container;
    const elements = {songTitleElement: mkEl('h2'), currentIconImg: mkEl('img'), historyGrid};

    return {ui: new UIManager(elements, 24), elements};
};

const song = {id: 3, title: 'Tres', icon: '🎵', iconType: 'emoji'};

test('el reproductor muestra el título y el icono de la canción al momento, sin dejarlos ocultos', () => {
    const {ui, elements} = build();

    ui.updatePlayerUI(song);

    assert.equal(elements.songTitleElement.textContent, 'Tres');
    assert.equal(elements.currentIconImg.alt, 'Tres');
    assert.ok(elements.currentIconImg.src.startsWith('data:image/png'));
    assert.equal(elements.songTitleElement.style.opacity, undefined);
    assert.equal(elements.currentIconImg.style.opacity, undefined);
});

test('el historial añade el icono ya visible, sin retardo ni opacidad cero', () => {
    const {ui, elements} = build();

    const item = ui.addToHistory(song);

    assert.equal(elements.historyGrid.children.length, 1);
    assert.equal(item.title, 'Tres');
    assert.equal(item.children[0].style.opacity, undefined);
    assert.ok(item.children[0].src.startsWith('data:image/png'));
});

test('no quedan temporizadores de revelado en el gestor de la interfaz', () => {
    const {ui} = build();

    assert.equal('playerRevealTimers' in ui, false);
    assert.equal(typeof ui.clearPlayerRevealTimers, 'undefined');
});
