import test from 'node:test';
import assert from 'node:assert/strict';
import {installDocument} from './helpers/fakeDom.js';
import {createFakeIndexedDb} from './helpers/fakeIndexedDb.js';
import {makeSnapshot} from './helpers/snapshot.js';
import {createIndexedDbStorage} from '../js/modules/GameStateStore.js';

const idb = createFakeIndexedDb();
globalThis.indexedDB = idb;
await createIndexedDbStorage(idb).set('current', makeSnapshot({songCount: 26, played: 2, cartones: 1}));

const dom = installDocument();
const originalWarn = console.warn;
const originalError = console.error;
console.warn = () => {};
console.error = () => {};

await import('../js/app.js');

const {get} = dom;
const settle = async () => { for (let i = 0; i < 8; i++) await new Promise(resolve => setImmediate(resolve)); };
const isOpen = (id) => !get(id)._cls.has('hidden');

await settle();

test.after(() => {
    console.warn = originalWarn;
    console.error = originalError;
});

test('si se rechaza la partida guardada, se descarta y la app queda vacía', async () => {
    assert.equal(isOpen('#confirm-modal'), true);

    get('#confirm-cancel').fire('click');
    await settle();

    assert.equal(idb.databases.get('bingoMusical').get('game').has('current'), false);
    assert.equal(get('#history-grid').children.length, 0);
    assert.equal(get('#game-name-input').value, '');
    assert.equal(get('#played-counter').textContent, '0');
    assert.equal(isOpen('#alert-modal'), false);
});
