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



    let gps = fs.get('gamepanels') || {};
    gps[id] = gp;
    fs.set('gamepanels', gps);

    let primary = fs.get('primaryGamePanel');
    if (!primary)
        fs.set('primaryGamePanel', gp);

    return gp;
}

export function removeGamePanel(id) {
    let gps = fs.get('gamepanels') || {};

    if (id in gps) {
        let gp = gps[id];
        delete gps[id];

        fs.set('gamepanels', gps);
        let primary = fs.get('primaryGamePanel');
        if (gp == primary) {
            let keys = Object.keys(gps);
            if (keys.length > 0) {
                let randomKey = Math.floor(Math.random() * keys.length)
                let key = keys[randomKey];
                fs.set('primaryGamePanel', gps[key])
            }
        }


        return true;
    }
    return false;
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

        copy = JSON.parse(JSON.stringify(delta));
        let hiddenState = DELTA.hidden(copy.state);
        let hiddenPlayers = DELTA.hidden(copy.players);


        message = DELTA.merge(lastMessage || {}, delta);


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

// export function onGamePrivateUpdate(message) {
//     try {
//         message = decode(message);
//         console.log('Private Data: ', message);

//         let socketUser = fs.get('socketUser');

//         let localPlayer = lastMessage.players[socketUser.id];

//         if (localPlayer) {
//             localPlayer = DELTA.merge(localPlayer || {}, JSON.parse(JSON.stringify(message)));
//             lastMessage.local = localPlayer;
//             lastMessage.delta = message;
//         }

//         fs.set('lastMessage', lastMessage);
//         // showJSONView(message, document.getElementById('private'));

//         // message.local = Object.assign({}, socket.user, localPlayer);
//         sendFrameMessage(lastMessage);
//         console.timeEnd('[ACOS] ActionLoop');
//     }
//     catch (e) {
//         console.error(e);
//     }
// }

export function attachToFrame() {
    window.addEventListener('message', recvFrameMessage, false);
}

export function detachFromFrame() {
    window.removeEventListener('message', recvFrameMessage, false);
}

export function sendFrameMessage(gamepanel, msg) {
    // let iframe = fs.get('iframe');

    if (gamepanel?.iframe?.current)
        gamepanel.iframe.current.contentWindow.postMessage(msg, '*');
    else {
        gamepanel.waitMessages = gamepanel.waitMessages || [];
        gamepanel.waitMessages.push(msg);
    }
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


    let iframe = getFrameByEvent(evt);
    let gamepanels = fs.get('gamepanels');
    let gamepanel = null;
    for (const id in gamepanels) {
        let test = gamepanels[id];
        if (test?.iframe?.current == iframe) {
            gamepanel = test;
            break;
        }
    }

    if (gamepanel) {
        let lastMessage = fs.get("lastMessage");

        let fakePlayers = fs.get('fakePlayers') || {};
        let user = fs.get('socketUser');
        if (fakePlayers[gamepanel.id]) {
            user = fakePlayers[gamepanel.id];
        }

        if (!user)
            return;

        if (data.type == 'loaded') {
            console.log(">>>> GAME IS LOADED ");
            if (gamepanel?.waitMessages?.length > 0) {
                for (const waitMessage of gamepanel.waitMessages) {
                    sendFrameMessage(gamepanel, waitMessage);
                }
            }
        }



        if (!lastMessage?.players || !(gamepanel.id in lastMessage.players)) {
            return;
        }

        if (user.id != gamepanel.id)
            return;

        let socket = fs.get('socket');
        data.user = { id: user.id, name: user.name };
        if (socket) socket.emit('action', encode(data));

    }

    // if (!action.type) return;

    // let gamepanel = findGamePanelByIFrame(iframe);

    // console.time('ActionLoop');

}