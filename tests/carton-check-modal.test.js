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
        checkCartonSubmitBtn: mkEl('button'), checkCartonResult: mkEl('div'), checkCartonTitle: mkEl('h2'), checkCartonActions: mkEl('div')
    };
    const calls = [];
    const log = [];
    const modal = new CartonCheckModal({
        elements, openButton: mkEl('button'), game,
        modals: {registerModal: (element, onClose) => { elements.onClose = onClose; }, openWithClick: () => log.push('abre'), closeWithClick: () => log.push('cierra')},
        dialogs: {showAlert: (alert) => log.push(['aviso', alert])},
        sounds: {play: (name) => log.push(['sonido', name])},
        callbacks: {
            onSing: ({kind, carton, result}) => calls.push(['canta', kind, carton?.id ?? null, result === null ? null : result.linea]),
            onShowFailure: ({kind, carton}) => calls.push(['fallo', kind, carton.id]),
            onDismiss: () => calls.push(['quita']),
            onRestart: async () => { calls.push(['reinicia']); }
        }
    });
    modal.init();
    return {modal, elements, log, game, generated, songs, calls};
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

const labels = (elements) => elements.checkCartonActions.children.filter(child => child.tag === 'button').map(button => button.textContent);
const click = (elements, index) => elements.checkCartonActions.children.filter(child => child.tag === 'button')[index].fire('click');
const playRow = (game, songs, carton, rowIndex) => {
    const ids = new Set(carton.rows[rowIndex].cells.filter(cell => cell.song).map(cell => cell.song.id));
    songs.filter(song => ids.has(song.id)).forEach(song => game.markSongAsPlayed(song));
};
const playAllOf = (game, songs, carton) => carton.rows.forEach((row, index) => playRow(game, songs, carton, index));

test('abrir en modo línea pone su título y deja el campo listo, sin botones hasta comprobar', () => {
    const {modal, elements} = build();

    modal.open('linea');

    assert.equal(elements.checkCartonTitle.textContent, TEXT.checkCarton.modeTitle.linea);
    assert.equal(elements.checkCartonNumberInput.disabled, false);
    assert.deepEqual(labels(elements), []);
});

test('comprobar con una primera línea ofrece cantarla; al pulsarlo canta con ese cartón y deja continuar', () => {
    const {modal, elements, calls, game, songs, generated} = build();
    playRow(game, songs, generated[0], 0);

    modal.open();
    type(elements, 1);
    modal.check();

    assert.deepEqual(labels(elements), [TEXT.checkCarton.sing.linea]);
    click(elements, 0);

    assert.deepEqual(calls, [['canta', 'linea', 1, true]]);
    assert.deepEqual(labels(elements), [TEXT.checkCarton.continuePlaying]);
    assert.equal(elements.checkCartonActions.children[0].textContent, TEXT.checkCarton.onProjector);
    assert.equal(elements.checkCartonResult.children.at(-1).textContent.includes(TEXT.checkCarton.onProjector), false);
});

test('con línea y bingo a la vez se ofrecen las dos, y cantar bingo deja continuar y comenzar de nuevo', () => {
    const {modal, elements, calls, game, songs, generated} = build();
    playAllOf(game, songs, generated[0]);

    modal.open();
    type(elements, 1);
    modal.check();

    assert.deepEqual(labels(elements), [TEXT.checkCarton.sing.linea, TEXT.checkCarton.sing.bingo]);
    click(elements, 1);

    assert.deepEqual(calls, [['canta', 'bingo', 1, true]]);
    assert.deepEqual(labels(elements), [TEXT.checkCarton.continuePlaying, TEXT.checkCarton.restart]);
});

test('si la línea ya se cantó, no se ofrece otra vez; el bingo sí si lo hay', () => {
    const {modal, elements, game, songs, generated} = build();
    playAllOf(game, songs, generated[0]);
    game.completeLinea();

    modal.open();
    type(elements, 1);
    modal.check();

    assert.deepEqual(labels(elements), [TEXT.checkCarton.sing.bingo]);
});

