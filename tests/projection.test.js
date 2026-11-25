import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ProjectionChannel, buildProjectionProgress, buildProjectionState} from '../js/modules/ProjectionChannel.js';
import {ProjectionView, fitHistorySize} from '../js/modules/ProjectionView.js';
import {
    DEFAULT_GAME_NAME,
    PROJECTION_DOCK_MS,
    PROJECTION_HISTORY_BASE_VMIN,
    PROJECTION_HISTORY_MIN_PX,
    PROJECTION_PAGE,
    PROJECTION_STATE_VERSION
} from '../js/constants.js';
import {TEXT} from '../js/messages.js';
import {installDocument, mkEl} from './helpers/fakeDom.js';
import {makeGame} from './helpers/snapshot.js';

installDocument();

const spreadEl = (rect = {left: 0, top: 0, width: 0, height: 0}) => {
    const el = mkEl();
    el.replaceChildren = (...children) => { el.children = children; };
    el.getBoundingClientRect = () => rect;
    return el;
};

const ICON_RECT = {left: 400, top: 200, width: 300, height: 300};
const SLOT_RECT = {left: 20, top: 10, width: 60, height: 60};

const makeElements = () => {
    const elements = {
        header: spreadEl(), logo: spreadEl(), logoSlot: spreadEl(SLOT_RECT), gameName: spreadEl(), status: spreadEl(), icon: spreadEl(ICON_RECT), title: spreadEl(),
        counter: spreadEl(), history: spreadEl(), progressBar: spreadEl(), progressFill: spreadEl(), time: spreadEl(),
        celebration: spreadEl(), celebrationTitle: spreadEl(), celebrationText: spreadEl(), celebrationRows: spreadEl()
    };
    elements.celebration.classList.add('hidden');
    return elements;
};

const fakeChannel = () => {
    const channel = {sent: [], postMessage(message) { channel.sent.push(message); }, onmessage: null};
    return channel;
};

const send = (view, data) => view.channel.onmessage({data});

test('buildProjectionState resume la partida sin exponer nada más de lo necesario', () => {
    const {songs, game} = makeGame({songCount: 26, played: 3});

    const state = buildProjectionState({songs, game, theme: 'light', startedAt: 1000});

    assert.equal(state.type, 'state');
    assert.equal(state.version, PROJECTION_STATE_VERSION);
    assert.equal(state.theme, 'light');
    assert.equal(state.gameName, 'Fiesta');
    assert.equal(state.played, 3);
    assert.equal(state.total, 26);
    assert.equal(state.current.id, songs[2].id);
    assert.deepEqual(Object.keys(state.current).sort(), ['icon', 'iconType', 'id', 'title']);
    assert.equal(state.startedAt, 1000);
    assert.equal(state.titleRevealMs, game.getTitleRevealTime() * 1000);
    assert.equal(state.iconRevealMs, game.getIconRevealTime() * 1000);
    assert.equal(state.history.length, 3);
    assert.deepEqual(Object.keys(state.history[0]).sort(), ['icon', 'iconType', 'id']);
});

test('buildProjectionState incluye todas las canciones reproducidas, no solo las últimas', () => {
    const {songs, game} = makeGame({songCount: 40, played: 30});

    const state = buildProjectionState({songs, game, theme: 'dark', startedAt: null});

    assert.equal(state.played, 30);
    assert.equal(state.history.length, 30);
    assert.equal(state.history.at(-1).id, songs[29].id);
});

test('fuera de partida el estado va ya revelado; sin canción actual, current es null', () => {
    const {songs, game} = makeGame({songCount: 26, played: 0, started: false});

    const state = buildProjectionState({songs, game, theme: 'dark', startedAt: null});

    assert.equal(state.current, null);
    assert.equal(state.revealed, true);
    assert.equal(state.startedAt, null);
});

test('ProjectionChannel publica el estado, agrupa avisos seguidos y responde al hello', async () => {
    const channel = fakeChannel();
    let version = 0;
    const projection = new ProjectionChannel({getState: () => ({n: ++version}), createChannel: () => channel, openWindow: () => {}});

    projection.schedulePublish();
    projection.schedulePublish();
    projection.schedulePublish();
    await Promise.resolve();
    assert.deepEqual(channel.sent, [{n: 1}]);

    channel.onmessage({data: {type: 'hello'}});
    assert.deepEqual(channel.sent, [{n: 1}, {n: 2}]);

    channel.onmessage({data: {type: 'otra cosa'}});
    assert.equal(channel.sent.length, 2);
});

test('ProjectionChannel sin BroadcastChannel no falla', () => {
    const projection = new ProjectionChannel({getState: () => ({}), createChannel: () => null, openWindow: () => {}});

    projection.publish();
    projection.schedulePublish();
});

test('ProjectionChannel abre la ventana de proyección', () => {
    const calls = [];
    const projection = new ProjectionChannel({getState: () => ({}), createChannel: () => null, openWindow: (...args) => calls.push(args)});

    projection.open();

    assert.equal(calls.length, 1);
    assert.equal(calls[0][0], PROJECTION_PAGE);
});

