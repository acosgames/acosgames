import { createGamePanel, removeGamePanel, sendFrameMessage } from './gamepanel';
import DELTA from './delta';
const { decode, encode } = require('./encoder');
import fs from 'flatstore';



export function leaveGame(message) {
    let socket = fs.get('socket');
    let socketUser = fs.get('socketUser');
    let user = { id: socketUser.id, name: socketUser.name };

    // fs.set('lastMessage', {});
    socket.emit('action', encode({ type: 'leave', user }));
    fs.set('gameStatus', 'none');
}

export function joinGame() {
    let socket = fs.get('socket');
    let socketUser = fs.get('socketUser');
    let user = { id: socketUser.id, name: socketUser.name };

    //fs.set('lastMessage', {});
    socket.emit('action', encode({ type: 'join', user }));
}

export function startGame(message) {
    let socket = fs.get('socket');
    let socketUser = fs.get('socketUser');
    let user = { id: socketUser.id, name: socketUser.name };

    //fs.set('lastMessage', {});
    socket.emit('action', encode({ type: 'gamestart', user }));
}

export function newGame(message) {
    let socket = fs.get('socket');
    let socketUser = fs.get('socketUser');
    let user = { id: socketUser.id, name: socketUser.name };

    fs.set('lastMessage', {});
    socket.emit('action', encode({ type: 'newgame', user }));
}

export function spawnFakePlayers(message) {
    let socket = fs.get('socket');
    let socketUser = fs.get('socketUser');
    let user = { id: socketUser.id, name: socketUser.name };


    // fs.set('lastMessage', {});
    socket.emit('fakeplayer', encode({ type: 'create', user, payload: 1 }));
}

export function joinFakePlayer(fakePlayer) {
    let socket = fs.get('socket');
    let user = { id: fakePlayer.id, name: fakePlayer.name };

    //fs.set('lastMessage', {});
    socket.emit('action', encode({ type: 'join', user }));
}

export function leaveFakePlayer(fakePlayer) {
    let socket = fs.get('socket');
    let socketUser = fs.get('socketUser');
    let user = { id: fakePlayer.id, name: fakePlayer.name, clientid: socketUser.id };

    //fs.set('lastMessage', {});
    socket.emit('action', encode({ type: 'leave', user }));
}

export function onLeave(message) {
    try {
        // fs.set('lastMessage', {});
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

        //message = DELTA.merge(lastMessage || {}, message);
        // showStateView(message, document.getElementById('state'));

        // document.getElementById('joingame').innerText = 'Join Game';
        // document.getElementById('joingame').style.display = 'none';
        // document.getElementById('joingame').disabled = false;
        // document.getElementById('leavegame').style.display = 'inline-block';
        // document.getElementById('startgame').style.display = 'inline-block';


        if (!message.players) return;

        // let localPlayer = message.players[socketUser.id];
        // // if (localPlayer) note.textContent = 'Status: ingame';
        // // console.log('Game: ', message);
        // message.local = localPlayer;
        // message.local.id = socketUser.name;

        // let gamepanels = fs.get('gamepanels');
        // for (const id in gamepanels) {
        //     let gamepanel = gamepanels[id];

        //     if (gamepanel?.iframe?.current) {
        //         sendFrameMessage(gamepanel.iframe.current, message);
        //     }
        // }

        let copy = JSON.parse(JSON.stringify(message));
        let hiddenState = DELTA.hidden(copy.state);
        let hiddenPlayers = DELTA.hidden(copy.players);

        let gamepanels = fs.get('gamepanels');
        for (const id in gamepanels) {
            let gamepanel = gamepanels[id];

            if (!gamepanel?.iframe?.current)
                continue;

            if (hiddenPlayers && hiddenPlayers[id] && copy?.players[id]) {
                copy.local = Object.assign({}, copy.players[id], hiddenPlayers[id]);
                copy.private = { players: { [id]: hiddenPlayers[id] } };
            }
            else
                copy.local = copy.players[id] || {};

            copy.local.id = id;


            sendFrameMessage(gamepanel, copy);
        }

        // message.local = Object.assign({}, socket.user, localPlayer);
        // sendFrameMessage(message);
        // console.timeEnd('ActionLoop');

        // if (message && message.events && message.events.gameover) {
        //     //lastMessage = null;
        // } else {
        lastMessage = message;
        // }

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

export function onSpectate(message) {


    try {
        message = decode(message);
        console.log("SPECTATOR UPDATE: ", message);
        if (!message) return;

        let lastSpectatorMessage = fs.get('lastSpectatorMessage');

        // let username = fs.get('username');

        let copy = JSON.parse(JSON.stringify(message));
        let lastCopy = JSON.parse(JSON.stringify(lastSpectatorMessage));
        let delta = DELTA.delta(lastCopy, copy, {});

        copy = JSON.parse(JSON.stringify(delta));
        let hiddenState = DELTA.hidden(copy.state);
        let hiddenPlayers = DELTA.hidden(copy.players);


        message = DELTA.merge(lastCopy || {}, delta);


        // showStateView(message, document.getElementById('state'));
        if (!message.players) return;

        // let localPlayer = message.players[socketUser.id];
        // if (localPlayer) fs.set('wsStatus', 'ingame');

        // if (localPlayer) note.textContent = 'Status: ingame';
        // console.log('Game: ', message);

        message.delta = copy;

        // console.log('Game: ', message);
        // message.delta = delta;
        // message.local = Object.assign({}, socket.user, localPlayer);

        let gamepanels = fs.get('gamepanels');
        for (const id in gamepanels) {
            let gamepanel = gamepanels[id];

            if (!gamepanel?.iframe?.current)
                continue;

            if (message.private)
                delete message.private;

            if (hiddenPlayers && hiddenPlayers[id] && message?.players[id]) {
                message.local = Object.assign({}, message.players[id], hiddenPlayers[id]);
                message.private = { players: { [id]: hiddenPlayers[id] } };
            }
            else
                message.local = message.players[id] || {};

            message.local.id = id;

            sendFrameMessage(gamepanel, message);
        }

        // console.timeEnd('ActionLoop');

        if (message && message.events && message.events.gameover) {
            lastSpectatorMessage = null;
        } else {
            lastSpectatorMessage = message;
        }

        fs.set('gameSpectatorStatus', message?.room?.status || 'none');
        fs.set('lastSpectatorMessage', lastSpectatorMessage);
    }
    catch (e) {
        console.error(e);
    }

}



export function onFakePlayer(message) {
    message = decode(message);
    console.log('FAKEPLAYER: ', message);
    if (!message || typeof message.type === 'undefined') return;

    let socket = fs.get('socket');
    let socketUser = fs.get('socketUser');
    let fakePlayers = fs.get('fakePlayers') || {};

    if (message.type == 'created') {

        let newFakePlayers = message.payload;
        for (const fakePlayer of newFakePlayers) {
            fakePlayers[fakePlayer.id] = fakePlayer;
        }
        for (const fakePlayer of newFakePlayers) {
            createGamePanel(fakePlayer.id);
        }
        fs.set('fakePlayers', fakePlayers);
    }
    else if (message.type == 'join') {
    }
    else if (message.type == 'leave') {

    }
    else if (message.type == 'removed') {
        let id = message?.user?.id;

        if (id && (id in fakePlayers)) {
            delete fakePlayers[id];
            fs.set('fakePlayers', fakePlayers);
            removeGamePanel(id);
        }
    }

}