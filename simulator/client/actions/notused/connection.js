

import { w3cwebsocket as W3CWebSocket } from "websocket";
import { encode, decode, defaultDict } from 'shared/util/encoder';
import { getUser, isUserLoggedIn, login } from './person';

import config from '../config'

import fs from 'flatstore';
import delta from 'shared/util/delta';
import { addRoom, addRooms, clearRoom, clearRooms, findGamePanelByIFrame, findGamePanelByRoom, getCurrentRoom, getGamePanels, getGameState, getIFrame, getRoom, reserveGamePanel, setCurrentRoom, setGamePanelActive, setGameState, setLastJoinType, setPrimaryGamePanel, setRoomActive, updateGamePanel, updateRoomStatus } from "./room";
import { addGameQueue, clearGameQueues, getJoinQueues } from "./queue";
import { findGameLeaderboard, findGameLeaderboardHighscore } from "./game";
import { addChatMessage } from "./chat";
import { GET } from "./http";

import { revertBrowserTitle } from '../browser';

// import { useHistory } from 'react-router-dom';
// import history from "./history";
// fs.set('iframe', null);
fs.set('ws', null);
fs.set('game', null);
// fs.set('gamestate', {});
fs.set('room_slug', null);
fs.set('games', {});

fs.set('queues', []);
fs.set('rooms', {});

// fs.set('offsetTime', 0);
fs.set('latency', 0);

var messageQueue = {};
var onResize = null;

var timerHandle = 0;

var forcedLatency = Math.round(RandRange(50, 200));
// console.log("FORCED LATENCY: ", forcedLatency);
function RandRange(min, max) {
    return Math.random() * (max - min) + min;
}

export function timerLoop(cb) {

    if (cb)
        cb();

    if (timerHandle) {
        clearTimeout(timerHandle);
        timerHandle = 0;
    }


    timerHandle = setTimeout(() => { timerLoop(cb) }, 30);

    let gamepanels = getGamePanels();

    //no panels, stop the timer
    if (gamepanels.length == 0) {
        clearTimeout(timerHandle);
        timerHandle = 0;
        return;
    }

    let timeleftUpdated = 0;

    for (let i = 0; i < gamepanels.length; i++) {

        let gamepanel = gamepanels[i];
        if (gamepanel.available || !gamepanel.gamestate || !gamepanel.loaded || !gamepanel.active)
            continue;

        let gamestate = gamepanel.gamestate || {};

        let timer = gamestate.timer;
        if (!timer) {
            continue;
        }

        let deadline = timer.end;
        if (!deadline)
            continue;

        let now = (new Date()).getTime();
        let elapsed = deadline - now;

        if (elapsed <= 0) {
            elapsed = 0;
        }

        // fs.set('gameTimeleft', elapsed);

        fs.set('timeleft/' + gamepanel.id, elapsed);
        timeleftUpdated = (new Date()).getTime();
        // gamepanel.timeleft = elapsed;
        // updateGamePanel(gamepanel);

        let state = gamestate.state;
        let events = gamestate.events;
        if (events?.gameover || state?.gamestatus == 'gamestart') {
            // clearTimeout(timerHandle);
            // timerHandle = 0;
            // return;
        }

    }

    if (timeleftUpdated > 0)
        fs.set('timeleftUpdated', timeleftUpdated);

}

export function attachToFrame() {
    window.addEventListener(
        'message',
        recvFrameMessage,
        false
    );
}

export function detachFromFrame() {
    window.removeEventListener('message', recvFrameMessage, false);
}

export function fastForwardMessages(room_slug) {

    // let room_slug = msg.room_slug;
    // let room_slug = getCurrentRoom();
    let gamepanel = findGamePanelByRoom(room_slug);
    let iframe = gamepanel.iframe;

    if (!iframe)
        return false;

    let gamestate = gamepanel.gamestate;// fs.get('gamestate') || {};
    if (!(gamestate?.state)) {
        //    iframe.resize();
        return false;
    }

    let mq = messageQueue[room_slug];
    if (mq && mq.length > 0) {
        console.log("Forwarding queued messages to iframe.");
        // for (var i = 0; i < mq.length; i++) {

        //     gamestate = delta.merge(gamestate, mq[i]);
        let last = mq[mq.length - 1];

        // }

        iframe.current.contentWindow.postMessage(last, '*');
        console.log(last);

        delete messageQueue[room_slug];
    }

    // iframe.resize();

}

