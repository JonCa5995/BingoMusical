/**
 * SongListView Module
 * Pinta la lista de canciones (búsqueda, filtro y orden incluidos) y avisa de lo
 * que hace el usuario sobre cada canción. No decide qué ocurre al pulsar: eso lo
 * deciden los handlers que recibe.
 */
import { SEARCH_DEBOUNCE_MS } from '../constants.js';
import { TEXT } from '../messages.js';

export class SongListView {
    /**
     * @param {Object} deps
     * @param {UIManager} deps.ui - Para los mensajes de lista vacía y el pintado final
     * @param {SongManager} deps.songManager - Para filtrar, ordenar y contar canciones
     * @param {{searchInput: HTMLInputElement, filterStatus: HTMLSelectElement, sortOrder: HTMLSelectElement}} deps.filterControls
     * @param {Function} deps.getSongs - Devuelve la lista actual de canciones
     * @param {Function} deps.getPlaybackState - Devuelve { currentSongId, gameStarted }
     * @param {{onIconClick: Function, onSongClick: Function, onDelete: Function}} deps.handlers - Reciben la canción
     */
    constructor({ ui, songManager, filterControls, getSongs, getPlaybackState, handlers }) {
        this.ui = ui;
        this.songManager = songManager;
        this.filterControls = filterControls;
        this.getSongs = getSongs;
        this.getPlaybackState = getPlaybackState;
        this.handlers = handlers;
        this.searchDebounceTimer = null;
    }

    /**
     * Escucha los controles de búsqueda, filtro y orden
     */
    bindFilterControls() {
        const { searchInput, filterStatus, sortOrder } = this.filterControls;

        // La búsqueda espera a que el usuario deje de escribir
        searchInput.addEventListener('input', () => {
            clearTimeout(this.searchDebounceTimer);
            this.searchDebounceTimer = setTimeout(() => this.render(), SEARCH_DEBOUNCE_MS);
        });
        filterStatus.addEventListener('change', () => this.render());
        sortOrder.addEventListener('change', () => this.render());
    }

    /**
     * Pinta la lista aplicando la búsqueda, el filtro y el orden actuales
     */
    render() {
        const songs = this.getSongs();
        const { searchInput, filterStatus, sortOrder } = this.filterControls;
        const visibleSongs = this.songManager.filterAndSort(songs, {
            searchTerm: searchInput.value,
            filterStatus: filterStatus.value,
            sortOrder: sortOrder.value
        });

        // Sin canciones cargadas: "No hay canciones". Con canciones pero ninguna visible: "Sin resultados"
        this.ui.renderSongs(
            visibleSongs,
            this.songManager.getTotalSongsWithFiles(songs),
            (song) => this.createSongItem(song),
            songs.length === 0 ? 'empty' : 'noResults'
        );
    }

    /**
     * Muestra con un fundido el título o el icono de una canción de la lista
     * @param {number} songId
     * @param {'title'|'icon'} part
     */
    reveal(songId, part) {
        const selector = part === 'title' ? '.song-item-title' : '.song-item-icon';
        const element = document.querySelector(`${selector}[data-song-id="${songId}"]`);
        if (element) {
            element.style.transition = 'opacity 1s ease-in';
            element.style.opacity = '1';
        }
    }

    /**
     * Crea el <li> de una canción
     */
    createSongItem(song) {
        const { currentSongId, gameStarted } = this.getPlaybackState();
        const isCurrent = currentSongId === song.id;
        const iconLocked = song.played || gameStarted;

        const li = document.createElement('li');
        li.className = `song-item ${song.played ? 'played' : ''} ${isCurrent ? 'playing' : ''}`;
        li.setAttribute('role', 'listitem');

        const iconBtn = document.createElement('button');
        iconBtn.type = 'button';
        iconBtn.className = 'song-item-icon';
        iconBtn.dataset.songId = song.id;
        iconBtn.title = this.ui.getSongIconTitle(song, gameStarted);
        iconBtn.style.cursor = iconLocked ? 'not-allowed' : 'pointer';
        iconBtn.setAttribute('aria-label', TEXT.list.changeIconLabel(song.title));
        iconBtn.disabled = iconLocked;
        iconBtn.innerHTML = this.ui.getSongIconHtml(song);

        // La canción en juego se oculta hasta que se revela
        if (isCurrent && gameStarted && song.hideIcon) {
            iconBtn.style.opacity = '0';
        }

        const infoDiv = document.createElement('div');
        infoDiv.className = 'song-item-info';

        const titleStrong = document.createElement('strong');
        titleStrong.className = 'song-item-title';
        titleStrong.dataset.songId = song.id;
        titleStrong.textContent = song.title;

        if (isCurrent && gameStarted && song.hideTitle) {
            titleStrong.style.opacity = '0';
        }

        const statusDiv = document.createElement('div');
        statusDiv.className = 'song-item-status';
        statusDiv.setAttribute('role', 'status');
        statusDiv.setAttribute('aria-live', 'polite');
        statusDiv.textContent = this.ui.getSongStateLabel(song);

        infoDiv.append(titleStrong, statusDiv);

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'song-item-delete';
        deleteBtn.title = TEXT.list.deleteTitle;
        deleteBtn.setAttribute('aria-label', TEXT.list.deleteLabel(song.title));
        deleteBtn.innerHTML = '<span aria-hidden="true">❌</span>';

        iconBtn.onclick = (e) => {
            e.stopPropagation();
            this.handlers.onIconClick(song);
        };
        li.onclick = () => this.handlers.onSongClick(song);
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            this.handlers.onDelete(song);
        };

        li.append(iconBtn, infoDiv, deleteBtn);
        return li;
    }
}
