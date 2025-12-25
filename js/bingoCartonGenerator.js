import {
    MIN_SONGS_REQUIRED,
    SONGS_PER_CARTON,
    ROWS_PER_CARTON,
    CELLS_PER_ROW,
    SONGS_IN_ROW,
    MAX_CARTON_GENERATION_ATTEMPTS,
    MAX_ROW_GENERATION_ATTEMPTS,
    DEFAULT_GAME_NAME
} from "./constants.js";

export class BingoCartonGenerator {
    emptyIcon = '<img class="image-icon" src="img/icon-decorative.svg" alt="Icono de decoración">';

    generateCartones(songs, count = 1, existingCartones = []) {
        if (songs.length < MIN_SONGS_REQUIRED) {
            throw new Error('Se necesitan al menos 24 canciones para generar cartones');
        }

        const cartones = [];
        const usedCombinations = new Set();

        // Agregar combinaciones de cartones existentes al set
        for (const existingCarton of existingCartones) {
            for (const row of existingCarton.rows) {
                const songIds = row.cells
                    .filter(c => c.type === 'song')
                    .map(c => c.song ? c.song.id : c.songId)
                    .filter(id => id)
                    .sort((a, b) => a - b)
                    .join('-');
                if (songIds) {
                    usedCombinations.add(songIds);
                }
            }
        }

        // Calcular el número de inicio para los nuevos cartones
        const startNumber = existingCartones.length + 1;

        for (let i = 0; i < count; i++) {
            let carton;
            let attempts = 0;

            do {
                carton = this.generateSingleCarton(songs, startNumber + i);
                attempts++;

                if (attempts > MAX_CARTON_GENERATION_ATTEMPTS) {
                    throw new Error('No se pudieron generar cartones únicos suficientes. Intenta con menos cartones.');
                }
            } while (this.isDuplicateCarton(carton, usedCombinations));

            for (const row of carton.rows) {
                const songIds = row.cells.filter(c => c.type === 'song').map(c => c.song.id).sort((a, b) => a - b).join('-');
                usedCombinations.add(songIds);
            }

            cartones.push(carton);
        }

        return cartones;
    }

    generateSingleCarton(songs, cartonNumber) {
        const selectedSongs = this.selectRandomSongs(songs, SONGS_PER_CARTON);
        const rows = [];
        const usedRowCombinations = new Set();

        for (let rowIndex = 0; rowIndex < ROWS_PER_CARTON; rowIndex++) {
            let row;
            let attempts = 0;

            do {
                const rowSongs = selectedSongs.slice(rowIndex * SONGS_IN_ROW, (rowIndex + 1) * SONGS_IN_ROW);
                row = this.generateRow(rowSongs);
                attempts++;

                if (attempts > MAX_ROW_GENERATION_ATTEMPTS) break;
            } while (this.isDuplicateRow(row, usedRowCombinations));

            usedRowCombinations.add(this.getRowKey(row));
            rows.push(row);
        }

        return {
            id: cartonNumber,
            rows,
            songs: selectedSongs,
            generatedAt: new Date().toISOString()
        };
    }

    selectRandomSongs(songs, count) {
        return [...songs].sort(() => Math.random() - 0.5).slice(0, count);
    }

    generateRow(songs) {
        const cells = [];
        const positions = this.generateRandomPositions();

        for (let i = 0; i < CELLS_PER_ROW; i++) {
            if (positions.includes(i)) {
                cells.push({
                    type: 'song',
                    position: i,
                    song: songs[positions.indexOf(i)],
                    marked: false
                });
            } else {
                cells.push({
                    type: 'decorative',
                    position: i,
                    icon: this.emptyIcon
                });
            }
        }

        return {cells};
    }

    generateRandomPositions() {
        const positions = [];
        while (positions.length < SONGS_IN_ROW) {
            const pos = Math.floor(Math.random() * CELLS_PER_ROW);
            if (!positions.includes(pos)) positions.push(pos);
        }
        return positions.sort((a, b) => a - b);
    }

