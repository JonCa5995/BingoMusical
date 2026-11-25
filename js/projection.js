import {PROJECTION_ALIVE_MS, PROJECTION_CHANNEL} from './constants.js';
import {ProjectionView} from './modules/ProjectionView.js';

const byId = (id) => document.getElementById(id);

const view = new ProjectionView({
    elements: {
        header: byId('projection-header'),
        celebration: byId('projection-celebration'),
        celebrationTitle: byId('projection-celebration-title'),
        celebrationText: byId('projection-celebration-text'),
        logo: byId('projection-logo'),
        logoSlot: byId('projection-logo-slot'),
        gameName: byId('projection-game-name'),
        status: byId('projection-status'),
        icon: byId('projection-icon'),
        title: byId('projection-title'),
        counter: byId('projection-counter'),
        history: byId('projection-history'),
        progressBar: byId('projection-progress'),
        progressFill: byId('projection-progress-fill'),
        time: byId('projection-time')
    },
    channel: new BroadcastChannel(PROJECTION_CHANNEL)
});

view.start();

window.addEventListener('resize', () => view.syncLogo(false));

setInterval(() => view.sendAlive(), PROJECTION_ALIVE_MS);
window.addEventListener('pagehide', () => view.sendBye());

document.addEventListener('dblclick', () => {
    if (document.fullscreenElement) {
        document.exitFullscreen();
    } else {
        document.documentElement.requestFullscreen();
    }
});
