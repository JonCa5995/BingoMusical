import test from 'node:test';
import assert from 'node:assert/strict';
import {escapeHTML, gameNameOrDefault, iconTextHtml, slugify} from '../js/utils.js';
import {DEFAULT_GAME_NAME} from '../js/constants.js';
import {formatTime} from '../js/modules/AudioControlsView.js';

test('escapeHTML escapa los cinco caracteres peligrosos y tolera nulos', () => {
    assert.equal(escapeHTML(`<a href="x">'&'</a>`), '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;');
    assert.equal(escapeHTML(null), '');
    assert.equal(escapeHTML(undefined), '');
    assert.equal(escapeHTML(12), '12');
});

test('slugify pasa a minúsculas y sustituye lo que no es alfanumérico', () => {
    assert.equal(slugify('Mi Fiesta 2024!'), 'mi-fiesta-2024-');
    assert.equal(slugify(null), '');
});

test('gameNameOrDefault usa el nombre por defecto cuando no hay nombre', () => {
    assert.equal(gameNameOrDefault(''), DEFAULT_GAME_NAME);
    assert.equal(gameNameOrDefault(undefined), DEFAULT_GAME_NAME);
    assert.equal(gameNameOrDefault('Fiesta'), 'Fiesta');
});

test('iconTextHtml envuelve el icono en un span oculto a lectores de pantalla', () => {
    assert.equal(iconTextHtml({icon: '▶️', text: 'Iniciar'}), '<span aria-hidden="true">▶️</span> Iniciar');
});

test('formatTime da minutos y segundos con ceros y tolera valores no finitos', () => {
    assert.equal(formatTime(0), '0:00');
    assert.equal(formatTime(65.9), '1:05');
    assert.equal(formatTime(600), '10:00');
    assert.equal(formatTime(NaN), '0:00');
    assert.equal(formatTime(Infinity), '0:00');
});
