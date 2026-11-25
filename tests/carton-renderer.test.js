import test from 'node:test';
import assert from 'node:assert/strict';
import {CartonHtmlRenderer, DECORATIVE_ICON_HTML} from '../js/modules/CartonHtmlRenderer.js';
import {BingoCartonGenerator} from '../js/bingoCartonGenerator.js';
import {DEFAULT_GAME_NAME, DEFAULT_PRINT_PRIMARY_COLOR} from '../js/constants.js';
import {makeSongs, seedRandom} from './helpers/seed.js';

const makeCartones = (count, songs = makeSongs(30)) => {
    const seed = seedRandom(11);
    try {
        return new BingoCartonGenerator().generateCartones(songs, count);
    } finally {
        seed.restore();
    }
};

test('el documento imprimible incluye todos los cartones y escapa el nombre del juego', () => {
    const renderer = new CartonHtmlRenderer();
    const html = renderer.generatePrintableHTML(makeCartones(4), {gameName: 'Mi <b>juego</b> & "co"'});

    assert.ok(html.startsWith('<!DOCTYPE html>'));
    assert.equal((html.match(/class="carton-container"/g) || []).length, 4);
    assert.equal(html.includes('<b>juego</b>'), false);
    assert.ok(html.includes('Mi &lt;b&gt;juego&lt;/b&gt; &amp; &quot;co&quot;'));
});

test('sin nombre ni colores usa los valores por defecto', () => {
    const html = new CartonHtmlRenderer().generatePrintableHTML(makeCartones(1));

    assert.ok(html.includes(DEFAULT_GAME_NAME));
    assert.ok(html.includes(DEFAULT_PRINT_PRIMARY_COLOR));
});

test('las canciones con icono de imagen o emoji se escapan en cada casilla', () => {
    const songs = makeSongs(30);
    songs[0].iconType = 'image';
    songs[0].icon = 'data:image/png;base64,AAA"onerror="x';
    songs[0].title = '<script>';
    const html = new CartonHtmlRenderer().generatePrintableHTML(makeCartones(60, songs));

    assert.equal(html.includes('<script>'), false);
    assert.equal(html.includes('"onerror="x'), false);
    assert.ok(html.includes('&lt;script&gt;'));
});

test('la vista previa lleva los colores, el nombre escapado y casillas decorativas', () => {
    const [carton] = makeCartones(1);
    const html = new CartonHtmlRenderer().generatePreviewHTML(carton, {primaryColor: '#123456', secondaryColor: '#abcdef'}, 'Fiesta <i>');

    assert.ok(html.includes('color: #123456'));
    assert.ok(html.includes('background-color: #abcdef'));
    assert.ok(html.includes('Fiesta &lt;i&gt;'));
    assert.ok(html.includes(DECORATIVE_ICON_HTML));
    assert.equal((html.match(/preview-cell /g) || []).length, 24);
});
