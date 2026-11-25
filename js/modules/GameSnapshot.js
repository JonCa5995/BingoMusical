import {
    AUDIO_FILE_EXTENSION,
    CELLS_PER_ROW,
    GAME_FILE_TYPE,
    GAME_FILE_VERSION,
    ICON_TYPE,
    MAX_CARTONES_IN_FILE,
    MAX_ICON_DATA_LENGTH,
    MAX_SONG_TITLE_LENGTH,
    MAX_SONGS_IN_FILE,
    ROWS_PER_CARTON,
    SONGS_PER_CARTON
} from '../constants.js';
import {TEXT} from '../messages.js';
import {serializeCartones} from './CartonSerializer.js';
import {sanitizeSettings} from './Settings.js';

const IMAGE_DATA_URL = /^data:image\/(png|jpeg|gif|webp);base64,[A-Za-z0-9+/]+={0,2}$/;
const MAX_EMOJI_LENGTH = 32;

class InvalidGameFile extends Error {}

const invalid = (detail) => { throw new InvalidGameFile(detail); };
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const isId = (value) => Number.isInteger(value) && value >= 0;

export function captureSnapshot({songs, game, settings, now = new Date()}) {
    return {
        type: GAME_FILE_TYPE,
        version: GAME_FILE_VERSION,
        date: now.toISOString(),
        settings: sanitizeSettings(settings).values,
        songs: songs.map(song => ({
            id: song.id,
            title: song.title,
            icon: song.icon,
            iconType: song.iconType || ICON_TYPE.EMOJI,
            played: Boolean(song.played),
            playedOrder: song.played ? song.playedOrder ?? null : null
        })),
        game: {
            started: game.isGameStarted(),
            currentSongId: game.getCurrentSong(),
            lineaCompleted: game.isLineaCompleted(),
            bingoCompleted: game.isBingoCompleted()
        },
        cartones: serializeCartones(game.getCartones())
    };
}

function validateSong(song, index) {
    const label = TEXT.savedGame.songLabel(index + 1);

    if (!isObject(song)) invalid(`${label} no es válida`);
    if (!isId(song.id)) invalid(`${label} no tiene un identificador válido`);
    if (typeof song.title !== 'string' || song.title.trim() === '' || song.title.length > MAX_SONG_TITLE_LENGTH) {
        invalid(`${label} no tiene un título válido`);
    }

    const iconType = song.iconType ?? ICON_TYPE.EMOJI;
    if (!Object.values(ICON_TYPE).includes(iconType)) invalid(`${label} tiene un tipo de icono desconocido`);

    const iconIsValid = typeof song.icon === 'string' && (iconType === ICON_TYPE.IMAGE
        ? song.icon.length <= MAX_ICON_DATA_LENGTH && IMAGE_DATA_URL.test(song.icon)
        : song.icon.length > 0 && song.icon.length <= MAX_EMOJI_LENGTH);
    if (!iconIsValid) invalid(`${label} tiene un icono no válido`);

    if (song.played !== undefined && typeof song.played !== 'boolean') invalid(`${label} tiene un estado de reproducción no válido`);
    const played = song.played === true;

    if (played && !(Number.isInteger(song.playedOrder) && song.playedOrder >= 1)) {
        invalid(`${label} está reproducida pero no tiene un orden válido`);
    }

    return {id: song.id, title: song.title, icon: song.icon, iconType, played, playedOrder: played ? song.playedOrder : null};
}

