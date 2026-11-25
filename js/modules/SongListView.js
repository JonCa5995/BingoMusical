import { SEARCH_DEBOUNCE_MS } from '../constants.js';
import { TEXT } from '../messages.js';

export class SongListView {
    constructor({ ui, songManager, filterControls, getSongs, getPlaybackState, handlers }) {
        this.ui = ui;
        this.songManager = songManager;
        this.filterControls = filterControls;
        this.getSongs = getSongs;
        this.getPlaybackState = getPlaybackState;
        this.handlers = handlers;
        this.searchDebounceTimer = null;
    }

    bindFilterControls() {
        const { searchInput, filterStatus, sortOrder } = this.filterControls;

        searchInput.addEventListener('input', () => {
            clearTimeout(this.searchDebounceTimer);
            this.searchDebounceTimer = setTimeout(() => this.render(), SEARCH_DEBOUNCE_MS);
        });
        filterStatus.addEventListener('change', () => this.render());
        sortOrder.addEventListener('change', () => this.render());
    }

    render() {
        const songs = this.getSongs();
        const { searchInput, filterStatus, sortOrder } = this.filterControls;
        const visibleSongs = this.songManager.filterAndSort(songs, {
            searchTerm: searchInput.value,
            filterStatus: filterStatus.value,
            sortOrder: sortOrder.value
        });

        this.ui.renderSongs(
            visibleSongs,
            this.songManager.getTotalSongsWithFiles(songs),
            (song) => this.createSongItem(song),
            songs.length === 0 ? 'empty' : 'noResults'
        );
    }

    reveal(songId, part) {
        const selector = part === 'title' ? '.song-item-title' : '.song-item-icon';
        const element = document.querySelector(`${selector}[data-song-id="${songId}"]`);
        if (element) {
            element.style.transition = 'opacity 1s ease-in';
            element.style.opacity = '1';
        }
    }

    createSongItem(song) {
        const { currentSongId, gameStarted } = this.getPlaybackState();
        const isCurrent = currentSongId === song.id;
        const iconLocked = song.played || gameStarted;

        // Fila de la canción
        const li = document.createElement('li');
        li.className = `song-item ${song.played ? 'played' : ''} ${isCurrent ? 'playing' : ''}`;
        li.setAttribute('role', 'listitem');

        // Botón del icono
        const iconBtn = document.createElement('button');
        iconBtn.type = 'button';
        iconBtn.className = 'song-item-icon';
        iconBtn.dataset.songId = song.id;
        iconBtn.title = this.ui.getSongIconTitle(song, gameStarted);
        iconBtn.style.cursor = iconLocked ? 'not-allowed' : 'pointer';
        iconBtn.setAttribute('aria-label', TEXT.list.changeIconLabel(song.title));
        iconBtn.disabled = iconLocked;
        iconBtn.innerHTML = this.ui.getSongIconHtml(song);

        // La canción en juego se oculta hasta revelarla
        if (isCurrent && gameStarted && song.hideIcon) {
            iconBtn.style.opacity = '0';
        }

        // Título y estado
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

        // Botón de borrar
        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'song-item-delete';
        deleteBtn.title = TEXT.list.deleteTitle;
        deleteBtn.setAttribute('aria-label', TEXT.list.deleteLabel(song.title));
        deleteBtn.innerHTML = '<span aria-hidden="true">❌</span>';

        // Eventos y montaje de la fila
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
