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
2. **Nombre y configuración:** el nombre del juego aparece en los cartones. La configuración (⚙️) fija cuántos segundos pasan hasta que se revela el título y el icono de cada canción. Solo se puede cambiar antes de empezar.
3. **Generar cartones:** «Generar Cartones» permite crear cartones nuevos o añadir más (hasta **1.500** por tanda). Cada cartón tiene 3 filas de 8 casillas con 4 canciones por fila, 12 canciones distintas, y **dos cartones nunca comparten una fila**.
4. **Imprimir:** desde el mismo menú, en HTML o en PDF (con el diálogo de impresión del navegador), todos los cartones o un rango, con colores a elegir y vista previa.
5. **Jugar:** «Iniciar Juego» reproduce una canción al azar y, una vez empezada la partida, el mismo botón pasa a ser «Siguiente». El historial muestra las que ya han salido.
6. **Cantar:** **LÍNEA** se puede cantar a partir de 4 canciones reproducidas y **BINGO** a partir de 12. Cada uno se puede cantar una sola vez por partida.
7. **Reiniciar:** el botón «Reiniciar juego» deja la partida a cero y mantiene la lista y los cartones.

### Modo continuo

El botón **«Automático»** (modo continuo) sirve para **reproducir las canciones sin empezar el juego**: al terminar una canción pasa sola a la siguiente, sin pulsar ningún botón. Es útil para ambientar o para probar la lista. Se desactiva solo al iniciar una partida (el botón pasa a mostrar «Manual» mientras está activo).

### Listas

- **Exportar lista** descarga un JSON con las canciones (título e icono), el nombre del juego y los cartones generados.
- **Importar lista** lee ese JSON y busca los audios en la carpeta `canciones/` (convención: `canciones/<título>.mp3`). Los JSON no contienen el audio.

### Atajos de teclado

| Tecla | Acción |
|---|---|
| `Espacio` | Reproducir / pausar |
| `R` | Reiniciar la canción actual |
| `N` | Siguiente canción |
| `F` | Pantalla completa |
| `L` | Cantar LÍNEA |
| `B` | Cantar BINGO |
| `Esc` | Cerrar la ventana abierta |
| `?` | Mostrar la ayuda de atajos |

## Estructura del código

```
index.html            Página única
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
