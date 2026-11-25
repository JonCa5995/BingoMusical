import { TEXT } from '../messages.js';

export class KeyboardShortcuts {
    constructor(isModalOpen) {
        this.isModalOpen = isModalOpen;
        this.shortcuts = new Map();
    }

    register(key, { action, label, description, icon = '', allowInModal = false, preventDefault = true }) {
        this.shortcuts.set(key, { action, label, description, icon, allowInModal, preventDefault });
        return this;
    }

    attach(target = document) {
        target.addEventListener('keydown', (e) => this._handleKeydown(e));
    }

    _handleKeydown(e) {
        const tagName = e.target.tagName?.toLowerCase();
        if (tagName === 'input' || tagName === 'textarea' || e.target.isContentEditable) {
            return;
        }

        const shortcut = this.shortcuts.get(e.key.toLowerCase());
        if (!shortcut) return;

        if (!shortcut.allowInModal && this.isModalOpen()) return;

        if (shortcut.preventDefault) e.preventDefault();
        shortcut.action();
    }

    getHelpText() {
        const lines = [...this.shortcuts.values()].map(({ icon, label, description }) =>
            `${icon} ${label} → ${description}`.trim()
        );
        return [TEXT.shortcuts.helpHeader, '', ...lines].join('\n');
    }
}
