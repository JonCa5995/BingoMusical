import { escapeHTML } from '../utils.js';
import { ICON_TYPE, MS_PER_SECOND, PLAYER_ICON_SIZE, HISTORY_ICON_SIZE } from '../constants.js';
import { TEXT } from '../messages.js';

export class UIManager {
    constructor(elements, minSongsRequired) {
        this.el = elements;
        this.MIN_SONGS_REQUIRED = minSongsRequired;
        this.playerRevealTimers = [];
    }

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

    renderSongs(songs, totalSongsWithFiles, createSongItem, emptyKind = 'empty') {
        const fragment = document.createDocumentFragment();

        if (songs.length === 0) {
            fragment.appendChild(this._createEmptyMessage(emptyKind));
        } else {
            if (totalSongsWithFiles < this.MIN_SONGS_REQUIRED) {
                fragment.appendChild(this.createWarningMessage(totalSongsWithFiles));
            }
            for (const song of songs) {
                fragment.appendChild(createSongItem(song));
            }
        }

        this.el.songsListElement.replaceChildren(fragment);
    }

    _createEmptyMessage(kind) {
        const { title, text, minSongsWarning: warning } = TEXT.list[kind];
        const minSongsWarning = warning
            ? `\n            <p role="alert" style="font-size:0.85rem;margin-top:1rem;color:var(--warning-color);"><strong>${warning(this.MIN_SONGS_REQUIRED)}</strong></p>`
            : '';

        const emptyLi = document.createElement('li');
        emptyLi.setAttribute('role', 'listitem');
        emptyLi.style.cssText = 'text-align:center;padding:2rem;color:var(--text-muted);list-style:none;';
        emptyLi.innerHTML = `
            <strong style="font-size:1.2rem;margin-bottom:0.5rem;display:block;">${title}</strong>
            <p style="font-size:0.9rem;margin:0.5rem 0;">${text}</p>${minSongsWarning}
        `;
        return emptyLi;
    }

    createWarningMessage(totalSongs) {
        const warning = document.createElement('li');
        warning.setAttribute('role', 'alert');
        warning.style.cssText = 'text-align:center;padding:1rem;margin-bottom:1rem;background:rgba(245,158,11,0.1);border-radius:8px;color:var(--warning-color);list-style:none;';
        warning.innerHTML = `<strong>${TEXT.list.notEnoughWarning.count(totalSongs, this.MIN_SONGS_REQUIRED)}</strong>${TEXT.list.notEnoughWarning.rest(this.MIN_SONGS_REQUIRED)}`;
        return warning;
    }

    updatePlayerUI(song, titleRevealTime = 0, iconRevealTime = 0, gameStarted = false) {
        // Cancela los revelados de la canción anterior
        this.clearPlayerRevealTimers();

        // Fuera de partida se muestra todo al instante
        if (!gameStarted) {
            this.el.songTitleElement.textContent = song.title;
            this.el.songTitleElement.style.opacity = '1';
            this.el.songTitleElement.style.transition = '';
            this.el.currentIconImg.style.opacity = '1';
            this.el.currentIconImg.style.transition = '';
        } else {
            // En partida el título empieza oculto
            this.el.songTitleElement.textContent = song.title;
            this.el.songTitleElement.style.transition = '';
            this.el.songTitleElement.style.opacity = '0';
            
            // Revela el título tras el tiempo configurado
            this.playerRevealTimers.push(setTimeout(() => {
                this.el.songTitleElement.style.transition = 'opacity 1s ease-in';
                this.el.songTitleElement.style.opacity = '1';
            }, titleRevealTime * MS_PER_SECOND));
            
            this.el.currentIconImg.style.transition = '';
            this.el.currentIconImg.style.opacity = '0';
        }

        this.el.currentIconImg.alt = song.title;

        // Muestra el icono
        if (song.iconType === ICON_TYPE.IMAGE && song.icon) {
            this.el.currentIconImg.src = song.icon;
        } else {
            this.el.currentIconImg.src = this.emojiToDataURL(song.icon, PLAYER_ICON_SIZE);
        }

        // Revela el icono tras el tiempo configurado (solo en partida)
        if (gameStarted) {
            this.playerRevealTimers.push(setTimeout(() => {
                this.el.currentIconImg.style.transition = 'opacity 1s ease-in';
                this.el.currentIconImg.style.opacity = '1';
            }, iconRevealTime * MS_PER_SECOND));
        }
    }

    clearPlayerRevealTimers() {
        for (const timer of this.playerRevealTimers) clearTimeout(timer);
        this.playerRevealTimers = [];
    }

