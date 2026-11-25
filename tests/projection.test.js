import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ProjectionChannel, buildProjectionState} from '../js/modules/ProjectionChannel.js';
import {ProjectionView} from '../js/modules/ProjectionView.js';
import {PROJECTION_HISTORY_LIMIT, PROJECTION_PAGE, PROJECTION_STATE_VERSION} from '../js/constants.js';
import {TEXT} from '../js/messages.js';
import {gameNameOrDefault} from '../js/utils.js';
import {installDocument, mkEl} from './helpers/fakeDom.js';
import {makeGame} from './helpers/snapshot.js';

installDocument();

const spreadEl = () => {
    const el = mkEl();
    el.replaceChildren = (...children) => { el.children = children; };
    return el;
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

test('buildProjectionState limita el historial a las últimas canciones', () => {
    const {songs, game} = makeGame({songCount: 40, played: 30});

    const state = buildProjectionState({songs, game, theme: 'dark', startedAt: null});

    assert.equal(state.played, 30);
    assert.equal(state.history.length, PROJECTION_HISTORY_LIMIT);
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
    const el = {gameName: spreadEl(), status: spreadEl(), icon: spreadEl(), title: spreadEl(), counter: spreadEl(), history: spreadEl()};
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
    assert.equal(el.icon.style.opacity, '0');
    assert.deepEqual(timers.map(timer => timer.delay).sort((a, b) => a - b), [2000, 5000]);
    assert.equal(el.history.children.length, 1);
});

test('al cumplirse el tiempo se revela el icono y entra en las últimas canciones', () => {
    const {view, el, timers} = buildView();
    view.start();
    send(view, stateFor());

    timers.find(timer => timer.delay === 2000).fn();

    assert.equal(el.icon.style.opacity, '1');
    assert.equal(el.history.children.length, 2);
});

test('una ventana abierta a mitad de canción solo espera lo que falta', () => {
    const {view, el, timers} = buildView({now: 13_000});
    view.start();

    send(view, stateFor());

    assert.equal(el.icon.style.opacity, '1');
    assert.equal(el.title.style.opacity, '0');
    assert.deepEqual(timers.map(timer => timer.delay), [2000]);
});

test('con la canción ya revelada o fuera de partida se muestra todo de inmediato', () => {
    const {view, el, timers} = buildView();
    view.start();

    send(view, stateFor({revealed: true}));

    assert.equal(el.title.style.opacity, '1');
    assert.equal(el.icon.style.opacity, '1');
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

test('sin nombre de partida muestra el nombre por defecto, nunca un título vacío', () => {
    const {view, el} = buildView();
    view.start();

    send(view, stateFor({gameName: ''}));

    assert.equal(el.gameName.textContent, gameNameOrDefault(''));
    assert.ok(el.gameName.textContent.length > 0);
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
    const el = {gameName: spreadEl(), status: spreadEl(), icon: spreadEl(), title: spreadEl(), counter: spreadEl(), history: spreadEl()};
    const view = new ProjectionView({elements: el, channel: fakeChannel(), root: {dataset: {}}, now: () => 0});

    view.handle(stateFor({startedAt: 0, titleRevealMs: 20, iconRevealMs: 20}));
    assert.equal(el.title.style.opacity, '0');
    await new Promise(resolve => setTimeout(resolve, 60));

    assert.equal(el.title.style.opacity, '1');
    view.renderWaiting();
});
