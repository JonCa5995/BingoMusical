import test from 'node:test';
import assert from 'node:assert/strict';
import {Dialogs} from '../js/modules/Dialogs.js';
import {ALERT_KIND, SOUND} from '../js/constants.js';
import {DEFAULT_TITLES, MSG} from '../js/messages.js';
import {mkEl} from './helpers/fakeDom.js';

const build = () => {
    const sounds = [];
    const opened = [];
    const elements = Object.fromEntries(['confirmModal', 'confirmTitle', 'confirmMessage', 'confirmCancelBtn', 'confirmAcceptBtn',
        'alertModal', 'alertTitle', 'alertMessage', 'alertOkBtn'].map(name => [name, mkEl()]));
    const modals = {registerModal() {}, openModal: (modal) => opened.push(modal), closeModal() {}};
    const dialogs = new Dialogs(elements, modals, {play: (name) => sounds.push(name)});
    return {dialogs, elements, sounds, opened};
};

test('showAlert escribe el título y el mensaje, abre el modal y suena un clic', () => {
    const {dialogs, elements, sounds, opened} = build();

    dialogs.showAlert({title: 'Hola', message: 'Mensaje'});

    assert.equal(elements.alertTitle.textContent, 'Hola');
    assert.equal(elements.alertMessage.textContent, 'Mensaje');
    assert.deepEqual(opened, [elements.alertModal]);
    assert.deepEqual(sounds, [SOUND.CLICK]);
});

test('un aviso de tipo error suena como error, aunque su título no lo diga', () => {
    const {dialogs, sounds} = build();

    dialogs.showAlert({title: 'Algo ha ido mal', message: 'x', kind: ALERT_KIND.ERROR});
    dialogs.showAlert(MSG.cartones.invalidCount(10));

    assert.deepEqual(sounds, [SOUND.ERROR, SOUND.ERROR]);
});

test('un título con la palabra «error» pero sin tipo ya no suena como error', () => {
    const {dialogs, sounds} = build();

    dialogs.showAlert({title: 'Error de prueba', message: 'x'});

    assert.deepEqual(sounds, [SOUND.CLICK]);
});

test('sin título usa el título por defecto', () => {
    const {dialogs, elements} = build();

    dialogs.showAlert({message: 'x'});

    assert.equal(elements.alertTitle.textContent, DEFAULT_TITLES.alert);
});

test('showConfirm se resuelve con la respuesta del botón pulsado', async () => {
    const {dialogs, elements} = build();

    const accepted = dialogs.showConfirm({message: '¿Seguro?'});
    elements.confirmAcceptBtn.fire('click');
    assert.equal(await accepted, true);

    const cancelled = dialogs.showConfirm({message: '¿Seguro?'});
    elements.confirmCancelBtn.fire('click');
    assert.equal(await cancelled, false);
});
