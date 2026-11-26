const listenersFor = (listeners, type) => {
    if (!listeners[type]) listeners[type] = [];

    return listeners[type];
};

export const mkEl = (tag = 'div') => {
    const el = {
        tag, attrs: {}, children: [], dataset: {}, className: '', title: '', textContent: '', value: '', disabled: false, checked: false,
        type: '', max: '', min: '',
        style: {setProperty(key, value) { this[key] = value; }},
        _cls: new Set(), _listeners: {},
        classList: {
            add(...names) { names.forEach(name => el._cls.add(name)); },
            remove(...names) { names.forEach(name => el._cls.delete(name)); },
            contains: (name) => el._cls.has(name),
            toggle(name, force) { (force ?? !el._cls.has(name)) ? el._cls.add(name) : el._cls.delete(name); }
        },
        setAttribute(key, value) { this.attrs[key] = String(value); },
        getAttribute(key) { return this.attrs[key]; },
        appendChild(child) {
            if (child.tag === '#fragment') {
                this.children.push(...child.children);
                child.children = [];
            } else {
                this.children.push(child);
            }
            return child;
        },
        append(...children) { children.forEach(child => this.appendChild(child)); },
        replaceChildren(fragment) {
            this.children = [];
            if (fragment) this.appendChild(fragment);
        },
        addEventListener(type, listener) { listenersFor(this._listeners, type).push(listener); },
        fire(type, event = {}) { (this._listeners[type] || []).forEach(listener => listener({target: this, currentTarget: this, ...event})); },
        remove() {}, scrollTo() {}, click() { this.fire('click'); },
        getContext() { return {fillText() {}, drawImage() {}}; },
        toDataURL() { return 'data:image/png;base64,canvas'; },
        querySelector() { return null; }, querySelectorAll() { return []; }
    };
    let html = '';
    Object.defineProperty(el, 'innerHTML', {
        get: () => html,
        set(value) {
            html = value;
            if (value === '') el.children = [];
        }
    });
    return el;
};

export const mkDialog = () => {
    const dialog = mkEl('dialog');
    dialog._cls.add('hidden');
    dialog.showModal = () => { dialog._modal = true; };
    dialog.close = () => { dialog._modal = false; };
    return dialog;
};

export function installDocument() {
    const registry = new Map();
    const isDialog = (key) => /-modal$|^#linea-overlay$|^#celebration-overlay$/.test(key);

    const tagFor = (key) => /input|slider/.test(key) ? 'input' : 'div';

    const get = (key) => {
        if (!registry.has(key)) {
            const element = isDialog(key) ? mkDialog() : mkEl(tagFor(key));
            element.key = key;
            element.files = [];
            element.parentElement = mkEl();
            element.focus = () => {};
            if (key === '#audio-player') {
                Object.assign(element, {play: () => Promise.resolve(), pause() {}, duration: 100, currentTime: 0, volume: 1, dispatchEvent() {}});
            }
            registry.set(key, element);
        }
        return registry.get(key);
    };

    const radios = [
        Object.assign(mkEl('input'), {value: 'all', checked: true}),
        Object.assign(mkEl('input'), {value: 'range', checked: false})
    ];
    const documentListeners = {};

    globalThis.document = {
        readyState: 'complete',
        getElementById: (id) => get('#' + id),
        querySelector: (selector) => get('q:' + selector),
        querySelectorAll: () => [],
        getElementsByName: () => radios,
        addEventListener: (type, listener) => { listenersFor(documentListeners, type).push(listener); },
        createElement: (tag) => {
            const element = mkEl(tag);
            element.parentElement = mkEl();
            return element;
        },
        createDocumentFragment: () => mkEl('#fragment'),
        documentElement: {dataset: {}, requestFullscreen: () => Promise.resolve()},
        body: mkEl('body'),
        fullscreenElement: null,
        exitFullscreen: () => Promise.resolve()
    };

    return {get, radios, documentListeners};
}

export function recordingDocument() {
    const lookups = {ids: [], selectors: [], names: []};
    globalThis.document = {
        getElementById: (id) => { lookups.ids.push(id); return {via: 'id', id}; },
        querySelector: (selector) => { lookups.selectors.push(selector); return {via: 'selector', selector}; },
        getElementsByName: (name) => { lookups.names.push(name); return []; },
        querySelectorAll: () => []
    };
    return lookups;
}