const buildView = ({now = 10_000} = {}) => {
    const el = makeElements();
    const channel = fakeChannel();
    const root = {dataset: {}};
    const timers = [];
    const view = new ProjectionView({
        elements: el, channel, root, now: () => now,
        timers: {
            set: (fn, delay) => { timers.push({fn, delay, cleared: false}); return timers.length - 1; },
            clear: (id) => { timers[id].cleared = true; }
        }
    });
    return {view, el, channel, root, timers};
};

const stateFor = (overrides = {}) => ({
    type: 'state', version: PROJECTION_STATE_VERSION, theme: 'light', gameName: 'Fiesta', gameStarted: true, played: 2, total: 20,
    current: {id: 2, title: 'Canción dos', icon: '🎵', iconType: 'emoji'},
    startedAt: 10_000, titleRevealMs: 5000, iconRevealMs: 2000, revealed: false,
    history: [{id: 1, icon: '🎸', iconType: 'emoji'}, {id: 2, icon: '🎵', iconType: 'emoji'}],
    ...overrides
});

test('al arrancar pide el estado y muestra la espera', () => {
    const {view, el, channel} = buildView();

    view.start();

    assert.deepEqual(channel.sent, [{type: 'hello'}]);
    assert.equal(el.status.textContent, TEXT.projection.waiting);
});

test('aplica tema, nombre y contador, y respeta los tiempos de revelado de título e icono', () => {
    const {view, el, root, timers} = buildView();
    view.start();

    send(view, stateFor());

    assert.equal(root.dataset.theme, 'light');
    assert.equal(el.gameName.textContent, 'Fiesta');
    assert.equal(el.counter.textContent, TEXT.projection.counter(2, 20));
    assert.equal(el.title.textContent, 'Canción dos');
    assert.equal(el.title.style.opacity, '0');
    assert.equal(el.icon.children[0].style.opacity, '0');
    assert.deepEqual(timers.map(timer => timer.delay).sort((a, b) => a - b), [2000, 5000]);
    assert.equal(el.history.children.length, 1);
});

test('al cumplirse el tiempo se revela el icono y entra en las últimas canciones', () => {
    const {view, el, timers} = buildView();
    view.start();
    send(view, stateFor());

    timers.find(timer => timer.delay === 2000).fn();

    assert.equal(el.icon.children[0].style.opacity, '1');
    assert.equal(el.history.children.length, 2);
});

test('una ventana abierta a mitad de canción solo espera lo que falta', () => {
    const {view, el, timers} = buildView({now: 13_000});
    view.start();

    send(view, stateFor());

    assert.equal(el.icon.children[0].style.opacity, '1');
    assert.equal(el.title.style.opacity, '0');
    assert.deepEqual(timers.map(timer => timer.delay), [2000]);
});

test('con la canción ya revelada o fuera de partida se muestra todo de inmediato', () => {
    const {view, el, timers} = buildView();
    view.start();

    send(view, stateFor({revealed: true}));

    assert.equal(el.title.style.opacity, '1');
    assert.equal(el.icon.children[0].style.opacity, '1');
    assert.equal(timers.length, 0);
});

test('un estado nuevo cancela los temporizadores pendientes del anterior', () => {
    const {view, timers} = buildView();
    view.start();
    send(view, stateFor());

    send(view, stateFor({current: {id: 3, title: 'Tres', icon: '🥁', iconType: 'emoji'}}));

    assert.equal(timers.slice(0, 2).every(timer => timer.cleared), true);
});

test('sin canción actual vuelve a la espera y vacía el historial', () => {
    const {view, el} = buildView();
    view.start();
    send(view, stateFor());

    send(view, stateFor({current: null, played: 0, history: []}));

    assert.equal(el.status.textContent, TEXT.projection.waiting);
    assert.equal(el.title.textContent, '');
    assert.equal(el.history.children.length, 0);
});

test('ignora mensajes que no son un estado válido de esta versión', () => {
    const {view, el} = buildView();
    view.start();

    for (const bad of [null, 'x', {}, stateFor({version: 99}), stateFor({history: 'no'}), stateFor({played: 'a'}), stateFor({titleRevealMs: NaN}), {type: 'hello'}]) {
        send(view, bad);
    }

    assert.equal(el.status.textContent, TEXT.projection.waiting);
    assert.equal(el.title.textContent, '');
});

test('los iconos de imagen solo se pintan si son data:image válidos; si no, queda vacío', () => {
    const {view, el} = buildView();
    view.start();
    const okImage = 'data:image/png;base64,AAAA';

    send(view, stateFor({revealed: true, current: {id: 2, title: 'a', icon: okImage, iconType: 'image'}}));
    assert.equal(el.icon.children[0].tag, 'img');
    assert.equal(el.icon.children[0].src, okImage);

    send(view, stateFor({revealed: true, current: {id: 2, title: 'a', icon: 'https://malo.example/x.png', iconType: 'image'}}));
    assert.equal(el.icon.children[0].tag, 'span');
    assert.equal(el.icon.children[0].textContent, '');
});