export function sendFrameMessage(msg) {

    let room_slug = msg.room_slug;
    // let room = fs.get('rooms>' + room_slug);

    let gamepanel = findGamePanelByRoom(room_slug);
    let iframe = gamepanel.iframe;// getIFrame(room_slug);
    // if (iframe)

    // let iframes = fs.get('iframes') || {}
    // let iframe = iframes[room_slug];

    // let iframeLoaded = fs.get('iframesLoaded>' + room_slug);
    if (!iframe?.current) {
        if (!messageQueue[room_slug])
            messageQueue[room_slug] = [];

        messageQueue[room_slug].push(msg);
        // setTimeout(() => {
        //     sendFrameMessage(msg);
        // }, 20)
        return;
    }
    else {


        //next frame
        // setTimeout(() => {
        console.log("SendFrameMessage: ", msg);
        try {
            iframe.current.contentWindow.postMessage(msg, '*');
        }
        catch (e) {
            console.log('Error iframe not working: ', e, gamepanel);
        }

        // }, 1000)

    }

}


export function sendPauseMessage(room_slug) {
    let gamepanel = findGamePanelByRoom(room_slug);
    if (gamepanel && gamepanel.iframe?.current) {
        gamepanel.iframe.current.contentWindow.postMessage({ type: 'pause' }, '*');
    }
}

export function sendUnpauseMessage(room_slug) {
    let gamepanel = findGamePanelByRoom(room_slug);
    if (gamepanel && gamepanel.iframe?.current) {
        gamepanel.iframe.current.contentWindow.postMessage({ type: 'unpause' }, '*');
    }
}

export function sendLoadMessage(room_slug) {
    // onResize = runCallback;

    let gamepanel = findGamePanelByRoom(room_slug);
    if (gamepanel && !gamepanel.isReplay && gamepanel.iframe?.current) {
        gamepanel.iframe.current.contentWindow.postMessage({ type: 'load', payload: { game_slug: gamepanel.room.game_slug, version: gamepanel.room.version } }, '*');
    }
    // let iframe = getIFrame(room_slug);
    // if (iframe)
    //     iframe.element.current.contentWindow.postMessage({ type: 'load', payload: { game_slug, version } }, '*');
}

export async function refreshGameState(room_slug) {

    let gamepanel = findGamePanelByRoom(room_slug);


    let gamestate = gamepanel.gamestate;// fs.get('gamestate') || {};
    let user = await getUser();
    let iframe = gamepanel.iframe;// fs.get('iframes>' + room_slug);
    // if (iframe) {
    let local = {};
    if (gamestate?.players) {
        local = gamestate.players[user.shortid];
        if (local)
            local.id = user.shortid;
    } else {
        local = { name: user.displayname, id: user.shortid };
    }

    let out = { local, room_slug, ...gamestate };


    // console.timeEnd('ActionLoop');
    sendFrameMessage(out);
    // }
}

export function getFrameByEvent(event) {
    return Array.from(document.getElementsByTagName('iframe')).filter(iframe => {
        return iframe.contentWindow === event.source;
    })[0];
}

export function replayPrevIndex(room_slug) {
    let gamepanel = findGamePanelByRoom(room_slug);
    if (!gamepanel?.room)
        return;

    let jumpIndex = gamepanel.room.replayIndex - 1;

    //if we are currently in gameover state, jump back 2 times
    if (gamepanel.room.replayIndex == gamepanel.gamestate.length - 1)
        jumpIndex -= 1;

    replayJumpToIndex(room_slug, jumpIndex);
}

export function replayTimerTriggerNext(room_slug, delay) {

    let gamepanel = findGamePanelByRoom(room_slug);
    if (!gamepanel?.room)
        return;

    if (gamepanel.room.replayTimerHandle) {
        clearTimeout(gamepanel.room.replayTimerHandle);
    }

    gamepanel.room.replayTimerHandle = setTimeout(() => {
        replayNextIndex(room_slug);
    }, delay)
}

export function replayNextIndex(room_slug) {
    let gamepanel = findGamePanelByRoom(room_slug);
    let iframe = gamepanel.iframe;

    if (!iframe)
        return false;

    let history = gamepanel.gamestate;// fs.get('gamestate') || {};
    if (!(history || history.length == 0)) {
        //    iframe.resize();
        return false;
    }

    let nextId = gamepanel.room.replayIndex + 1;
    if (nextId >= history.length)
        return false;

    let merged = gamepanel.room.replayState;
    let copy = JSON.parse(JSON.stringify(history[nextId].payload));

    if (merged?.events) {
        merged.events = {};
    }
    delta.merge(merged, copy);

    merged.room_slug = history[0].room_slug;

    // merged = { room_slug: history[nextId].room_slug, ...merged };

    if (merged?.timer?.seconds) {

        if (history.length > nextId + 1) {
            let nextHistory = history[nextId + 1];
            let nextCopy = JSON.parse(JSON.stringify(nextHistory.payload));
            let nextMerged = JSON.parse(JSON.stringify(merged));
            delta.merge(nextMerged, nextCopy);

            let nextEnd = nextMerged.timer.end;
            let nextSeconds = nextMerged.timer.seconds;
            let nextStartTime = nextEnd - (nextSeconds * 1000);

            let currentEnd = merged.timer.end;
            let currentSeconds = merged.timer.seconds;
            let currentStartTime = currentEnd - (currentSeconds * 1000);
            replayTimerTriggerNext(room_slug, nextStartTime - currentStartTime);
        }

        merged.timer.end = (merged.timer.seconds * 1000) + Date.now();
    }

    let players = merged?.players;
    merged.local = players[gamepanel.room.replayFollow];

    gamepanel.room.replayIndex = gamepanel.room.replayIndex + 1;
    gamepanel.room.replayState = merged;
    updateGamePanel(gamepanel);

    iframe.current.contentWindow.postMessage(merged, '*');
}

