import { sendFrameMessage } from './gamepanel';
import DELTA from './delta';



export function onGameUpdate(message) {
    let delta = decode(message);
    console.log('GAME UPDATE: ', delta);
    if (!delta) return;

    // document.getElementById('delta').innerHTML = jsonViewer(delta, true);
    let lastMessage = fs.get('lastMessage');

    message = DELTA.merge(lastMessage || {}, delta);


    // showStateView(message, document.getElementById('state'));
    if (!message.players) return;

    let localPlayer = message.players[socket.user.id];
    if (localPlayer) note.textContent = 'Status: ingame';
    // console.log('Game: ', message);
    message.delta = delta;
    message.local = Object.assign({}, socket.user, localPlayer);
    sendFrameMessage(message);
    // console.timeEnd('ActionLoop');

    if (message && message.events && message.events.gameover) {
        lastMessage = null;
    } else {
        lastMessage = message;
    }

    fs.set('lastMessage', lastMessage);
}

export function onGamePrivateUpdate(message) {
    message = decode(message);
    console.log('Private Data: ', message);

    let localPlayer = lastMessage.players[socket.user.id];

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


export function onJoin(message) {
    message = decode(message);
    console.log('JOINED: ', message);
    if (!message) return;
    lastMessage = {};

    // document.getElementById('delta').innerHTML = jsonViewer(message, true);

    message = DELTA.merge(lastMessage || {}, message);
    // showStateView(message, document.getElementById('state'));

    // document.getElementById('joingame').innerText = 'Join Game';
    // document.getElementById('joingame').style.display = 'none';
    // document.getElementById('joingame').disabled = false;
    // document.getElementById('leavegame').style.display = 'inline-block';
    // document.getElementById('startgame').style.display = 'inline-block';


    if (!message.players) return;

    let localPlayer = message.players[socket.user.id];
    // if (localPlayer) note.textContent = 'Status: ingame';
    // console.log('Game: ', message);
    message.local = Object.assign({}, socket.user, localPlayer);
    sendFrameMessage(message);
    // console.timeEnd('ActionLoop');

    if (message && message.events && message.events.gameover) {
        lastMessage = null;
    } else {
        lastMessage = message;
    }
}