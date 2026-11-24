/**
 * CartonHtmlRenderer Module
 * Convierte cartones (datos) en HTML imprimible. No genera cartones ni descarga nada.
 */
import { DEFAULT_GAME_NAME } from '../constants.js';
import { escapeHTML } from '../utils.js';

/** Icono que se dibuja en las celdas decorativas (sin canción). Es presentación, no dato del cartón */
export const DECORATIVE_ICON_HTML = '<img class="image-icon" src="img/icon-decorative.svg" alt="Icono de decoración">';

export class CartonHtmlRenderer {
    generatePrintableHTML(cartones, config = {}) {
        const header = this._generateHTMLHeader(cartones.length, config);
        const cartonesHTML = cartones.map(carton => this._generateCartonHTML(carton, config)).join('\n');

        return `${header}\n  <main class="cartones-grid">\n${cartonesHTML}  </main>\n</body>\n</html>`;
    }

    _generateHTMLHeader(count, config = {}) {
        const gameName = escapeHTML(config.gameName || DEFAULT_GAME_NAME);
        return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Cartones de ${gameName} generados - ${count} cartones únicos">
  <title>Cartones de ${gameName}</title>
  <style>${this._generateCSS(config)}</style>
</head>
<body>
  <header class="print-info no-print">
    <h1>ℹ️ Información de Impresión</h1>
    <p><strong>${count} cartones generados</strong> • Configuración recomendada: A4, márgenes 0 mm • ${Math.ceil(count / 3)} página(s)</p>
  </header>`;
    }

    _generateCSS(config = {}) {
        const primaryColor = config.primaryColor || '#6366f1';
        const secondaryColor = config.secondaryColor || '#f8faff';
        
        return `
    @page { size: A4; margin: 0; }
    @media print {
        html, body { margin: 0 !important; padding: 0 !important; print-color-adjust: exact; color-adjust: exact; overflow: visible !important; }
        .no-print { display: none; }
        .cartones-grid { margin: 0 !important; padding: 0 !important; display: block; gap: 0; position: static; }
        .carton-container { box-shadow: none; border-width: 1px; page-break-inside: avoid; break-inside: avoid; }
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Arial', sans-serif; background: white; margin: 0; padding: 0; }
    .cartones-grid { display: grid; grid-template-columns: repeat(1, 1fr); gap: 1rem; width: 210mm; margin: 0 auto; }
    .carton-container { background: white; border: 2px solid ${primaryColor}; padding: 12px; display: flex; flex-direction: column; }
    .carton-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 2px solid ${primaryColor}; }
    .carton-title { font-size: 20px; font-weight: bold; color: ${primaryColor}; text-transform: uppercase; }
    .carton-number { font-size: 25px; font-weight: bold; color: ${primaryColor}; background: ${secondaryColor}; padding: 3px 10px; border-radius: 4px; }
    .carton-grid { display: grid; grid-template-columns: repeat(8, 1fr); grid-template-rows: repeat(3, 1fr); gap: 4px; width: 100%; height: 100%; border-collapse: separate; border-spacing: 4px; }
    .carton-cell { aspect-ratio: 1 / 1; border: 2px solid #e2e8f0; border-radius: 6px; display: flex; align-items: center; justify-content: center; background: white; }
    .carton-cell.song { border-color: ${primaryColor}; background: white; }
    .carton-cell.decorative { background: white; border-color: #e2e8f0; border-style: dashed; }
    .cell-icon { font-size: 72px; line-height: 1; display: flex; align-items: center; justify-content: center; height: 100%; }
    .cell-icon img { max-width: 100%; max-height: 100%; object-fit: contain; }
    .image-icon { height: 56px; aspect-ratio: 1; }
    .song .image-icon { height: 100%; }
    .decorative-icon { font-size: 40px; opacity: 0.2; filter: grayscale(100%); }
    .print-info { text-align: center; padding: 20px; margin: 20px; background: #fef3c7; border-radius: 8px; border: 2px solid #f59e0b; }
    .print-info h1 { color: #92400e; margin-bottom: 10px; font-size: 1.25rem; }
    .print-info p { color: #78350f; line-height: 1.6; }
    @media screen {
      body { background: #f5f5f5; padding: 10px; }
      .carton-container:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.15); transform: translateY(-2px); transition: all 0.2s; }
    }`;
    }

    _generateCartonHTML(carton, config = {}) {
        const gameName = escapeHTML(config.gameName || DEFAULT_GAME_NAME);
        const rowsHTML = carton.rows.map(row =>
            row.cells.map(cell => this._generateCellHTML(cell)).join('')
        ).join('\n        \n');

        return `    <article class="carton-container" role="region" aria-labelledby="carton-title-${carton.id}">
      <header class="carton-header">
        <h2 id="carton-title-${carton.id}" class="carton-title">🎵 ${gameName}</h2>
        <span class="carton-number" aria-label="Cartón número ${carton.id}">#${carton.id}</span>
      </header>
      <div class="carton-grid" role="grid" aria-label="Cuadrícula de bingo con 3 filas y 8 columnas">
        
${rowsHTML}        
      </div>
    </article>`;
    }

    _generateCellHTML(cell) {
        if (cell.type === 'song') {
            const title = escapeHTML(cell.song.title);
            const iconHTML = cell.song.iconType === 'image'
                ? `<img src="${escapeHTML(cell.song.icon)}" alt="${title}" class="image-icon">`
                : `<span role="img" aria-label="${title}">${escapeHTML(cell.song.icon)}</span>`;
            return `          <div class="carton-cell song" role="gridcell"><div class="cell-icon">${iconHTML}</div></div>\n`;
        }
        return `          <div class="carton-cell decorative" role="gridcell"><div class="decorative-icon" aria-hidden="true">${DECORATIVE_ICON_HTML}</div></div>\n`;
    }
}