export function replayJumpToIndex(room_slug, startIndex) {
    let gamepanel = findGamePanelByRoom(room_slug);
    let iframe = gamepanel.iframe;

    if (!iframe)
        return false;

    let history = gamepanel.gamestate;// fs.get('gamestate') || {};
    if (!(history || history.length == 0)) {
        //    iframe.resize();
        return false;
    }

    if (startIndex < gamepanel.room.replayStartIndex || startIndex >= history.length) {
        return false;
    }

    if (gamepanel.room.replayIndex == history.length - 1) {

    }

    let merged = {};

    for (let i = 0; i <= startIndex; i++) {
        let copy = JSON.parse(JSON.stringify(history[i].payload));

        if (merged?.events) {
            merged.events = {};
        }

        delta.merge(merged, copy);
    }

    merged.room_slug = history[0].room_slug;

    if (merged?.timer?.seconds) {

        if (history.length > startIndex + 1) {
            let nextHistory = history[startIndex + 1];
            let nextCopy = JSON.parse(JSON.stringify(nextHistory.payload));
            let nextMerged = JSON.parse(JSON.stringify(merged));
            delta.merge(nextMerged, nextCopy);

            let nextEnd = nextMerged.timer.end;
            let nextSeconds = nextMerged.timer.seconds;
            let nextStartTime = nextEnd - (nextSeconds * 1000);

            let currentEnd = merged.timer.end;
            let currentSeconds = merged.timer.seconds;
            let currentStartTime = currentEnd - (currentSeconds * 1000);
            replayTimerTriggerNext(room_slug, nextStartTime - currentStartTime);
        }



        merged.timer.end = (merged.timer.seconds * 1000) + Date.now();
    }

    let players = merged?.players;
    if (!gamepanel.room.replayFollow) {
        let playerIds = Object.keys(players);
        let randomPlayerId = playerIds[Math.floor(Math.random() * playerIds.length)];

        merged.local = players[randomPlayerId];

        gamepanel.room.replayFollow = randomPlayerId;
    } else {
        merged.local = players[gamepanel.room.replayFollow];
    }


    gamepanel.room.replayIndex = startIndex;
    gamepanel.room.replayState = merged;
    updateGamePanel(gamepanel);

    // iframe.current.contentWindow.postMessage({ type: 'load', payload: { game_slug: gamepanel.room.game_slug, version: gamepanel.room.version } }, '*');

    // iframe.current.contentWindow.location.reload()

    // iframe.current.contentWindow.postMessage({ events: { gameover: true } }, '*');

    iframe.current.contentWindow.postMessage(merged, '*');
}

export function replaySendGameStart(room_slug) {
    let gamepanel = findGamePanelByRoom(room_slug);
    let iframe = gamepanel.iframe;

    if (!iframe)
        return false;

    let history = gamepanel.gamestate;// fs.get('gamestate') || {};
    if (!(history || history.length == 0)) {
        //    iframe.resize();
        return false;
    }

    //find gamestart index
    let replayStartIndex = 0;
    for (let i = 0; i < history.length; i++) {
        let gamestate = history[i];
        if (gamestate?.payload?.state?.gamestatus == 'gamestart') {
            replayStartIndex = i;
            break;
        }
    }

    gamepanel.room.replayStarted = true;
    gamepanel.room.replayStartIndex = replayStartIndex;
    updateGamePanel(gamepanel);

    replayJumpToIndex(room_slug, replayStartIndex);
}