    updateControls(playing, gameStarted, hasSongLoaded = true, noSongsLeft = false) {
        if (playing) {
            this.el.pauseBtn.innerHTML = '<span aria-hidden="true">⏸</span>';
            this.el.pauseBtn.setAttribute('aria-label', TEXT.player.pauseLabel);
            this.el.stopBtn.disabled = false;
            this.el.pauseBtn.disabled = false;
            this.el.songIconContainer.classList.add('playing');
        } else {
            this.el.pauseBtn.innerHTML = '<span aria-hidden="true">▶️</span>';
            this.el.pauseBtn.setAttribute('aria-label', TEXT.player.playLabel);
            this.el.stopBtn.disabled = !hasSongLoaded;
            this.el.pauseBtn.disabled = !hasSongLoaded;
            this.el.songIconContainer.classList.remove('playing');
        }

        this.el.playBtn.disabled = gameStarted && (playing || noSongsLeft);
    }

    updateCounters(playedCount, totalSongs) {
        this.el.playedCounterSpan.textContent = playedCount.toString();
        this.el.totalCounterSpan.textContent = totalSongs.toString();
    }

    _setLocked(element, locked) {
        if ('disabled' in element) element.disabled = locked;
        element.style.opacity = locked ? '0.5' : '1';
        element.style.cursor = locked ? 'not-allowed' : 'pointer';
    }

    updateUIState(gameStarted, continuousMode, toggleContinuousModeCallback) {
        const isDisabled = gameStarted;

        this.el.addSongsInput.disabled = isDisabled;
        this._setLocked(this.el.addSongsLabel, isDisabled);
        this.el.addSongsLabel.style.pointerEvents = isDisabled ? 'none' : 'auto';

        this.el.importListBtn.disabled = isDisabled;
        this.el.importListBtn.style.cursor = isDisabled ? 'not-allowed' : 'pointer';

        this.el.clearHistoryBtn.disabled = !isDisabled;
        this.el.clearHistoryBtn.style.opacity = isDisabled ? '1' : '0.5';
        this.el.clearHistoryBtn.style.cursor = isDisabled ? 'pointer' : 'not-allowed';

        this._setLocked(this.el.shuffleAllBtn, isDisabled);
        if (isDisabled && continuousMode) {
            toggleContinuousModeCallback();
        }

        this._setLocked(this.el.configBtn, isDisabled);

        if (gameStarted) {
            this.el.playBtn.innerHTML = `<span aria-hidden="true">${TEXT.player.next.icon}</span> ${TEXT.player.next.text}`;
            this.el.playBtn.setAttribute('aria-label', TEXT.player.next.label);
        } else {
            this.el.playBtn.innerHTML = `<span aria-hidden="true">${TEXT.player.start.icon}</span> ${TEXT.player.start.text}`;
            this.el.playBtn.setAttribute('aria-label', TEXT.player.start.label);
        }
    }

    addToHistory(song, iconRevealTime = 0, gameStarted = false) {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.title = song.title;
        historyItem.setAttribute('role', 'img');
        historyItem.setAttribute('aria-label', TEXT.player.playedHistoryLabel(song.title));

        const img = document.createElement('img');
        
        if (gameStarted) {
            img.style.opacity = '0';
        }

        if (song.iconType === ICON_TYPE.IMAGE && song.icon) {
            img.src = song.icon;
        } else {
            img.src = this.emojiToDataURL(song.icon, HISTORY_ICON_SIZE);
        }

        img.alt = song.title;
        historyItem.appendChild(img);
        this.el.historyGrid.appendChild(historyItem);

        const container = this.el.historyGrid.parentElement;
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });

        if (gameStarted) {
            setTimeout(() => {
                img.style.transition = 'opacity 1s ease-in';
                img.style.opacity = '1';
            }, iconRevealTime * MS_PER_SECOND);
        }

        return historyItem;
    }

    getSongIconTitle(song, gameStarted) {
        if (song.played) return TEXT.list.iconTitle.lockedPlayed;
        return gameStarted ? TEXT.list.iconTitle.lockedStarted : TEXT.list.iconTitle.change;
    }

    getSongIconHtml(song) {
        const title = escapeHTML(song.title);
        if (song.iconType === ICON_TYPE.IMAGE) {
            return `<img src="${escapeHTML(song.icon)}" alt="${title}" style="padding:.25rem;aspect-ratio:1;object-fit:contain;">`;
        }
        return `<span role="img" aria-label="${title}">${escapeHTML(song.icon)}</span>`;
    }

    getSongStateLabel(song) {
        if (song.played) {
            return TEXT.list.songState.played;
        } else if (song.file) {
            return TEXT.list.songState.pending;
        } else {
            return TEXT.list.songState.noFile;
        }
    }
}
