import {SERVICE_WORKER_DEV_PARAM, SERVICE_WORKER_FILE} from '../constants.js';

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]'];

export function shouldRegisterServiceWorker({location, hasServiceWorker}) {
    if (!hasServiceWorker) return false;
    if (!LOCAL_HOSTS.includes(location.hostname)) return true;

    return new URLSearchParams(location.search).get(SERVICE_WORKER_DEV_PARAM) === '1';
}

export function registerServiceWorker({
    navigatorRef = globalThis.navigator,
    location = globalThis.location,
    onError = () => {}
} = {}) {
    const serviceWorker = navigatorRef?.serviceWorker;

    if (!location || !shouldRegisterServiceWorker({location, hasServiceWorker: Boolean(serviceWorker)})) {
        return Promise.resolve(false);
    }

    return serviceWorker.register(SERVICE_WORKER_FILE).then(() => true, (error) => {
        onError(error);
        return false;
    });
}
