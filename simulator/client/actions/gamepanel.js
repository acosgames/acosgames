import fs from 'flatstore';
const { encode } = require('./encoder');

export function createGamePanel(config) {

    let gp = {};
    gp.id = -1;
    gp.available = false;
    gp.loaded = false;
    gp.ready = false;
    gp.canvasRef = null;
    gp.gamestate = null;
    gp.gameover = false;
    gp.iframe = null;
    gp.config = config;
    gp.active = true;

    fs.set('gamepanel', gp);

    return gp;
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

export function recvFrameMessage(evt) {
    let data = evt.data;
    if (data.type == '__ready') {
        return;
    }
    // console.time('ActionLoop');
    let socket = fs.get('socket');
    if (socket) socket.emit('action', encode(data));
}