test('si la línea y el bingo ya se cantaron, no hay botones de cantar', () => {
    const {modal, elements, game, songs, generated} = build();
    playAllOf(game, songs, generated[0]);
    game.completeLinea();
    game.completeBingo();

    modal.open();
    type(elements, 1);
    modal.check();

    assert.deepEqual(labels(elements), []);
});

test('al comprobar sin línea no hay botones: el modo comprobar nunca ofrece el fallo', () => {
    const {modal, elements} = build({played: 2});

    modal.open();
    type(elements, 1);
    modal.check();

    assert.deepEqual(labels(elements), []);
});

test('con muy pocas canciones reproducidas no se ofrece cantar aunque el cartón las tenga', () => {
    const {modal, elements, game, songs, generated} = build();
    const first = generated[0].rows[0].cells.filter(cell => cell.song).slice(0, 2).map(cell => cell.song.id);
    songs.filter(song => first.includes(song.id)).forEach(song => game.markSongAsPlayed(song));

    modal.open();
    type(elements, 1);
    modal.check();

    assert.deepEqual(labels(elements), []);
});

test('en modo línea, un cartón sin línea ofrece mostrar el fallo; al pulsarlo se envía y se puede continuar', () => {
    const {modal, elements, calls} = build({played: 3});

    modal.open('linea');
    type(elements, 2);
    modal.check();

    assert.deepEqual(labels(elements), [TEXT.checkCarton.showFailure]);
    click(elements, 0);

    assert.deepEqual(calls, [['fallo', 'linea', 2]]);
    assert.deepEqual(labels(elements), [TEXT.checkCarton.continuePlaying]);
    assert.equal(elements.checkCartonActions.children[0].textContent, TEXT.checkCarton.failureOnProjector);
});

test('en modo línea, un cartón con línea ofrece solo cantar la línea aunque ya tenga el bingo', () => {
    const {modal, elements, game, songs, generated} = build();
    playAllOf(game, songs, generated[0]);

    modal.open('linea');
    type(elements, 1);
    modal.check();

    assert.deepEqual(labels(elements), [TEXT.checkCarton.sing.linea]);
});

test('en modo bingo, con línea pero sin bingo ofrece el fallo; con bingo ofrece cantarlo', () => {
    const {modal, elements, calls, game, songs, generated} = build();
    playRow(game, songs, generated[0], 0);
    playRow(game, songs, generated[0], 1);
    playRow(game, songs, generated[0], 2);

    modal.open('bingo');
    type(elements, 2);
    modal.check();
    assert.deepEqual(labels(elements), [TEXT.checkCarton.showFailure]);
    click(elements, 0);
    assert.deepEqual(calls, [['fallo', 'bingo', 2]]);

    modal.open('bingo');
    type(elements, 1);
    modal.check();
    assert.deepEqual(labels(elements), [TEXT.checkCarton.sing.bingo]);
});

test('cerrar la ventana después de cantar quita la pantalla de la proyección, una sola vez', () => {
    const {modal, elements, calls, game, songs, generated} = build();
    playRow(game, songs, generated[0], 0);
    modal.open();
    type(elements, 1);
    modal.check();
    click(elements, 0);

    elements.checkCartonModal.fire('close');
    elements.checkCartonModal.fire('close');

    assert.deepEqual(calls.filter(call => call[0] === 'quita'), [['quita']]);
});

test('comprobar otro cartón después de cantar quita la pantalla anterior', () => {
    const {modal, elements, calls, game, songs, generated} = build();
    playRow(game, songs, generated[0], 0);
    modal.open();
    type(elements, 1);
    modal.check();
    click(elements, 0);

    type(elements, 2);
    modal.check();

    assert.deepEqual(calls.filter(call => call[0] === 'quita'), [['quita']]);
});

test('cerrar la ventana sin haber mostrado nada no toca la proyección', () => {
    const {modal, elements, calls} = build({played: 2});
    modal.open();
    type(elements, 1);
    modal.check();

    elements.checkCartonModal.fire('close');

    assert.deepEqual(calls, []);
});

