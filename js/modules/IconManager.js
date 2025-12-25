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
        this.iconKeywords = {};
        this.currentEditingSongId = null;
        
        this.initializeIcons();
        this.initializeKeywords();
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

            // 😀 Emociones y expresiones (50)
            '😀', '😁', '😂', '😅', '😊', '😍', '🥰', '😘', '😎', '🤩', '🤗',
            '😇', '🥳', '🤪', '😜', '🤓', '😏', '😌', '😴', '😢', '😭', '😡', '🤬',
            '😱', '😳', '🤯', '🤔', '🤨', '🙄', '😆', '😋', '😺',
            '🤡', '👹', '👺', '💀', '☠️', '👻', '👽', '🤖', '🎃', '😈',
            '👿', '🙃', '😵', '😵‍💫', '🥴', '🫠', '🫨', '🤯', '🤪',

            // ❤️ Amor y corazones (20)
            '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💗',
            '💖', '💝', '💘', '💕', '💞', '💓', '💔', '❣️', '💌', '💋',

            // 🌿 Naturaleza y paisajes (36)
            '🌞', '🌝', '🌙', '⭐', '🌟', '🌠', '🌌', '🌈', '🔥', '💧', '❄️', '🍀',
            '🌹', '🌻', '🌸', '🌷', '🌼', '🌳', '🌴', '🌵', '🍂', '🍁',
            '🏔️', '⛰️', '🌋', '🗻', '🏕️', '🏖️', '🏜️', '🏝️', '🌊', '🏞️',
            '🌲', '🌾', '🪨', '🏠',

            // 👥 Personas y gente (62)
            '👶', '🧒', '👦', '👧', '🧑', '👩', '👨', '👵', '🧓', '👴', '👩‍🎤', '👩‍🏫',
            '👩‍🍳', '👩‍🚀', '👩‍⚕️', '👩‍💻', '👩‍🎨', '👩‍🔧', '👩‍🚒', '👩‍✈️', '👩‍⚖️', '👩‍🌾', '👩‍🔬',
            '👫', '🤝', '👏', '👍', '🙌', '🙏', '🤟', '✌️', '👸', '🤴', '👰', '🤵',
            '👼', '🎅', '🤶', '🧙', '🧚', '🧛', '🧜', '🧝', '🧞', '🧟', '🧌', '🦸',
            '🦹', '👯', '👨‍👩‍👧', '👨‍👩‍👦', '👨‍👩‍👧‍👦', '👪', '👨‍👦', '👩‍👧', '💃', '🕺', '🕴️', '🧖', '🧘', '🤸',

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
            '🥋', '🥅', '⛳', '⛸️', '🎿', '🛷', '🥌', '🏒', '🏑', '🏏', '🤿', '🏹',

            // 🐾 Animales y bichos (40)
            '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐸',
            '🐵', '🙈', '🙉', '🙊', '🐔', '🐧', '🐦', '🐤', '🦆', '🦉',
            '🦇', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦗', '🕷️', '🦂',
            '🐢', '🐍', '🦎', '🐙', '🦑', '🦀', '🦞', '🦐', '🐠', '🐬',

            // 💪 Fuerza y poder (20)
            '💪', '🦾', '⚡', '💥', '🦁', '🐯', '🦅', '🐉', '🦍', '🐺',
            '🗡️', '⚔️', '🛡️', '🏋️', '🤺', '🧗', '💎', '👊', '🔱', '⚓',

            // ⏰ Relojes y tiempo (20)
            '⏰', '⏱️', '⏲️', '🕰️', '⌚', '⏳', '⌛', '🕛', '🕐', '🕑', '🕒',
            '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '📅',

        ];
    }

    /**
     * Inicializa el diccionario de palabras clave para búsqueda de iconos
     */
    initializeKeywords() {
        this.iconKeywords = {
            // 🎵 Música y sonido
            '🎵': ['musica', 'nota', 'cancion', 'melodia', 'music', 'song'],
            '🎶': ['musica', 'notas', 'cancion', 'melodia', 'music'],
            '🎼': ['partitura', 'musica', 'pentagrama', 'nota'],
            '🎹': ['piano', 'teclado', 'musica', 'instrumento'],
            '🎤': ['microfono', 'cantar', 'karaoke', 'voz', 'cantante'],
            '🎧': ['auriculares', 'audifonos', 'escuchar', 'musica', 'headphones'],
            '🎸': ['guitarra', 'rock', 'musica', 'instrumento', 'guitar'],
            '🎺': ['trompeta', 'instrumento', 'viento', 'musica'],
            '🎻': ['violin', 'instrumento', 'clasica', 'musica'],
            '🥁': ['tambor', 'bateria', 'percusion', 'drums'],
            '🎷': ['saxofon', 'jazz', 'instrumento', 'viento'],
            '🪕': ['banjo', 'instrumento', 'country', 'cuerda'],
            '🪗': ['acordeon', 'instrumento', 'musica'],
            '📯': ['corneta', 'cuerno', 'instrumento'],
            '🎙️': ['microfono', 'radio', 'podcast', 'grabacion'],
            '📻': ['radio', 'musica', 'emisora'],
            '💿': ['cd', 'disco', 'musica', 'album'],
            '🎚️': ['mezclador', 'volumen', 'audio', 'dj'],
            '🎛️': ['control', 'perilla', 'audio', 'dj'],
            '🔊': ['altavoz', 'volumen', 'sonido', 'audio'],
            '🔇': ['silencio', 'mudo', 'volumen'],
            '🔔': ['campana', 'notificacion', 'sonido', 'alarma'],
            '🔕': ['silencio', 'campana', 'mudo'],
            '📢': ['megafono', 'anuncio', 'altavoz'],
            '📣': ['megafono', 'animador', 'anuncio'],
            '🪘': ['tambor', 'africano', 'percusion'],
            '🪇': ['maracas', 'percusion', 'ritmo'],
            '🪈': ['flauta', 'viento', 'instrumento'],

            // 🎉 Entretenimiento y celebración
            '🎉': ['fiesta', 'celebracion', 'cumpleanos', 'party'],
            '🎊': ['confeti', 'fiesta', 'celebracion'],
            '🎈': ['globo', 'fiesta', 'cumpleanos', 'balloon'],
            '🎁': ['regalo', 'presente', 'cumpleanos', 'navidad', 'gift'],
            '🎂': ['pastel', 'tarta', 'cumpleanos', 'cake'],
            '🍰': ['pastel', 'tarta', 'postre', 'dulce'],
            '🍾': ['champan', 'champagne', 'brindis', 'celebracion'],
            '🥂': ['brindis', 'copas', 'celebracion', 'champan'],
            '🍷': ['vino', 'copa', 'bebida', 'wine'],
            '🍸': ['coctel', 'martini', 'bebida', 'cocktail'],
            '🍹': ['coctel', 'tropical', 'bebida'],
            '🍺': ['cerveza', 'beer', 'bebida', 'bar'],
            '🎇': ['bengala', 'fuegos', 'artificiales', 'fireworks'],
            '✨': ['brillos', 'estrellas', 'magia', 'sparkles'],
            '💫': ['estrella', 'mareo', 'magia', 'brillo'],
            '🎭': ['teatro', 'mascara', 'drama', 'comedia', 'arte'],
            '🎪': ['circo', 'carpa', 'espectaculo'],
            '🎬': ['cine', 'pelicula', 'claqueta', 'movie', 'film'],
            '🎮': ['videojuego', 'control', 'gamer', 'gaming', 'play'],
            '🕹️': ['joystick', 'arcade', 'juego', 'retro'],
            '🎯': ['diana', 'objetivo', 'dardo', 'target'],
            '🎲': ['dado', 'juego', 'azar', 'casino', 'dice'],
            '🃏': ['joker', 'carta', 'poker', 'naipe'],
            '🎰': ['tragamonedas', 'casino', 'suerte', 'slot'],
            '🏆': ['trofeo', 'premio', 'campeon', 'ganador', 'trophy'],
            '🥇': ['oro', 'medalla', 'primero', 'ganador', 'gold'],
            '🥈': ['plata', 'medalla', 'segundo', 'silver'],
            '🥉': ['bronce', 'medalla', 'tercero', 'bronze'],
            '🎖️': ['medalla', 'militar', 'honor'],
            '🏅': ['medalla', 'deportes', 'premio'],
            '🎟️': ['ticket', 'entrada', 'boleto'],
            '🎫': ['ticket', 'entrada', 'boleto', 'pase'],

            // 😀 Emociones y expresiones
            '😀': ['feliz', 'sonrisa', 'alegre', 'happy'],
            '😁': ['feliz', 'sonrisa', 'alegre', 'risa'],
            '😂': ['risa', 'llorar', 'carcajada', 'gracioso', 'laugh'],
            '😅': ['nervioso', 'sudor', 'risa', 'alivio'],
            '😊': ['sonrisa', 'feliz', 'timido', 'dulce'],
            '😍': ['amor', 'enamorado', 'corazones', 'ojos', 'love'],
            '🥰': ['amor', 'cariño', 'corazones', 'ternura'],
            '😘': ['beso', 'amor', 'guiño', 'kiss'],
            '😎': ['cool', 'gafas', 'genial', 'sol'],
            '🤩': ['estrella', 'asombro', 'emocion', 'wow'],
            '🤗': ['abrazo', 'manos', 'cariño', 'hug'],
            '😇': ['angel', 'inocente', 'santo', 'bueno'],
            '🥳': ['fiesta', 'celebrar', 'cumpleanos', 'party'],
            '🤪': ['loco', 'tonto', 'lengua', 'crazy'],
            '😜': ['guiño', 'lengua', 'bromista', 'travieso'],
            '🤓': ['nerd', 'gafas', 'estudioso', 'listo'],
            '😏': ['picaro', 'presumido', 'travieso'],
            '😌': ['alivio', 'paz', 'tranquilo', 'relajado'],
            '😴': ['dormir', 'sueño', 'cansado', 'sleep'],
            '😢': ['triste', 'lagrima', 'llorar', 'sad'],
            '😭': ['llorar', 'triste', 'lagrimas', 'cry'],
            '😡': ['enfadado', 'enojado', 'rabia', 'angry'],
            '🤬': ['enfadado', 'insulto', 'rabia', 'censura'],
            '😱': ['miedo', 'terror', 'grito', 'susto', 'scared'],
            '😳': ['sonrojo', 'verguenza', 'sorpresa'],
            '🤯': ['explosion', 'mente', 'sorpresa', 'alucinado', 'mindblown'],
            '🤔': ['pensar', 'duda', 'hmm', 'think'],
            '🤨': ['duda', 'sospecha', 'ceja'],
            '🙄': ['ojos', 'aburrido', 'fastidio'],
            '😆': ['risa', 'feliz', 'ojos', 'cerrados'],
            '😋': ['delicioso', 'rico', 'lengua', 'yummy'],
            '😺': ['gato', 'feliz', 'sonrisa', 'cat'],
            '🤡': ['payaso', 'clown', 'circo', 'gracioso'],
            '👹': ['ogro', 'demonio', 'monstruo', 'japones'],
            '👺': ['tengu', 'demonio', 'japones', 'mascara'],
            '💀': ['calavera', 'muerte', 'skull', 'hueso'],
            '☠️': ['calavera', 'huesos', 'pirata', 'muerte', 'peligro'],
            '👻': ['fantasma', 'ghost', 'halloween', 'boo'],
            '👽': ['alien', 'extraterrestre', 'ovni', 'et'],
            '🤖': ['robot', 'maquina', 'androide', 'tecnologia'],
            '🎃': ['calabaza', 'halloween', 'pumpkin'],
            '😈': ['diablo', 'demonio', 'travieso', 'devil'],
            '👿': ['diablo', 'demonio', 'enfadado', 'evil'],
            '🙃': ['reves', 'ironia', 'sarcasmo'],
            '😵': ['mareado', 'confuso', 'muerto', 'dizzy'],
            '😵‍💫': ['mareado', 'espiral', 'confuso', 'hipnotizado'],
            '🥴': ['borracho', 'mareado', 'confuso', 'woozy'],
            '🫠': ['derretir', 'calor', 'verguenza'],
            '🫨': ['temblar', 'vibrar', 'nervioso'],

            // ❤️ Amor y corazones
            '❤️': ['corazon', 'amor', 'rojo', 'love', 'heart'],
            '🧡': ['corazon', 'naranja', 'amor'],
            '💛': ['corazon', 'amarillo', 'amistad', 'amor'],
            '💚': ['corazon', 'verde', 'amor', 'naturaleza'],
            '💙': ['corazon', 'azul', 'amor', 'confianza'],
            '💜': ['corazon', 'morado', 'amor', 'purple'],
            '🖤': ['corazon', 'negro', 'amor', 'dark'],
            '🤍': ['corazon', 'blanco', 'amor', 'puro'],
            '🤎': ['corazon', 'marron', 'amor'],
            '💗': ['corazon', 'creciendo', 'amor', 'latido'],
            '💖': ['corazon', 'brillante', 'amor', 'sparkle'],
            '💝': ['corazon', 'lazo', 'regalo', 'amor'],
            '💘': ['corazon', 'flecha', 'cupido', 'amor', 'enamorado'],
            '💕': ['corazones', 'amor', 'pareja', 'dos'],
            '💞': ['corazones', 'girando', 'amor'],
            '💓': ['corazon', 'latiendo', 'amor', 'beat'],
            '💔': ['corazon', 'roto', 'triste', 'broken'],
            '❣️': ['corazon', 'exclamacion', 'amor'],
            '💌': ['carta', 'amor', 'sobre', 'letter'],
            '💋': ['beso', 'labios', 'amor', 'kiss'],

            // 🌿 Naturaleza y paisajes
            '🌞': ['sol', 'dia', 'calor', 'verano', 'sun'],
            '🌝': ['luna', 'llena', 'noche', 'cara'],
            '🌙': ['luna', 'noche', 'creciente', 'moon'],
            '⭐': ['estrella', 'star', 'noche', 'brillo'],
            '🌟': ['estrella', 'brillante', 'brillo', 'star'],
            '🌠': ['estrella', 'fugaz', 'deseo', 'shooting'],
            '🌌': ['galaxia', 'via', 'lactea', 'noche', 'espacio'],
            '🌈': ['arcoiris', 'rainbow', 'colores', 'lluvia'],
            '🔥': ['fuego', 'llama', 'caliente', 'fire', 'hot'],
            '💧': ['agua', 'gota', 'lluvia', 'water', 'drop'],
            '❄️': ['nieve', 'frio', 'hielo', 'invierno', 'snow', 'ice'],
            '🍀': ['trebol', 'suerte', 'verde', 'luck', 'clover'],
            '🌹': ['rosa', 'flor', 'roja', 'amor', 'rose'],
            '🌻': ['girasol', 'flor', 'amarillo', 'sunflower'],
            '🌸': ['cerezo', 'flor', 'rosa', 'primavera', 'sakura'],
            '🌷': ['tulipan', 'flor', 'primavera', 'tulip'],
            '🌼': ['flor', 'margarita', 'primavera', 'flower'],
            '🌳': ['arbol', 'bosque', 'naturaleza', 'tree'],
            '🌴': ['palmera', 'tropical', 'playa', 'palm'],
            '🌵': ['cactus', 'desierto', 'mexico'],
            '🍂': ['hojas', 'otono', 'secas', 'autumn', 'fall'],
            '🍁': ['hoja', 'arce', 'canada', 'otono', 'maple'],
            '🏔️': ['montana', 'nieve', 'pico', 'mountain'],
            '⛰️': ['montana', 'roca', 'mountain'],
            '🌋': ['volcan', 'lava', 'erupcion', 'volcano'],
            '🗻': ['fuji', 'montana', 'japon', 'mount'],
            '🏕️': ['camping', 'tienda', 'naturaleza', 'camp'],
            '🏖️': ['playa', 'beach', 'verano', 'arena', 'sol'],
            '🏜️': ['desierto', 'arena', 'calor', 'desert'],
            '🏝️': ['isla', 'tropical', 'palmera', 'island'],
            '🌊': ['ola', 'mar', 'oceano', 'wave', 'sea', 'agua'],
            '🏞️': ['parque', 'paisaje', 'naturaleza', 'rio'],
            '🌲': ['pino', 'arbol', 'bosque', 'navidad'],
            '🌾': ['trigo', 'campo', 'agricultura', 'cereal'],
            '🪨': ['roca', 'piedra', 'rock', 'stone'],
            '🏠': ['casa', 'hogar', 'home', 'house'],

            // 👥 Personas y gente
            '👶': ['bebe', 'baby', 'nino', 'pequeno'],
            '🧒': ['nino', 'child', 'infancia'],
            '👦': ['nino', 'chico', 'boy'],
            '👧': ['nina', 'chica', 'girl'],
            '🧑': ['persona', 'adulto', 'person'],
            '👩': ['mujer', 'woman', 'chica', 'femenino'],
            '👨': ['hombre', 'man', 'chico', 'masculino'],
            '👵': ['abuela', 'anciana', 'grandma'],
            '🧓': ['anciano', 'viejo', 'abuelo'],
            '👴': ['abuelo', 'anciano', 'grandpa'],
            '👩‍🎤': ['cantante', 'rockera', 'artista', 'singer'],
            '👩‍🏫': ['profesora', 'maestra', 'teacher'],
            '👩‍🍳': ['cocinera', 'chef', 'cook'],
            '👩‍🚀': ['astronauta', 'espacio', 'astronaut'],
            '👩‍⚕️': ['doctora', 'medica', 'doctor', 'salud'],
            '👩‍💻': ['programadora', 'informatica', 'developer'],
            '👩‍🎨': ['artista', 'pintora', 'artist'],
            '👩‍🔧': ['mecanica', 'ingeniera', 'mechanic'],
            '👩‍🚒': ['bombera', 'firefighter'],
            '👩‍✈️': ['piloto', 'aviadora', 'pilot'],
            '👩‍⚖️': ['jueza', 'abogada', 'judge'],
            '👩‍🌾': ['granjera', 'agricultora', 'farmer'],
            '👩‍🔬': ['cientifica', 'scientist'],
            '👫': ['pareja', 'novios', 'couple'],
            '🤝': ['saludo', 'manos', 'acuerdo', 'handshake'],
            '👏': ['aplausos', 'clap', 'bravo'],
            '👍': ['bien', 'ok', 'like', 'pulgar'],
            '🙌': ['manos', 'arriba', 'celebrar', 'yay'],
            '🙏': ['rezar', 'orar', 'gracias', 'pray', 'please'],
            '🤟': ['rock', 'mano', 'love', 'cuernos'],
            '✌️': ['paz', 'victoria', 'peace', 'dos'],
            '👸': ['princesa', 'reina', 'corona', 'princess'],
            '🤴': ['principe', 'rey', 'corona', 'prince'],
            '👰': ['novia', 'boda', 'bride', 'casarse'],
            '🤵': ['novio', 'boda', 'groom', 'traje'],
            '👼': ['angel', 'bebe', 'cielo', 'alas'],
            '🎅': ['papa', 'noel', 'santa', 'navidad', 'christmas'],
            '🤶': ['mama', 'noel', 'navidad', 'christmas'],
            '🧙': ['mago', 'wizard', 'magia', 'harry'],
            '🧚': ['hada', 'fairy', 'magia', 'alas'],
            '🧛': ['vampiro', 'dracula', 'vampire'],
            '🧜': ['sirena', 'mermaid', 'mar'],
            '🧝': ['elfo', 'elf', 'orejas'],
            '🧞': ['genio', 'genie', 'lampara', 'deseo'],
            '🧟': ['zombie', 'muerto', 'viviente'],
            '🧌': ['troll', 'ogro', 'monstruo'],
            '🦸': ['superheroe', 'hero', 'capa'],
            '🦹': ['supervillano', 'villain', 'malo'],
            '👯': ['bailar', 'conejitas', 'dance', 'bunny'],
            '👨‍👩‍👧': ['familia', 'family', 'hija'],
            '👨‍👩‍👦': ['familia', 'family', 'hijo'],
            '👨‍👩‍👧‍👦': ['familia', 'family', 'hijos'],
            '👪': ['familia', 'family', 'padres'],
            '👨‍👦': ['padre', 'hijo', 'papa'],
            '👩‍👧': ['madre', 'hija', 'mama'],
            '💃': ['bailar', 'baile', 'dance', 'mujer', 'salsa', 'flamenco'],
            '🕺': ['bailar', 'baile', 'dance', 'hombre', 'disco'],
            '🕴️': ['levitar', 'traje', 'misterioso'],
            '🧖': ['spa', 'sauna', 'relajar'],
            '🧘': ['yoga', 'meditar', 'zen', 'paz'],
            '🤸': ['gimnasia', 'voltereta', 'acrobata'],

            // ✝️ Iglesias y religión
            '⛪': ['iglesia', 'church', 'religion', 'cristiano'],
            '🕌': ['mezquita', 'mosque', 'islam', 'muslim'],
            '🛕': ['templo', 'hindu', 'india'],
            '🕍': ['sinagoga', 'judio', 'synagogue'],
            '⛩️': ['torii', 'japon', 'shinto', 'templo'],
            '🏛️': ['templo', 'griego', 'columnas', 'clasico'],
            '✝️': ['cruz', 'cristiano', 'cross', 'jesus'],
            '✡️': ['estrella', 'david', 'judio', 'jewish'],
            '🕎': ['menora', 'judio', 'hanuka'],
            '☦️': ['cruz', 'ortodoxa', 'orthodox'],
            '🛐': ['orar', 'religion', 'rezar', 'worship'],
            '📿': ['rosario', 'cuentas', 'orar', 'beads'],
            '🕊️': ['paloma', 'paz', 'dove', 'peace'],
            '🕯️': ['vela', 'candle', 'luz'],
            '📖': ['libro', 'biblia', 'leer', 'book'],
            '📜': ['pergamino', 'scroll', 'antiguo'],
            '💒': ['capilla', 'boda', 'church', 'wedding'],
            '☁️': ['nube', 'cielo', 'cloud'],
            '🌅': ['amanecer', 'sunrise', 'sol', 'playa'],
            '🌄': ['amanecer', 'montana', 'sunrise'],
            '🧎': ['arrodillarse', 'orar', 'kneel'],

            // 🍔 Comida y bebida
            '🍎': ['manzana', 'apple', 'fruta', 'roja'],
            '🍊': ['naranja', 'orange', 'fruta', 'citrico'],
            '🍌': ['platano', 'banana', 'fruta', 'amarillo'],
            '🍉': ['sandia', 'watermelon', 'fruta', 'verano'],
            '🍇': ['uvas', 'grapes', 'fruta', 'vino'],
            '🍓': ['fresa', 'strawberry', 'fruta', 'roja'],
            '🍒': ['cereza', 'cherry', 'fruta', 'roja'],
            '🍍': ['pina', 'pineapple', 'fruta', 'tropical'],
            '🥭': ['mango', 'fruta', 'tropical'],
            '🥝': ['kiwi', 'fruta', 'verde'],
            '🍑': ['melocoton', 'peach', 'fruta'],
            '🍋': ['limon', 'lemon', 'citrico', 'amarillo'],
            '🥑': ['aguacate', 'avocado', 'verde'],
            '🥦': ['brocoli', 'broccoli', 'verdura', 'verde'],
            '🥕': ['zanahoria', 'carrot', 'naranja', 'verdura'],
            '🌽': ['maiz', 'corn', 'elote', 'amarillo'],
            '🥔': ['patata', 'papa', 'potato'],
            '🍞': ['pan', 'bread', 'panaderia'],
            '🥐': ['croissant', 'pan', 'frances'],
            '🥨': ['pretzel', 'pan', 'salado'],
            '🍔': ['hamburguesa', 'burger', 'comida', 'rapida'],
            '🍕': ['pizza', 'italiano', 'comida'],
            '🍟': ['papas', 'fritas', 'fries', 'patatas'],
            '🌭': ['hotdog', 'perrito', 'salchicha'],

            // 🚗 Transporte y viajes
            '🚗': ['coche', 'carro', 'auto', 'car'],
            '🚕': ['taxi', 'cab', 'amarillo'],
            '🚙': ['suv', 'coche', 'todoterreno'],
            '🚌': ['autobus', 'bus', 'transporte'],
            '🚎': ['trolebus', 'bus', 'electrico'],
            '🏎️': ['ferrari', 'formula1', 'carrera', 'racing'],
            '🚓': ['policia', 'police', 'patrulla'],
            '🚑': ['ambulancia', 'ambulance', 'emergencia'],
            '🚒': ['bomberos', 'fire', 'camion'],
            '🚐': ['furgoneta', 'van', 'camper'],
            '🚚': ['camion', 'truck', 'mudanza'],
            '🚜': ['tractor', 'granja', 'campo'],
            '🚲': ['bicicleta', 'bike', 'bicycle', 'ciclismo'],
            '🛵': ['scooter', 'vespa', 'moto'],
            '🏍️': ['moto', 'motorcycle', 'motocicleta'],
            '🚂': ['tren', 'train', 'locomotora'],
            '✈️': ['avion', 'plane', 'volar', 'viaje'],
            '🚀': ['cohete', 'rocket', 'espacio', 'nasa'],
            '🛸': ['ovni', 'ufo', 'alien', 'platillo'],
            '⛵': ['barco', 'velero', 'sail', 'boat'],
            '🚢': ['barco', 'crucero', 'ship'],

            // 💻 Tecnología
            '💻': ['laptop', 'ordenador', 'computadora', 'computer'],
            '🖨️': ['impresora', 'printer'],
            '⌨️': ['teclado', 'keyboard'],
            '🖱️': ['raton', 'mouse'],
            '📱': ['movil', 'telefono', 'phone', 'celular', 'smartphone'],
            '☎️': ['telefono', 'phone', 'antiguo'],
            '📞': ['telefono', 'llamar', 'phone'],
            '📟': ['buscador', 'pager', 'beeper'],
            '📠': ['fax', 'oficina'],
            '📺': ['television', 'tv', 'tele'],
            '📷': ['camara', 'foto', 'camera', 'photo'],
            '🎥': ['camara', 'video', 'cine', 'film'],
            '🎞️': ['pelicula', 'film', 'cine', 'rollo'],
            '📹': ['camara', 'video', 'grabar'],
            '💾': ['disquete', 'floppy', 'guardar', 'save'],
            '🖲️': ['trackball', 'raton', 'control'],
            '🔋': ['bateria', 'pila', 'battery', 'energia'],

            // ⚽ Deportes y actividades
            '⚽': ['futbol', 'soccer', 'balon', 'football'],
            '🏀': ['baloncesto', 'basketball', 'nba'],
            '🏈': ['americano', 'football', 'nfl'],
            '⚾': ['beisbol', 'baseball'],
            '🎾': ['tenis', 'tennis', 'pelota'],
            '🏐': ['voleibol', 'volleyball'],
            '🏉': ['rugby', 'balon'],
            '🥏': ['frisbee', 'disco', 'ultimate'],
            '🎱': ['billar', 'pool', 'bola8'],
            '🏓': ['pingpong', 'tenis', 'mesa'],
            '🏸': ['badminton', 'raqueta'],
            '🥊': ['boxeo', 'boxing', 'guante'],
            '🥋': ['karate', 'judo', 'artes', 'marciales'],
            '🥅': ['porteria', 'gol', 'goal'],
            '⛳': ['golf', 'hoyo', 'green'],
            '⛸️': ['patinar', 'hielo', 'skating', 'ice'],
            '🎿': ['esqui', 'ski', 'nieve', 'invierno'],
            '🛷': ['trineo', 'sled', 'nieve'],
            '🥌': ['curling', 'hielo'],
            '🏒': ['hockey', 'hielo', 'palo'],
            '🏑': ['hockey', 'campo', 'stick'],
            '🏏': ['cricket', 'bat'],
            '🤿': ['buceo', 'snorkel', 'diving', 'mar'],
            '🏹': ['arco', 'flecha', 'archery', 'tiro'],

            // 🐾 Animales y bichos
            '🐶': ['perro', 'dog', 'mascota', 'cachorro'],
            '🐱': ['gato', 'cat', 'mascota', 'miau'],
            '🐭': ['raton', 'mouse', 'pequeño'],
            '🐹': ['hamster', 'mascota', 'roedor'],
            '🐰': ['conejo', 'rabbit', 'bunny'],
            '🦊': ['zorro', 'fox', 'naranja'],
            '🐻': ['oso', 'bear', 'peluche'],
            '🐼': ['panda', 'oso', 'china'],
            '🐨': ['koala', 'australia'],
            '🐸': ['rana', 'frog', 'verde'],
            '🐵': ['mono', 'monkey', 'simio'],
            '🙈': ['mono', 'ojos', 'tapados', 'vergüenza'],
            '🙉': ['mono', 'orejas', 'tapadas'],
            '🙊': ['mono', 'boca', 'tapada'],
            '🐔': ['pollo', 'gallina', 'chicken'],
            '🐧': ['pinguino', 'penguin', 'frio'],
            '🐦': ['pajaro', 'bird', 'ave'],
            '🐤': ['pollito', 'chick', 'amarillo'],
            '🦆': ['pato', 'duck'],
            '🦉': ['buho', 'owl', 'noche', 'sabio'],
            '🦇': ['murcielago', 'bat', 'noche', 'batman'],
            '🐝': ['abeja', 'bee', 'miel', 'avispa', 'honey'],
            '🐛': ['oruga', 'gusano', 'caterpillar', 'bug'],
            '🦋': ['mariposa', 'butterfly', 'insecto'],
            '🐌': ['caracol', 'snail', 'lento'],
            '🐞': ['mariquita', 'ladybug', 'insecto'],
            '🐜': ['hormiga', 'ant', 'insecto'],
            '🦗': ['grillo', 'cricket', 'insecto'],
            '🕷️': ['araña', 'spider', 'spiderman'],
            '🦂': ['escorpion', 'scorpion', 'peligro'],
            '🐢': ['tortuga', 'turtle', 'lenta'],
            '🐍': ['serpiente', 'snake', 'vibora'],
            '🦎': ['lagarto', 'lizard', 'reptil'],
            '🐙': ['pulpo', 'octopus', 'mar'],
            '🦑': ['calamar', 'squid', 'mar'],
            '🦀': ['cangrejo', 'crab', 'mar', 'playa'],
            '🦞': ['langosta', 'lobster', 'mar'],
            '🦐': ['camaron', 'gamba', 'shrimp'],
            '🐠': ['pez', 'fish', 'mar', 'acuario'],
            '🐬': ['delfin', 'dolphin', 'mar', 'inteligente'],

            // 💪 Fuerza y poder
            '💪': ['musculo', 'fuerza', 'strong', 'muscle', 'bicep'],
            '🦾': ['brazo', 'robot', 'protesis', 'cyborg'],
            '⚡': ['rayo', 'lightning', 'energia', 'electricidad', 'flash'],
            '💥': ['explosion', 'boom', 'pow', 'impacto'],
            '🦁': ['leon', 'lion', 'rey', 'africa', 'rugir'],
            '🐯': ['tigre', 'tiger', 'rayas', 'felino'],
            '🦅': ['aguila', 'eagle', 'ave', 'libertad'],
            '🐉': ['dragon', 'fuego', 'fantasia', 'china'],
            '🦍': ['gorila', 'gorilla', 'fuerza', 'simio'],
            '🐺': ['lobo', 'wolf', 'manada', 'salvaje'],
            '🗡️': ['espada', 'sword', 'arma', 'lucha'],
            '⚔️': ['espadas', 'batalla', 'cruzadas', 'combate'],
            '🛡️': ['escudo', 'shield', 'defensa', 'proteccion'],
            '🏋️': ['pesas', 'gym', 'gimnasio', 'weightlifting'],
            '🤺': ['esgrima', 'fencing', 'espada'],
            '🧗': ['escalada', 'climbing', 'roca', 'montana'],
            '💎': ['diamante', 'diamond', 'joya', 'gema', 'valioso'],
            '👊': ['puño', 'punch', 'golpe', 'fist'],
            '🔱': ['tridente', 'trident', 'poseidon', 'mar'],
            '⚓': ['ancla', 'anchor', 'mar', 'barco', 'marinero'],

            // ⏰ Relojes y tiempo
            '⏰': ['alarma', 'despertador', 'alarm', 'clock', 'reloj'],
            '⏱️': ['cronometro', 'stopwatch', 'tiempo'],
            '⏲️': ['temporizador', 'timer', 'cocina'],
            '🕰️': ['reloj', 'antiguo', 'pendulo', 'clock'],
            '⌚': ['reloj', 'pulsera', 'watch', 'hora'],
            '⏳': ['arena', 'tiempo', 'espera', 'hourglass'],
            '⌛': ['arena', 'tiempo', 'terminado', 'hourglass'],
            '🕛': ['reloj', 'doce', 'medianoche', 'mediodia', 'hora'],
            '🕐': ['reloj', 'una', 'hora', 'clock'],
            '🕑': ['reloj', 'dos', 'hora', 'clock'],
            '🕒': ['reloj', 'tres', 'hora', 'clock'],
            '🕓': ['reloj', 'cuatro', 'hora', 'clock'],
            '🕔': ['reloj', 'cinco', 'hora', 'clock'],
            '🕕': ['reloj', 'seis', 'hora', 'clock'],
            '🕖': ['reloj', 'siete', 'hora', 'clock'],
            '🕗': ['reloj', 'ocho', 'hora', 'clock'],
            '🕘': ['reloj', 'nueve', 'hora', 'clock'],
            '🕙': ['reloj', 'diez', 'hora', 'clock'],
            '🕚': ['reloj', 'once', 'hora', 'clock'],
            '📅': ['calendario', 'calendar', 'fecha', 'dia']
        };
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

        // Limpiar búsqueda al cerrar
        this.dom.iconSearchInput.value = '';
    }

    /**
     * Filtra los iconos según el texto de búsqueda
     */
    filterIcons(searchText) {
        const query = searchText.toLowerCase().trim()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Eliminar acentos

        const iconOptions = this.dom.iconPickerContainer.querySelectorAll('.icon-option');
        let visibleCount = 0;

        // Eliminar mensaje de "sin resultados" si existe
        const noResults = this.dom.iconPickerContainer.querySelector('.icon-picker-no-results');
        if (noResults) noResults.remove();

        for (const option of iconOptions) {
            const icon = option.textContent;
            const keywords = this.iconKeywords[icon] || [];

            // Buscar en las palabras clave (sin acentos)
            const matches = query === '' || keywords.some(keyword =>
                keyword.normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(query)
            ) || icon.includes(query);

            option.style.display = matches ? '' : 'none';
            if (matches) visibleCount++;
        }

        // Mostrar mensaje si no hay resultados
        if (visibleCount === 0 && query !== '') {
            const noResultsMsg = document.createElement('div');
            noResultsMsg.className = 'icon-picker-no-results';
            noResultsMsg.textContent = `No se encontraron iconos para "${searchText}"`;
            this.dom.iconPickerContainer.appendChild(noResultsMsg);
        }
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

        // Guardar referencia al callback antes de cerrar el modal
        const callback = this.onIconSelected;

        const handleUpdate = () => {
            song.iconType = 'image';
            this.audio.playEffect('click');
            this.closeIconModal();
            
            // Usar la referencia guardada del callback
            if (callback) {
                callback();
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
                    canvas.width = 300;
                    canvas.height = 300;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, 300, 300);
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
