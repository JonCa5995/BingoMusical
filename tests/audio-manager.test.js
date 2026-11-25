import test from 'node:test';
import assert from 'node:assert/strict';
import {AudioManager} from '../js/modules/AudioManager.js';
import {SOUND} from '../js/constants.js';
import {seedRandom} from './helpers/seed.js';

const makeAudio = () => {
    const listeners = {};
    const audio = {
        src: '', volume: 1, currentTime: 0, duration: NaN, paused: true,
        addEventListener(type, listener) { (listeners[type] ||= []).push(listener); },
        dispatchEvent(event) { (listeners[event.type] || []).forEach(listener => listener(event)); return true; },
        play() { audio.paused = false; return Promise.resolve(); },
        pause() { audio.paused = true; },
        load(duration) { audio.duration = duration; audio.dispatchEvent(new Event('loadedmetadata')); },
        tick(time) { audio.currentTime = time; audio.dispatchEvent(new Event('timeupdate')); }
    };
    return audio;
};

const build = () => {
    const audio = makeAudio();
    const sounds = [];
    const urls = [];
    const manager = new AudioManager(audio, {play: (name) => sounds.push(name)}, {
        urlApi: {createObjectURL: (file) => { urls.push(file.name); return `blob:${file.name}`; }, revokeObjectURL() {}}
    });
    const ended = [];
    audio.addEventListener('ended', () => ended.push(audio.currentTime));
    return {audio, manager, sounds, urls, ended};
};

const song = (name = 'a.mp3') => ({name});

test('sin fragmento reproduce la canción entera y no se corta', () => {
    const {audio, manager, sounds, ended} = build();
    let started = 0;

    manager.play(song(), () => started++);
    audio.load(200);
    audio.tick(150);

    assert.equal(audio.src, 'blob:a.mp3');
    assert.equal(started, 1);
    assert.equal(audio.paused, false);
    assert.deepEqual(sounds, [SOUND.START]);
    assert.deepEqual(ended, []);
    assert.deepEqual(manager.getTimeline(), {currentTime: 150, duration: 200});
});

test('un fragmento sin inicio aleatorio empieza al principio y termina con «ended» al cumplirse', () => {
    const {audio, manager, ended} = build();

    manager.play(song(), null, {seconds: 30, randomStart: false});
    audio.load(200);
    audio.tick(29.9);
    assert.deepEqual(ended, []);

    audio.tick(30.1);

    assert.equal(ended.length, 1);
    assert.equal(audio.paused, true);
    assert.equal(manager.isPlaying, false);
});

test('tras terminar el fragmento, otro timeupdate no lanza «ended» dos veces', () => {
    const {audio, manager, ended} = build();

    manager.play(song(), null, {seconds: 10, randomStart: false});
    audio.load(100);
    audio.tick(10.2);
    audio.tick(10.4);
    audio.tick(10.6);

    assert.equal(ended.length, 1);
});

test('con inicio aleatorio salta a un punto en el que el fragmento cabe entero', () => {
    const seed = seedRandom(7);
    try {
        const {audio, manager} = build();

        manager.play(song(), null, {seconds: 30, randomStart: true});
        audio.load(100);

        const {start, end} = manager.clip;
        assert.ok(start > 0 && start <= 70, `empieza en ${start}`);
        assert.equal(end - start, 30);
        assert.equal(audio.currentTime, start);
    } finally {
        seed.restore();
    }
});

test('el inicio aleatorio es siempre válido: nunca pasa de duración − fragmento', () => {
    const seed = seedRandom(1);
    try {
        for (let i = 0; i < 200; i++) {
            const {audio, manager} = build();
            manager.play(song(), null, {seconds: 30, randomStart: true});
            audio.load(31);

            assert.ok(manager.clip.start >= 0 && manager.clip.end <= 31 + 1e-9);
        }
    } finally {
        seed.restore();
    }
});

