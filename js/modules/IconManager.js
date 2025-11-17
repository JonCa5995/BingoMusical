/**
 * IconManager Module
 * Gestiona la selección y personalización de iconos para las canciones
 */
export class IconManager {
    constructor(dom, audio, getSongs) {
        this.dom = dom;
        this.audio = audio;
        this.getSongs = getSongs; // Función para obtener las canciones actuales
        this.availableIcons = [];
        this.currentEditingSongId = null;
        
        this.initializeIcons();
        this.setupEventListeners();
    }

    /**
     * Inicializa el array de iconos disponibles
     */
    initializeIcons() {
        this.availableIcons = [
            // 🎵 Música y sonido (28)
            '🎵', '🎶', '🎼', '🎹', '🎤', '🎧', '🎸', '🎺', '🎻', '🥁', '🎷', '🪕',
            '🪗', '📯', '🎙️', '📻', '💿', '🎚️', '🎛️', '🔊', '🔇', '🔔', '🔕', '📢',
            '📣', '🪘', '🪇', '🪈',

            // 🎉 Entretenimiento y celebración (32)
            '🎉', '🎊', '🎈', '🎁', '🎂', '🍰', '🍾', '🥂', '🍷', '🍸', '🍹', '🍺',
            '🎇', '✨', '💫', '🎭', '🎪', '🎬', '🎮', '🕹️', '🎯', '🎲',
            '🃏', '🎰', '🏆', '🥇', '🥈', '🥉', '🎖️', '🏅', '🎟️', '🎫',

            // 😀 Emociones y expresiones (32)
            '😀', '😁', '😂', '😅', '😊', '😍', '🥰', '😘', '😎', '🤩', '🤗',
            '😇', '🥳', '🤪', '😜', '🤓', '😏', '😌', '😴', '😢', '😭', '😡', '🤬',
            '😱', '😳', '🤯', '🤔', '🤨', '🙄', '😆', '😋', '😺',

            // 🌿 Naturaleza y colores (22)
            '🌞', '🌝', '🌙', '⭐', '🌟', '🌠', '🌌', '🌈', '🔥', '💧', '❄️', '🍀',
            '🌹', '🌻', '🌸', '🌷', '🌼', '🌳', '🌴', '🌵', '🍂', '🍁',

            // 👥 Personas y gente (56)
            '👶', '🧒', '👦', '👧', '🧑', '👩', '👨', '👵', '🧓', '👴', '👩‍🎤', '👩‍🏫',
            '👩‍🍳', '👩‍🚀', '👩‍⚕️', '👩‍💻', '👩‍🎨', '👩‍🔧', '👩‍🚒', '👩‍✈️', '👩‍⚖️', '👩‍🌾', '👩‍🔬',
            '👫', '🤝', '👏', '👍', '🙌', '🙏', '🤟', '✌️', '👸', '🤴', '👰', '🤵',
            '👼', '🎅', '🤶', '🧙', '🧚', '🧛', '🧜', '🧝', '🧞', '🧟', '🧌', '🦸',
            '🦹', '👯', '👨‍👩‍👧', '👨‍👩‍👦', '👨‍👩‍👧‍👦', '👪', '👨‍👦', '👩‍👧',

            // ✝️ Iglesias y religión / espiritualidad (23)
            '⛪', '🕌', '🛕', '🕍', '⛩️', '🏛️', '✝️', '✡️', '🕎', '☦️', '🛐', '📿',
            '🕊️', '🔔', '🕯️', '📖', '📜', '💒', '☁️', '🌅',
            '🌄', '🙏', '🧎',

            // 🍔 Comida y bebida (24)
            '🍎', '🍊', '🍌', '🍉', '🍇', '🍓', '🍒', '🍍', '🥭', '🥝', '🍑', '🍋',
            '🥑', '🥦', '🥕', '🌽', '🥔', '🍞', '🥐', '🥨', '🍔', '🍕', '🍟', '🌭',

            // 🚗 Transporte y viajes (21)
            '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🚚',
            '🚜', '🚲', '🛵', '🏍️', '🚂', '✈️', '🚀', '🛸', '⛵', '🚢',

            // 💻 Tecnología (17)
            '💻', '🖨️', '⌨️', '🖱️', '📱', '☎️', '📞', '📟', '📠', '📺',
            '📷', '🎥', '🎞️', '📹', '💾', '🖲️', '🔋',

            // ⚽ Deportes y actividades (24)
            '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸', '🥊',
            '🥋', '🥅', '⛳', '⛸️', '🎿', '🛷', '🥌', '🏒', '🏑', '🏏', '🤿', '🏹'
        ];
    }