test('«Continuar jugando» cierra la ventana y quita la pantalla', () => {
    const {modal, elements, calls, log, game, songs, generated} = build();
    playRow(game, songs, generated[0], 0);
    modal.open();
    type(elements, 1);
    modal.check();
    click(elements, 0);

    click(elements, 0);

    assert.ok(log.includes('cierra'));
    assert.deepEqual(calls.at(-1), ['quita']);
});

test('«Comenzar de nuevo» reinicia la partida y luego cierra la ventana', async () => {
    const {modal, elements, calls, log, game, songs, generated} = build();
    playAllOf(game, songs, generated[0]);
    modal.open('bingo');
    type(elements, 1);
    modal.check();
    click(elements, 0);

    click(elements, 1);
    await new Promise(resolve => setImmediate(resolve));

    assert.deepEqual(calls.filter(call => call[0] === 'reinicia'), [['reinicia']]);
    assert.ok(log.includes('cierra'));
    assert.deepEqual(calls.at(-1), ['quita']);
});

test('sin cartones, cantar LÍNEA abre la ventana con un único botón para cantar sin cartón', () => {
    const {modal, elements, calls, log} = build({cartones: 0});

    modal.open('linea');

    assert.ok(log.includes('abre'));
    assert.equal(elements.checkCartonNumberInput.disabled, true);
    assert.equal(elements.checkCartonSubmitBtn.disabled, true);
    assert.deepEqual(labels(elements), [TEXT.checkCarton.singWithoutCarton.linea]);

    click(elements, 0);
    assert.deepEqual(calls, [['canta', 'linea', null, null]]);
});

test('sin cartones, cantar BINGO ofrece cantar sin cartón y comprobar sigue avisando', () => {
    const {modal, elements, log} = build({cartones: 0});

    modal.open('bingo');
    assert.deepEqual(labels(elements), [TEXT.checkCarton.singWithoutCarton.bingo]);

    log.length = 0;
    modal.open('check');
    assert.deepEqual(log, [['aviso', MSG.checkCarton.noCartones]]);
});

test('el aviso de fin de canciones muestra el bingo con continuar y comenzar de nuevo, y cerrarlo quita la pantalla', () => {
    const {modal, elements, calls} = build({cartones: 0});

    modal.open('ended');

    assert.equal(elements.checkCartonTitle.textContent, TEXT.checkCarton.modeTitle.ended);
    assert.equal(elements.checkCartonNumberInput.disabled, true);
    assert.deepEqual(labels(elements), [TEXT.checkCarton.continuePlaying, TEXT.checkCarton.restart]);

    elements.checkCartonModal.fire('close');
    assert.deepEqual(calls, [['quita']]);
});

test('reabrir la ventana empieza limpia: sin resultado, sin botones y con el campo vacío', () => {
    const {modal, elements, game, songs, generated} = build();
    playRow(game, songs, generated[0], 0);
    modal.open();
    type(elements, 1);
    modal.check();

    modal.open('bingo');

    assert.equal(elements.checkCartonResult.children.length, 0);
    assert.deepEqual(labels(elements), []);
    assert.equal(elements.checkCartonNumberInput.value, '');
});

test('Esc, clic fuera o la X cierran la ventana a través del mismo cierre y quitan la pantalla de la proyección al instante', () => {
    const {modal, elements, calls, log, game, songs, generated} = build();
    playRow(game, songs, generated[0], 0);
    modal.open();
    type(elements, 1);
    modal.check();
    click(elements, 0);

    elements.onClose();

    assert.ok(log.includes('cierra'));
    assert.deepEqual(calls.at(-1), ['quita']);
});

test('el botón X de la ventana la cierra y quita la pantalla', () => {
    const {modal, elements, calls, game, songs, generated} = build();
    playRow(game, songs, generated[0], 0);
    modal.open();
    type(elements, 1);
    modal.check();
    click(elements, 0);

    elements.closeCheckCartonModalBtn.fire('click');

    assert.deepEqual(calls.at(-1), ['quita']);
});
