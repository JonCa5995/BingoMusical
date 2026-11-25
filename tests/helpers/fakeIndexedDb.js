export function createFakeIndexedDb() {
    const databases = new Map();
    const counters = {opens: 0};

    const makeRequest = (transaction, operation) => {
        const request = {};
        queueMicrotask(() => {
            try {
                request.result = operation();
                transaction.oncomplete?.();
            } catch (error) {
                transaction.error = error;
                transaction.onerror?.();
            }
        });
        return request;
    };

    return {
        counters,
        databases,
        open(name) {
            const request = {};

            queueMicrotask(() => {
                counters.opens++;
                const isNew = !databases.has(name);
                if (isNew) databases.set(name, new Map());

                request.result = {
                    createObjectStore: (storeName) => { databases.get(name).set(storeName, new Map()); },
                    transaction(storeName) {
                        const data = databases.get(name).get(storeName);
                        const transaction = {};
                        const store = {
                            get: (key) => makeRequest(transaction, () => structuredClone(data.get(key))),
                            put: (value, key) => makeRequest(transaction, () => { data.set(key, structuredClone(value)); }),
                            delete: (key) => makeRequest(transaction, () => { data.delete(key); })
                        };
                        transaction.objectStore = () => store;
                        return transaction;
                    },
                    close() {}
                };

                if (isNew) request.onupgradeneeded?.();
                request.onsuccess?.();
            });

            return request;
        }
    };
}
