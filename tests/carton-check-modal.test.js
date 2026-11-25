import test from 'node:test';
import assert from 'node:assert/strict';
import {CartonCheckModal} from '../js/modules/CartonCheckModal.js';
import {GameManager} from '../js/modules/GameManager.js';
import {BingoCartonGenerator} from '../js/bingoCartonGenerator.js';
import {MSG, TEXT} from '../js/messages.js';
import {installDocument, mkDialog, mkEl} from './helpers/fakeDom.js';
import {makeSongs, seedRandom} from './helpers/seed.js';

installDocument();

const build = ({played = 0, cartones = 3} = {}) => {
    const seed = seedRandom(41);
    const songs = makeSongs(30);
    const game = new GameManager();
    let generated = [];
    try {
        generated = cartones > 0 ? new BingoCartonGenerator().generateCartones(songs, cartones) : [];
    } finally {
        seed.restore();
    }
    game.setCartones(generated);
    game.startGame();
    songs.slice(0, played).forEach(song => game.markSongAsPlayed(song));

    const elements = {
        checkCartonModal: mkDialog(), closeCheckCartonModalBtn: mkEl('button'), checkCartonNumberInput: Object.assign(mkEl('input'), {focus() { elements.focused = true; }}),
        checkCartonSubmitBtn: mkEl('button'), checkCartonResult: mkEl('div')
    };
    const log = [];
    const modal = new CartonCheckModal({
        elements, openButton: mkEl('button'), game,
        modals: {registerWithCloseButton() {}, openWithClick: () => log.push('abre')},
        dialogs: {showAlert: (alert) => log.push(['aviso', alert])},
        sounds: {play: (name) => log.push(['sonido', name])}
    });
    modal.init();
    return {modal, elements, log, game, generated, songs};
};

const type = (elements, value) => { elements.checkCartonNumberInput.value = String(value); };
const texts = (container) => container.children.map(child => child.textContent);

test('abrir sin cartones avisa y no abre la ventana', () => {
    const {modal, log} = build({cartones: 0});

    modal.open();

    assert.deepEqual(log, [['aviso', MSG.checkCarton.noCartones]]);
});

test('abrir con cartones abre la ventana, limita el número al total y deja el cursor en el campo', () => {
    const {modal, elements, log} = build({cartones: 5});

    modal.open();

    assert.deepEqual(log, ['abre']);
    assert.equal(elements.checkCartonNumberInput.max, 5);
    assert.equal(elements.focused, true);
});

test('un número vacío, no numérico o menor que 1 avisa', () => {
    const {modal, elements, log} = build();

    for (const value of ['', 'abc', '0', '-2']) {
        log.length = 0;
        type(elements, value);
        modal.check();
        assert.deepEqual(log, [['aviso', MSG.checkCarton.invalidNumber(3)]], value);
    }
});

test('un número que no existe avisa con el total de cartones', () => {
    const {modal, elements, log} = build();

    type(elements, 9);
    modal.check();

    assert.deepEqual(log, [['aviso', MSG.checkCarton.notFound(9, 3)]]);
    assert.equal(elements.checkCartonResult.children.length, 0);
});

test('comprobar un cartón sin canciones reproducidas muestra el veredicto negativo y sus tres filas', () => {
    const {modal, elements, log} = build({played: 0});

    type(elements, 2);
    modal.check();

    const [title, linea, bingo, ...rows] = elements.checkCartonResult.children;
    assert.equal(title.textContent, TEXT.checkCarton.cartonTitle(2));
    assert.ok(linea.className.includes('check-pending'));
    assert.ok(linea.textContent.startsWith('📏 LÍNEA: no'));
    assert.ok(bingo.textContent.includes('faltan 12 de 12'));
    assert.equal(rows.length, 3);
    assert.ok(rows.every(row => row.children[1].children.length === 4));
    assert.deepEqual(log, [['sonido', 'click']]);
});

test('cada canción lleva su marca de salida y su título como texto', () => {
    const {modal, elements, generated} = build({played: 0});
    const first = generated[0].rows[0].cells.find(cell => cell.type === 'song').song;

    type(elements, 1);
    modal.check();

    const item = elements.checkCartonResult.children[3].children[1].children[0];
    assert.equal(item.children[0].textContent, '✗');
    assert.equal(item.children[0].attrs['aria-label'], TEXT.checkCarton.pending);
    assert.equal(item.children[2].textContent, first.title);
    assert.ok(item.className.includes('check-song-pending'));
});

test('con todo reproducido hay línea y bingo, suena la victoria y las filas salen completas', () => {
    const {modal, elements, log} = build({played: 30});

    type(elements, 1);
    modal.check();

    const [, linea, bingo, ...rows] = elements.checkCartonResult.children;
    assert.ok(linea.className.includes('check-ok'));
    assert.ok(linea.textContent.includes('filas 1 y 2 y 3'));
    assert.ok(bingo.className.includes('check-ok'));
    assert.ok(rows.every(row => row.className.includes('check-row-complete')));
    assert.deepEqual(log, [['sonido', 'win']]);
});

test('comprobar de nuevo sustituye el resultado anterior en lugar de añadirlo', () => {
    const {modal, elements} = build({played: 5});

    type(elements, 1);
    modal.check();
    modal.check();
    type(elements, 3);
    modal.check();

    assert.equal(elements.checkCartonResult.children.length, 6);
    assert.equal(elements.checkCartonResult.children[0].textContent, TEXT.checkCarton.cartonTitle(3));
});

test('un título con HTML se muestra como texto, no como etiquetas', () => {
    const {modal, elements, generated, songs} = build({played: 0});
    const song = generated[0].rows[0].cells.find(cell => cell.type === 'song').song;
    song.title = '<img src=x onerror=alert(1)>';
    song.icon = '<b>';

    type(elements, 1);
    modal.check();

    const item = elements.checkCartonResult.children[3].children[1].children[0];
    assert.equal(item.children[2].textContent, '<img src=x onerror=alert(1)>');
    assert.equal(item.children[1].textContent, '<b>');
    assert.equal(item.children[2].innerHTML, '');
    assert.ok(songs.length > 0);
});

test('Enter en el campo comprueba el cartón', () => {
    const {elements, log} = build({played: 0});

    type(elements, 1);
    elements.checkCartonNumberInput.fire('keydown', {key: 'Enter'});

    assert.ok(log.some(entry => entry[0] === 'sonido'));
    assert.ok(elements.checkCartonResult.children.length > 0);
});

test('otra tecla en el campo no comprueba nada', () => {
    const {elements, log} = build();

    type(elements, 1);
    elements.checkCartonNumberInput.fire('keydown', {key: '1'});

    assert.deepEqual(log, []);
});

test('el botón Comprobar lanza la comprobación', () => {
    const {elements} = build({played: 2});

    type(elements, 2);
    elements.checkCartonSubmitBtn.fire('click');

    assert.equal(elements.checkCartonResult.children.length, 6);
});

test('el estado se mide con las canciones del historial, no con una copia', () => {
    const {modal, elements, game, songs} = build({played: 0});

    type(elements, 1);
    modal.check();
    assert.ok(elements.checkCartonResult.children[2].textContent.includes('faltan 12 de 12'));

    const mine = new Set();
    game.getCartones()[0].rows.forEach(row => row.cells.forEach(cell => cell.song && mine.add(cell.song.id)));
    songs.filter(song => mine.has(song.id)).forEach(song => game.markSongAsPlayed(song));
    modal.check();

    assert.ok(elements.checkCartonResult.children[2].className.includes('check-ok'));
});
