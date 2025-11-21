# Funcionalidad de Configuración de Revelación

## Resumen
Se ha implementado una funcionalidad que permite configurar cuánto tiempo debe pasar desde que se inicia la reproducción de una canción hasta que aparecen progresivamente el título y el icono.

## Características Implementadas

### 1. Modal de Configuración
- **Ubicación**: Botón "⚙️ Configuración" en los controles del reproductor
- **Disponibilidad**: Solo antes de iniciar el juego
- **Contenido**:
  - Slider para tiempo de revelación del título (0-30 segundos)
  - Slider para tiempo de revelación del icono (0-30 segundos)
  - Valores predeterminados: 5s para título, 10s para icono

### 2. Revelación Progresiva del Título
- El título inicia oculto (opacity: 0)
- Aparece gradualmente después del tiempo configurado
- Transición suave de 1 segundo (fade-in)
- Se aplica en el reproductor principal

### 3. Revelación Progresiva del Icono
- El icono inicia oculto (opacity: 0)
- Aparece gradualmente después del tiempo configurado
- Transición suave de 1 segundo (fade-in)
- Se aplica simultáneamente en:
  - Reproductor principal
  - Historial de canciones reproducidas
  - **Lista de canciones (canción en reproducción)**

## Archivos Modificados

### HTML
- `index.html`: 
  - Añadido botón de configuración
  - Añadido modal de configuración con sliders

### JavaScript
- `js/modules/DOMElements.js`: Referencias a elementos del modal de configuración
- `js/modules/GameManager.js`: 
  - Propiedades `titleRevealTime` y `iconRevealTime`
  - Métodos getter/setter para tiempos de revelación
- `js/modules/UIManager.js`: 
  - Actualizado `updatePlayerUI()` para soportar revelación progresiva
  - Actualizado `addToHistory()` para soportar revelación progresiva
  - Actualizado `updateUIState()` para deshabilitar configuración durante el juego
- `js/app.js`: 
  - Event listeners para el modal de configuración
  - Funciones `openConfigModal()`, `closeConfigModal()`, `saveConfig()`
  - Integración con `updatePlayerUI()` y `addToHistory()`
  - Revelación progresiva en la lista de canciones (`createSongItemElement()`, `playSong()`)
  - Limpieza de estados en `stopSong()`, `onSongEnded()` y `reiniciarJuego()`

### CSS
- `css/components/modals.css`: Estilos para el modal de configuración y sliders personalizados

## Flujo de Uso

1. El usuario carga canciones en la aplicación
2. **Antes de iniciar el juego**, hace clic en "⚙️ Configuración"
3. Ajusta los sliders según su preferencia:
   - Tiempo para revelar título
   - Tiempo para revelar icono
4. Guarda la configuración
5. Inicia el juego
6. Al reproducirse cada canción:
   - El título aparece después del tiempo configurado
   - El icono aparece después del tiempo configurado en:
     * Reproductor principal
     * Historial de canciones reproducidas
     * Lista de canciones (en la canción que está sonando)

## Restricciones
- La configuración **solo puede modificarse antes de iniciar el juego**
- Una vez iniciado el juego, el botón de configuración se deshabilita
- Al reiniciar el juego, la configuración se mantiene (no se resetea)

## Valores Configurables
- **Tiempo de revelación del título**: 0-30 segundos (paso de 1 segundo)
- **Tiempo de revelación del icono**: 0-30 segundos (paso de 1 segundo)
- **Valores predeterminados**: 
  - Título: 5 segundos
  - Icono: 10 segundos

## Beneficios
- Aumenta la dificultad y emoción del juego
- Los jugadores deben reconocer las canciones por el audio antes de ver el título o icono
- Configurable según las preferencias de dificultad del host
