import {ALERT_KIND} from './constants.js';

const T = {
    insufficientSongs: 'Canciones Insuficientes',
    emptyList: 'Lista Vacía',
    noCartones: 'Sin Cartones',
    gameStarted: 'Juego Iniciado',
    songPlayed: 'Canción Ya Reproducida',
    error: 'Error'
};

const msg = (title, message) => ({title, message});
const errorMsg = (title, message) => ({title, message, kind: ALERT_KIND.ERROR});

export const DEFAULT_TITLES = {
    alert: 'Información',
    confirm: 'Confirmar'
};

// ============================================================
// ALERTAS Y CONFIRMACIONES
// ============================================================
const labelsOf = (keys) => keys.map(key => TEXT.settings.labels[key] ?? key).join(', ');

export const MSG = {
    settings: {
        exported: msg('Ajustes Exportados', 'Se ha descargado el archivo con los ajustes. Para llevarlos a otro navegador, impórtalo desde la configuración.'),
        importFailed: (error) => errorMsg('Error de Importación', `Error al importar los ajustes: ${error}`),
        imported: (applied, discarded) => applied.length === 0
            ? msg('Sin Ajustes Válidos', 'El archivo no contenía ningún ajuste válido, así que no se ha cambiado nada.')
            : msg('Ajustes Importados', `Se han aplicado ${applied.length} ajuste(s): ${labelsOf(applied)}.` +
                (discarded.length > 0 ? `\n\nSe han descartado por no ser válidos: ${labelsOf(discarded)}.` : ''))
    },
    gameStarted: {
        changeConfig: msg(T.gameStarted, 'No puedes cambiar la configuración una vez que el juego ha iniciado.'),
        importList: msg(T.gameStarted, 'No puedes importar una lista una vez que el juego ha iniciado. Debes reiniciar el juego primero.'),
        changeIcons: msg(T.gameStarted, 'No puedes cambiar iconos una vez que el juego ha iniciado.'),
        addSongs: msg(T.gameStarted, 'No puedes agregar canciones una vez que el juego ha iniciado. Debes reiniciar el juego primero.'),
        deleteSong: msg(T.gameStarted, 'No puedes eliminar canciones una vez que el juego ha iniciado. Debes limpiar el historial primero.'),
        deleteAllSongs: msg(T.gameStarted, 'No puedes eliminar canciones una vez iniciado el juego.')
    },

    game: {
        nameTooLong: (max) => msg('Nombre muy largo', `El nombre del juego no puede tener más de ${max} caracteres.`),
        lineaAlreadyCalled: msg('Línea Ya Cantada', 'La línea ya fue cantada. Solo puedes cantar línea una vez por juego.'),
        lineaNeedsSongs: (min) => errorMsg(T.insufficientSongs, `Debes reproducir al menos ${min} canciones antes de cantar LÍNEA.`),
        bingoAlreadyCalled: msg('Bingo Ya Completado', 'El bingo ya fue completado. Reinicia el juego para comenzar de nuevo.'),
        bingoNeedsSongs: (min) => errorMsg(T.insufficientSongs, `Debes reproducir al menos ${min} canciones antes de cantar BINGO.`),
        confirmRestart: msg('Confirmar Reinicio', '¿Estás seguro de que quieres reiniciar el juego? Esto limpiará el historial y el progreso actual.')
    },

    config: {
        saved: (titleSeconds, iconSeconds, clip) => msg(
            'Configuración Guardada',
            `Configuración guardada:\n\n` +
            `• Tiempo para revelar título: ${titleSeconds} segundos\n` +
            `• Tiempo para revelar icono: ${iconSeconds} segundos` +
            (clip?.seconds > 0 ? `\n• Fragmento de ${clip.seconds} segundos${clip.randomStart ? ' (inicio aleatorio)' : ''}` : '')
        )
    },

    songs: {
        iconLocked: msg(T.songPlayed, 'No puedes cambiar el icono de una canción que ya fue reproducida.'),
        noAudioFile: msg('Sin Archivo', 'Esta canción no tiene archivo de audio.'),
        noMoreSongs: msg('Sin Canciones', 'No hay más canciones disponibles. Limpia el historial para volver a empezar'),
        notEnoughToPlay: (min) => errorMsg(T.insufficientSongs, `Necesitas al menos ${min} canciones cargadas para poder jugar.`),
        duplicatesNotAdded: (titles) => msg('Canciones Duplicadas', `Las siguientes canciones ya existen y no se han añadido:\n\n- ${titles.join('\n- ')}`),
        nothingToDelete: msg(T.emptyList, 'No hay canciones para eliminar.'),
        confirmDeleteAll: (count) => msg('Confirmar Eliminación Total', `¿Estás seguro de eliminar TODAS las ${count} canciones de la lista?`),
        allDeleted: msg(T.emptyList, 'Todas las canciones han sido eliminadas.')
    },

    icons: {
        songNotFound: errorMsg(T.error, 'Canción no encontrada')
    },

    savedGame: {
        found: ({songs, played, cartones}) => msg('Partida Guardada',
            `Hay una partida guardada en este navegador: ${songs} canciones (${played} reproducidas) y ${cartones} cartones.\n\n¿Quieres reanudarla? Si no, se descartará.`),
        replaceCurrent: msg('Reemplazar Partida', 'Tienes una partida en curso. Al importar se reemplazarán las canciones, el progreso y los cartones actuales. ¿Continuar?'),
        restored: ({songs, played, cartones}) => msg('Partida Restaurada',
            `Partida restaurada: ${songs} canciones (${played} reproducidas) y ${cartones} cartones.\n\nLos archivos de audio no se guardan en la partida: usa el botón «Vincular audio» (🔗) y elige la carpeta donde están para poder seguir jugando.`),
        exported: msg('Partida Exportada', 'Se ha descargado la partida con las canciones, el progreso, los cartones y los ajustes. No incluye los archivos de audio. Impórtala desde «Importar» en cualquier navegador.'),
        nothingToExport: msg(T.emptyList, 'No hay nada que exportar: agrega canciones primero.'),
        importFailed: (error) => errorMsg('Error de Importación', `Error al importar la partida: ${error}`)
    },

    audio: {
        noSongsToLink: msg(T.emptyList, 'No hay canciones a las que vincular audio. Importa una lista o agrega canciones primero.'),
        allLinked: msg('Audio Completo', 'Todas las canciones de la lista ya tienen su archivo de audio.'),
        noMatches: (pending, audioFiles) => errorMsg('Sin Coincidencias',
            `Ningún archivo de la carpeta coincide con las ${pending} canciones sin audio (se han leído ${audioFiles} archivos de audio).\n\nEl nombre de cada archivo, sin la extensión, debe ser igual al título de la canción.`),
        linked: ({linked, missing, pendingCount}) => msg('Audio Vinculado',
            `Se han vinculado ${linked.length} de ${pendingCount} canciones sin audio.` +
            (missing.length > 0 ? `\n\nSin coincidencia (${missing.length}):\n- ${missing.slice(0, 10).map(song => song.title).join('\n- ')}${missing.length > 10 ? '\n- ...' : ''}` : ''))
    },

    playlist: {
        exportOk: (message) => msg('Exportación Exitosa', message),
        exportFailed: (error) => errorMsg('Error al Exportar', error),
        importFailed: (error) => errorMsg('Error de Importación', `Error al importar la lista: ${error}`),
        importDuplicates: (titles) => msg('Canciones Duplicadas Omitidas', `Se omitieron las siguientes canciones duplicadas:\n\n- ${titles.join('\n- ')}`),
        importNoSongs: errorMsg('Error al Importar', 'La lista no contiene ninguna canción.'),
        importOk: (count, folder, missing = 0) => msg('Importación Exitosa', missing > 0
            ? `Lista importada con ${count} canciones, ${missing} de ellas sin archivo de audio: no estaban en ${folder}\n\nUsa el botón «Vincular audio» (🔗) y elige la carpeta donde están los audios; el nombre de cada archivo debe coincidir con el título de la canción.`
            : `Lista importada con ${count} canciones.\n\nLos archivos de audio deben estar en: ${folder}`)
    },

    cartones: {
        existing: (count, action) => msg('Cartones Existentes', `Tienes ${count} cartón(es) generado(s). Al ${action}, se borrarán TODOS los cartones.\n\n¿Deseas continuar?`),
        noneToPrint: msg(T.noCartones, 'No hay cartones guardados para imprimir.'),
        noneToDelete: msg(T.noCartones, 'No hay cartones para eliminar.'),
        confirmDelete: (count) => msg('Confirmar Eliminación', `¿Estás seguro de eliminar los ${count} cartón(es) guardado(s)?`),
        deleted: msg('Cartones Eliminados', 'Todos los cartones han sido eliminados.'),
        generated: (count) => msg('Cartones Generados', `${count} cartón(es) generado(s) y guardado(s) exitosamente.\n\nUsa "Imprimir Existentes" para descargarlos.`),
        added: (count, total) => msg('Cartones Añadidos', `${count} cartón(es) añadido(s) exitosamente.\n\nTotal de cartones: ${total}`),
        printed: (count, format) => msg('Cartones Impresos', `${count} cartón(es) descargado(s) en ${format.toUpperCase()} exitosamente.`),
        printFailed: (error) => errorMsg(T.error, `Error al imprimir cartones: ${error}`),
        invalidCount: (max) => errorMsg('Número Inválido', `Por favor ingresa un número válido entre 1 y ${max}.`),
        notEnoughSongs: (min) => errorMsg(T.insufficientSongs, `Necesitas al menos ${min} canciones cargadas para poder generar cartones.`),
        generateFailed: (error) => errorMsg(T.error, `Error al generar cartones: ${error}`)
    }
};