export function recvFrameMessage(evt) {
    let action = evt.data;
    let origin = evt.origin;
    let source = evt.source;

    let iframe = getFrameByEvent(evt);

    if (!action.type) return;

    let gamepanel = findGamePanelByIFrame(iframe);

    // console.log('[iframe]: ', action);

    let room_slug = gamepanel.room.room_slug;//getCurrentRoom();
    let gamestate = gamepanel.gamestate;//getGameState();
    // let iframesLoaded = gamepanel.loaded;// fs.get('iframesLoaded') || {};

    if (!gamepanel || !gamepanel.active)
        return;

    if (action.type == 'ready') {
        // iframesLoaded[room_slug] = true;
        // fs.set('iframesLoaded', iframesLoaded);

        // gamepanel.loaded = true;
        // updateGamePanel(gamepanel);

        if (gamepanel.room.isReplay && !gamepanel.room.replayStarted) {
            replaySendGameStart(gamepanel.room.room_slug);
        }
        else {
            fastForwardMessages(room_slug);
            refreshGameState(room_slug);

            let gamestatus = gamestate?.state?.gamestatus;
            if (gamestatus && gamestatus != 'pregame') {
                return;
            }
        }

    }



    //game loaded
    if (action.type == 'loaded') {
        setTimeout(() => {

            gamepanel.loaded = true;
            updateGamePanel(gamepanel);
            // fs.set('gameLoaded', true);
        }, 300)
        return;
    }

    if (gamepanel.room.isReplay)
        return;

    // let msg = data.payload;
    // if (msg.indexOf("Hello") > -1) {
    //     this.send('connected', 'Welcome to 5SG!');
    // }

    // let ws = fs.get('ws');

    // if (ws) {
    // console.time('ActionLoop');

    action.room_slug = room_slug;
    if (gamestate && gamestate.timer)
        action.seq = gamestate.timer.seq || 0;
    else
        action.seq = 0;
    // if (action.payload && action.payload.cell) {
    //     action.payload.cell = 100;
    // }
    wsSend(action);
    console.log("[Outgoing] Action: ", action);
    // }
}

export async function wsSendFAKE(action) {

    latencyStart = new Date().getTime();

    setTimeout(() => {
        wsSend(action);
    }, forcedLatency);
}


export async function wsSend(action) {
    let ws = fs.get('ws');
    if (!ws || !action)
        return false;

    try {
        let buffer = encode(action);
        ws.send(buffer);
    }
    catch (e) {
        console.error(e);
        return false;
    }

    return true;
}


// export async function parseCookies() {
//     let cookies = {};
//     document.cookie.split(';').forEach(v => {
//         let pair = v.split('=');
//         if (!pair || !pair[0])
//             return;

//         cookies[pair[0].trim()] = pair[1].trim();
//     })
//     return cookies;
// }

var reconnectTimeout = 0;


export async function disconnect() {
    let ws = fs.get('ws');
    if (!ws)
        return;

    ws.close();

    fs.set('ws', null);
    console.log("Disconnected from server.");
}
export async function reconnect(skipQueues) {
    let ws = fs.get('ws');
    if (ws && ws.isReady) {
        return ws;
    }


    let duplicatetabs = fs.get('duplicatetabs');
    if (duplicatetabs) {
        fs.set('chatToggle', false);
        return null;
    }
    // let queues = fs.get('queues') || localStorage.getItem('queues') || [];
    // let rooms = fs.get('rooms');
    // if (queues.length == 0 && !isNew && (!rooms || Object.keys(rooms).length == 0))
    //     return disconnect();


    try {
        // if (reconnectTimeout)
        //     clearTimeout(reconnectTimeout);
        // reconnectTimeout = setTimeout(async () => { 
        ws = await wsConnect();
        // }, 500);

        if (!skipQueues && isUserLoggedIn())
            wsRejoinQueues();
    }
    catch (e) {
        console.error(e);
        return null;
    }

    return ws;
}

export async function wsLeaveGame(game_slug, room_slug) {

    let ws = fs.get('ws');
    if (!ws || !ws.isReady) {
        // let history = fs.get('history');
        // setGameState({});
        // setCurrentRoom(null);
        // history.goBack();
        setRoomActive(room_slug, false);
        //clearRoom(room_slug);
        return;
    }

    let action = { type: 'leave', room_slug }
    console.log("[Outgoing] Leaving: ", action);
    wsSend(action);

    setRoomActive(room_slug, false);
    revertBrowserTitle();

    sendPauseMessage(room_slug);
    // clearRoom(room_slug);
    // setGameState({});
    // setCurrentRoom(null);

    // let history = fs.get('history');
    // history.goBack();
}

export async function wsLeaveQueue() {

    setLastJoinType('');
    await clearGameQueues();

    // let ws = await reconnect();
    // if (!ws || !ws.isReady) {
    //     return;
    // }

    fs.set('joinqueues', null);
    localStorage.removeItem('joinqueues');
    let action = { type: 'leavequeue' }
    wsSend(action);

    // await disconnect();

    console.log("[Outgoing] Leave Queue ");
}

export async function wsRejoinQueues() {

    if (!validateLogin()) {
        return;
    }

    let joinqueues = getJoinQueues() || {};
    let user = fs.get('user');

    let jqs = joinqueues.queues || [];
    if (jqs.length > 0 && user)
        wsJoinQueues(joinqueues.queues, joinqueues.owner);
}

