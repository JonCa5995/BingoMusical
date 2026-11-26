import {CELEBRATION, CELL_TYPE, FAILURE_VIEW, ICON_TYPE, LINE_VIEW} from '../constants.js';

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
    const missingForLinea = candidates.length > 0 ? Math.min(...candidates) : null;

    return {
        rows,
        total,
        linea,
        completeRows: rows.flatMap((row, index) => row.complete ? [index + 1] : []),
        bingo: total > 0 && missingForBingo === 0,
        missingForLinea: linea ? 0 : missingForLinea,
        missingForBingo
    };
}

const HIDDEN_SONG = Object.freeze({icon: '', iconType: ICON_TYPE.EMOJI, played: false});

export function buildCelebration({kind, ok, carton = null, result = null, view}) {
    if (!carton || !result) return {kind, ok, cartonId: null, rows: []};
    if (!ok && view === FAILURE_VIEW.ONLY_TEXT) return {kind, ok, cartonId: carton.id, rows: []};

    const isLinea = kind === CELEBRATION.LINEA;
    const onlyLine = ok && isLinea && view === LINE_VIEW.LINE;
    const hideMissing = ok ? isLinea && !onlyLine : (view ?? FAILURE_VIEW.PLAYED) === FAILURE_VIEW.PLAYED;
    const rows = result.rows
        .filter(row => !onlyLine || row.complete)
        .map(row => ({
            complete: row.complete,
            songs: row.songs.map(({song, played}) => (hideMissing && !played ? HIDDEN_SONG : {icon: song.icon, iconType: song.iconType, played}))
        }));

    return {kind, ok, cartonId: carton.id, rows};
}