// ============================================================
// TEXTOS DE LA INTERFAZ
// ============================================================
export const TEXT = {
    savedGame: {
        downloadLabel: 'Descargar la partida en formato JSON',
        notGame: 'El archivo no es una partida de Bingo Musical.',
        newerVersion: (version) => `El archivo de partida es de una versión más nueva (${version}) que la que entiende esta aplicación.`,
        invalid: (detail) => `El archivo de partida no es válido: ${detail}.`,
        songLabel: (number) => `La canción ${number}`,
        cartonLabel: (number) => `El cartón ${number}`
    },

    settings: {
        labels: {
            theme: 'Tema',
            musicVolume: 'Volumen de la música',
            effectsVolume: 'Volumen de los efectos',
            titleRevealTime: 'Tiempo para revelar el título',
            iconRevealTime: 'Tiempo para revelar el icono',
            gameName: 'Nombre del juego',
            printPrimaryColor: 'Color principal de impresión',
            printSecondaryColor: 'Color secundario de impresión',
            cartonCount: 'Cantidad de cartones',
            clipSeconds: 'Duración del fragmento',
            randomClipStart: 'Inicio aleatorio del fragmento'
        },
        downloadLabel: 'Descargar los ajustes del juego en formato JSON',
        invalidJson: 'El archivo no es un JSON válido.',
        notSettings: 'El archivo no contiene ajustes de Bingo Musical.',
        newerVersion: (version) => `El archivo es de una versión más nueva (${version}) que la que entiende esta aplicación.`
    },

    cartonActions: {
        addSongs: 'añadir canciones',
        changeIcon: 'cambiar el icono',
        deleteSong: 'eliminar esta canción'
    },

    seconds: (count) => `${count} segundos`,
    clipSeconds: (count) => count === 0 ? 'Canción completa' : `${count} segundos`,
    clipWarning: (clip, reveal) => `El fragmento (${clip} s) no supera el mayor tiempo de revelado (${reveal} s): el título o el icono se revelarán al terminar.`,

    gameName: {
        locked: 'Nombre del juego bloqueado (juego iniciado o cartones generados)',
        editHint: (max) => `Edita el nombre del juego (máx. ${max} caracteres)`
    },

    player: {
        currentSongAlt: 'Canción actual',
        pauseLabel: 'Pausar canción actual',
        playLabel: 'Reproducir canción seleccionada',
        next: {icon: '🔀', text: 'Siguiente', label: 'Siguiente canción'},
        start: {icon: '▶️', text: 'Iniciar Juego', label: 'Iniciar Juego'},
        continuousOn: {icon: '⏸', text: 'Manual'},
        continuousOff: {icon: '🔄', text: 'Automático'},
        playedHistoryLabel: (title) => `Canción reproducida: ${title}`
    },

    list: {
        empty: {
            title: 'No hay canciones cargadas',
            text: 'Arrastra archivos de audio o usa el botón "Agregar Canciones"',
            minSongsWarning: (min) => `⚠️ Necesitas al menos ${min} canciones para jugar`
        },
        noResults: {
            title: 'No se encontraron canciones',
            text: 'Intenta con otro término de búsqueda o cambia los filtros'
        },
        notEnoughWarning: {
            count: (total, min) => `⚠️ Tienes ${total}/${min} canciones.`,
            rest: (min) => ` Necesitas al menos ${min} para jugar.`
        },
        songState: {
            played: '✓ Ya reproducida',
            pending: '○ Pendiente',
            noFile: '⚠ Sin archivo'
        },
        iconTitle: {
            lockedPlayed: 'Icono bloqueado (canción ya reproducida)',
            lockedStarted: 'Icono bloqueado (juego iniciado)',
            change: 'Click para cambiar icono'
        },
        changeIconLabel: (title) => `Cambiar icono de ${title}`,
        deleteTitle: 'Eliminar canción',
        deleteLabel: (title) => `Eliminar ${title}`
    },

    icons: {
        selectLabel: (icon) => `Seleccionar icono ${icon}`,
        inUse: 'Este icono ya está en uso',
        noResults: (query) => `No se encontraron iconos para "${query}"`
    },

    theme: {
        toLight: 'Cambiar a tema claro',
        toDark: 'Cambiar a tema oscuro'
    },
    fullscreen: {
        exit: 'Salir de pantalla completa',
        enter: 'Activar pantalla completa'
    },

    cartones: {
        optionsInfo: (count) => `Tienes ${count} cartón(es) guardado(s). ¿Qué deseas hacer?`,
        noneInfo: 'No tienes cartones guardados. Selecciona "Crear Nuevos" para generar.',
        printInfo: (count) => `Tienes ${count} cartón(es) guardado(s) listo(s) para imprimir.`,
        previewError: '❌ Error al generar vista previa',
        noneToPrint: 'No hay cartones para imprimir',
        invalidRange: (max) => `Rango inválido. Debe ser entre 1 y ${max}, y "Desde" debe ser menor o igual que "Hasta".`,
        unsupportedFormat: (format) => `Formato de impresión no soportado: ${format}`,
        generatorNeedsSongs: (min) => `Se necesitan al menos ${min} canciones para generar cartones`,
        notUnique: 'No se pudieron generar cartones únicos suficientes. Intenta con menos cartones.',
        popupBlocked: 'No se pudo abrir la ventana de impresión. Por favor, permite ventanas emergentes.',
        downloadLabel: (count) => `Descargar ${count} cartones de bingo`
    },

    playlist: {
        noSongsToExport: 'No hay canciones para exportar',
        downloadLabel: 'Descargar lista de canciones en formato JSON',
        cartonesIncluded: (count) => `\n${count} cartón(es) incluido(s) en el archivo.`,
        exported: (name, cartonesInfo, songsFolder) =>
            `Lista "${name}" exportada correctamente.${cartonesInfo}\n\n` +
            `Coloca el archivo JSON en la carpeta raíz del proyecto.\n` +
            `Coloca los archivos de audio en: ${songsFolder}`,
        noFileSelected: 'No se seleccionó ningún archivo',
        invalidFormat: 'Formato de archivo inválido'
    },

    shortcuts: {
        helpTitle: '⌨️ Atajos de Teclado',
        helpHeader: 'ATAJOS DE TECLADO DISPONIBLES:'
    },

    document: {
        metaDescription: (gameName, count) => `Cartones de ${gameName} generados - ${count} cartones únicos`,
        title: (gameName) => `Cartones de ${gameName}`,
        infoTitle: 'ℹ️ Información de Impresión',
        generated: (count) => `${count} cartones generados`,
        recommendation: (pages) => ` • Configuración recomendada: A4, márgenes 0 mm • ${pages} página(s)`,
        cartonTitle: (gameName) => `🎵 ${gameName}`,
        cartonNumberLabel: (id) => `Cartón número ${id}`,
        gridLabel: (rows, columns) => `Cuadrícula de bingo con ${rows} filas y ${columns} columnas`,
        decorativeAlt: 'Icono de decoración'
    }
};

// ============================================================
// ATAJOS DE TECLADO (fila de la ayuda: icono, tecla y descripción)
// ============================================================
export const SHORTCUTS = {
    playPause: {icon: '▶', label: 'ESPACIO', description: 'Reproducir/Pausar'},
    restart: {icon: '🔄', label: 'R', description: 'Reiniciar canción actual'},
    next: {icon: '⏭', label: 'N', description: 'Siguiente canción (en modo continuo)'},
    fullscreen: {icon: '⛶', label: 'F', description: 'Pantalla completa'},
    linea: {icon: '📏', label: 'L', description: 'Cantar LÍNEA'},
    bingo: {icon: '🎉', label: 'B', description: 'Cantar BINGO'},
    escape: {icon: '❌', label: 'ESC', description: 'Cerrar modal'},
    help: {icon: '❓', label: '?', description: 'Mostrar esta ayuda'}
};