export async function wsJoinQueues(queues, owner) {

    if (!validateLogin())
        return false;

    if (!queues || queues.length == 0 || !queues[0].game_slug) {
        console.error("Queues is invalid.", queues);
        return false;
    }

    let currentQueues = fs.get('queues') || [];
    if (currentQueues.length > 0) {
        console.warn("Already in queue", currentQueues);
        // return false;
    }

    let joinQueues = { queues, owner };
    fs.set('joinqueues', joinQueues);
    localStorage.setItem('joinqueues', JSON.stringify(joinQueues));


    let ws = await reconnect(true);
    if (!ws || !ws.isReady) {
        return false;
    }


    gtag('event', 'joinqueues', { queues, owner });

    let user = await getUser();
    let players = [{ shortid: user.shortid, displayname: user.displayname }]
    let payload = { queues, owner, players, captain: user.shortid };
    let action = { type: 'joinqueues', payload }
    wsSend(action);

    console.log("[Outgoing] Queing ", action);

    fs.set('queues', queues);

    // if (owner)
    //     fs.set('successMessage', { description: `You joined ${owner}'s ${queues.length} queues.` })
    // else
    //     fs.set('successMessage', { description: `You joined ${queues.length} queues.` })

    // console.timeEnd('ActionLoop');
    return true;
}


export async function wsJoinGame(mode, game_slug) {

    if (!validateLogin())
        return false;

    let ws = await reconnect(true);
    if (!ws || !ws.isReady) {
        return;
    }

    if (!game_slug) {
        console.error("Game [" + game_slug + "] is invalid.  Something went wrong.");
        return;
    }

    let user = await getUser();

    let queues = [{ mode, game_slug }];
    let players = [{ shortid: user.shortid, displayname: user.displayname }]
    let action = { type: 'joingame', payload: { captain: user.shortid, queues, players } }
    wsSend(action);


    console.log("[Outgoing] Joining " + mode + ": ", action);

    // let games = fs.get('games');
    // let game = games[game_slug];
    // let gameName = game?.name || game?.game_slug || '';


    sendPing(ws);
    // if (game.maxplayers > 1)
    //     fs.set('successMessage', { description: `You joined the "${gameName}" ${mode} mode.` })
    // console.timeEnd('ActionLoop');
}

export async function wsJoinRoom(game_slug, room_slug, private_key) {
    let ws = await reconnect(true);
    if (!ws || !ws.isReady) {
        console.log("RETRYING wSJoinRoom");
        setTimeout(() => { wsJoinRoom(game_slug, room_slug, private_key); }, 1000);
        return;
    }

    if (!room_slug) {
        console.error("Room [" + room_slug + "] is invalid.  Something went wrong.");
        return;
    }

    gtag('event', 'joinroom', { game_slug: game_slug });

    let action = { type: 'joinroom', payload: { game_slug, room_slug, private_key } }
    wsSend(action);

    console.log("[Outgoing] Joining room [" + room_slug + "]: ", game_slug, action);
    // console.timeEnd('ActionLoop');
}

export async function wsSpectateGame(game_slug) {
    let ws = await reconnect(true);
    if (!ws || !ws.isReady || !game) {
        return;
    }

    if (!game_slug) {
        console.error("Game [" + game_slug + "] is invalid.  Something went wrong.");
        return;
    }

    let action = { type: 'spectate', payload: { game_slug } }
    wsSend(action);

    console.log("[Outgoing] Spectating [" + game_slug + "]: ", action);
    // console.timeEnd('ActionLoop');
}

export async function wsJoinBetaGame(game) {
    gtag('event', 'join', { mode: 'experimental', game_slug: game.game_slug });
    wsJoinGame('experimental', game.game_slug);
}


export async function wsJoinRankedGame(game) {
    gtag('event', 'join', { mode: 'rank', game_slug: game.game_slug });
    wsJoinGame('rank', game.game_slug);
}

export async function wsJoinPublicGame(game) {
    wsJoinGame('public', game.game_slug);
}

export async function wsJoin(game_slug, room_slug) {
    wsJoinRoom(game_slug, room_slug);
}

export async function wsJoinPrivate(game_slug, room_slug, private_key) {
    wsJoinRoom(game_slug, room_slug, private_key);
}

export async function wsRejoinRoom(game_slug, room_slug, private_key) {
    gtag('event', 'joinroom', { mode: 'rank' });
    await wsJoinRoom(game_slug, room_slug, private_key);
}

export async function wsRejoinRooms() {
    let rooms = fs.get('rooms') || localStorage.getItem('rooms') || {};
    let roomList = Object.keys(rooms);
    for (var rs of roomList) {
        let room = rooms[rs];
        await wsRejoinRoom(room.game_slug, room.room_slug);
    }
}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function validateLogin() {
    if (!isUserLoggedIn()) {

        login();


        // let history = fs.get('history');
        // history.push('/login');
        // console.log("CONNECT #3")
        return false;
        // await sleep(1000);
        // user = fs.get('user');
    }
    return true;
}

