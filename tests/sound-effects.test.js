import test from 'node:test';
import assert from 'node:assert/strict';
import {SOUND_EFFECTS, SoundEffects} from '../js/modules/SoundEffects.js';
import {SOUND} from '../js/constants.js';

const makeContext = (log, state = 'running') => {
    let oscillators = 0;
    let gains = 0;
    const param = (name) => ({
        setValueAtTime: (...args) => log.push(`${name}.set(${args.join(',')})`),
        exponentialRampToValueAtTime: (...args) => log.push(`${name}.ramp(${args.join(',')})`),
        set value(value) { log.push(`${name}.value=${value}`); }
    });
    return {
        currentTime: 2, state, destination: {id: 'destino'},
        resume: () => log.push('resume'),
        createOscillator() {
            const id = `osc${++oscillators}`;
            return {
                id, frequency: param(`${id}.freq`),
                set type(value) { log.push(`${id}.type=${value}`); },
                connect: (target) => log.push(`${id}->${target.id}`),
                start: (time) => log.push(`${id}.start(${time})`),
                stop: (time) => log.push(`${id}.stop(${time})`)
            };
        },
        createGain() {
            const id = `gain${++gains}`;
            return {id, gain: param(`${id}.gain`), connect: (target) => log.push(`${id}->${target.id}`)};
        }
    };
};

test('un barrido crea una voz, sube la frecuencia y baja el volumen', () => {
    const log = [];
    const effects = new SoundEffects({createAudioContext: () => makeContext(log), volume: 0.5});

    effects.play(SOUND.START);

    assert.deepEqual(log, [
        'osc1->gain1', 'gain1->destino', 'osc1.type=sine',
        'osc1.freq.set(400,2)', 'osc1.freq.ramp(800,2.3)',
        'gain1.gain.set(0.5,2)', 'gain1.gain.ramp(0.01,2.3)',
        'osc1.start(2)', 'osc1.stop(2.3)'
    ]);
});

test('una melodía crea una voz por nota, escalonadas en el tiempo', () => {
    const log = [];
    const effects = new SoundEffects({createAudioContext: () => makeContext(log), volume: 1});

    effects.play(SOUND.WIN);

    const starts = log.filter(entry => entry.includes('.start('));
    assert.equal(starts.length, SOUND_EFFECTS[SOUND.WIN].notes.length);
    assert.deepEqual(starts, ['osc1.start(2)', 'osc2.start(2.15)', 'osc3.start(2.3)', 'osc4.start(2.45)']);
});

test('con volumen 0 o un efecto desconocido no hace nada', () => {
    const log = [];
    const effects = new SoundEffects({createAudioContext: () => makeContext(log)});

    effects.play('no-existe');
    effects.setVolume(0);
    effects.play(SOUND.CLICK);

    assert.deepEqual(log, []);
});

test('reanuda el contexto suspendido y recrea el cerrado', () => {
    const log = [];
    const states = ['suspended', 'closed'];
    let created = 0;
    const effects = new SoundEffects({createAudioContext: () => makeContext(log, states[created++] ?? 'running')});

    effects.play(SOUND.CLICK);
    assert.ok(log.includes('resume'));
    effects.audioContext.state = 'closed';
    effects.play(SOUND.CLICK);
    assert.equal(created, 2);
});

test('si el audio falla, avisa por consola y no lanza', () => {
    const originalWarn = console.warn;
    const warnings = [];
    console.warn = (message) => warnings.push(message);
    try {
        const effects = new SoundEffects({createAudioContext: () => { throw new Error('sin audio'); }});

        assert.doesNotThrow(() => effects.play(SOUND.ERROR));
        assert.equal(warnings.length, 1);
    } finally {
        console.warn = originalWarn;
    }
});
