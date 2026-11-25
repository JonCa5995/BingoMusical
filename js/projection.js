import {PROJECTION_CHANNEL} from './constants.js';
import {ProjectionView} from './modules/ProjectionView.js';

const byId = (id) => document.getElementById(id);

const view = new ProjectionView({
    elements: {
        gameName: byId('projection-game-name'),
        status: byId('projection-status'),
        icon: byId('projection-icon'),
        title: byId('projection-title'),
        counter: byId('projection-counter'),
        history: byId('projection-history')
    },
    channel: new BroadcastChannel(PROJECTION_CHANNEL)
});

view.start();

document.addEventListener('dblclick', () => {
    if (document.fullscreenElement) {
        document.exitFullscreen();
    } else {
        document.documentElement.requestFullscreen();
    }
});