    isDuplicateCarton(carton, usedCombinations) {
        return carton.rows.some(row => usedCombinations.has(this.getRowKey(row)));
    }

    isDuplicateRow(row, usedRows) {
        return usedRows.has(this.getRowKey(row));
    }

    getRowKey(row) {
        return row.cells.filter(c => c.type === 'song').map(c => `${c.song.id}-${c.position}`).join('|');
    }

    generatePrintableHTML(cartones, config = {}) {
        const header = this._generateHTMLHeader(cartones.length, config);
        const cartonesHTML = cartones.map(carton => this._generateCartonHTML(carton, config)).join('\n');

        return `${header}\n  <main class="cartones-grid">\n${cartonesHTML}  </main>\n</body>\n</html>`;
    }

    _generateHTMLHeader(count, config = {}) {
        const gameName = config.gameName || DEFAULT_GAME_NAME;
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
    .carton-title { font-size: 20px; font-weight: bold; color: ${secondaryColor}; text-transform: uppercase; }
    .carton-number { font-size: 25px; font-weight: bold; color: ${primaryColor}; background: ${secondaryColor}; padding: 3px 10px; border-radius: 4px; }
    .carton-grid { display: grid; grid-template-columns: repeat(8, 1fr); grid-template-rows: repeat(3, 1fr); gap: 4px; width: 100%; height: 100%; border-collapse: separate; border-spacing: 4px; }
    .carton-cell { aspect-ratio: 1 / 1; border: 2px solid #e2e8f0; border-radius: 6px; display: flex; align-items: center; justify-content: center; background: white; }
    .carton-cell.song { border-color: ${primaryColor}; background: white; }
    .carton-cell.decorative { background: white; border-color: #e2e8f0; border-style: dashed; }
    .cell-icon { font-size: 72px; line-height: 1; display: flex; align-items: center; justify-content: center; height: 100%; }
    .cell-icon img { max-width: 90%; max-height: 90%; object-fit: contain; }
    .image-icon { height: 56px; aspect-ratio: 1; }
    .song .image-icon { height: 72px; }
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
        const gameName = config.gameName || DEFAULT_GAME_NAME;
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
            const iconHTML = cell.song.iconType === 'image'
                ? `<img src="${cell.song.icon}" alt="${cell.song.title}" class="image-icon">`
                : `<span role="img" aria-label="${cell.song.title}">${cell.song.icon}</span>`;
            return `          <div class="carton-cell song" role="gridcell"><div class="cell-icon">${iconHTML}</div></div>\n`;
        }
        return `          <div class="carton-cell decorative" role="gridcell"><div class="decorative-icon" aria-hidden="true">${cell.icon}</div></div>\n`;
    }

    downloadAsHTML(cartones, config = {}) {
        const gameName = config.gameName || DEFAULT_GAME_NAME;
        const sanitizedName = gameName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const filename = `cartones-${sanitizedName}.html`;

        const html = this.generatePrintableHTML(cartones, config);
        const blob = new Blob([html], {type: 'text/html;charset=utf-8'});
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.setAttribute('aria-label', `Descargar ${cartones.length} cartones de bingo`);

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
    }
    
    async downloadAsPDF(cartones, config = {}) {
        // Para generar PDF, primero generamos el HTML y luego lo abrimos para imprimir
        // El usuario puede usar "Guardar como PDF" desde el diálogo de impresión del navegador
        const html = this.generatePrintableHTML(cartones, config);
        const printWindow = window.open('', '_blank');
        
        if (!printWindow) {
            throw new Error('No se pudo abrir la ventana de impresión. Por favor, permite ventanas emergentes.');
        }
        
        printWindow.document.write(html);
        printWindow.document.close();
        
        // Esperar a que se cargue el contenido
        printWindow.onload = function() {
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
            }, 250);
        };
    }
}
