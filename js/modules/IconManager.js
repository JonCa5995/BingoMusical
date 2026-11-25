import {availableIcons, iconKeywords} from './IconDictionary.js';
import {CUSTOM_ICON_SIZE, ICON_MODAL_CLOSE_DELAY_MS, ICON_TYPE, SOUND} from '../constants.js';
import {MSG, TEXT} from '../messages.js';

export class IconManager {
    constructor(elements, sounds, getSongs, modals) {
        this.el = elements;
        this.sounds = sounds;
        this.getSongs = getSongs;
        this.modals = modals;
        this.currentEditingSongId = null;

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.el.closeIconModalBtn.addEventListener('click', () => this.closeIconModal());
        this.modals.registerModal(this.el.iconModal, () => this.closeIconModal());

        this.el.uploadCustomIconBtn.addEventListener('click', () => {
            this.el.customIconUploadInput.click();
        });
        this.el.customIconUploadInput.addEventListener('change', (e) => {
            const songs = this.getSongs();
            this.uploadCustomIcon(e, songs);
        });

        this.el.iconSearchInput.addEventListener('input', (e) => {
            this.filterIcons(e.target.value);
        });
    }

    getAvailableIcons(songs) {
        const usedIcons = new Set(
            songs
                .filter(song => song.iconType === ICON_TYPE.EMOJI && song.icon != null)
                .map(song => song.icon)
        );
        return availableIcons.filter(icon => !usedIcons.has(icon));
    }

    isIconUsed(icon, songs) {
        return songs.some(s =>
            s.icon === icon &&
            s.iconType === ICON_TYPE.EMOJI &&
            s.id !== this.currentEditingSongId
        );
    }

    openIconPicker(songId, songs, onIconSelected) {
        // Comprueba que la canción existe y se puede cambiar
        const song = songs.find(s => s.id === songId);
        if (!song) return {success: false, alert: MSG.icons.songNotFound};

        if (song.played) {
            return {success: false, alert: MSG.songs.iconLocked};
        }

        // Prepara el modal para esa canción
        this.currentEditingSongId = songId;
        this.onIconSelected = onIconSelected;
        this.el.modalSongTitle.textContent = song.title;

        // Crea los botones de los iconos
        const fragment = document.createDocumentFragment();

        for (const icon of availableIcons) {
            const iconOption = document.createElement('button');
            iconOption.type = 'button';
            iconOption.className = 'icon-option';
            iconOption.setAttribute('aria-label', TEXT.icons.selectLabel(icon));

            const isUsed = this.isIconUsed(icon, songs);
            const isCurrentSongIcon = icon === song.icon;

            if (isCurrentSongIcon) {
                iconOption.classList.add('selected');
                iconOption.setAttribute('aria-pressed', 'true');
            } else {
                iconOption.setAttribute('aria-pressed', 'false');
            }

            if (isUsed && !isCurrentSongIcon) {
                iconOption.style.opacity = '0.3';
                iconOption.style.cursor = 'not-allowed';
                iconOption.title = TEXT.icons.inUse;
                iconOption.disabled = true;
            } else {
                iconOption.onclick = () => this.selectIcon(icon, songs);
            }

            iconOption.textContent = icon;
            fragment.appendChild(iconOption);
        }

        this.el.iconPickerContainer.innerHTML = '';
        this.el.iconPickerContainer.appendChild(fragment);

        // Abre el modal
        this.el.iconModal.classList.remove('hidden');
        if (this.el.iconModal.showModal) {
            this.el.iconModal.showModal();
        }

        this.sounds.play(SOUND.CLICK);

        return {success: true};
    }

    closeIconModal() {
        if (this.el.iconModal.close) {
            this.el.iconModal.close();
        }
        this.el.iconModal.classList.add('hidden');

        this.currentEditingSongId = null;
        this.onIconSelected = null;

        this.el.iconSearchInput.value = '';
    }

    removeAccents(text) {
        return text.normalize('NFD').replaceAll(/[\u0300-\u036f]/g, '');
    }

    filterIcons(searchText) {
        const query = this.removeAccents(searchText.toLowerCase().trim());

        const iconOptions = this.el.iconPickerContainer.querySelectorAll('.icon-option');
        let visibleCount = 0;

        const noResults = this.el.iconPickerContainer.querySelector('.icon-picker-no-results');
        if (noResults) noResults.remove();

        for (const option of iconOptions) {
            const icon = option.textContent;
            const keywords = iconKeywords[icon] || [];

            const matches = query === '' || keywords.some(keyword =>
                this.removeAccents(keyword).includes(query)
            ) || icon.includes(query);

            option.style.display = matches ? '' : 'none';
            if (matches) visibleCount++;
        }

        if (visibleCount === 0 && query !== '') {
            const noResultsMsg = document.createElement('div');
            noResultsMsg.className = 'icon-picker-no-results';
            noResultsMsg.textContent = TEXT.icons.noResults(searchText);
            this.el.iconPickerContainer.appendChild(noResultsMsg);
        }
    }

    selectIcon(icon, songs) {
        if (this.currentEditingSongId === null) return;

        const song = songs.find(s => s.id === this.currentEditingSongId);
        if (!song || song.played) return;

        song.icon = icon;
        song.iconType = ICON_TYPE.EMOJI;

        this.sounds.play(SOUND.CLICK);

        for (const opt of document.querySelectorAll('.icon-option')) {
            const isSelected = opt.textContent === icon;
            opt.classList.toggle('selected', isSelected);
            opt.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
        }

        if (this.onIconSelected) {
            this.onIconSelected();
        }

        setTimeout(() => this.closeIconModal(), ICON_MODAL_CLOSE_DELAY_MS);
    }

    uploadCustomIcon(e, songs) {
        const file = e.target.files[0];
        if (!file) return;

        const song = songs.find(s => s.id === this.currentEditingSongId);
        if (!song) return;

        const reader = new FileReader();

        // Guarda el callback antes de cerrar el modal
        const callback = this.onIconSelected;

        const handleUpdate = () => {
            song.iconType = ICON_TYPE.IMAGE;
            this.sounds.play(SOUND.CLICK);
            this.closeIconModal();

            if (callback) {
                callback();
            }
        };

        // Los PNG se reescalan; el resto se guarda tal cual
        reader.onload = (event) => {
            if (file.type === 'image/png') {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = CUSTOM_ICON_SIZE;
                    canvas.height = CUSTOM_ICON_SIZE;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, CUSTOM_ICON_SIZE, CUSTOM_ICON_SIZE);
                    song.icon = canvas.toDataURL('image/png');
                    handleUpdate();
                };
                img.src = event.target.result;
            } else {
                song.icon = event.target.result;
                handleUpdate();
            }
        };

        reader.readAsDataURL(file);
    }

    getRandomAvailableIcon(songs) {
        const availableIconsList = this.getAvailableIcons(songs);
        if (availableIconsList.length > 0) {
            return availableIconsList[Math.floor(Math.random() * availableIconsList.length)];
        }
        return availableIcons[Math.floor(Math.random() * availableIcons.length)];
    }
}
