import {CELEBRATION, CELL_TYPE} from '../constants.js';

export function evaluateCarton(carton, playedIds) {
    const rows = carton.rows.map(row => {
        const songs = row.cells
            .filter(cell => cell.type === CELL_TYPE.SONG && cell.song)
            .map(cell => ({song: cell.song, played: playedIds.has(cell.song.id)}));
        const missing = songs.filter(item => !item.played).length;

        return {songs, missing, complete: songs.length > 0 && missing === 0};
    });

    const total = rows.reduce((sum, row) => sum + row.songs.length, 0);
    const missingForBingo = rows.reduce((sum, row) => sum + row.missing, 0);
    const linea = rows.some(row => row.complete);
    const candidates = rows.filter(row => row.songs.length > 0).map(row => row.missing);

    return {
        rows,
        total,
        linea,
        completeRows: rows.flatMap((row, index) => row.complete ? [index + 1] : []),
        bingo: total > 0 && missingForBingo === 0,
        missingForLinea: linea ? 0 : (candidates.length > 0 ? Math.min(...candidates) : null),
        missingForBingo
    };
}

export function buildCelebration({kind, ok, carton = null, result = null}) {
    if (!carton || !result) return {kind, ok, cartonId: null, rows: []};

    const onlyComplete = ok && kind === CELEBRATION.LINEA;
    const rows = result.rows
        .filter(row => !onlyComplete || row.complete)
        .map(row => ({
            complete: row.complete,
            songs: row.songs.map(({song, played}) => ({icon: song.icon, iconType: song.iconType, played}))
        }));

    return {kind, ok, cartonId: carton.id, rows};
}