    /**
     * Configura event listeners para el modal de iconos
     */
    setupEventListeners() {
        this.dom.closeIconModalBtn.addEventListener('click', () => this.closeIconModal());
        this.dom.iconModal.addEventListener('click', (e) => {
            if (e.target.id === 'icon-modal') this.closeIconModal();
        });

        this.dom.uploadCustomIconBtn.addEventListener('click', () => {
            this.dom.customIconUploadInput.click();
        });
        this.dom.customIconUploadInput.addEventListener('change', (e) => {
            const songs = this.getSongs();
            this.uploadCustomIcon(e, songs);
        });
    }

    /**
     * Obtiene los iconos disponibles (no usados)
     */
    getAvailableIcons(songs) {
        const usedIcons = new Set(
            songs
                .filter(song => song.iconType === 'emoji' && song.icon != null)
                .map(song => song.icon)
        );
        return this.availableIcons.filter(icon => !usedIcons.has(icon));
    }

    /**
     * Verifica si un icono está en uso
     */
    isIconUsed(icon, songs) {
        return songs.some(s => 
            s.icon === icon && 
            s.iconType === 'emoji' && 
            s.id !== this.currentEditingSongId
        );
    }

    /**
     * Abre el modal de selección de iconos
     */
    openIconPicker(songId, songs, onIconSelected) {
        const song = songs.find(s => s.id === songId);
        if (!song) return { success: false, error: 'Canción no encontrada' };

        if (song.played) {
            return { 
                success: false, 
                error: 'No puedes cambiar el icono de una canción que ya fue reproducida.',
                title: 'Canción Ya Reproducida'
            };
        }

        this.currentEditingSongId = songId;
        this.onIconSelected = onIconSelected;
        this.dom.modalSongTitle.textContent = song.title;

        // Renderizar iconos usando DocumentFragment
        const fragment = document.createDocumentFragment();

        for (const icon of this.availableIcons) {
            const iconOption = document.createElement('button');
            iconOption.type = 'button';
            iconOption.className = 'icon-option';
            iconOption.setAttribute('aria-label', `Seleccionar icono ${icon}`);

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
                iconOption.title = 'Este icono ya está en uso';
                iconOption.disabled = true;
            } else {
                iconOption.onclick = () => {
                    if (!isUsed || isCurrentSongIcon) {
                        this.selectIcon(icon, 'emoji', songs);
                    }
                };
            }

            iconOption.textContent = icon;
            fragment.appendChild(iconOption);
        }

        this.dom.iconPickerContainer.innerHTML = '';
        this.dom.iconPickerContainer.appendChild(fragment);

        this.dom.iconModal.classList.remove('hidden');
        
        if (this.dom.iconModal.showModal) {
            this.dom.iconModal.showModal();
        }
        
        this.audio.playEffect('click');

        return { success: true };
    }

    /**
     * Cierra el modal de iconos
     */
    closeIconModal() {
        if (this.dom.iconModal.close) {
            this.dom.iconModal.close();
        }
        
        this.dom.iconModal.classList.add('hidden');
        this.currentEditingSongId = null;
        this.onIconSelected = null;
    }

    /**
     * Selecciona un icono para la canción actual
     */
    selectIcon(icon, iconType, songs) {
        if (this.currentEditingSongId === null) return;

        const song = songs.find(s => s.id === this.currentEditingSongId);
        if (!song || song.played) return;

        song.icon = icon;
        song.iconType = iconType;

        this.audio.playEffect('click');

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

        setTimeout(() => this.closeIconModal(), 300);
    }

    /**
     * Carga un icono personalizado desde archivo
     */
    async uploadCustomIcon(e, songs) {
        const file = e.target.files[0];
        if (!file) return;

        const song = songs.find(s => s.id === this.currentEditingSongId);
        if (!song) return;

        const reader = new FileReader();

        const handleUpdate = () => {
            song.iconType = 'image';
            this.audio.playEffect('click');
            this.closeIconModal();
            
            if (this.onIconSelected) {
                this.onIconSelected();
            }

            return {
                success: true,
                message: 'Icono personalizado cargado correctamente.',
                title: 'Icono Actualizado'
            };
        };

        reader.onload = (event) => {
            if (file.type === 'image/png') {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = 200;
                    canvas.height = 200;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, 200, 200);
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
        return this.availableIcons[Math.floor(Math.random() * this.availableIcons.length)];
    }
}
