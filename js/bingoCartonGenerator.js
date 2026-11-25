import {
    CELL_TYPE,
    CELLS_PER_ROW,
    MAX_CARTON_GENERATION_ATTEMPTS,
    MIN_SONGS_REQUIRED,
    ROWS_PER_CARTON,
    SONGS_IN_ROW,
    SONGS_PER_CARTON
} from "./constants.js";
import {TEXT} from "./messages.js";

export class BingoCartonGenerator {
    generateCartones(songs, count = 1, existingCartones = []) {
        if (songs.length < MIN_SONGS_REQUIRED) {
            throw new Error(TEXT.cartones.generatorNeedsSongs(MIN_SONGS_REQUIRED));
        }

        const cartones = [];

        const usedRows = new Set(
            existingCartones.flatMap(carton => carton.rows.map(row => this.rowSongsKey(row)))
        );

        const startNumber = existingCartones.length + 1;

        for (let i = 0; i < count; i++) {
            let carton;
            let attempts = 0;

            do {
                carton = this.generateSingleCarton(songs, startNumber + i);
                attempts++;

                if (attempts > MAX_CARTON_GENERATION_ATTEMPTS) {
                    throw new Error(TEXT.cartones.notUnique);
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
                    type: CELL_TYPE.SONG,
                    position: i,
                    song: songs[positions.indexOf(i)],
                    marked: false
                });
            } else {
                cells.push({
                    type: CELL_TYPE.DECORATIVE,
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

    rowSongsKey(row) {
        return row.cells
            .filter(cell => cell.type === CELL_TYPE.SONG)
            .map(cell => cell.song.id)
            .sort((a, b) => a - b)
            .join('-');
    }
}
