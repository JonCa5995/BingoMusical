import {validateGameFile} from './GameSnapshot.js';

const DB_NAME = 'bingoMusical';
const DB_VERSION = 1;
const STORE_NAME = 'game';
const KEY = 'current';

export function createIndexedDbStorage(factory = globalThis.indexedDB) {
    if (!factory) return null;

    const open = () => new Promise((resolve, reject) => {
        const request = factory.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });

    const run = async (mode, action) => {
        const db = await open();

        try {
            return await new Promise((resolve, reject) => {
                const transaction = db.transaction(STORE_NAME, mode);
                const request = action(transaction.objectStore(STORE_NAME));
                transaction.oncomplete = () => resolve(request.result);
                transaction.onerror = () => reject(transaction.error);
                transaction.onabort = () => reject(transaction.error);
            });
        } finally {
            db.close();
        }
    };

    return {
        get: (key) => run('readonly', store => store.get(key)),
        set: (key, value) => run('readwrite', store => store.put(value, key)),
        remove: (key) => run('readwrite', store => store.delete(key))
    };
}

export class GameStateStore {
    constructor(storage = createIndexedDbStorage()) {
        this.storage = storage;
    }

    async save(snapshot) {
        if (!this.storage) return false;

        try {
            await this.storage.set(KEY, snapshot);
            return true;
        } catch (error) {
            console.error('Error al guardar la partida:', error);
            return false;
        }
    }

    async load() {
        if (!this.storage) return null;

        try {
            const validation = validateGameFile(await this.storage.get(KEY));
            return validation.success ? validation.snapshot : null;
        } catch (error) {
            console.error('Error al cargar la partida guardada:', error);
            return null;
        }
    }

    async clear() {
        if (!this.storage) return false;

        try {
            await this.storage.remove(KEY);
            return true;
        } catch (error) {
            console.error('Error al borrar la partida guardada:', error);
            return false;
        }
    }
}