export function wsConnect(url, onMessage, onOpen, onError) {
    return new Promise(async (rs, rj) => {
        console.log("CONNECT #1")
        let ws = fs.get('ws');
        let user = fs.get('user') || { token: 'LURKER' };
        fs.set('wsConnected', false);
        // if (!user) {
        //     //let ws = await reconnect();
        //     rs(ws);
        //     return;
        // }
        //if connecting or open, don't try to connect
        if (ws && ws.readyState <= 1) {
            //let ws = await reconnect();
            console.log("CONNECT #2")
            rs(ws);
            return;
        }




        // let cookies = parseCookies();
        url = config.https.ws;
        var client = new W3CWebSocket(url || 'ws://127.0.0.1:9002', user.token, 'http://localhost:3000', {});
        client.binaryType = 'arraybuffer'
        client.isReady = false;

        client.onopen = onOpen || ((err) => {
            console.log(err);
            console.log('WebSocket Client Connected');
            console.log("CONNECT #4")
            if (rs)
                rs(client);

            if (client.readyState == client.OPEN) {
                client.isReady = true;
                sendPing(client);
            }


            fs.set('duplicatetabs', false);
            fs.set('wsConnected', true);
            wsRejoinRooms();

            var currentdate = new Date();
            var datetime = "WS Opened: " + currentdate.getDate() + "/"
                + (currentdate.getMonth() + 1) + "/"
                + currentdate.getFullYear() + " @ "
                + currentdate.getHours() + ":"
                + currentdate.getMinutes() + ":"
                + currentdate.getSeconds() + "." + currentdate.getMilliseconds();
            console.log(datetime);

        });

        client.onclose = async (evt) => {
            console.log("CONNECT #5")
            console.log(evt);
            client.isReady = false;
            // fs.set('gamestate', {});
            fs.set('wsConnected', false);
            var currentdate = new Date();
            var datetime = "WS Closed: " + currentdate.getDate() + "/"
                + (currentdate.getMonth() + 1) + "/"
                + currentdate.getFullYear() + " @ "
                + currentdate.getHours() + ":"
                + currentdate.getMinutes() + ":"
                + currentdate.getSeconds() + "." + currentdate.getMilliseconds();
            console.log(datetime);

            if (rj)
                rj(evt);
            // clearRooms();
            await reconnect();
        }
        client.onerror = onError || (async (error, data) => {
            console.log("CONNECT #6")
            console.error(error);
            if (rj)
                rj(error);

            fs.set('wsConnected', false);
            var currentdate = new Date();
            var datetime = "WS Errored: " + currentdate.getDate() + "/"
                + (currentdate.getMonth() + 1) + "/"
                + currentdate.getFullYear() + " @ "
                + currentdate.getHours() + ":"
                + currentdate.getMinutes() + ":"
                + currentdate.getSeconds() + "." + currentdate.getMilliseconds();
            console.log(datetime);
            await reconnect();
        });

        client.onmessage = onMessage || wsIncomingMessage;

        fs.set('ws', client);
    });
}

var latencyStart = 0;
var latency = 0;

function sendPing(ws) {
    latencyStart = new Date().getTime();
    let action = { type: 'ping', payload: latencyStart }

    console.log("[Outgoing] Ping: ", action);
    wsSend(action);
}

function onPong(message) {
    let serverOffset = message.payload.offset;
    let serverTime = message.payload.serverTime;
    let currentTime = new Date().getTime();
    latency = currentTime - latencyStart;
    let offsetTime = serverTime - currentTime;
    // let halfLatency = Math.ceil(latency / 2);
    // let realTime = currentTime + offsetTime + halfLatency;
    console.log('Latency Start: ', latencyStart);
    console.log('Latency: ', latency);
    console.log('Offset Time: ', offsetTime);
    console.log('Server Offset: ', serverOffset);
    console.log('Server Time: ', serverTime);
    console.log('Client Time: ', currentTime);
    // console.log('Real Time: ', realTime);
    fs.set('latency', latency);
    fs.set('serverOffset', serverOffset);
    fs.set('offsetTime', offsetTime);
    fs.set('playerCount', message.playerCount || 0);
}

async function wsIncomingMessageFAKE(message) {

    setTimeout(() => {
        wsIncomingMessage(message);
    }, forcedLatency);

}



