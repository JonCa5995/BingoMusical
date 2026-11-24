import {
    MIN_SONGS_REQUIRED,
    SONGS_PER_CARTON,
    ROWS_PER_CARTON,
    CELLS_PER_ROW,
    SONGS_IN_ROW,
    MAX_CARTON_GENERATION_ATTEMPTS,
    MAX_ROW_GENERATION_ATTEMPTS
} from "./constants.js";

/**
 * BingoCartonGenerator
 * Genera cartones únicos (solo datos). El HTML lo produce CartonHtmlRenderer
 * y la descarga/impresión CartonExporter.
 */
export class BingoCartonGenerator {
    generateCartones(songs, count = 1, existingCartones = []) {
        if (songs.length < MIN_SONGS_REQUIRED) {
            throw new Error(`Se necesitan al menos ${MIN_SONGS_REQUIRED} canciones para generar cartones`);
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
        // Fisher-Yates parcial: uniforme (sort con random no lo es) y solo baraja lo necesario
        const pool = [...songs];
        const n = Math.min(count, pool.length);
        for (let i = 0; i < n; i++) {
            const j = i + Math.floor(Math.random() * (pool.length - i));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        return pool.slice(0, n);
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
                    // El icono decorativo es presentación: lo pone CartonHtmlRenderer
                    type: 'decorative',
                    position: i
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
}
