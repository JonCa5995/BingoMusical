import {CELL_TYPE} from '../constants.js';

export function serializeCartones(cartones) {
    return cartones.map(carton => ({
        id: carton.id,
        songs: carton.songs.map(song => song.id),
        rows: carton.rows.map(row => ({
            cells: row.cells.map(cell => ({
                position: cell.position,
                songId: cell.type === CELL_TYPE.SONG ? cell.song.id : null
            }))
        })),
        generatedAt: carton.generatedAt
    }));
}

export function deserializeCartones(cartonesData, songs) {
    const songMap = new Map(songs.map(song => [song.id, song]));

    const toCell = ({position, songId}) => {
        if (songId == null) {
            return {type: CELL_TYPE.DECORATIVE, position};
        }

        const song = songMap.get(songId);
        if (!song) {
            console.warn(`Canción con ID ${songId} no encontrada`);
            return {type: CELL_TYPE.DECORATIVE, position};
        }

        return {type: CELL_TYPE.SONG, position, song};
    };

    return cartonesData.map(cartonData => ({
        id: cartonData.id,
        rows: cartonData.rows.map(rowData => ({cells: rowData.cells.map(toCell)})),
        songs: cartonData.songs.map(songId => songMap.get(songId)).filter(Boolean),
        generatedAt: cartonData.generatedAt
    }));
}
