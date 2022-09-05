import { sendFrameMessage } from './gamepanel';
import DELTA from './delta';
const { decode, encode } = require('./encoder');
import fs from 'flatstore';

export function onGameUpdate(message) {
    try {
        let delta = decode(message);
        console.log('GAME UPDATE: ', delta);
        if (!delta) return;

        // document.getElementById('delta').innerHTML = jsonViewer(delta, true);
        let lastMessage = fs.get('lastMessage');
        let socket = fs.get('socket');
        let socketUser = fs.get('socketUser');

        // let username = fs.get('username');

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
            localPlayer = DELTA.merge(localPlayer || {}, message);
            lastMessage.local = localPlayer;
            lastMessage.private = message;
        }

        // showJSONView(message, document.getElementById('private'));

        // message.local = Object.assign({}, socket.user, localPlayer);
        sendFrameMessage(lastMessage);
        console.timeEnd('[ACOS] ActionLoop');
    }
    catch (e) {
        console.error(e);
    }
}

export function leaveGame(message) {
    let socket = fs.get('socket');
    let socketUser = fs.get('socketUser');
    let user = { id: socketUser.id, name: socketUser.name };

    fs.set('lastMessage', {});
    socket.emit('action', encode({ type: 'leave', user }));
    fs.set('gameStatus', 'none');
}

export function joinGame() {
    let socket = fs.get('socket');
    let socketUser = fs.get('socketUser');
    let user = { id: socketUser.id, name: socketUser.name };

    fs.set('lastMessage', {});
    socket.emit('action', encode({ type: 'join', user }));
}

export function startGame(message) {
    let socket = fs.get('socket');
    let socketUser = fs.get('socketUser');
    let user = { id: socketUser.id, name: socketUser.name };

    fs.set('lastMessage', {});
    socket.emit('action', encode({ type: 'gamestart', user }));
}

export function newGame(message) {
    let socket = fs.get('socket');
    let socketUser = fs.get('socketUser');
    let user = { id: socketUser.id, name: socketUser.name };

    fs.set('lastMessage', {});
    socket.emit('action', encode({ type: 'newgame', user }));
}

export function onLeave(message) {
    try {
        fs.set('lastMessage', {});
        fs.set('wsStatus', 'connected');
        fs.set('gameStatus', 'none');
    }
    catch (e) {
        console.error(e);
    }
}

export function onJoin(message) {
    try {
        message = decode(message);
        console.log('JOINED: ', message);
        if (!message) return;
        let lastMessage = fs.get('lastMessage');
        let socket = fs.get('socket');
        let socketUser = fs.get('socketUser');
        // let username = fs.get('username');
        // document.getElementById('delta').innerHTML = jsonViewer(message, true);

        message = DELTA.merge(lastMessage || {}, message);
        // showStateView(message, document.getElementById('state'));

        // document.getElementById('joingame').innerText = 'Join Game';
        // document.getElementById('joingame').style.display = 'none';
        // document.getElementById('joingame').disabled = false;
        // document.getElementById('leavegame').style.display = 'inline-block';
        // document.getElementById('startgame').style.display = 'inline-block';


        if (!message.players) return;

        let localPlayer = message.players[socketUser.id];
        // if (localPlayer) note.textContent = 'Status: ingame';
        // console.log('Game: ', message);
        message.local = localPlayer;
        message.local.id = socketUser.name;

        // message.local = Object.assign({}, socket.user, localPlayer);
        sendFrameMessage(message);
        // console.timeEnd('ActionLoop');

        if (message && message.events && message.events.gameover) {
            lastMessage = null;
        } else {
            lastMessage = message;
        }

        if (message?.room?.status) {
            fs.set('gameStatus', message.room.status);
        }
        fs.set('wsStatus', 'ingame');
        fs.set('lastMessage', lastMessage);
    }
    catch (e) {
        console.error(e);
    }
}