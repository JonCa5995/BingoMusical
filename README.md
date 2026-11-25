# Bingo Musical

Aplicación web para jugar al bingo con música: cada bola es una canción. Se cargan los archivos de audio, se genera un cartón por jugador (con los iconos de las canciones) y se van reproduciendo canciones al azar mientras los jugadores marcan.

No necesita instalación ni dependencias: es HTML, CSS y JavaScript con módulos ES.

## Cómo ejecutarla

Los módulos ES y la carga de listas con `fetch` **no funcionan abriendo `index.html` con doble clic** (`file://`). Hace falta servir la carpeta con cualquier servidor estático:

```
python -m http.server 8000
```

o, con Node:

```
npx serve
```

y abrir <http://localhost:8000>.

## Cómo se juega

1. **Añadir canciones:** botón «Agregar Canciones» (o arrastrar los archivos `.mp3` a la lista). Cada canción recibe un icono distinto que se puede cambiar o sustituir por una imagen propia. Se necesitan al menos **24 canciones**.
2. **Nombre y configuración:** el nombre del juego aparece en los cartones. La configuración (⚙️) fija cuántos segundos pasan hasta que se revela el título y el icono de cada canción. Solo se puede cambiar antes de empezar. Los ajustes se guardan en el navegador y se recuperan al volver a abrir la aplicación (ver «Ajustes»).
3. **Generar cartones:** «Generar Cartones» permite crear cartones nuevos o añadir más (hasta **1.500** por tanda). Cada cartón tiene 3 filas de 8 casillas con 4 canciones por fila, 12 canciones distintas, y **dos cartones nunca comparten una fila**. Por eso hay un tope: con 24 canciones caben unos 3.000 cartones, con 30 unos 7.000. Si pides más de los que caben, se guardan los que se han encontrado y el aviso dice cuántos de los pedidos se han generado; cuando ya no encuentra ninguno nuevo avisa con «Cartones Agotados» y no cambia nada.
4. **Imprimir:** desde el mismo menú, en HTML o en PDF (con el diálogo de impresión del navegador), todos los cartones o un rango, con colores a elegir. La vista previa muestra **los cartones reales** (con su número) y se recorren con ◀ y ▶.
5. **Jugar:** «Iniciar Juego» reproduce una canción al azar y, una vez empezada la partida, el mismo botón pasa a ser «Siguiente». El historial muestra las que ya han salido.
6. **Cantar:** **LÍNEA** se puede cantar a partir de 4 canciones reproducidas y **BINGO** a partir de 12. Cada uno se puede cantar una sola vez por partida.
7. **Reiniciar:** el botón «Reiniciar juego» deja la partida a cero y mantiene la lista y los cartones.

### Comprobar un cartón

Cuando alguien canta LÍNEA o BINGO, el botón **🔍** (o la tecla **C**) abre «Comprobar cartón». Se escribe el número del cartón y la aplicación lo compara con las canciones que han salido: muestra sus tres filas con ✓/✗ en cada canción, si hay **LÍNEA** (y en qué fila o filas) y si hay **BINGO**. Si aún no lo hay, dice cuántas canciones le faltan a la fila más cercana y al cartón entero. Solo informa: no cambia el estado de la partida. El botón está desactivado mientras no haya cartones.

### Proyección para el público
El botón **📺** (o la tecla **P**) abre una segunda ventana, `projection.html`, pensada para un proyector o una pantalla grande.

