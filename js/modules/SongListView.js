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

    createSongItem(song) {
        const { currentSongId, gameStarted } = this.getPlaybackState();
        const state = { isCurrent: currentSongId === song.id, gameStarted };

        const li = document.createElement('li');
        li.className = `song-item ${song.played ? 'played' : ''} ${state.isCurrent ? 'playing' : ''}`;
        li.setAttribute('role', 'listitem');
        li.onclick = () => this.handlers.onSongClick(song);

        li.append(
            this._createIconButton(song, state),
            this._createInfo(song),
            this._createDeleteButton(song)
        );
        return li;
    }

    _createButton(className, onClick) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = className;
        button.onclick = (e) => {
            e.stopPropagation();
            onClick();
        };
        return button;
    }

    _createIconButton(song, { gameStarted }) {
        const locked = song.played || gameStarted;

        const button = this._createButton('song-item-icon', () => this.handlers.onIconClick(song));
        button.dataset.songId = song.id;
        button.title = this.ui.getSongIconTitle(song, gameStarted);
        button.style.cursor = locked ? 'not-allowed' : 'pointer';
        button.setAttribute('aria-label', TEXT.list.changeIconLabel(song.title));
        button.disabled = locked;
        button.innerHTML = this.ui.getSongIconHtml(song);

        return button;
    }

    _createInfo(song) {
        const info = document.createElement('div');
        info.className = 'song-item-info';

        const title = document.createElement('strong');
        title.className = 'song-item-title';
        title.dataset.songId = song.id;
        title.textContent = song.title;

        const status = document.createElement('div');
        status.className = 'song-item-status';
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');
        status.textContent = this.ui.getSongStateLabel(song);

        info.append(title, status);
        return info;
    }

    _createDeleteButton(song) {
        const button = this._createButton('song-item-delete', () => this.handlers.onDelete(song));
        button.title = TEXT.list.deleteTitle;
        button.setAttribute('aria-label', TEXT.list.deleteLabel(song.title));
        button.innerHTML = '<span aria-hidden="true">❌</span>';

        return button;
    }
}
