export function seedRandom(seed = 1) {
    const original = Math.random;
    let state = seed;
    let calls = 0;

    Math.random = () => {
        calls++;
        state = (state * 1664525 + 1013904223) % 4294967296;
        return state / 4294967296;
    };

    return {
        restore: () => { Math.random = original; },
        calls: () => calls
    };
}

export function makeSongs(count, {withFile = count, icon = '🎵'} = {}) {
    return Array.from({length: count}, (_, index) => ({
        id: index + 1,
        title: `Canción ${index + 1}`,
        icon,
        iconType: 'emoji',
        file: index < withFile ? {} : null,
        played: false
    }));
}
