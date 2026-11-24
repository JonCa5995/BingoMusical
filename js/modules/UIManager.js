/**
 * UIManager Module
 * Gestiona el renderizado y actualización de la interfaz de usuario
 */
import { escapeHTML } from '../utils.js';

export class UIManager {
    constructor(dom, minSongsRequired) {
        this.dom = dom;
        this.MIN_SONGS_REQUIRED = minSongsRequired;
        this.playerRevealTimers = [];
    }

    /**
     * Convierte un emoji a una imagen Data URL
     * @param {string} emoji - El emoji a convertir
     * @param {number} size - Tamaño del canvas (ancho y alto)
     * @returns {string} - Data URL de la imagen
     */
    emojiToDataURL(emoji, size) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const fontSize = Math.floor(size * 0.75);
        ctx.font = `${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, size / 2, size / 2 + size * 0.05);
        return canvas.toDataURL();
    }

    /**
     * Método interno para renderizar canciones al DOM
     * @private
     */
    _renderToDOM(songs, totalSongsWithFiles, createSongItemCallback, emptyMessageFn) {
        const fragment = document.createDocumentFragment();

        if (songs.length === 0) {
            const emptyLi = emptyMessageFn();
            fragment.appendChild(emptyLi);
            this.dom.songsListElement.innerHTML = '';
            this.dom.songsListElement.appendChild(fragment);
            return;
        }

        if (totalSongsWithFiles < this.MIN_SONGS_REQUIRED) {
            const warning = this.createWarningMessage(totalSongsWithFiles);
            fragment.appendChild(warning);
        }

        for (const song of songs) {
            const li = createSongItemCallback(song);
            fragment.appendChild(li);
        }

        this.dom.songsListElement.innerHTML = '';
        this.dom.songsListElement.appendChild(fragment);
    }

    /**
     * Renderiza la lista completa de canciones
     */
    renderSongsList(songs, totalSongsWithFiles, createSongItemCallback) {
        this._renderToDOM(songs, totalSongsWithFiles, createSongItemCallback, () => this.createEmptyListMessage());
    }

    /**
     * Renderiza una lista filtrada de canciones
     */
    renderFilteredSongsList(songsToShow, totalSongsWithFiles, createSongItemCallback) {
        this._renderToDOM(songsToShow, totalSongsWithFiles, createSongItemCallback, () => this.createNoResultsMessage());
    }

    /**
     * Crea el mensaje para lista vacía
     */
    createEmptyListMessage() {
        const emptyLi = document.createElement('li');
        emptyLi.setAttribute('role', 'listitem');
        emptyLi.style.cssText = 'text-align:center;padding:2rem;color:var(--text-muted);list-style:none;';
        emptyLi.innerHTML = `
            <strong style="font-size:1.2rem;margin-bottom:0.5rem;display:block;">No hay canciones cargadas</strong>
            <p style="font-size:0.9rem;margin:0.5rem 0;">Arrastra archivos de audio o usa el botón "Agregar Canciones"</p>
            <p role="alert" style="font-size:0.85rem;margin-top:1rem;color:var(--warning-color);"><strong>⚠️ Necesitas al menos ${this.MIN_SONGS_REQUIRED} canciones para jugar</strong></p>
        `;
        return emptyLi;
    }

    /**
     * Crea el mensaje de sin resultados
     */
    createNoResultsMessage() {
        const emptyLi = document.createElement('li');
        emptyLi.setAttribute('role', 'listitem');
        emptyLi.style.cssText = 'text-align:center;padding:2rem;color:var(--text-muted);list-style:none;';
        emptyLi.innerHTML = `
            <strong style="font-size:1.2rem;margin-bottom:0.5rem;display:block;">No se encontraron canciones</strong>
            <p style="font-size:0.9rem;margin:0.5rem 0;">Intenta con otro término de búsqueda o cambia los filtros</p>
        `;
        return emptyLi;
    }

    /**
     * Crea el mensaje de advertencia de canciones insuficientes
     */
    createWarningMessage(totalSongs) {
        const warning = document.createElement('li');
        warning.setAttribute('role', 'alert');
        warning.style.cssText = 'text-align:center;padding:1rem;margin-bottom:1rem;background:rgba(245,158,11,0.1);border-radius:8px;color:var(--warning-color);list-style:none;';
        warning.innerHTML = `<strong>⚠️ Tienes ${totalSongs}/${this.MIN_SONGS_REQUIRED} canciones.</strong> Necesitas al menos ${this.MIN_SONGS_REQUIRED} para jugar.`;
        return warning;
    }

    /**
     * Actualiza la UI del reproductor con información de la canción
     */
    updatePlayerUI(song, titleRevealTime = 0, iconRevealTime = 0, gameStarted = false) {
        // Cancelar revelados pendientes de la canción anterior para que no destapen la nueva antes de tiempo
        this.clearPlayerRevealTimers();

        // Si el juego no ha iniciado, mostrar todo inmediatamente
        if (!gameStarted) {
            this.dom.songTitleElement.textContent = song.title;
            this.dom.songTitleElement.style.opacity = '1';
            this.dom.songTitleElement.style.transition = '';
            this.dom.currentIconImg.style.opacity = '1';
            this.dom.currentIconImg.style.transition = '';
        } else {
            // Si el juego ha iniciado, ocultar y revelar progresivamente
            // Establecer el título inmediatamente pero oculto
            this.dom.songTitleElement.textContent = song.title;
            this.dom.songTitleElement.style.transition = '';
            this.dom.songTitleElement.style.opacity = '0';
            
            // Revelar título después del tiempo configurado
            this.playerRevealTimers.push(setTimeout(() => {
                this.dom.songTitleElement.style.transition = 'opacity 1s ease-in';
                this.dom.songTitleElement.style.opacity = '1';
            }, titleRevealTime * 1000));
            
            // Icono se maneja más abajo
            this.dom.currentIconImg.style.transition = '';
            this.dom.currentIconImg.style.opacity = '0';
        }

        this.dom.currentIconImg.alt = song.title;

        // Preparar icono
        if (song.iconType === 'image' && song.icon) {
            this.dom.currentIconImg.src = song.icon;
        } else {
            this.dom.currentIconImg.src = this.emojiToDataURL(song.icon, 300);
        }

        // Revelar icono después del tiempo configurado (solo si el juego ha iniciado)
        if (gameStarted) {
            this.playerRevealTimers.push(setTimeout(() => {
                this.dom.currentIconImg.style.transition = 'opacity 1s ease-in';
                this.dom.currentIconImg.style.opacity = '1';
            }, iconRevealTime * 1000));
        }
    }

    /**
     * Cancela los revelados pendientes del reproductor
     */
    clearPlayerRevealTimers() {
        for (const timer of this.playerRevealTimers) clearTimeout(timer);
        this.playerRevealTimers = [];
    }

    /**
     * Actualiza los controles del reproductor
     */
    updateControls(playing, gameStarted, hasSongLoaded = true, noSongsLeft = false) {
        if (playing) {
            this.dom.pauseBtn.innerHTML = '<span aria-hidden="true">⏸</span>';
            this.dom.pauseBtn.setAttribute('aria-label', 'Pausar canción actual');
            this.dom.stopBtn.disabled = false;
            this.dom.pauseBtn.disabled = false;
            this.dom.songIconContainer.classList.add('playing');
        } else {
            this.dom.pauseBtn.innerHTML = '<span aria-hidden="true">▶️</span>';
            this.dom.pauseBtn.setAttribute('aria-label', 'Reproducir canción seleccionada');
            this.dom.stopBtn.disabled = !hasSongLoaded;
            this.dom.pauseBtn.disabled = !hasSongLoaded;
            this.dom.songIconContainer.classList.remove('playing');
        }

        // En partida: desactivado mientras suena o cuando ya no quedan canciones por sacar
        this.dom.playBtn.disabled = gameStarted && (playing || noSongsLeft);
    }

    /**
     * Actualiza los contadores de canciones
     */
    updateCounters(playedCount, totalSongs) {
        this.dom.playedCounterSpan.textContent = playedCount.toString();
        this.dom.totalCounterSpan.textContent = totalSongs.toString();
    }

    /**
     * Actualiza el estado de la UI según si el juego ha iniciado
     */
    updateUIState(gameStarted, continuousMode, toggleContinuousModeCallback) {
        const isDisabled = gameStarted;

        this.dom.addSongsInput.disabled = isDisabled;
        this.dom.addSongsLabel.style.opacity = isDisabled ? '0.5' : '1';
        this.dom.addSongsLabel.style.cursor = isDisabled ? 'not-allowed' : 'pointer';
        this.dom.addSongsLabel.style.pointerEvents = isDisabled ? 'none' : 'auto';

        this.dom.importListBtn.disabled = isDisabled;
        this.dom.importListBtn.style.cursor = isDisabled ? 'not-allowed' : 'pointer';

        this.dom.clearHistoryBtn.disabled = !isDisabled;
        this.dom.clearHistoryBtn.style.opacity = isDisabled ? '1' : '0.5';
        this.dom.clearHistoryBtn.style.cursor = isDisabled ? 'pointer' : 'not-allowed';

        this.dom.shuffleAllBtn.disabled = isDisabled;
        this.dom.shuffleAllBtn.style.opacity = isDisabled ? '0.5' : '1';
        this.dom.shuffleAllBtn.style.cursor = isDisabled ? 'not-allowed' : 'pointer';
        if (isDisabled && continuousMode) {
            toggleContinuousModeCallback();
        }

        // Deshabilitar botón de configuración cuando el juego está iniciado
        this.dom.configBtn.disabled = isDisabled;
        this.dom.configBtn.style.opacity = isDisabled ? '0.5' : '1';
        this.dom.configBtn.style.cursor = isDisabled ? 'not-allowed' : 'pointer';

        if (gameStarted) {
            this.dom.playBtn.innerHTML = '<span aria-hidden="true">🔀</span> Siguiente';
            this.dom.playBtn.setAttribute('aria-label', 'Siguiente canción');
        } else {
            this.dom.playBtn.innerHTML = '<span aria-hidden="true">▶️</span> Iniciar Juego';
            this.dom.playBtn.setAttribute('aria-label', 'Iniciar Juego');
        }
    }

    /**
     * Agrega una canción al historial visual
     */
    addToHistory(song, iconRevealTime = 0, gameStarted = false) {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.title = song.title;
        historyItem.setAttribute('role', 'img');
        historyItem.setAttribute('aria-label', `Canción reproducida: ${song.title}`);

        const img = document.createElement('img');
        
        // Solo ocultar si el juego ha iniciado
        if (gameStarted) {
            img.style.opacity = '0';
        }

        if (song.iconType === 'image' && song.icon) {
            img.src = song.icon;
        } else {
            img.src = this.emojiToDataURL(song.icon, 150);
        }

        img.alt = song.title;
        historyItem.appendChild(img);
        this.dom.historyGrid.appendChild(historyItem);

        // Scroll suave al final del contenedor
        const container = this.dom.historyGrid.parentElement;
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });

        // Revelar icono después del tiempo configurado (solo si el juego ha iniciado)
        if (gameStarted) {
            setTimeout(() => {
                img.style.transition = 'opacity 1s ease-in';
                img.style.opacity = '1';
            }, iconRevealTime * 1000);
        }

        return historyItem;
    }

    /**
     * Obtiene el título del icono de una canción
     */
    getSongIconTitle(song, gameStarted) {
        if (song.played) return 'Icono bloqueado (canción ya reproducida)';
        return gameStarted ? 'Icono bloqueado (juego iniciado)' : 'Click para cambiar icono';
    }

    /**
     * Obtiene el HTML del icono de una canción
     */
    getSongIconHtml(song) {
        const title = escapeHTML(song.title);
        if (song.iconType === 'image') {
            return `<img src="${escapeHTML(song.icon)}" alt="${title}" style="padding:.25rem;aspect-ratio:1;object-fit:contain;">`;
        }
        return `<span role="img" aria-label="${title}">${escapeHTML(song.icon)}</span>`;
    }

    /**
     * Obtiene la etiqueta de estado de una canción
     */
    getSongStateLabel(song) {
        if (song.played) {
            return '✓ Ya reproducida';
        } else if (song.file) {
            return '○ Pendiente';
        } else {
            return '⚠ Sin archivo';
        }
    }
}
