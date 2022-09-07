import fs from 'flatstore';
import DELTA from './delta';
const { decode, encode } = require('./encoder');


fs.set('primaryGamePanel', null);
fs.set('gamepanels', {});

const defaultScreenConfig = {
    screentype: 3,
    resow: 4,
    resoh: 4,
    screenwidth: 1024
}

fs.set('screenConfig', defaultScreenConfig);

export function createGamePanel(id) {

    let gp = {};
    gp.id = id;
    gp.available = false;
    gp.loaded = false;
    gp.ready = false;
    gp.canvasRef = null;
    gp.gamestate = null;
    gp.gameover = false;
    gp.iframe = null;
    gp.active = true;

    let primary = fs.get('primaryGamePanel');
    if (!primary)
        fs.set('primaryGamePanel', gp);

    let gps = fs.get('gamepanels') || {};
    gps[id] = gp;
    fs.set('gamepanels', gps);

    return gp;
}

export function onGameUpdate(message) {
    try {
        message = decode(message);
        console.log('GAME UPDATE: ', message);
        if (!message) return;

        // document.getElementById('delta').innerHTML = jsonViewer(delta, true);
        let lastMessage = fs.get('lastMessage');
        let socket = fs.get('socket');
        let socketUser = fs.get('socketUser');

        // let username = fs.get('username');

        let copy = JSON.parse(JSON.stringify(message));

        let delta = DELTA.delta(lastMessage, copy, {});

        copy = JSON.parse(JSON.stringify(message));
        let hiddenState = DELTA.hidden(copy.state);
        let hiddenPlayers = DELTA.hidden(copy.players);


        message = DELTA.merge(lastMessage || {}, delta);


        // showStateView(message, document.getElementById('state'));
        if (!message.players) return;

        let localPlayer = message.players[socketUser.id];
        if (localPlayer) fs.set('wsStatus', 'ingame');

        // if (localPlayer) note.textContent = 'Status: ingame';
        // console.log('Game: ', message);
        message.local = localPlayer;
        message.local.id = socketUser.name;

        // console.log('Game: ', message);
        // message.delta = delta;
        // message.local = Object.assign({}, socket.user, localPlayer);
        sendFrameMessage(message);
        // console.timeEnd('ActionLoop');

        if (message && message.events && message.events.gameover) {
            lastMessage = null;
        } else {
            lastMessage = message;
        }

        fs.set('gameStatus', message?.room?.status || 'none');
        fs.set('lastMessage', lastMessage);
    }
    catch (e) {
        console.error(e);
    }

}

export function onGamePrivateUpdate(message) {
    try {
        message = decode(message);
        console.log('Private Data: ', message);

        let socketUser = fs.get('socketUser');

        let localPlayer = lastMessage.players[socketUser.id];

        if (localPlayer) {
            localPlayer = DELTA.merge(localPlayer || {}, JSON.parse(JSON.stringify(message)));
            lastMessage.local = localPlayer;
            lastMessage.delta = message;
        }

        fs.set('lastMessage', lastMessage);
        // showJSONView(message, document.getElementById('private'));

        // message.local = Object.assign({}, socket.user, localPlayer);
        sendFrameMessage(lastMessage);
        console.timeEnd('[ACOS] ActionLoop');
    }
    catch (e) {
        console.error(e);
    }
}

export function attachToFrame() {
    window.addEventListener('message', recvFrameMessage, false);
}

export function detachFromFrame() {
    window.removeEventListener('message', recvFrameMessage, false);
}

export function sendFrameMessage(msg) {
    let iframe = fs.get('iframe');
    if (iframe?.current)
        iframe.current.contentWindow.postMessage(msg, '*');
}

export function getFrameByEvent(event) {
    return Array.from(document.getElementsByTagName('iframe')).filter(iframe => {
        return iframe.contentWindow === event.source;
    })[0];
}




export function recvFrameMessage(evt) {
    let data = evt.data;
    if (data.type == '__ready') {
        return;
    }

    // let iframe = getFrameByEvent(evt);

    // if (!action.type) return;

    // let gamepanel = findGamePanelByIFrame(iframe);

    // console.time('ActionLoop');
    let socket = fs.get('socket');
    let socketUser = fs.get('socketUser');
    data.user = { id: socketUser.id, name: socketUser.name };
    if (socket) socket.emit('action', encode(data));
}