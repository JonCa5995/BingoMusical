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

/**
 * Convierte un texto en un nombre de archivo seguro ("Mi Juego!" -> "mi-juego-")
 * @param {string} name
 * @returns {string}
 */
export function slugify(name) {
    return String(name ?? '').toLowerCase().replaceAll(/[^a-z0-9]+/g, '-');
}

/**
 * Descarga un contenido como archivo en el navegador
 * @param {string|Blob} content - Contenido del archivo
 * @param {string} filename - Nombre con el que se descarga
 * @param {string} mimeType - Tipo MIME (si content no es ya un Blob)
 * @param {string} [ariaLabel] - Etiqueta accesible del enlace temporal
 */
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

    // Liberar tras un margen: revocar justo después de click() puede cancelar la descarga en Firefox/Safari
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
