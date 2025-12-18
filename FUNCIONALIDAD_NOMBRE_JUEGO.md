# 🎯 Funcionalidad: Nombre del Juego/Lista

## 📝 Descripción

Se ha implementado la funcionalidad para asignar un **nombre personalizado** al juego o lista de canciones. Este nombre se refleja en múltiples lugares de la aplicación y persiste en las exportaciones e importaciones.

---

## ✨ Características Implementadas

### 1. **Input del Nombre en la Interfaz**
- **Ubicación**: Barra de herramientas superior, junto al logo
- **Características**:
  - Input de texto con placeholder "✏️ Nombre del juego..."
  - Máximo 50 caracteres
  - Se actualiza en tiempo real
  - Validación automática al perder el foco

### 2. **Visualización del Nombre**
El nombre del juego aparece en:
- ✅ **Cartones de bingo** (tanto en vista previa como en generados)
- ✅ **Archivo JSON exportado** (campo `name`)
- ✅ **Nombre de archivo al exportar** (JSON y HTML de cartones)

### 3. **Restricciones de Edición**
El input del nombre se **deshabilita automáticamente** cuando:
- ❌ El juego ha iniciado
- ❌ Se han generado cartones

**Razón**: Garantizar consistencia entre los cartones generados y el estado del juego.

### 4. **Persistencia**
- ✅ Se guarda en el archivo JSON al exportar
- ✅ Se carga automáticamente al importar
- ✅ Se mantiene entre reinicios del juego (NO se resetea)
- ❌ Se resetea solo al eliminar todas las canciones

---

## 🎨 Implementación Técnica

### Archivos Modificados

#### 1. **index.html**
```html
<div class="game-name-wrapper">
  <label for="game-name-input" class="sr-only">Nombre del juego</label>
  <input 
    id="game-name-input" 
    class="game-name-input" 
    type="text" 
    placeholder="✏️ Nombre del juego..."
    maxlength="50"
    aria-label="Nombre del juego"
  >
</div>
```

#### 2. **css/layout/toolbar.css**
Nuevos estilos:
- `.game-name-wrapper`
- `.game-name-input` (con estados: normal, focus, disabled, placeholder)

#### 3. **js/modules/DOMElements.js**
```javascript
this.gameNameInput = document.getElementById('game-name-input');
```

#### 4. **js/modules/GameManager.js**
Nuevas propiedades y métodos:
```javascript
gameName = '';
cartonesGenerated = false;

setGameName(name)
getGameName()
setCartonesGenerated(generated)
hasCartonesGenerated()
```

#### 5. **js/modules/StorageManager.js**
```javascript
exportPlaylist(songs, songsFolder, gameName = '')
// Ahora incluye el nombre en el JSON y en el nombre del archivo
```

#### 6. **js/modules/CartonManager.js**
```javascript
updateCartonPreview(songs, gameName = '')
generateCartones(songs, maxCartones, minRequired, showAlertCallback, gameName = '', format = 'html')
// Ahora reciben y usan el nombre del juego
```

#### 7. **js/bingoCartonGenerator.js**
```javascript
_generateHTMLHeader(count, config = {})
_generateCartonHTML(carton, config = {})
downloadAsHTML(cartones, config = {})
// Ahora usan config.gameName para mostrar el nombre en los cartones
```

#### 8. **js/app.js**
Nuevos métodos:
```javascript
_setupGameNameEventListeners()
// Event listeners para input y blur del nombre

updateUIState()
// Deshabilita el input cuando corresponde

exportPlaylist()
importPlaylist()
openCartonModal()
updateCartonPreview()
generateCartones()
deleteAllSongs()
// Actualizados para manejar el nombre del juego
```

---

## 📦 Formato JSON Actualizado

### Antes
```json
{
  "version": "1.0",
  "date": "2025-12-19T10:30:00.000Z",
  "songs": [...]
}
```

### Después
```json
{
  "version": "1.0",
  "name": "Mi Bingo Navideño",
  "date": "2025-12-19T10:30:00.000Z",
  "songs": [...]
}
```

### Nombre de Archivo
**Antes**: `bingo-musical-2025-12-19.json`

**Después**: 
- Con nombre: `mi-bingo-navideno-2025-12-19.json`
- Sin nombre: `bingo-musical-2025-12-19.json` (comportamiento por defecto)

---

## 🎴 Cartones Generados

### Encabezado del Cartón

**Antes**:
```
🎵 Bingo Musical
```

**Después**:
```
🎵 [Nombre del juego personalizado]
```

Si no hay nombre, muestra: `🎵 Bingo Musical` (valor por defecto)

### Nombre de Archivo HTML

**Antes**: `cartones-bingo-musical.html`

**Después**:
- Con nombre: `cartones-mi-bingo-navideno.html`
- Sin nombre: `cartones-bingo-musical.html`

---

## 🔄 Flujo de Uso

### Escenario 1: Crear Juego Nuevo
1. Usuario carga canciones
2. Escribe nombre del juego: "Bingo Navideño 2025"
3. Genera 50 cartones
4. ❌ Ya NO puede editar el nombre (cartones generados)
5. Exporta la lista → `bingo-navideno-2025-2025-12-19.json`
6. Cartones se llaman: `cartones-bingo-navideno-2025.html`