test('con nombre de partida lo muestra en la cabecera; sin nombre o con el de la aplicación, lo oculta', () => {
    const {view, el} = buildView();
    view.start();

    send(view, stateFor({gameName: 'Noche de Bingo'}));
    assert.equal(el.gameName.textContent, 'Noche de Bingo');
    assert.equal(el.gameName.hidden, false);

    send(view, stateFor({gameName: ''}));
    assert.equal(el.gameName.textContent, '');
    assert.equal(el.gameName.hidden, true);

    send(view, stateFor({gameName: DEFAULT_GAME_NAME}));
    assert.equal(el.gameName.hidden, true);
});

test('un tema desconocido se ignora', () => {
    const {view, root} = buildView();
    view.start();

    send(view, stateFor({theme: 'rosa'}));

    assert.equal(root.dataset.theme, undefined);
});

test('la página de proyección usa el mismo canal que la aplicación', () => {
    const source = fs.readFileSync(new URL('../js/projection.js', import.meta.url), 'utf8');

    assert.ok(source.includes('new BroadcastChannel(PROJECTION_CHANNEL)'));
});

test('los temporizadores por defecto funcionan sin contexto (setTimeout real)', async () => {
    const el = makeElements();
    const view = new ProjectionView({elements: el, channel: fakeChannel(), root: {dataset: {}}, now: () => 0});

    view.handle(stateFor({startedAt: 0, titleRevealMs: 20, iconRevealMs: 20}));
    assert.equal(el.title.style.opacity, '0');
    await new Promise(resolve => setTimeout(resolve, 60));

    assert.equal(el.title.style.opacity, '1');
    view.renderWaiting();
});

test('buildProjectionProgress limpia valores no válidos y devuelve el estado de reproducción', () => {
    assert.deepEqual(buildProjectionProgress({timeline: {currentTime: 12.5, duration: 200}, playing: true}),
        {type: 'progress', version: PROJECTION_STATE_VERSION, currentTime: 12.5, duration: 200, playing: true});

    const empty = buildProjectionProgress({timeline: {currentTime: NaN, duration: Infinity}, playing: false});
    assert.equal(empty.currentTime, 0);
    assert.equal(empty.duration, 0);
    assert.equal(empty.playing, false);
});

test('ProjectionChannel manda el progreso al pedir el estado y cuando se le pide, y no manda nada sin progreso', () => {
    const channel = fakeChannel();
    const progress = {type: 'progress', currentTime: 3};
    const projection = new ProjectionChannel({getState: () => ({n: 1}), getProgress: () => progress, createChannel: () => channel, openWindow: () => {}});

    channel.onmessage({data: {type: 'hello'}});
    assert.deepEqual(channel.sent, [{n: 1}, progress]);

    projection.publishProgress();
    assert.equal(channel.sent.length, 3);

    const quiet = fakeChannel();
    new ProjectionChannel({getState: () => ({}), createChannel: () => quiet, openWindow: () => {}}).publishProgress();
    assert.deepEqual(quiet.sent, []);
});

const progressMessage = (overrides = {}) => ({type: 'progress', version: PROJECTION_STATE_VERSION, currentTime: 30, duration: 120, playing: true, ...overrides});

test('la barra de progreso muestra el porcentaje, el tiempo y el valor accesible', () => {
    const {view, el} = buildView();
    view.start();

    send(view, progressMessage());

    assert.equal(el.progressFill.style.width, '25%');
    assert.equal(el.progressBar.getAttribute('aria-valuenow'), '25');
    assert.equal(el.time.textContent, TEXT.projection.time('0:30', '2:00'));
});

test('el progreso nunca pasa del 100 % ni divide por cero', () => {
    const {view, el} = buildView();
    view.start();

    send(view, progressMessage({currentTime: 500, duration: 120}));
    assert.equal(el.progressFill.style.width, '100%');

    send(view, progressMessage({currentTime: 5, duration: 0}));
    assert.equal(el.progressFill.style.width, '0%');
    assert.equal(el.time.textContent, TEXT.projection.time('0:05', '0:00'));
});

test('ignora mensajes de progreso inválidos o de otra versión', () => {
    const {view, el} = buildView();
    view.start();
    send(view, progressMessage());

    for (const bad of [progressMessage({version: 99}), progressMessage({currentTime: 'x'}), progressMessage({duration: NaN})]) {
        send(view, bad);
    }

    assert.equal(el.progressFill.style.width, '25%');
});

test('al cambiar de canción la barra vuelve a cero, y con la misma canción no se toca', () => {
    const {view, el} = buildView();
    view.start();
    send(view, stateFor());
    send(view, progressMessage());

    send(view, stateFor({played: 3}));
    assert.equal(el.progressFill.style.width, '25%');

    send(view, stateFor({current: {id: 9, title: 'Nueva', icon: '🥁', iconType: 'emoji'}}));
    assert.equal(el.progressFill.style.width, '0%');
    assert.equal(el.time.textContent, TEXT.projection.time('0:00', '0:00'));
});

const logoBox = (el) => ({left: el.logo.style.left, top: el.logo.style.top, width: el.logo.style.width, height: el.logo.style.height});

