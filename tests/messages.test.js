import test from 'node:test';
import assert from 'node:assert/strict';
import {MSG} from '../js/messages.js';
import {ALERT_KIND} from '../js/constants.js';

const REGLA_ANTIGUA = /error|inválido|insuficientes/i;
const ARGUMENTOS = [['texto', 'pdf'], [['a', 'b'], 'pdf'], [3, 'pdf'], [['theme'], ['otro']], [[], ['otro']]];

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

test('todo aviso cuyo título cumplía la regla antigua sigue siendo de tipo error', () => {
    for (const {trail, alert} of collectAlerts()) {
        if (REGLA_ANTIGUA.test(alert.title)) {
            assert.equal(alert.kind, ALERT_KIND.ERROR, `${trail}: «${alert.title}»`);
        }
    }
});

test('los 11 avisos que sonaban como error siguen siéndolo', () => {
    const errors = collectAlerts().filter(({alert}) => alert.kind === ALERT_KIND.ERROR).map(({trail}) => trail);

    for (const trail of ['MSG.game.lineaNeedsSongs()', 'MSG.game.bingoNeedsSongs()', 'MSG.songs.notEnoughToPlay()', 'MSG.cartones.notEnoughSongs()',
        'MSG.icons.songNotFound', 'MSG.cartones.printFailed()', 'MSG.cartones.generateFailed()', 'MSG.playlist.exportFailed()',
        'MSG.playlist.importFailed()', 'MSG.playlist.importNoSongs()', 'MSG.cartones.invalidCount()']) {
        assert.ok(errors.includes(trail), `falta ${trail}`);
    }
});