### Escenario 2: Importar Juego Existente
1. Usuario importa archivo JSON con nombre "Mis Favoritas"
2. El nombre se carga automáticamente en el input
3. Las canciones se cargan
4. Usuario puede editar el nombre (si no genera cartones ni inicia juego)
5. Al exportar, se guarda con el nombre actualizado

### Escenario 3: Durante el Juego
1. Usuario escribe nombre: "Fiesta de Cumpleaños"
2. Inicia el juego
3. ❌ Ya NO puede editar el nombre (juego iniciado)
4. Al reiniciar el juego:
   - ✅ El nombre se MANTIENE
   - ✅ Puede volver a editar el nombre (si no hay cartones generados)

### Escenario 4: Eliminar Todas las Canciones
1. Usuario tiene nombre: "Mi Lista"
2. Elimina todas las canciones
3. El nombre se resetea automáticamente a vacío
4. El flag de cartones generados se resetea

---

## ⚙️ Validaciones

### Validación de Longitud
```javascript
// En blur del input
if (name.length > 50) {
    showAlert('El nombre del juego no puede tener más de 50 caracteres.');
    input.value = name.substring(0, 50);
}
```

### Validación de Estado
```javascript
// En updateUIState()
const shouldDisable = game.isGameStarted() || game.hasCartonesGenerated();
gameNameInput.disabled = shouldDisable;
```

---

## 🎯 Casos de Borde Manejados

### ✅ Nombre Vacío
- Si el nombre está vacío, se usa "Bingo Musical" como valor por defecto
- No se muestra error, es un valor válido

### ✅ Caracteres Especiales
- Se sanitizan automáticamente para nombres de archivo
- Ejemplo: "Mi Bingo #1" → `mi-bingo-1.html`
- Función: `.toLowerCase().replace(/[^a-z0-9]+/g, '-')`

### ✅ Nombre Muy Largo
- Se trunca a 50 caracteres con validación
- Se notifica al usuario

### ✅ Reinicio de Juego
- El nombre NO se resetea (persiste)
- Solo se resetea al eliminar todas las canciones

### ✅ Cartones Generados
- Una vez generados, el nombre queda bloqueado
- Garantiza consistencia con los cartones físicos

---

## 🚀 Beneficios

1. **Organización**: Múltiples listas con nombres descriptivos
2. **Identificación**: Fácil reconocimiento de cartones y listas
3. **Profesionalismo**: Cartones personalizados con nombre del evento
4. **Compartir**: Archivos JSON con nombres significativos
5. **Consistencia**: El nombre se mantiene entre importaciones/exportaciones

---

## 📚 Métodos de API

### GameManager
```javascript
setGameName(name: string): void
getGameName(): string
setCartonesGenerated(generated: boolean): void
hasCartonesGenerated(): boolean
```

### StorageManager
```javascript
exportPlaylist(songs: Array, songsFolder: string, gameName: string = ''): Object
```

### CartonManager
```javascript
updateCartonPreview(songs: Array, gameName: string = ''): void
generateCartones(songs: Array, maxCartones: number, minRequired: number, 
                 showAlertCallback: Function, gameName: string = '', 
                 format: string = 'html'): Promise<boolean>
```

### BingoCartonGenerator
```javascript
_generateHTMLHeader(count: number, config: Object): string
_generateCartonHTML(carton: Object, config: Object): string
downloadAsHTML(cartones: Array, config: Object): void
```

---

## 🔧 Mantenimiento

### Para Agregar Más Lugares donde Mostrar el Nombre
1. Obtener el nombre: `this.game.getGameName() || 'Bingo Musical'`
2. Usar el nombre con valor por defecto
3. Actualizar cuando cambie el input (si es dinámico)

### Para Cambiar el Comportamiento de Bloqueo
Modificar en `app.js` → `updateUIState()`:
```javascript
const shouldDisableGameName = this.game.isGameStarted() || this.game.hasCartonesGenerated();
```

### Para Cambiar la Validación de Caracteres
Modificar el regex en `StorageManager.exportPlaylist()` y `bingoCartonGenerator.downloadAsHTML()`:
```javascript
.replace(/[^a-z0-9]+/g, '-')
```

---

## ✅ Testing Manual Recomendado

- [ ] Escribir nombre y verificar que aparece en cartones
- [ ] Exportar JSON y verificar campo `name`
- [ ] Importar JSON y verificar que carga el nombre
- [ ] Iniciar juego y verificar que se bloquea el input
- [ ] Generar cartones y verificar que se bloquea el input
- [ ] Reiniciar juego y verificar que el nombre persiste
- [ ] Eliminar todas las canciones y verificar que se resetea
- [ ] Probar con nombre vacío (debe usar valor por defecto)
- [ ] Probar con nombre de 50+ caracteres (debe truncar)
- [ ] Probar con caracteres especiales en el nombre

---

**Última actualización**: 2025-12-19
**Versión**: 1.0
**Estado**: ✅ Implementado y Funcional

