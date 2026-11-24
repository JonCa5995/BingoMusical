/**
 * SettingsManager Module
 * Gestiona configuraciones de la aplicación: temas, pantalla completa y drag&drop
 */
export class SettingsManager {
    constructor(dom, audio, storage) {
        this.dom = dom;
        this.audio = audio;
        this.storage = storage;
    }

    /**
     * Carga y aplica el tema guardado
     */
    loadThemePreference() {
        const savedTheme = this.storage.loadTheme('dark');
        this.applyTheme(savedTheme);
    }

    /**
     * Alterna entre tema claro y oscuro
     */
    toggleTheme() {
        const currentTheme = document.documentElement.dataset.theme || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
        this.storage.saveTheme(newTheme);
        this.audio.playEffect('click');
    }

    /**
     * Aplica un tema específico
     */
    applyTheme(theme) {
        document.documentElement.dataset.theme = theme;
        this.dom.themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
        this.dom.themeToggleBtn.setAttribute('title', 
            theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'
        );
    }

    /**
     * Alterna pantalla completa
     */
    toggleFullscreen() {
        this.audio.playEffect('click');

        if (document.fullscreenElement) {
            document.exitFullscreen().then();
        } else {
            document.documentElement.requestFullscreen().catch(err => {
                console.warn('Error al entrar en pantalla completa:', err);
            });
        }
    }

    /**
     * Maneja cambios en el estado de pantalla completa
     */
    onFullscreenChange() {
        const isFullscreen = !!document.fullscreenElement;

        if (isFullscreen) {
            document.body.classList.add('fullscreen');
            this.dom.fullscreenBtn.innerHTML = '<span class="fullscreen-icon" aria-hidden="true">⊗</span>';
            this.dom.fullscreenBtn.setAttribute('aria-label', 'Salir de pantalla completa');
        } else {
            document.body.classList.remove('fullscreen');
            this.dom.fullscreenBtn.innerHTML = '<span class="fullscreen-icon" aria-hidden="true">⛶</span>';
            this.dom.fullscreenBtn.setAttribute('aria-label', 'Activar pantalla completa');
        }
    }

    /**
     * Configura drag & drop para agregar canciones
     */
    setupDragAndDrop(gameStartedCallback, onDropCallback) {
        const dropZones = [
            ...document.querySelectorAll('.file-label'),
            this.dom.songsSection
        ];

        const events = {
            prevent: ['dragenter', 'dragover', 'dragleave', 'drop'],
            highlight: ['dragenter', 'dragover'],
            unhighlight: ['dragleave', 'drop']
        };

        for (const zone of dropZones) {
            // Prevenir comportamiento por defecto
            for (const eventName of events.prevent) {
                zone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                }, false);
            }

            // Resaltar zona al arrastrar
            for (const eventName of events.highlight) {
                zone.addEventListener(eventName, () => {
                    if (!gameStartedCallback()) {
                        zone.classList.add('dragover');
                    }
                }, false);
            }

            // Quitar resaltado
            for (const eventName of events.unhighlight) {
                zone.addEventListener(eventName, () => zone.classList.remove('dragover'), false);
            }

            // Manejar el drop
            zone.addEventListener('drop', (e) => {
                if (gameStartedCallback()) return;

                this.dom.addSongsInput.files = e.dataTransfer.files;
                this.dom.addSongsInput.dispatchEvent(new Event('change', { bubbles: true }));
                
                if (onDropCallback) {
                    onDropCallback(e.dataTransfer.files);
                }
            }, false);
        }
    }

    /**
     * Obtiene el tema actual
     */
    getCurrentTheme() {
        return document.documentElement.dataset.theme || 'dark';
    }

    /**
     * Verifica si está en pantalla completa
     */
    isFullscreen() {
        return !!document.fullscreenElement;
    }
}