- **Antes de empezar:** muestra el logo de la aplicación en gris (el mismo de las casillas decorativas de los cartones) en el sitio del icono.
- **Al pulsar para empezar:** primero el logo se desplaza con una animación (un segundo), pasa a su versión de color y queda pequeño a la izquierda del título «Bingo Musical»; después empieza a sonar la primera canción. Si no hay ninguna proyección abierta, la canción suena al instante: la ventana avisa de que sigue abierta cada segundo y se da por cerrada a los tres.
- **Durante la partida:** el icono de la canción aparece dentro de una caja con efecto de pulso (que se detiene al pausar). Debajo van el título, la **barra de reproducción** con el tiempo (sigue la pausa, los saltos y el cambio de canción de la ventana principal), el contador (`5 de 24 canciones`) y las últimas canciones que han salido. Si la partida tiene nombre, aparece en la cabecera junto al título.
- **Tiempos de revelado:** el título y el icono aparecen en la proyección con el retardo configurado, y el icono solo entra en las últimas canciones cuando ya se ha mostrado, para no adelantar nada. **La ventana principal lo muestra todo al instante** (reproductor, lista e historial): es la pantalla de quien presenta.
- Sigue el tema claro u oscuro y respeta la preferencia de «reducir movimiento» del sistema. **Doble clic** en la ventana para pasar a pantalla completa.

La ventana se alimenta con un `BroadcastChannel`, así que tiene que abrirse desde la propia aplicación (mismo navegador y mismo origen); no recibe ni los archivos de audio ni los cartones. Se puede abrir en cualquier momento, también a mitad de canción, o cerrar y volver a abrir.

### Instalar y usar sin conexión
La aplicación es una PWA: con `manifest.webmanifest` y un service worker (`sw.js`) el navegador puede **instalarla** (icono de instalar en la barra de direcciones) y abrirla sin conexión, porque guarda el esqueleto de la aplicación (HTML, estilos, scripts e iconos). Funciona cuando se sirve por **HTTPS** (o desde `localhost`).

- Los **audios no se guardan** en esa caché: siguen siendo tus archivos (arrastrados, vinculados desde una carpeta o servidos desde `canciones/`).
- En `localhost` el service worker **no se registra** para no confundir el desarrollo con código en caché; para probarlo, abre `http://localhost:8000/?sw=1`.
- Al cambiar cualquier archivo de la aplicación hay que subir `CACHE_VERSION` en `sw.js`; si no, los navegadores que ya la tienen instalada seguirán viendo la versión guardada. Además, si se añade o quita un archivo, hay que reflejarlo en la lista `PRECACHE` (una prueba lo comprueba).

### Accesibilidad
Las ventanas son `<dialog>` nativos (el foco queda dentro, Escape las cierra y el foco vuelve al botón que las abrió), los botones tienen nombre accesible y los contrastes de los botones cumplen WCAG AA en los dos temas. La única excepción conocida es la vista previa de impresión, que reproduce los colores elegidos por el usuario para el documento.

### Modo continuo

El botón **«Automático»** (modo continuo) sirve para **reproducir las canciones sin empezar el juego**: al terminar una canción pasa sola a la siguiente, sin pulsar ningún botón. Es útil para ambientar o para probar la lista. Se desactiva solo al iniciar una partida (el botón pasa a mostrar «Manual» mientras está activo).

### Fragmentos de canción

En la configuración (⚙️), **«Duración del fragmento»** hace que cada canción suene solo unos segundos (de 1 a 120; con 0 suena entera). La casilla **«Empezar en un punto aleatorio»** elige al azar el comienzo, de modo que el fragmento siempre quepa dentro de la canción. Si la canción dura menos que el fragmento, suena entera.

Al acabar el fragmento la canción se da por terminada, igual que si hubiera acabado sola: en el **modo continuo** pasa a la siguiente, y en una partida se queda esperando a «Siguiente». La barra de progreso y el tiempo se miden desde el inicio del fragmento. Los tiempos de revelado de título e icono también cuentan desde ese inicio; si el fragmento no supera el mayor de ellos, la configuración avisa de que se revelarán al terminar.

### Listas

