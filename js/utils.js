import {DEFAULT_GAME_NAME, REVOKE_URL_DELAY_MS} from './constants.js';

const HTML_ESCAPES = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
};

const IMAGE_DATA_URL = /^data:image\/(png|jpeg|gif|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

export function isImageDataUrl(value) {
    return typeof value === 'string' && IMAGE_DATA_URL.test(value);
}

export function escapeHTML(value) {
    return String(value ?? '').replaceAll(/[&<>"']/g, char => HTML_ESCAPES[char]);
}

export function gameNameOrDefault(name) {
    return name || DEFAULT_GAME_NAME;
}

export function iconTextHtml({icon, text}) {
    return `<span aria-hidden="true">${icon}</span> ${text}`;
}

export function slugify(name) {
    return String(name ?? '').toLowerCase().replaceAll(/[^a-z0-9]+/g, '-');
}

export function downloadFile(content, filename, mimeType, ariaLabel = '') {
    const blob = content instanceof Blob ? content : new Blob([content], {type: mimeType});
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
