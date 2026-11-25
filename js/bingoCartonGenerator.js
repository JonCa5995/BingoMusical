import {
    CELLS_PER_ROW,
    MAX_CARTON_GENERATION_ATTEMPTS,
    MIN_SONGS_REQUIRED,
    ROWS_PER_CARTON,
    SONGS_IN_ROW,
    SONGS_PER_CARTON
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

        // Grupos de canciones ya usados en alguna fila (de los cartones existentes y de los nuevos).
        // Dos filas con las mismas canciones permitirían cantar LÍNEA a dos cartones a la vez.
        const usedRows = new Set(
            existingCartones.flatMap(carton => carton.rows.map(row => this.rowSongsKey(row)))
        );

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
            } while (this.isDuplicateCarton(carton, usedRows));

            for (const row of carton.rows) {
                usedRows.add(this.rowSongsKey(row));
            }

            cartones.push(carton);
        }

        return cartones;
    }

    generateSingleCarton(songs, cartonNumber) {
        // Las 12 canciones son distintas, así que las filas de un mismo cartón nunca se repiten
        const selectedSongs = this.selectRandomSongs(songs, SONGS_PER_CARTON);
        const rows = [];

        for (let rowIndex = 0; rowIndex < ROWS_PER_CARTON; rowIndex++) {
            const rowSongs = selectedSongs.slice(rowIndex * SONGS_IN_ROW, (rowIndex + 1) * SONGS_IN_ROW);
            rows.push(this.generateRow(rowSongs));
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

    isDuplicateCarton(carton, usedRows) {
        return carton.rows.some(row => usedRows.has(this.rowSongsKey(row)));
    }

    /**
     * Clave de una fila: los IDs de sus canciones ordenados (la posición no importa para cantar LÍNEA)
     */
    rowSongsKey(row) {
        return row.cells
            .filter(cell => cell.type === 'song')
            .map(cell => cell.song.id)
            .sort((a, b) => a - b)
            .join('-');
    }
}
