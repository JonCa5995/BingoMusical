import test from 'node:test';
import assert from 'node:assert/strict';
import {createIndexedDbStorage, GameStateStore} from '../js/modules/GameStateStore.js';
import {createFakeIndexedDb} from './helpers/fakeIndexedDb.js';
import {clone, makeSnapshot} from './helpers/snapshot.js';

const silenceErrors = () => {
    const original = console.error;
    console.error = () => {};
    return () => { console.error = original; };
};

test('guarda y recupera una partida a través de IndexedDB', async () => {
    const store = new GameStateStore(createIndexedDbStorage(createFakeIndexedDb()));
    const snapshot = makeSnapshot();

    assert.equal(await store.load(), null);
    assert.equal(await store.save(snapshot), true);

    const loaded = await store.load();
    assert.deepEqual(loaded.songs, snapshot.songs);
    assert.deepEqual(loaded.cartones, snapshot.cartones);
    assert.deepEqual(loaded.game, snapshot.game);
});

test('la partida guardada sobrevive a una instancia nueva del almacén', async () => {
    const idb = createFakeIndexedDb();

    await new GameStateStore(createIndexedDbStorage(idb)).save(makeSnapshot({played: 4}));
    const loaded = await new GameStateStore(createIndexedDbStorage(idb)).load();

    assert.equal(loaded.songs.filter(song => song.played).length, 4);
});

test('guardar de nuevo sustituye la partida anterior', async () => {
    const store = new GameStateStore(createIndexedDbStorage(createFakeIndexedDb()));

    await store.save(makeSnapshot({played: 1}));
    await store.save(makeSnapshot({played: 6}));

    assert.equal((await store.load()).songs.filter(song => song.played).length, 6);
});

test('clear borra la partida guardada', async () => {
    const store = new GameStateStore(createIndexedDbStorage(createFakeIndexedDb()));

    await store.save(makeSnapshot());
    assert.equal(await store.clear(), true);

    assert.equal(await store.load(), null);
});

test('si lo guardado está corrupto o es de una versión futura, se ignora', async () => {
    const idb = createFakeIndexedDb();
    const storage = createIndexedDbStorage(idb);
    const store = new GameStateStore(storage);

    for (const value of ['basura', {type: 'game', version: 99}, {...clone(makeSnapshot()), songs: 'x'}, null]) {
        await storage.set('current', value);
        assert.equal(await store.load(), null);
    }
});

test('sin IndexedDB disponible no lanza y no guarda nada', async () => {
    const store = new GameStateStore(createIndexedDbStorage(undefined));

    assert.equal(await store.save(makeSnapshot()), false);
    assert.equal(await store.load(), null);
    assert.equal(await store.clear(), false);
});

test('si el almacenamiento falla, devuelve false o null en lugar de lanzar', async () => {
    const restore = silenceErrors();
    try {
        const broken = {get: async () => { throw new Error('lleno'); }, set: async () => { throw new Error('lleno'); }, remove: async () => { throw new Error('lleno'); }};
        const store = new GameStateStore(broken);

        assert.equal(await store.save(makeSnapshot()), false);
        assert.equal(await store.load(), null);
        assert.equal(await store.clear(), false);
    } finally {
        restore();
    }
});

test('cada operación abre y cierra su propia conexión', async () => {
    const idb = createFakeIndexedDb();
    const store = new GameStateStore(createIndexedDbStorage(idb));

    await store.save(makeSnapshot());
    await store.load();
    await store.clear();

    assert.equal(idb.counters.opens, 3);
});