export function downloadReplay(game_slug) {

    return new Promise(async (rs, rj) => {

        try {
            let url = `${config.https.cdn}g/test-game-3/replays/7/rank/1661646594335.json`

            let response = await GET(url);
            let jsonStr = response.data;

            rs(jsonStr);

            // fetch(url)
            //     .then(response => {
            //         if (!response.ok) {
            //             console.error("Failed to download JSON replay");
            //         }
            //         return response.json();
            //     })
            //     .then(data => {
            //         rs(data);
            //     })
            //     .catch(err => {
            //         rj(err);
            //     })
        }
        catch (e) {
            rj(e);
        }
    })

}




async function wsIncomingMessage(message) {
    let user = fs.get('user');
    let history = fs.get('history');
    // let gamestate = getGameState();

    let buffer = await message.data;
    let msg = decode(buffer);
    if (!msg) {
        console.error("Error: Unable to decode buffer of size " + buffer.byteLength);
        return;
    }


    switch (msg.type) {
        case 'chat':
            addChatMessage(msg);
            return;
        case 'pong':
            onPong(msg);
            return;
        case 'addedQueue':
            console.log("[Incoming] queue: ", JSON.parse(JSON.stringify(msg, null, 2)));
            addGameQueue(msg.payload.queues);
            // fs.set('playerCount', msg.playerCount || 0);

            return;
        case 'removedQueue':
            console.log("[Incoming] queue: ", JSON.parse(JSON.stringify(msg, null, 2)));
            await wsLeaveQueue();
            // fs.set('playerCount', msg.playerCount || 0);

            return;
        case 'ready':
            console.log("iframe is ready!");
            return;
        case 'noshow':
            console.log("[Incoming] No SHOW!", JSON.parse(JSON.stringify(msg, null, 2)));
            break;
        case 'notexist':
            let currentPath = window.location.href;
            let currentParts = currentPath.split('/g/');
            if (currentParts.length > 1) {
                let gamemode = currentParts[1].split('/');
                let game_slug = gamemode[0];

                history.push('/g/' + game_slug);
            }

            clearRoom(msg.room_slug);

            return;

        case 'inrooms':
            console.log("[Incoming] InRooms: ", JSON.parse(JSON.stringify(msg, null, 2)));
            if (msg.payload && Array.isArray(msg.payload) && msg.payload.length > 0) {

                fs.set('playerCount', msg.playerCount || 0);

                if (!msg.payload || msg.payload.length == 0) {
                    console.log("No rooms found.");
                    return;
                }

                await addRooms(msg.payload);
                // fs.set('gameLoaded', false);
                setLastJoinType('');
                await clearGameQueues();

                //lets move into the first room on the list
                let room = msg.payload[0];

                //update the gamestate
                // if (window.location.href.indexOf(room.room_slug) > -1) {
                //     if (room.payload)
                //         setGameState(room.payload);
                // }

                //redirect to the room url
                // let experimental = room.mode == 'experimental' ? '/experimental' : '';
                // let urlPath = '/g/' + room.game_slug + experimental + '/' + room.room_slug;
                // if (window.location.href.indexOf(urlPath) == -1)
                //     history.push(urlPath);
                return;
            }
            break;
        case 'joined':
            console.log("[Incoming] Joined: ", JSON.parse(JSON.stringify(msg, null, 2)));
            // setCurrentRoom(msg.room.room_slug);

            gtag('event', 'joined', { game_slug: msg.room.game_slug });



            addRoom(msg);

            clearGameQueues();
            // fs.set('gameLoaded', false);

            setLastJoinType('');

            // gamestate = msg.payload || {};
            // setGameState(gamestate);

            timerLoop();

            // let experimental = msg.room.mode == 'experimental' ? '/experimental' : '';
            // let urlPath = '/g/' + msg.room.game_slug + experimental + '/' + msg.room.room_slug;
            // if (window.location.href.indexOf(urlPath) == -1)
            //     history.push(urlPath);
            break;
        case 'join':
            console.log("[Incoming] Player joined the game!", JSON.parse(JSON.stringify(msg, null, 2)));
            break;
        case 'kicked':
            console.log("[Incoming] You were kicked from game!", JSON.parse(JSON.stringify(msg, null, 2)));
            break;
        case 'gameover':
            console.log("[Incoming] Game Over!", JSON.parse(JSON.stringify(msg, null, 2)));
            break;
        case 'private':
            console.log("[Incoming] Private State: ", JSON.parse(JSON.stringify(msg, null, 2)));
            break;
        case 'update':
            console.log("[Incoming] Update: ", JSON.parse(JSON.stringify(msg, null, 2)));
            break;
        case 'error':
            console.log("[Incoming] ERROR:: ", JSON.parse(JSON.stringify(msg, null, 2)));
            break;
        case 'duplicatetabs':
            console.log("[Incoming] ERROR :: Duplicate Tabs:: ", JSON.parse(JSON.stringify(msg, null, 2)));
            fs.set('duplicatetabs', true);
            return;
        default:
            console.log("[Incoming] Unknown type: ", JSON.parse(JSON.stringify(msg, null, 2)));
            return;
    }

    if (msg.payload) {

        let gamepanel = findGamePanelByRoom(msg.room_slug || msg.room.room_slug);
        let room = gamepanel?.room;
        let gamestate = gamepanel?.gamestate;

        // console.log("[Previous State]: ", gamestate);
        if (msg.type == 'private') {
            let player = gamestate.players[user.shortid]
            player = delta.merge(player, msg.payload);

            // getRoom(msg.room_slug);
            //UPDATE PLAYER STATS FOR THIS GAME
            if (room?.mode == 'rank' && msg?.payload?._played) {
                let player_stats = fs.get('player_stats');
                let player_stat = player_stats[room.game_slug]
                if (player_stat) {
                    if (msg.payload._win)
                        player_stat.win = msg.payload._win;
                    if (msg.payload._loss)
                        player_stat.loss = msg.payload._loss;
                    if (msg.payload._tie)
                        player_stat.tie = msg.payload._tie;
                    if (msg.payload._played)
                        player_stat.played = msg.payload._played;
                    // if (msg.payload.rating)
                    //     player_stat.rating = player.rating;
                    // if (player.ratingTxt)
                    //     player_stat.ratingTxt = player.ratingTxt;

                }
                fs.set('player_stats', player_stats);
            }

            gamestate.players[user.shortid] = player;
            // gamestate.deltaPrivate = msg.payload;
            updateGamePanel(gamepanel);
            // setGameState(gamestate);
            return;
        }
        else {

            if (msg.payload?.timer?.end) {
                let latency = fs.get('latency') || 0;
                let offsetTime = fs.get('offsetTime') || 0;
                let extra = 30; //for time between WS and gameserver
                msg.payload.timer.end += (-offsetTime) - (latency / 2) - (extra);
            }

            // let room = getRoom(msg.room_slug);
            // if (msg.payload && msg.payload.players) {
            //     let player = msg?.payload?.players[user.shortid]
            //     if (player) {
            //         let player_stats = fs.get('player_stats');
            //         let player_stat = player_stats[room.game_slug]
            //         if (player.rating)
            //             player_stat.rating = player.rating;

            //         if (player.ratingTxt)
            //             player_stat.ratingTxt = player.ratingTxt;

            //         fs.set('player_stats', player_stats);
            //     }
            // }



            let deltaState = msg.payload;
            msg.payload = delta.merge(gamestate, deltaState);
            // msg.payload.delta = deltaState;

            gamepanel.gamestate = msg.payload;
            updateGamePanel(gamepanel);

            // setGameState(msg.payload);
        }

    }

    if (msg.payload && msg.payload.players) {
        msg.local = msg.payload.players[user.shortid];
        if (msg.local)
            msg.local.id = user.shortid;
    } else {
        msg.local = { name: user.displayname, id: user.shortid };
    }

    let out = { local: msg.local, room_slug: (msg.room_slug || msg.room.room_slug), ...msg.payload };


    // console.timeEnd('ActionLoop');
    sendFrameMessage(out);

    postIncomingMessage(msg)

    updateRoomStatus(msg.room_slug || msg.room.room_slug);
}