test('sin canción el logo ocupa el sitio del icono, sin animación y con la cabecera sin hueco para él', () => {
    const {view, el} = buildView();

    view.start();

    assert.deepEqual(logoBox(el), {left: '400px', top: '200px', width: '300px', height: '300px'});
    assert.equal(el.logo.classList.contains('animated'), false);
    assert.equal(el.header.classList.contains('docked'), false);
    assert.equal(el.logo.classList.contains('docked'), false);
});

test('al sonar la primera canción el logo se acopla junto al título, animado, y la cabecera le hace hueco', () => {
    const {view, el} = buildView();
    view.start();
    send(view, stateFor({current: null, played: 0, history: []}));

    send(view, stateFor());

    assert.deepEqual(logoBox(el), {left: '20px', top: '10px', width: '60px', height: '60px'});
    assert.equal(el.logo.classList.contains('animated'), true);
    assert.equal(el.header.classList.contains('docked'), true);
    assert.equal(el.logo.classList.contains('docked'), true);
});

test('una proyección abierta con la partida ya en marcha coloca el logo acoplado sin animar', () => {
    const {view, el} = buildView();
    view.start();

    send(view, stateFor());

    assert.deepEqual(logoBox(el), {left: '20px', top: '10px', width: '60px', height: '60px'});
    assert.equal(el.logo.classList.contains('animated'), false);
});

test('si la partida vuelve a quedarse sin canción, el logo regresa al centro animado', () => {
    const {view, el} = buildView();
    view.start();
    send(view, stateFor({current: null, played: 0, history: []}));
    send(view, stateFor());

    send(view, stateFor({current: null, played: 0, history: []}));

    assert.deepEqual(logoBox(el), {left: '400px', top: '200px', width: '300px', height: '300px'});
    assert.equal(el.logo.classList.contains('animated'), true);
    assert.equal(el.header.classList.contains('docked'), false);
    assert.equal(el.logo.classList.contains('docked'), false);
});

test('syncLogo(false) recoloca el logo sin animar, por ejemplo al cambiar el tamaño de la ventana', () => {
    const {view, el} = buildView();
    view.start();
    send(view, stateFor({current: null, played: 0, history: []}));
    send(view, stateFor());

    view.syncLogo(false);

    assert.equal(el.logo.classList.contains('animated'), false);
    assert.equal(logoBox(el).width, '60px');
});

test('el icono recibe la caja del reproductor y el pulso solo mientras suena la canción actual', () => {
    const {view, el} = buildView();
    view.start();
    assert.equal(el.icon.classList.contains('has-song'), false);

    send(view, stateFor());
    assert.equal(el.icon.classList.contains('has-song'), true);
    assert.equal(el.icon.classList.contains('playing'), false);

    send(view, progressMessage({playing: true}));
    assert.equal(el.icon.classList.contains('playing'), true);

    send(view, progressMessage({playing: false}));
    assert.equal(el.icon.classList.contains('playing'), false);

    send(view, progressMessage({playing: true}));
    send(view, stateFor({current: null, played: 0, history: []}));
    assert.equal(el.icon.classList.contains('playing'), false);
    assert.equal(el.icon.classList.contains('has-song'), false);
});

test('sin canción actual un progreso con playing=true no activa el pulso', () => {
    const {view, el} = buildView();
    view.start();

    send(view, progressMessage({playing: true}));

    assert.equal(el.icon.classList.contains('playing'), false);
});

test('ProjectionChannel sabe si hay una ventana de proyección escuchando: hello y alive, bye y caducidad', () => {
    const channel = fakeChannel();
    let now = 1000;
    const projection = new ProjectionChannel({getState: () => ({}), createChannel: () => channel, openWindow: () => {}, now: () => now});
    assert.equal(projection.hasListener(), false);

    channel.onmessage({data: {type: 'hello'}});
    assert.equal(projection.hasListener(), true);

    now += 2500;
    assert.equal(projection.hasListener(), true);
    channel.onmessage({data: {type: 'alive'}});
    now += 2500;
    assert.equal(projection.hasListener(), true);

    now += 1000;
    assert.equal(projection.hasListener(), false);

    channel.onmessage({data: {type: 'alive'}});
    assert.equal(projection.hasListener(), true);
    channel.onmessage({data: {type: 'bye'}});
    assert.equal(projection.hasListener(), false);
});

test('ProjectionChannel ignora mensajes desconocidos al decidir si hay escucha', () => {
    const channel = fakeChannel();
    const projection = new ProjectionChannel({getState: () => ({}), createChannel: () => channel, openWindow: () => {}});

    channel.onmessage({data: {type: 'otra cosa'}});
    channel.onmessage({data: null});

    assert.equal(projection.hasListener(), false);
});

test('dockLogo avisa a la proyección y espera lo que tarda el logo en acoplarse', async () => {
    const channel = fakeChannel();
    const waits = [];
    const projection = new ProjectionChannel({getState: () => ({}), createChannel: () => channel, openWindow: () => {}, wait: (ms) => { waits.push(ms); return Promise.resolve(); }});

    await projection.dockLogo();

    assert.deepEqual(channel.sent, [{type: 'dock', version: PROJECTION_STATE_VERSION}]);
    assert.deepEqual(waits, [PROJECTION_DOCK_MS]);
});

