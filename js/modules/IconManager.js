/**
 * IconManager Module
 * Gestiona la selección y personalización de iconos para las canciones
 */
import {availableIcons, iconKeywords} from './IconDictionary.js';
import {CUSTOM_ICON_SIZE, ICON_MODAL_CLOSE_DELAY_MS, ICON_TYPE, SOUND} from '../constants.js';
import {MSG, TEXT} from '../messages.js';

export class IconManager {
    constructor(dom, sounds, getSongs) {
        this.dom = dom;
        this.sounds = sounds;
        this.getSongs = getSongs; // Función para obtener las canciones actuales
        this.currentEditingSongId = null;

        this.setupEventListeners();
    }


    /**
     * Configura event listeners para el modal de iconos
     */
    setupEventListeners() {
        // El cierre al hacer clic fuera y con Escape lo gestiona ModalManager (registerModal)
        this.dom.closeIconModalBtn.addEventListener('click', () => this.closeIconModal());

        this.dom.uploadCustomIconBtn.addEventListener('click', () => {
            this.dom.customIconUploadInput.click();
        });
        this.dom.customIconUploadInput.addEventListener('change', (e) => {
            const songs = this.getSongs();
            this.uploadCustomIcon(e, songs);
        });

        // Event listener para búsqueda de iconos
        this.dom.iconSearchInput.addEventListener('input', (e) => {
            this.filterIcons(e.target.value);
        });
    }

    /**
     * Obtiene los iconos disponibles (no usados)
     */
    getAvailableIcons(songs) {
        const usedIcons = new Set(
            songs
                .filter(song => song.iconType === ICON_TYPE.EMOJI && song.icon != null)
                .map(song => song.icon)
        );
        return availableIcons.filter(icon => !usedIcons.has(icon));
    }

    /**
     * Verifica si un icono está en uso
     */
    isIconUsed(icon, songs) {
        return songs.some(s =>
            s.icon === icon &&
            s.iconType === ICON_TYPE.EMOJI &&
            s.id !== this.currentEditingSongId
        );
    }

    /**
     * Abre el modal de selección de iconos
     */
    openIconPicker(songId, songs, onIconSelected) {
        const song = songs.find(s => s.id === songId);
        if (!song) return {success: false, alert: MSG.icons.songNotFound};

        if (song.played) {
            return {success: false, alert: MSG.songs.iconLocked};
        }

        this.currentEditingSongId = songId;
        this.onIconSelected = onIconSelected;
        this.dom.modalSongTitle.textContent = song.title;

        // Renderizar iconos usando DocumentFragment
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

        this.dom.iconPickerContainer.innerHTML = '';
        this.dom.iconPickerContainer.appendChild(fragment);

        // Abrir modal
        this.dom.iconModal.classList.remove('hidden');
        if (this.dom.iconModal.showModal) {
            this.dom.iconModal.showModal();
        }

        this.sounds.play(SOUND.CLICK);

        return {success: true};
    }

    /**
     * Cierra el modal de iconos
     */
    closeIconModal() {
        // Cerrar modal
        if (this.dom.iconModal.close) {
            this.dom.iconModal.close();
        }
        this.dom.iconModal.classList.add('hidden');

        this.currentEditingSongId = null;
        this.onIconSelected = null;

        // Limpiar búsqueda al cerrar
        this.dom.iconSearchInput.value = '';
    }

    /**
     * Elimina los acentos de un texto
     * @param {string} text - Texto a normalizar
     * @returns {string} - Texto sin acentos
     */
    removeAccents(text) {
        return text.normalize('NFD').replaceAll(/[\u0300-\u036f]/g, '');
    }

    /**
     * Filtra los iconos según el texto de búsqueda
     */
    filterIcons(searchText) {
        const query = this.removeAccents(searchText.toLowerCase().trim());

        const iconOptions = this.dom.iconPickerContainer.querySelectorAll('.icon-option');
        let visibleCount = 0;

        // Eliminar mensaje de "sin resultados" si existe
        const noResults = this.dom.iconPickerContainer.querySelector('.icon-picker-no-results');
        if (noResults) noResults.remove();

        for (const option of iconOptions) {
            const icon = option.textContent;
            const keywords = iconKeywords[icon] || [];

            // Buscar en las palabras clave (sin acentos)
            const matches = query === '' || keywords.some(keyword =>
                this.removeAccents(keyword).includes(query)
            ) || icon.includes(query);

            option.style.display = matches ? '' : 'none';
            if (matches) visibleCount++;
        }

        // Mostrar mensaje si no hay resultados
        if (visibleCount === 0 && query !== '') {
            const noResultsMsg = document.createElement('div');
            noResultsMsg.className = 'icon-picker-no-results';
            noResultsMsg.textContent = TEXT.icons.noResults(searchText);
            this.dom.iconPickerContainer.appendChild(noResultsMsg);
        }
    }

    /**
     * Selecciona un icono para la canción actual
     */
    selectIcon(icon, songs) {
        if (this.currentEditingSongId === null) return;

        const song = songs.find(s => s.id === this.currentEditingSongId);
        if (!song || song.played) return;

        song.icon = icon;
        song.iconType = ICON_TYPE.EMOJI;

        this.sounds.play(SOUND.CLICK);

        // Actualizar visualización de iconos seleccionados
        for (const opt of document.querySelectorAll('.icon-option')) {
            const isSelected = opt.textContent === icon;
            opt.classList.toggle('selected', isSelected);
            opt.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
        }

        // Llamar callback para actualizar UI
        if (this.onIconSelected) {
            this.onIconSelected();
        }

        setTimeout(() => this.closeIconModal(), ICON_MODAL_CLOSE_DELAY_MS);
    }

    /**
     * Carga un icono personalizado desde archivo
     */
    uploadCustomIcon(e, songs) {
        const file = e.target.files[0];
        if (!file) return;

        const song = songs.find(s => s.id === this.currentEditingSongId);
        if (!song) return;

        const reader = new FileReader();

        // Guardar referencia al callback antes de cerrar el modal
        const callback = this.onIconSelected;

        const handleUpdate = () => {
            song.iconType = ICON_TYPE.IMAGE;
            this.sounds.play(SOUND.CLICK);
            this.closeIconModal();

            // Usar la referencia guardada del callback
            if (callback) {
                callback();
            }
        };

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

    /**
     * Obtiene un icono aleatorio disponible
     */
    getRandomAvailableIcon(songs) {
        const availableIconsList = this.getAvailableIcons(songs);
        if (availableIconsList.length > 0) {
            return availableIconsList[Math.floor(Math.random() * availableIconsList.length)];
        }
        return availableIcons[Math.floor(Math.random() * availableIcons.length)];
    }
}
