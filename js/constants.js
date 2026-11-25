// ============================================================
// REGLAS DEL JUEGO
// ============================================================

// Requisitos del juego
export const MIN_SONGS_REQUIRED = 24;
export const MAX_CARTONS_GENERATED = 1500;

// Configuración de cartones
export const SONGS_PER_CARTON = 12;
export const ROWS_PER_CARTON = 3;
export const CELLS_PER_ROW = 8;
export const SONGS_IN_ROW = 4;

// Canciones mínimas reproducidas para poder cantar (una fila / un cartón completo)
export const MIN_SONGS_FOR_LINEA = SONGS_IN_ROW;
export const MIN_SONGS_FOR_BINGO = SONGS_PER_CARTON;

// Límites de generación
export const MAX_CARTON_GENERATION_ATTEMPTS = 1000;

// Cantidad de cartones que propone el modal de generación
export const DEFAULT_CARTON_COUNT = 10;

// Longitud máxima del nombre del juego
export const MAX_GAME_NAME_LENGTH = 50;

// ============================================================
// TIEMPOS
// ============================================================

// Tiempos de revelado por defecto (en segundos) y máximo configurable
export const DEFAULT_TITLE_REVEAL_TIME = 5;
export const DEFAULT_ICON_REVEAL_TIME = 10;
export const MAX_REVEAL_TIME_SECONDS = 30;

// Esperas de la interfaz (en milisegundos)
export const SEARCH_DEBOUNCE_MS = 300;             // tras la última tecla, antes de filtrar la lista
export const CELEBRATION_DELAY_MS = 500;           // entre cantar LÍNEA/BINGO y mostrar la celebración
export const IMPORT_MESSAGE_DELAY_MS = 2000;       // entre el aviso de duplicados y el mensaje final de importar
export const CONTINUOUS_NEXT_SONG_DELAY_MS = 1000; // pausa entre canciones en modo automático
export const PRINT_DIALOG_DELAY_MS = 250;          // para que cargue el documento antes de abrir el diálogo de impresión
export const REVOKE_URL_DELAY_MS = 1000;           // margen antes de liberar la URL de una descarga
export const ICON_MODAL_CLOSE_DELAY_MS = 300;      // el modal de iconos se cierra un instante después de elegir
export const MS_PER_SECOND = 1000;

// ============================================================
// IMÁGENES Y AUDIO
// ============================================================

// Tamaños (en píxeles) de los iconos convertidos a imagen
export const PLAYER_ICON_SIZE = 300;
export const CUSTOM_ICON_SIZE = 300;
export const HISTORY_ICON_SIZE = 150;

// Volúmenes iniciales (de 0 a 1)
export const DEFAULT_MUSIC_VOLUME = 1;
export const DEFAULT_EFFECTS_VOLUME = 0.7;

// ============================================================
// RUTAS, ARCHIVOS Y ALMACENAMIENTO
// ============================================================

export const DEFAULT_SONGS_FOLDER = 'canciones/';
export const AUDIO_FILE_EXTENSION = '.mp3';
export const LOGO_PATH = 'icon.png';
export const DECORATIVE_ICON_PATH = 'img/icon-decorative.svg';
export const STORAGE_PREFIX = 'bingoMusical_';

// ============================================================
// VALORES POR DEFECTO
// ============================================================

export const DEFAULT_GAME_NAME = 'Bingo Musical';

// Nombre con el que se guarda la lista exportada si el juego no tiene nombre
export const DEFAULT_PLAYLIST_NAME = 'Lista de Bingo Musical';

// Colores de impresión de los cartones
export const DEFAULT_PRINT_PRIMARY_COLOR = '#6366f1';
export const DEFAULT_PRINT_SECONDARY_COLOR = '#f8faff';

// Cartones que caben en una página impresa (A4)
export const CARTONS_PER_PRINT_PAGE = 3;

// ============================================================
// TIPOS Y ESTADOS
// Los valores no deben cambiar: algunos se guardan (JSON exportado, localStorage)
// o los lee el CSS, y lo ya guardado tiene que seguir funcionando.
// ============================================================

/** Tipo de icono de una canción */
export const ICON_TYPE = Object.freeze({
    EMOJI: 'emoji',
    IMAGE: 'image'
});

/** Tipo de celda de un cartón */
export const CELL_TYPE = Object.freeze({
    SONG: 'song',
    DECORATIVE: 'decorative'
});

/** Qué hacer al generar cartones: crear nuevos o añadir a los existentes */
export const CARTON_MODE = Object.freeze({
    NEW: 'new',
    ADD: 'add'
});

/** Formato de impresión de los cartones */
export const PRINT_FORMAT = Object.freeze({
    HTML: 'html',
    PDF: 'pdf'
});

/** Tema de la interfaz (el CSS lo lee de data-theme) */
export const THEME = Object.freeze({
    DARK: 'dark',
    LIGHT: 'light'
});

/** Nombres de los efectos de sonido (sus parámetros están en SoundEffects.js) */
export const SOUND = Object.freeze({
    CLICK: 'click',
    START: 'start',
    WIN: 'win',
    COMPLETE: 'complete',
    ERROR: 'error'
});
