import test from 'node:test';
import assert from 'node:assert/strict';
import {AudioControlsView} from '../js/modules/AudioControlsView.js';
import {mkEl} from './helpers/fakeDom.js';

const NAMES = ['progressBar', 'progressFill', 'currentTimeSpan', 'durationSpan', 'musicVolumeSlider', 'musicVolumeValueSpan', 'effectsVolumeSlider', 'effectsVolumeValueSpan'];

const build = (extra = {}) => {
    const elements = Object.fromEntries(NAMES.map(name => [name, mkEl(/Slider|progressFill/.test(name) ? 'input' : 'div')]));
    const audioElement = {currentTime: 0, duration: NaN, ...mkEl()};
    const volumes = [];
    const view = new AudioControlsView({
        audioElement, elements,
        handlers: {onSeek() {}, onMusicVolume: (value) => volumes.push(['musica', value]), onEffectsVolume: (value) => volumes.push(['efectos', value])},
        ...extra
    });
    view.bind();
    return {view, elements, audioElement, volumes};
};

test('sin línea de tiempo propia, el progreso se mide con el elemento de audio', () => {
    const {view, elements, audioElement} = build();
    audioElement.currentTime = 30;
    audioElement.duration = 120;

    view.updateProgress();
    view.updateDuration();

    assert.equal(elements.progressFill.value, 25);
    assert.equal(elements.currentTimeSpan.textContent, '0:30');
    assert.equal(elements.durationSpan.textContent, '2:00');
    assert.equal(elements.durationSpan.attrs.datetime, 'PT120S');
});

test('con línea de tiempo propia (fragmento), el progreso y la duración son los del fragmento', () => {
    const {view, elements, audioElement} = build({getTimeline: () => ({currentTime: 5, duration: 20})});
    audioElement.currentTime = 65;
    audioElement.duration = 200;

    view.updateProgress();
    view.updateDuration();

    assert.equal(elements.progressFill.value, 25);
    assert.equal(elements.currentTimeSpan.textContent, '0:05');
    assert.equal(elements.durationSpan.textContent, '0:20');
    assert.equal(elements.durationSpan.attrs.datetime, 'PT20S');
});

test('un progreso no finito (duración desconocida) no cambia la barra', () => {
    const {view, elements} = build({getTimeline: () => ({currentTime: 0, duration: NaN})});

    view.updateProgress();

    assert.equal(elements.progressFill.value, '');
});

test('setVolumes pone los controles y sus textos en porcentaje', () => {
    const {view, elements} = build();

    view.setVolumes(0.4, 0.75);

    assert.equal(elements.musicVolumeSlider.value, 40);
    assert.equal(elements.musicVolumeSlider.attrs['aria-valuenow'], '40');
    assert.equal(elements.musicVolumeValueSpan.textContent, '40%');
    assert.equal(elements.effectsVolumeSlider.value, 75);
    assert.equal(elements.effectsVolumeValueSpan.textContent, '75%');
});

test('mover un control de volumen avisa con un valor entre 0 y 1', () => {
    const {elements, volumes} = build();

    elements.musicVolumeSlider.fire('input', {target: {value: '55', setAttribute() {}}});
    elements.effectsVolumeSlider.fire('input', {target: {value: '10', setAttribute() {}}});

    assert.deepEqual(volumes, [['musica', 0.55], ['efectos', 0.1]]);
});