function validateCarton(carton, index) {
    const label = TEXT.savedGame.cartonLabel(index + 1);

    if (!isObject(carton) || !Number.isInteger(carton.id) || carton.id < 1) invalid(`${label} no es válido`);
    if (!Array.isArray(carton.songs) || carton.songs.length > SONGS_PER_CARTON || !carton.songs.every(isId)) invalid(`${label} tiene canciones no válidas`);
    if (!Array.isArray(carton.rows) || carton.rows.length > ROWS_PER_CARTON) invalid(`${label} tiene filas no válidas`);

    const rows = carton.rows.map(row => {
        if (!isObject(row) || !Array.isArray(row.cells) || row.cells.length > CELLS_PER_ROW) invalid(`${label} tiene filas no válidas`);

        return {
            cells: row.cells.map(cell => {
                const validPosition = isObject(cell) && Number.isInteger(cell.position) && cell.position >= 0 && cell.position < CELLS_PER_ROW;
                if (!validPosition || !(cell.songId === null || isId(cell.songId))) invalid(`${label} tiene casillas no válidas`);

                return {position: cell.position, songId: cell.songId};
            })
        };
    });

    return {id: carton.id, songs: [...carton.songs], rows, generatedAt: typeof carton.generatedAt === 'string' ? carton.generatedAt : ''};
}

function validateGame(game, songIds, playedCount) {
    if (!isObject(game)) invalid('faltan los datos de la partida');

    const flags = ['started', 'lineaCompleted', 'bingoCompleted'];
    if (!flags.every(flag => typeof game[flag] === 'boolean')) invalid('los datos de la partida no son válidos');

    const currentSongId = game.currentSongId ?? null;
    if (currentSongId !== null && !songIds.has(currentSongId)) invalid('la canción actual no está en la lista');

    return {started: game.started || playedCount > 0, lineaCompleted: game.lineaCompleted, bingoCompleted: game.bingoCompleted, currentSongId};
}

export function validateGameFile(data) {
    if (!isObject(data) || data.type !== GAME_FILE_TYPE || !Number.isInteger(data.version) || data.version < 1) {
        return {success: false, error: TEXT.savedGame.notGame};
    }

    if (data.version > GAME_FILE_VERSION) {
        return {success: false, error: TEXT.savedGame.newerVersion(data.version)};
    }

    try {
        if (!Array.isArray(data.songs) || data.songs.length > MAX_SONGS_IN_FILE) invalid('la lista de canciones no es válida');
        if (!Array.isArray(data.cartones) || data.cartones.length > MAX_CARTONES_IN_FILE) invalid('la lista de cartones no es válida');

        const songs = data.songs.map(validateSong);
        const songIds = new Set(songs.map(song => song.id));
        if (songIds.size !== songs.length) invalid('hay canciones con el mismo identificador');

        const orders = songs.filter(song => song.played).map(song => song.playedOrder);
        if (new Set(orders).size !== orders.length) invalid('hay canciones reproducidas con el mismo orden');

        const game = validateGame(data.game, songIds, orders.length);
        const cartones = data.cartones.map(validateCarton);
        const {values: settings, discarded} = sanitizeSettings(isObject(data.settings) ? data.settings : {});

        return {
            success: true,
            snapshot: {type: GAME_FILE_TYPE, version: data.version, date: typeof data.date === 'string' ? data.date : '', settings, songs, game, cartones},
            discardedSettings: discarded
        };
    } catch (error) {
        if (error instanceof InvalidGameFile) return {success: false, error: TEXT.savedGame.invalid(error.message)};
        throw error;
    }
}

export function restoreFromSnapshot(snapshot) {
    const songs = snapshot.songs.map(song => ({
        id: song.id,
        title: song.title,
        icon: song.icon,
        iconType: song.iconType,
        audioPath: song.title + AUDIO_FILE_EXTENSION,
        file: null,
        played: song.played,
        playedOrder: song.played ? song.playedOrder : undefined
    }));

    const playedSongs = songs.filter(song => song.played).sort((a, b) => a.playedOrder - b.playedOrder);

    return {
        songs,
        gameState: {...snapshot.game, playedSongs},
        settings: snapshot.settings
    };
}

export function summarizeSnapshot(snapshot) {
    return {
        songs: snapshot.songs.length,
        played: snapshot.songs.filter(song => song.played).length,
        cartones: snapshot.cartones.length
    };
}