test('la proyección acopla el logo al recibir dock, animado, y lo ignora si ya está acoplado o es de otra versión', () => {
    const {view, el} = buildView();
    view.start();

    send(view, {type: 'dock', version: 99});
    assert.equal(el.logo.classList.contains('docked'), false);

    send(view, {type: 'dock', version: PROJECTION_STATE_VERSION});
    assert.equal(el.logo.classList.contains('docked'), true);
    assert.equal(el.logo.classList.contains('animated'), true);
    assert.equal(el.header.classList.contains('docked'), true);
    assert.deepEqual(logoBox(el), {left: '20px', top: '10px', width: '60px', height: '60px'});

    el.logo.classList.remove('animated');
    send(view, {type: 'dock', version: PROJECTION_STATE_VERSION});
    assert.equal(el.logo.classList.contains('animated'), false);
});

test('tras dock, el estado con la primera canción no vuelve a mover el logo', () => {
    const {view, el} = buildView();
    view.start();
    send(view, stateFor({current: null, played: 0, history: []}));
    send(view, {type: 'dock', version: PROJECTION_STATE_VERSION});
    const before = logoBox(el);

    send(view, stateFor());

    assert.deepEqual(logoBox(el), before);
    assert.equal(el.logo.classList.contains('docked'), true);
});

test('la proyección avisa de que sigue abierta y de que se cierra', () => {
    const {view, channel} = buildView();

    view.sendAlive();
    view.sendBye();

    assert.deepEqual(channel.sent, [{type: 'alive'}, {type: 'bye'}]);
});

const celebrationOf = (overrides = {}) => ({
    kind: 'linea', ok: true, cartonId: 17,
    rows: [{complete: true, songs: [
        {icon: '🎵', iconType: 'emoji', played: true}, {icon: '🎸', iconType: 'emoji', played: true},
        {icon: '🥁', iconType: 'emoji', played: true}, {icon: 'data:image/png;base64,AAAA', iconType: 'image', played: true}
    ]}],
    ...overrides
});

const failedRow = (flags) => ({complete: flags.every(Boolean), songs: flags.map((played, index) => ({icon: '🎵' + index, iconType: 'emoji', played}))});

test('buildProjectionState incluye la celebración activa y por defecto ninguna', () => {
    const {songs, game} = makeGame({songCount: 26, played: 3});
    const celebration = celebrationOf();

    assert.equal(buildProjectionState({songs, game, theme: 'dark', startedAt: null}).celebration, null);
    assert.deepEqual(buildProjectionState({songs, game, theme: 'dark', startedAt: null, celebration}).celebration, celebration);
});

test('LÍNEA correcta: título verde, cartón, y una fila con todos sus iconos marcados con tick verde', () => {
    const {view, el} = buildView();
    view.start();

    send(view, stateFor({celebration: celebrationOf()}));

    assert.equal(el.celebration.classList.contains('hidden'), false);
    assert.equal(el.celebration.classList.contains('has-rows'), true);
    assert.equal(el.celebrationTitle.textContent, TEXT.projection.celebration.linea.title);
    assert.equal(el.celebrationTitle.classList.contains('celebration-title-linea'), true);
    assert.equal(el.celebrationTitle.classList.contains('celebration-title-fail'), false);
    assert.equal(el.celebrationText.textContent, TEXT.projection.celebration.carton(17));
    assert.equal(el.celebrationRows.children.length, 1);

    const songs = el.celebrationRows.children[0].children;
    assert.equal(songs.length, 4);
    assert.ok(songs.every(song => song.className.includes('celebration-song-ok')));
    assert.ok(songs.every(song => song.children[1].textContent === '✓'));
    assert.equal(songs[0].children[0].textContent, '🎵');
    assert.equal(songs[3].children[0].tag, 'img');
});

test('LÍNEA con varias filas completas las muestra todas', () => {
    const {view, el} = buildView();
    view.start();
    const rows = celebrationOf().rows;

    send(view, stateFor({celebration: celebrationOf({rows: [rows[0], rows[0]]})}));

    assert.equal(el.celebrationRows.children.length, 2);
});

test('BINGO correcto: título de bingo y las tres filas con tick verde en todos los iconos', () => {
    const {view, el} = buildView();
    view.start();
    const full = [failedRow([true, true, true, true]), failedRow([true, true, true, true]), failedRow([true, true, true, true])];

    send(view, stateFor({celebration: celebrationOf({kind: 'bingo', rows: full, cartonId: 3})}));

    assert.equal(el.celebrationTitle.textContent, TEXT.projection.celebration.bingo.title);
    assert.equal(el.celebrationTitle.classList.contains('celebration-title-linea'), false);
    assert.equal(el.celebrationRows.children.length, 3);
    assert.ok(el.celebrationRows.children.every(row => row.children.every(song => song.children[1].textContent === '✓')));
    assert.equal(el.celebrationText.textContent, TEXT.projection.celebration.carton(3));
});