- **Exportar lista** descarga un JSON con las canciones (título e icono), el nombre del juego y los cartones generados.
- **Importar** lee ese JSON (una lista, o una partida: ver más abajo) y busca los audios en la carpeta `canciones/` (convención: `canciones/<título>.mp3`). Los JSON no contienen el audio. Las canciones cuyo audio no se encuentra **se conservan como «Sin archivo»**, con su icono y sus cartones, en lugar de descartarse.
- **Vincular audio** (🔗) abre un selector de carpeta y asigna a cada canción sin archivo el audio cuyo nombre, sin extensión, es igual a su título (sin distinguir mayúsculas, espacios sobrantes ni acentos descompuestos). Solo lee archivos de audio, no toca las canciones que ya tienen archivo y avisa de cuántas ha vinculado y cuáles quedan sin coincidencia. Se puede usar tantas veces como haga falta, también con la partida empezada. Sirve para recuperar el audio tras importar una lista en otro navegador o equipo, sin necesidad de un servidor con la carpeta `canciones/`.

### Ajustes

La aplicación recuerda en el navegador: el tema, el volumen de la música y de los efectos, los tiempos de revelado, el fragmento de canción, el nombre del juego, los colores de impresión y la cantidad de cartones que propone el generador.

Para **llevarlos a otro navegador**, la configuración (⚙️) tiene los botones **Exportar ajustes** e **Importar ajustes**. El archivo es un JSON:

```json
{
  "type": "settings",
  "version": 1,
  "date": "2026-03-04T05:06:07.000Z",
  "settings": {
    "theme": "dark",
    "musicVolume": 1,
    "effectsVolume": 0.7,
    "titleRevealTime": 5,
    "iconRevealTime": 10,
    "clipSeconds": 0,
    "randomClipStart": false,
    "gameName": "Noche de bingo",
    "printPrimaryColor": "#4f46e5",
    "printSecondaryColor": "#f8faff",
    "cartonCount": 10
  }
}
```

| Campo | Valores válidos |
|---|---|
| `theme` | `"dark"` o `"light"` |
| `musicVolume`, `effectsVolume` | número entre 0 y 1 |
| `titleRevealTime`, `iconRevealTime` | entero entre 0 y 30 (segundos) |
| `clipSeconds` | entero entre 0 y 120 (0 = canción completa) |
| `randomClipStart` | `true` o `false` |
| `gameName` | texto de hasta 50 caracteres |
| `printPrimaryColor`, `printSecondaryColor` | color `#rrggbb` |
| `cartonCount` | entero entre 1 y 1500 |

Al importar, cada campo se valida: los inválidos o desconocidos se **descartan** (la aplicación dice cuáles) y el resto se aplica. Un archivo puede llevar solo algunos campos. Si el archivo no es de ajustes, no es un JSON válido o es de una versión más nueva que la que entiende la aplicación, se rechaza sin cambiar nada.

### Reanudar y llevar una partida

**La partida se guarda sola** en el navegador (IndexedDB) unos instantes después de cada cambio: canciones, reproducidas y su orden, canción actual, LÍNEA y BINGO cantados, cartones y ajustes. Al volver a abrir la aplicación, si hay una partida guardada pregunta si quieres **reanudarla**; si dices que no, se descarta.

Los archivos de audio **no se guardan** (pesan demasiado): tras reanudar, las canciones quedan «Sin archivo» y hay que pulsar **Vincular audio** (🔗) y elegir la carpeta donde están. Hasta entonces el botón «Siguiente» está desactivado.

Para **llevar la partida a otro navegador o equipo**, el botón **Exportar partida** (💾) descarga un JSON y **Importar** (⬆️) lo reconoce (acepta tanto listas como partidas). Si ya hay una partida en curso, pide confirmación antes de reemplazarla.

```json
{
  "type": "game",
  "version": 1,
  "date": "2026-04-05T06:07:08.000Z",
  "settings": { "theme": "dark", "musicVolume": 1, "gameName": "Noche de bingo" },
  "songs": [
    { "id": 1, "title": "Canción 1", "icon": "🎵", "iconType": "emoji", "played": true, "playedOrder": 1 }
  ],
  "game": { "started": true, "currentSongId": 1, "lineaCompleted": false, "bingoCompleted": false },
  "cartones": [
    { "id": 1, "songs": [1], "generatedAt": "2026-04-05T06:00:00.000Z",
      "rows": [ { "cells": [ { "position": 0, "songId": 1 }, { "position": 1, "songId": null } ] } ] }
  ]
}
```

