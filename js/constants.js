/**
 * Constants Module
 * Centraliza todas las constantes de la aplicación
 */

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
export const MAX_ROW_GENERATION_ATTEMPTS = 100;

// Tiempos por defecto (en segundos)
export const DEFAULT_TITLE_REVEAL_TIME = 5;
export const DEFAULT_ICON_REVEAL_TIME = 10;

// Rutas
export const DEFAULT_SONGS_FOLDER = 'canciones/';
export const LOGO_PATH = 'icon.png';

// Nombres por defecto
export const DEFAULT_GAME_NAME = 'Bingo Musical';