test('fallo: título de incorrecto en rojo, el cartón entero, ticks verdes en lo que ha salido y cruces rojas en lo que falta', () => {
    const {view, el} = buildView();
    view.start();
    const rows = [failedRow([true, true, false, false]), failedRow([true, false, false, false]), failedRow([false, false, false, false])];

    send(view, stateFor({celebration: celebrationOf({kind: 'linea', ok: false, rows, cartonId: 9})}));

    assert.equal(el.celebrationTitle.textContent, TEXT.projection.celebration.fail.linea.title);
    assert.equal(el.celebrationTitle.classList.contains('celebration-title-fail'), true);
    assert.equal(el.celebrationTitle.classList.contains('celebration-title-linea'), false);
    assert.equal(el.celebrationRows.children.length, 3);
    const marks = el.celebrationRows.children.flatMap(row => row.children.map(song => song.children[1].textContent));
    assert.equal(marks.filter(mark => mark === '✓').length, 3);
    assert.equal(marks.filter(mark => mark === '✗').length, 9);
    assert.ok(el.celebrationRows.children[2].children.every(song => song.className.includes('celebration-song-missing')));
});

test('fallo de BINGO usa su propio título', () => {
    const {view, el} = buildView();
    view.start();

    send(view, stateFor({celebration: celebrationOf({kind: 'bingo', ok: false, rows: [failedRow([true, false])], cartonId: 2})}));

    assert.equal(el.celebrationTitle.textContent, TEXT.projection.celebration.fail.bingo.title);
});

test('sin cartón (genérica) muestra el texto de felicitación y ninguna fila', () => {
    const {view, el} = buildView();
    view.start();

    send(view, stateFor({celebration: {kind: 'bingo', ok: true, cartonId: null, rows: []}}));

    assert.equal(el.celebrationText.textContent, TEXT.projection.celebration.bingo.text);
    assert.equal(el.celebrationRows.children.length, 0);
    assert.equal(el.celebration.classList.contains('has-rows'), false);
});

test('la pantalla se oculta cuando la celebración vuelve a ser null y se puede mostrar otra después', () => {
    const {view, el} = buildView();
    view.start();
    send(view, stateFor({celebration: celebrationOf()}));

    send(view, stateFor({celebration: null}));
    assert.equal(el.celebration.classList.contains('hidden'), true);

    send(view, stateFor({celebration: celebrationOf({kind: 'bingo', ok: false, rows: [failedRow([false])]})}));
    assert.equal(el.celebration.classList.contains('hidden'), false);
    assert.equal(el.celebrationTitle.textContent, TEXT.projection.celebration.fail.bingo.title);
});

test('mientras la celebración no cambia, los estados repetidos no vuelven a pintarla', () => {
    const {view, el} = buildView();
    view.start();
    send(view, stateFor({celebration: celebrationOf()}));
    el.celebrationTitle.textContent = 'marca';
    const rowsBefore = el.celebrationRows.children[0];

    send(view, stateFor({celebration: celebrationOf(), played: 5}));

    assert.equal(el.celebrationTitle.textContent, 'marca');
    assert.equal(el.celebrationRows.children[0], rowsBefore);
});

test('un estado sin el campo celebration (versión anterior de la app) no muestra nada', () => {
    const {view, el} = buildView();
    view.start();
    const old = stateFor();
    delete old.celebration;

    send(view, old);

    assert.equal(el.celebration.classList.contains('hidden'), true);
});

test('un estado con una celebración mal formada se ignora entero', () => {
    const bad = [
        'linea',
        {kind: 'fuegos', ok: true, cartonId: null, rows: []},
        {kind: 'linea', ok: 'si', cartonId: null, rows: []},
        {kind: 'linea', ok: true, cartonId: 'x', rows: []},
        {kind: 'linea', ok: true, cartonId: 1, rows: 'no'},
        {kind: 'linea', ok: true, cartonId: 1, rows: [failedRow([true]), failedRow([true]), failedRow([true]), failedRow([true])]},
        {kind: 'linea', ok: true, cartonId: 1, rows: [{complete: true, songs: Array.from({length: 9}, () => ({icon: 'a', iconType: 'emoji', played: true}))}]},
        {kind: 'linea', ok: true, cartonId: 1, rows: [{complete: true, songs: [{icon: 5, iconType: 'emoji', played: true}]}]},
        {kind: 'linea', ok: true, cartonId: 1, rows: [{complete: true, songs: [{icon: 'a', iconType: 'otro', played: true}]}]},
        {kind: 'linea', ok: true, cartonId: 1, rows: [{complete: true, songs: [{icon: 'a', iconType: 'emoji', played: 'si'}]}]},
        {kind: 'linea', ok: true, cartonId: 1, rows: [{complete: 'si', songs: []}]},
        {kind: 'linea', ok: true, cartonId: 1, rows: [null]}
    ];

    for (const celebration of bad) {
        const {view, el} = buildView();
        view.start();

        send(view, stateFor({celebration, played: 9}));

        assert.equal(el.celebration.classList.contains('hidden'), true, JSON.stringify(celebration));
        assert.equal(el.counter.textContent, '', JSON.stringify(celebration));
    }
});