`settings` usa los mismos campos que el archivo de ajustes. Como el archivo viene de fuera, **se valida por completo** antes de tocar nada, y si algo no cuadra se rechaza con un mensaje que dice qué falla:

| Campo | Regla |
|---|---|
| `type`, `version` | `"game"` y un entero entre 1 y la versión que entiende la aplicación |
| `songs` | hasta 2.000; `id` entero único y no negativo; `title` de 1 a 300 caracteres |
| `icon` | emoji de hasta 32 caracteres, o con `iconType: "image"` una imagen `data:image/png`, `jpeg`, `gif` o `webp` en base64 de hasta 2 MB (no se aceptan URL ni SVG) |
| `played`, `playedOrder` | booleano; las reproducidas necesitan un orden entero ≥ 1 y sin repetirse |
| `game` | tres booleanos y, si hay canción actual, que exista en la lista |
| `cartones` | hasta 20.000, con la estructura de 3 filas de hasta 8 casillas; las canciones que ya no existan quedan como casillas decorativas |

Los campos desconocidos se descartan y los ajustes inválidos se ignoran.

### Atajos de teclado

| Tecla | Acción |
|---|---|
| `Espacio` | Reproducir / pausar |
| `R` | Reiniciar la canción actual |
| `N` | Siguiente canción |
| `F` | Pantalla completa |
| `L` | Cantar LÍNEA |
| `B` | Cantar BINGO |
| `C` | Comprobar un cartón |
| `P` | Abrir la ventana de proyección |
| `Esc` | Cerrar la ventana abierta |
| `?` | Mostrar la ayuda de atajos |

## Estructura del código

```
index.html            Página única
projection.html       Ventana de proyección para el público (css/projection.css, js/projection.js)
manifest.webmanifest, sw.js   Aplicación instalable y sin conexión (PWA)
css/                  Estilos por zonas (base, layout, components, modules, themes, utilities)
js/app.js             Coordinador: crea los módulos y conecta sus eventos
js/constants.js       Reglas del juego, tiempos, rutas y enumeraciones
js/messages.js        Todos los textos y avisos de la interfaz
js/utils.js           Funciones pequeñas compartidas
js/bingoCartonGenerator.js   Genera cartones únicos
js/modules/
  GameManager         Estado del juego (partida, historial, cartones, LÍNEA y BINGO)
  SongManager         Lista de canciones: alta, filtrado, orden
  AudioManager        Reproducción de la canción actual
  SoundEffects        Sonidos sintetizados de la interfaz
  Projection*         Envío del estado de la partida (canal) y dibujo de la ventana de proyección
  Carton*             Gestión, modales, exportación, renderizado y serialización de cartones
  UIManager, SongListView, DOMElements, ModalManager, Dialogs, ...   Interfaz
tests/                Pruebas automáticas
```

Cada módulo recibe por el constructor lo que necesita (elementos del DOM, almacenamiento, funciones de descarga), lo que permite probarlos sin navegador.

## Pruebas

Requieren Node 22 o superior y no tienen dependencias:

```
npm test
```

(equivale a `node --test`). Cubren la lógica de juego, la generación y serialización de cartones, la gestión de canciones, el audio, las listas y el arranque completo de la aplicación con un DOM simulado. Hay además comprobaciones de coherencia: que todos los elementos que busca el código existan en `index.html`, que todas las hojas de estilo y módulos importados existan y que no queden hojas sin importar.

Las pruebas con DOM simulado no ven problemas de maquetación: los cambios visuales se comprueban a mano en Edge y en Firefox.