test('con inicio aleatorio, termina 30 segundos después del punto elegido', () => {
    const seed = seedRandom(3);
    try {
        const {audio, manager, ended} = build();

        manager.play(song(), null, {seconds: 30, randomStart: true});
        audio.load(100);
        const {start, end} = manager.clip;
        audio.tick(end - 0.5);
        assert.deepEqual(ended, []);
        audio.tick(end + 0.1);

        assert.equal(ended.length, 1);
        assert.ok(ended[0] >= start + 30);
    } finally {
        seed.restore();
    }
});

test('si la canción dura menos que el fragmento, suena entera', () => {
    const {audio, manager, ended} = build();

    manager.play(song(), null, {seconds: 60, randomStart: true});
    audio.load(45);
    audio.tick(44);

    assert.equal(manager.clip, null);
    assert.deepEqual(ended, []);
    assert.deepEqual(manager.getTimeline(), {currentTime: 44, duration: 45});
});

test('un fragmento de 0 segundos o ausente no se aplica', () => {
    for (const clip of [null, undefined, {seconds: 0, randomStart: true}]) {
        const {audio, manager} = build();

        manager.play(song(), null, clip);
        audio.load(100);

        assert.equal(manager.clip, null);
    }
});

test('la línea de tiempo y el avance se miden desde el inicio del fragmento', () => {
    const seed = seedRandom(5);
    try {
        const {audio, manager} = build();

        manager.play(song(), null, {seconds: 20, randomStart: true});
        audio.load(100);
        const {start} = manager.clip;
        audio.tick(start + 5);

        assert.deepEqual(manager.getTimeline(), {currentTime: 5, duration: 20});
    } finally {
        seed.restore();
    }
});

test('reiniciar y parar vuelven al inicio del fragmento, no al de la canción', () => {
    const seed = seedRandom(9);
    try {
        const {audio, manager} = build();
        const sounds = [];
        manager.sounds = {play: (name) => sounds.push(name)};

        manager.play(song(), null, {seconds: 20, randomStart: true});
        audio.load(100);
        const {start} = manager.clip;
        audio.tick(start + 12);

        manager.restart();
        assert.equal(audio.currentTime, start);
        audio.tick(start + 8);
        manager.stop();
        assert.equal(audio.currentTime, start);
        assert.equal(manager.isPlaying, false);
    } finally {
        seed.restore();
    }
});

test('saltar en la barra de progreso se mide dentro del fragmento', () => {
    const seed = seedRandom(11);
    try {
        const {audio, manager} = build();

        manager.play(song(), null, {seconds: 20, randomStart: true});
        audio.load(100);
        const {start} = manager.clip;

        manager.seekToFraction(0.5);
        assert.ok(Math.abs(audio.currentTime - (start + 10)) < 1e-9);
        manager.seekToFraction(2);
        assert.ok(Math.abs(audio.currentTime - (start + 20)) < 1e-9);
        manager.seekToFraction(-1);
        assert.equal(audio.currentTime, start);
    } finally {
        seed.restore();
    }
});

test('saltar en la barra sin fragmento se mide sobre la canción entera', () => {
    const {audio, manager} = build();

    manager.play(song(), null);
    audio.load(80);
    manager.seekToFraction(0.25);

    assert.equal(audio.currentTime, 20);
});

test('al empezar otra canción se descarta el fragmento anterior', () => {
    const seed = seedRandom(2);
    try {
        const {audio, manager} = build();

        manager.play(song('uno.mp3'), null, {seconds: 10, randomStart: true});
        audio.load(100);
        assert.ok(manager.clip);

        manager.play(song('dos.mp3'), null, null);
        assert.equal(manager.clip, null);
        audio.load(100);
        assert.equal(manager.clip, null);
    } finally {
        seed.restore();
    }
});

test('pausar y reanudar conserva el fragmento y no corta antes de tiempo', () => {
    const {audio, manager, ended} = build();

    manager.play(song(), null, {seconds: 10, randomStart: false});
    audio.load(100);
    audio.tick(4);
    assert.equal(manager.pause(), false);
    audio.tick(4);
    assert.equal(manager.pause(), true);
    audio.tick(9);

    assert.deepEqual(ended, []);
    audio.tick(10.1);
    assert.equal(ended.length, 1);
});