test('un icono de imagen que no es data:image no se pinta en la celebración', () => {
    const {view, el} = buildView();
    view.start();
    const rows = [{complete: true, songs: [{icon: 'https://malo.example/x.png', iconType: 'image', played: true}]}];

    send(view, stateFor({celebration: celebrationOf({rows})}));

    assert.equal(el.celebrationRows.children[0].children[0].children[0].tag, 'span');
    assert.equal(el.celebrationRows.children[0].children[0].children[0].textContent, '');
});

const VIEWPORT = {width: 1920, height: 1080};
const SIDE_BOX = {width: 480, height: 940};

test('fitHistorySize: con pocas canciones usa el tamaño base (10 % del lado menor, 1,25 veces el anterior)', () => {
    assert.equal(fitHistorySize({count: 6, box: SIDE_BOX, viewport: VIEWPORT}), Math.floor(10.8 * PROJECTION_HISTORY_BASE_VMIN));
    assert.equal(fitHistorySize({count: 6, box: SIDE_BOX, viewport: VIEWPORT}), 108);
});

test('fitHistorySize: encoge los iconos lo justo para que quepan todos en la barra lateral', () => {
    const gap = 10.8 * 1.2;

    for (const count of [12, 28, 40, 75, 120, 250]) {
        const size = fitHistorySize({count, box: SIDE_BOX, viewport: VIEWPORT});
        const columns = Math.floor((SIDE_BOX.width + gap) / (size + gap));
        const rows = Math.floor((SIDE_BOX.height + gap) / (size + gap));

        assert.ok(columns * rows >= count || size === PROJECTION_HISTORY_MIN_PX, `caben ${count}`);
        assert.ok(size >= PROJECTION_HISTORY_MIN_PX && size <= 108);
    }
});

test('fitHistorySize: es lo más grande posible, un píxel más no cabría', () => {
    const gap = 10.8 * 1.2;
    const count = 60;
    const size = fitHistorySize({count, box: SIDE_BOX, viewport: VIEWPORT});
    const bigger = size + 1;
    const fits = Math.floor((SIDE_BOX.width + gap) / (bigger + gap)) * Math.floor((SIDE_BOX.height + gap) / (bigger + gap)) >= count;

    assert.equal(fits, false);
});

test('fitHistorySize: cuantas más canciones, iconos iguales o más pequeños, y nunca por debajo del mínimo', () => {
    let previous = Infinity;
    for (const count of [0, 10, 30, 60, 100, 200, 5000]) {
        const size = fitHistorySize({count, box: SIDE_BOX, viewport: VIEWPORT});
        assert.ok(size <= previous);
        assert.ok(size >= PROJECTION_HISTORY_MIN_PX);
        previous = size;
    }
    assert.equal(fitHistorySize({count: 5000, box: SIDE_BOX, viewport: VIEWPORT}), PROJECTION_HISTORY_MIN_PX);
});

test('fitHistorySize: sin canciones, o con una caja minúscula, no falla', () => {
    assert.equal(fitHistorySize({count: 0, box: SIDE_BOX, viewport: VIEWPORT}), 108);
    assert.equal(fitHistorySize({count: 3, box: {width: 10, height: 10}, viewport: {width: 10, height: 10}}), PROJECTION_HISTORY_MIN_PX);
});

const buildSized = (viewport) => {
    const el = makeElements();
    el.history.clientWidth = viewport.boxWidth;
    el.history.clientHeight = viewport.boxHeight;
    const holder = {viewport: {width: viewport.width, height: viewport.height}};
    const view = new ProjectionView({
        elements: el, channel: fakeChannel(), root: {dataset: {}}, now: () => 10_000,
        viewport: () => holder.viewport, timers: {set: () => 0, clear: () => {}}
    });
    view.start();
    return {el, view, holder};
};

test('la proyección pinta todas las canciones reproducidas, de la más reciente a la más antigua, ajustadas a la barra lateral', () => {
    const {el, view} = buildSized({width: 1920, height: 1080, boxWidth: 480, boxHeight: 940});
    const history = Array.from({length: 40}, (_, index) => ({id: index + 1, icon: '🎵', iconType: 'emoji'}));

    send(view, stateFor({revealed: true, current: {id: 40, title: 'Cuarenta', icon: '🎵', iconType: 'emoji'}, played: 40, history}));

    assert.equal(el.history.children.length, 40);
    const size = Number.parseInt(el.history.style['--history-size'], 10);
    assert.ok(size > 60 && size <= 108, String(size));
});

test('al cambiar el tamaño de la ventana, syncHistory recalcula el tamaño de los iconos', () => {
    const {el, view, holder} = buildSized({width: 1920, height: 1080, boxWidth: 480, boxHeight: 940});
    const history = Array.from({length: 30}, (_, index) => ({id: index + 1, icon: '🎵', iconType: 'emoji'}));
    send(view, stateFor({revealed: true, played: 30, history}));
    const before = Number.parseInt(el.history.style['--history-size'], 10);

    holder.viewport = {width: 960, height: 540};
    el.history.clientWidth = 240;
    el.history.clientHeight = 470;
    view.syncHistory();

    assert.ok(Number.parseInt(el.history.style['--history-size'], 10) < before);
});

