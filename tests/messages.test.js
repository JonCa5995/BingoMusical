import test from 'node:test';
import assert from 'node:assert/strict';
import {MSG} from '../js/messages.js';
import {ALERT_KIND} from '../js/constants.js';

const REGLA_ANTIGUA = /error|inválido|insuficientes/i;
const ARGUMENTOS = [['texto', 'pdf'], [['a', 'b'], 'pdf'], [3, 'pdf']];

const collectAlerts = () => {
    const alerts = [];
    const visit = (value, trail) => {
        if (typeof value === 'function') {
            const results = ARGUMENTOS.flatMap(args => {
                try { return [value(...args)]; } catch { return []; }
            });
            const wellFormed = results.find(result => typeof result?.title === 'string' && typeof result?.message === 'string');
            visit(wellFormed ?? results[0], `${trail}()`);
        } else if (value && typeof value === 'object' && 'title' in value && 'message' in value) {
            alerts.push({trail, alert: value});
        } else if (value && typeof value === 'object') {
            for (const [key, child] of Object.entries(value)) visit(child, `${trail}.${key}`);
        }
    };
    visit(MSG, 'MSG');
    return alerts;
};

test('todos los avisos, fijos o calculados, tienen título y mensaje de texto', () => {
    const alerts = collectAlerts();

    assert.ok(alerts.length >= 40, `solo se encontraron ${alerts.length} avisos`);
    for (const {trail, alert} of alerts) {
        assert.equal(typeof alert.title, 'string', trail);
        assert.equal(typeof alert.message, 'string', trail);
        assert.ok(alert.title && alert.message, trail);
    }
});

test('el tipo de cada aviso coincide con la regla antigua basada en el título', () => {
    for (const {trail, alert} of collectAlerts()) {
        assert.equal(alert.kind === ALERT_KIND.ERROR, REGLA_ANTIGUA.test(alert.title), `${trail}: «${alert.title}»`);
    }
});

test('los avisos de error son los esperados', () => {
    const errors = collectAlerts().filter(({alert}) => alert.kind === ALERT_KIND.ERROR).map(({trail}) => trail);

    assert.ok(errors.length >= 11);
    assert.ok(errors.includes('MSG.cartones.invalidCount()'));
    assert.ok(errors.includes('MSG.playlist.importFailed()'));
    assert.ok(errors.includes('MSG.game.lineaNeedsSongs()'));
});
