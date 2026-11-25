import { REVOKE_URL_DELAY_MS } from './constants.js';

const HTML_ESCAPES = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
};

export function escapeHTML(value) {
    return String(value ?? '').replaceAll(/[&<>"']/g, char => HTML_ESCAPES[char]);
}

export function slugify(name) {
    return String(name ?? '').toLowerCase().replaceAll(/[^a-z0-9]+/g, '-');
}

export function downloadFile(content, filename, mimeType, ariaLabel = '') {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    if (ariaLabel) link.setAttribute('aria-label', ariaLabel);

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), REVOKE_URL_DELAY_MS);
}