test('sin medidas del navegador (la caja aún mide cero) se estima a partir del tamaño de la ventana', () => {
    const {el, view} = buildSized({width: 1920, height: 1080, boxWidth: 0, boxHeight: 0});
    const history = Array.from({length: 10}, (_, index) => ({id: index + 1, icon: '🎵', iconType: 'emoji'}));

    send(view, stateFor({revealed: true, played: 10, history}));

    assert.ok(Number.parseInt(el.history.style['--history-size'], 10) >= PROJECTION_HISTORY_MIN_PX);
});

test('syncHistory antes de recibir ningún estado no hace nada', () => {
    const {view} = buildView();

    view.syncHistory();
});

test('un hueco sin icono y sin acertar se dibuja como una cruz grande, sin imagen ni emoji', () => {
    const {view, el} = buildView();
    view.start();
    const rows = [{complete: false, songs: [
        {icon: '🎵', iconType: 'emoji', played: true},
        {icon: '', iconType: 'emoji', played: false},
        {icon: '', iconType: 'emoji', played: false},
        {icon: '🥁', iconType: 'emoji', played: true}
    ]}];

    send(view, stateFor({celebration: celebrationOf({kind: 'linea', ok: false, rows})}));

    const songs = el.celebrationRows.children[0].children;
    assert.equal(songs.length, 4);
    assert.ok(songs[1].className.includes('celebration-song-hidden'));
    assert.equal(songs[1].children.length, 1);
    assert.equal(songs[1].children[0].className, 'celebration-cross');
    assert.equal(songs[1].children[0].textContent, '✗');
    assert.equal(songs[1].children[0].attrs['aria-label'], TEXT.projection.celebration.pending);
    assert.ok(songs[0].className.includes('celebration-song-ok'));
    assert.equal(songs[0].children[1].textContent, '✓');
    assert.equal(songs[0].children[0].textContent, '🎵');
});

test('con toda la tabla, los iconos que faltan se siguen dibujando con su cruz roja pequeña (no es un hueco)', () => {
    const {view, el} = buildView();
    view.start();
    const rows = [{complete: false, songs: [{icon: '🎵', iconType: 'emoji', played: true}, {icon: '🥁', iconType: 'emoji', played: false}]}];

    send(view, stateFor({celebration: celebrationOf({kind: 'bingo', ok: false, rows})}));

    const missing = el.celebrationRows.children[0].children[1];
    assert.equal(missing.className.includes('celebration-song-hidden'), false);
    assert.equal(missing.children[0].textContent, '🥁');
    assert.equal(missing.children[1].textContent, '✗');
});

test('un cartón con todos los huecos en cruz se dibuja entero: tres filas', () => {
    const {view, el} = buildView();
    view.start();
    const hidden = () => ({complete: false, songs: Array.from({length: 4}, () => ({icon: '', iconType: 'emoji', played: false}))});

    send(view, stateFor({celebration: celebrationOf({kind: 'bingo', ok: false, rows: [hidden(), hidden(), hidden()], cartonId: 4})}));

    assert.equal(el.celebrationRows.children.length, 3);
    assert.ok(el.celebrationRows.children.every(row => row.children.every(song => song.className.includes('celebration-song-hidden'))));
    assert.equal(el.celebrationText.textContent, TEXT.projection.celebration.carton(4));
});

test('un fallo sin filas muestra el título de incorrecto y un texto con el número de cartón, sin dibujar el cartón', () => {
    const {view, el} = buildView();
    view.start();

    send(view, stateFor({celebration: {kind: 'linea', ok: false, cartonId: 6, rows: []}}));

    assert.equal(el.celebration.classList.contains('hidden'), false);
    assert.equal(el.celebrationTitle.textContent, TEXT.projection.celebration.fail.linea.title);
    assert.equal(el.celebrationText.textContent, TEXT.projection.celebration.failWithCarton.linea(6));
    assert.ok(el.celebrationText.textContent.includes('6'));
    assert.equal(el.celebrationRows.children.length, 0);
    assert.equal(el.celebration.classList.contains('has-rows'), false);
});

test('un fallo de bingo solo con texto también indica el número de cartón', () => {
    const {view, el} = buildView();
    view.start();

    send(view, stateFor({celebration: {kind: 'bingo', ok: false, cartonId: 31, rows: []}}));

    assert.equal(el.celebrationText.textContent, TEXT.projection.celebration.failWithCarton.bingo(31));
});

test('un fallo sin número de cartón (sin cartón asociado) usa el texto genérico de fallo', () => {
    const {view, el} = buildView();
    view.start();

    send(view, stateFor({celebration: {kind: 'linea', ok: false, cartonId: null, rows: []}}));

    assert.equal(el.celebrationText.textContent, TEXT.projection.celebration.fail.linea.text);
});