async function postIncomingMessage(msg) {
    // let rooms = fs.get('rooms');

    let gamepanel = findGamePanelByRoom(msg.room_slug || msg.room.room_slug);
    let room = gamepanel.room;
    // let gamestate = gamepanel.gamestate;

    switch (msg.type) {
        case 'gameover':


            // let room = rooms[msg.room_slug];
            // let gamestate = fs.get('gamestate');
            let user = fs.get('user');
            // let games = fs.get('games');
            // let game = games[room.game_slug];


            if (room.mode == 'rank') {
                let player = msg.payload.players[user.shortid];

                let player_stats = fs.get('player_stats');
                let player_stat = player_stats[room.game_slug] || {};
                if (player_stat) {
                    if (player.rating)
                        player_stat.rating = player.rating;
                    if (player.ratingTxt)
                        player_stat.ratingTxt = player.ratingTxt;
                    player_stats[room.game_slug] = player_stat;
                }
                fs.set('player_stats', player_stats);

                if (room?.maxplayers > 1)
                    findGameLeaderboard(room.game_slug);

                if (room?.lbscore || room?.maxplayers == 1) {
                    findGameLeaderboardHighscore(room.game_slug);
                }
            }
            // fs.set('gamestate', {});
            break;
        case 'noshow':
            break;
        case 'notexist':
            break;
        case 'error':
            break;
        case 'kicked':

            break;
        default:
            return;
    }

    setRoomActive(room.room_slug, false);
    //sendPauseMessage(room.room_slug);
    revertBrowserTitle();
    // clearRoom(msg.room_slug);
    // delete rooms[msg.room_slug];
    // fs.set('rooms', rooms);
    // disconnect()
}

