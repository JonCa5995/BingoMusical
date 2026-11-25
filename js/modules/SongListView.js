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
        const state = { isCurrent: currentSongId === song.id, gameStarted };

        const li = document.createElement('li');
        li.className = `song-item ${song.played ? 'played' : ''} ${state.isCurrent ? 'playing' : ''}`;
        li.setAttribute('role', 'listitem');
        li.onclick = () => this.handlers.onSongClick(song);

        li.append(
            this._createIconButton(song, state),
            this._createInfo(song, state),
            this._createDeleteButton(song)
        );
        return li;
    }

    _createIconButton(song, { isCurrent, gameStarted }) {
        const locked = song.played || gameStarted;

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'song-item-icon';
        button.dataset.songId = song.id;
        button.title = this.ui.getSongIconTitle(song, gameStarted);
        button.style.cursor = locked ? 'not-allowed' : 'pointer';
        button.setAttribute('aria-label', TEXT.list.changeIconLabel(song.title));
        button.disabled = locked;
        button.innerHTML = this.ui.getSongIconHtml(song);

        if (isCurrent && gameStarted && song.hideIcon) {
            button.style.opacity = '0';
        }

        button.onclick = (e) => {
            e.stopPropagation();
            this.handlers.onIconClick(song);
        };
        return button;
    }

    _createInfo(song, { isCurrent, gameStarted }) {
        const info = document.createElement('div');
        info.className = 'song-item-info';

        const title = document.createElement('strong');
        title.className = 'song-item-title';
        title.dataset.songId = song.id;
        title.textContent = song.title;

        if (isCurrent && gameStarted && song.hideTitle) {
            title.style.opacity = '0';
        }

        const status = document.createElement('div');
        status.className = 'song-item-status';
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');
        status.textContent = this.ui.getSongStateLabel(song);

        info.append(title, status);
        return info;
    }

    _createDeleteButton(song) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'song-item-delete';
        button.title = TEXT.list.deleteTitle;
        button.setAttribute('aria-label', TEXT.list.deleteLabel(song.title));
        button.innerHTML = '<span aria-hidden="true">❌</span>';

        button.onclick = (e) => {
            e.stopPropagation();
            this.handlers.onDelete(song);
        };
        return button;
    }
}
