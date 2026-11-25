import {
    CARTONS_PER_PRINT_PAGE,
    CELL_TYPE,
    CELLS_PER_ROW,
    DECORATIVE_ICON_PATH,
    DEFAULT_PRINT_PRIMARY_COLOR,
    DEFAULT_PRINT_SECONDARY_COLOR,
    ICON_TYPE,
    ROWS_PER_CARTON
} from '../constants.js';
import {escapeHTML, gameNameOrDefault} from '../utils.js';
import {TEXT} from '../messages.js';

export const DECORATIVE_ICON_HTML = `<img class="image-icon" src="${DECORATIVE_ICON_PATH}" alt="${TEXT.document.decorativeAlt}">`;

export class CartonHtmlRenderer {
    generatePrintableHTML(cartones, config = {}) {
        const header = this._generateHTMLHeader(cartones.length, config);
        const cartonesHTML = cartones.map(carton => this._generateCartonHTML(carton, config)).join('\n');

        return `${header}\n  <main class="cartones-grid">\n${cartonesHTML}  </main>\n</body>\n</html>`;
    }

    _generateHTMLHeader(count, config = {}) {
        const gameName = escapeHTML(gameNameOrDefault(config.gameName));
        return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${TEXT.document.metaDescription(gameName, count)}">
  <title>${TEXT.document.title(gameName)}</title>
  <style>${this._generateCSS(config)}</style>
</head>
<body>
  <header class="print-info no-print">
    <h1>${TEXT.document.infoTitle}</h1>
    <p><strong>${TEXT.document.generated(count)}</strong>${TEXT.document.recommendation(Math.ceil(count / CARTONS_PER_PRINT_PAGE))}</p>
  </header>`;
    }

    _generateCSS(config = {}) {
        const primaryColor = config.primaryColor || DEFAULT_PRINT_PRIMARY_COLOR;
        const secondaryColor = config.secondaryColor || DEFAULT_PRINT_SECONDARY_COLOR;

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
    .carton-grid { display: grid; grid-template-columns: repeat(${CELLS_PER_ROW}, 1fr); grid-template-rows: repeat(${ROWS_PER_CARTON}, 1fr); gap: 4px; width: 100%; height: 100%; border-collapse: separate; border-spacing: 4px; }
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
        const gameName = escapeHTML(gameNameOrDefault(config.gameName));
        const rowsHTML = carton.rows.map(row =>
            row.cells.map(cell => this._generateCellHTML(cell)).join('')
        ).join('\n        \n');

        return `    <article class="carton-container" role="region" aria-labelledby="carton-title-${carton.id}">
      <header class="carton-header">
        <h2 id="carton-title-${carton.id}" class="carton-title">${TEXT.document.cartonTitle(gameName)}</h2>
        <span class="carton-number" aria-label="${TEXT.document.cartonNumberLabel(carton.id)}">#${carton.id}</span>
      </header>
      <div class="carton-grid" role="grid" aria-label="${TEXT.document.gridLabel(ROWS_PER_CARTON, CELLS_PER_ROW)}">
        
${rowsHTML}        
      </div>
    </article>`;
    }

    _generateCellHTML(cell) {
        if (cell.type === CELL_TYPE.SONG) {
            const title = escapeHTML(cell.song.title);
            const iconHTML = cell.song.iconType === ICON_TYPE.IMAGE
                ? `<img src="${escapeHTML(cell.song.icon)}" alt="${title}" class="image-icon">`
                : `<span role="img" aria-label="${title}">${escapeHTML(cell.song.icon)}</span>`;
            return `          <div class="carton-cell song" role="gridcell"><div class="cell-icon">${iconHTML}</div></div>\n`;
        }
        return `          <div class="carton-cell decorative" role="gridcell"><div class="decorative-icon" aria-hidden="true">${DECORATIVE_ICON_HTML}</div></div>\n`;
    }

    generatePreviewHTML(carton, config, gameName = '') {
        const {primaryColor, secondaryColor} = config;
        const displayName = escapeHTML(gameNameOrDefault(gameName));

        const cellsHTML = carton.rows.flatMap(row =>
            row.cells.map(cell => {
                const cellClass = cell.type === CELL_TYPE.SONG ? 'song' : 'decorative';
                const icon = this._previewCellIcon(cell);

                return `<div class="preview-cell ${cellClass}">
                    ${icon}
                </div>`;
            })
        ).join('');

        return `
            <div class="preview-carton" style="color: ${primaryColor}; border-color: ${primaryColor};">
                <div class="preview-carton-header" style="border-color: ${primaryColor};">
                    <div class="preview-carton-title" style="color: ${primaryColor};">${TEXT.document.cartonTitle(displayName)}</div>
                    <div class="preview-carton-number" style="background-color: ${secondaryColor};">#1</div>
                </div>
                <div class="preview-carton-grid">
                    ${cellsHTML}
                </div>
            </div>
        `;
    }

    _previewCellIcon(cell) {
        if (cell.type === CELL_TYPE.SONG && cell.song) {
            if (cell.song.iconType === ICON_TYPE.IMAGE) {
                return `<img src="${escapeHTML(cell.song.icon)}" alt="${escapeHTML(cell.song.title)}" style="max-width: 90%; max-height: 90%;">`;
            }
            return escapeHTML(cell.song.icon);
        }
        return `<span class="decorative-icon">${DECORATIVE_ICON_HTML}</span>`;
    }
}
