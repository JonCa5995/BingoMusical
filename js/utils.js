/**
 * Utilidades compartidas
 */

const HTML_ESCAPES = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
};

/**
 * Escapa un texto para insertarlo de forma segura en HTML (contenido o atributos)
 * @param {*} value - Valor a escapar
 * @returns {string}
 */
export function escapeHTML(value) {
    return String(value ?? '').replaceAll(/[&<>"']/g, char => HTML_ESCAPES[char]);
}
