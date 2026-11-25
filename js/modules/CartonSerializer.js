/**
 * CartonSerializer Module
 * Única puerta entre las dos formas de un cartón:
 *
 * - En memoria (la que usa toda la aplicación):
 *     { id, songs: [canción], generatedAt,
 *       rows: [{ cells: [{ type: 'song', position, song, marked } | { type: 'decorative', position }] }] }
 *
 * - Guardado en el JSON de la playlist:
 *     { id, songs: [idCanción], generatedAt,
 *       rows: [{ cells: [{ position, songId | null }] }] }
 *
 * Fuera de este módulo nadie debe conocer la forma guardada.
 */

/**
 * Convierte cartones en memoria a su forma guardada
 * @param {Array} cartones
 * @returns {Array}
 */
export function serializeCartones(cartones) {
    return cartones.map(carton => ({
        id: carton.id,
        songs: carton.songs.map(song => song.id),
        rows: carton.rows.map(row => ({
            cells: row.cells.map(cell => ({
                position: cell.position,
                songId: cell.type === 'song' ? cell.song.id : null
            }))
        })),
        generatedAt: carton.generatedAt
    }));
}

/**
 * Convierte cartones guardados a su forma en memoria, enlazándolos con las canciones actuales.
 * Una celda cuya canción ya no existe pasa a ser decorativa.
 * @param {Array} cartonesData - Cartones tal como vienen en el JSON
 * @param {Array} songs - Canciones cargadas
 * @returns {Array}
 */
export function deserializeCartones(cartonesData, songs) {
    const songMap = new Map(songs.map(song => [song.id, song]));

    const toCell = ({position, songId}) => {
        if (songId == null) {
            return {type: 'decorative', position};
        }

        const song = songMap.get(songId);
        if (!song) {
            console.warn(`Canción con ID ${songId} no encontrada`);
            return {type: 'decorative', position};
        }

        // `marked` no se guarda: siempre empieza sin marcar
        return {type: 'song', position, song, marked: false};
    };

    return cartonesData.map(cartonData => ({
        id: cartonData.id,
        rows: cartonData.rows.map(rowData => ({cells: rowData.cells.map(toCell)})),
        // Canciones que ya no existan se descartan
        songs: cartonData.songs.map(songId => songMap.get(songId)).filter(Boolean),
        generatedAt: cartonData.generatedAt
    }));
}
