import DELTA from './delta';
const { decode, encode } = require('./encoder');
import fs from 'flatstore';

import GamePanelService from '../services/GamePanelService';
import { wsSend } from './websocket';
import GameStateService from '../services/GameStateService';


var timerHandle = 0;
export function timerLoop(cb) {

    if (cb)
        cb();

    if (timerHandle) {
        clearTimeout(timerHandle);
        timerHandle = 0;
    }

    timerHandle = setTimeout(() => { timerLoop(cb) }, 30);

    updateTimeleft();
}

timerLoop();

export function validateNextUser(userid) {
    let gamestate = GameStateService.getGameState();
    let next = gamestate?.next;
    let nextid = next?.id;
    let room = gamestate.room;

    if (room?.status == 'pregame')
        return true;

    if (!next || !nextid)
        return false;

    if (!gamestate.state)
        return false;

    //check if we ven have teams
    let teams = gamestate?.teams;


    if (typeof nextid === 'string') {
        //anyone can send actions
        if (nextid == '*')
            return true;

        //only specific user can send actions
        if (nextid == userid)
            return true;

        //validate team has players
        if (!teams || !teams[nextid] || !teams[nextid].players)
            return false;

        //allow players on specified team to send actions
        if (Array.isArray(teams[nextid].players) && teams[nextid].players.includes(userid)) {
            return true;
        }
    }
    else if (Array.isArray(nextid)) {

        //multiple users can send actions if in the array
        if (nextid.includes(userid))
            return true;

        //validate teams exist
        if (!teams)
            return false;

        //multiple teams can send actions if in the array
        for (var i = 0; i < nextid.length; i++) {
            let teamid = nextid[i];
            if (Array.isArray(teams[teamid].players) && teams[teamid].players.includes(userid)) {
                return true;
            }
        }
    }

    return false;
}

export function updateTimeleft() {
    let gamestate = GameStateService.getGameState();
    if (!gamestate)
        return;

    let timer = gamestate.timer;
    if (!timer) {
        return;
    }

    let deadline = timer.end;
    if (!deadline)
        return;

    let now = (new Date()).getTime();
    let elapsed = deadline - now;

    if (elapsed <= 0) {
        elapsed = 0;
    }

    fs.set('timeleft', elapsed);
    fs.set('timeleftUpdated', Date.now());
}

export function leaveGame(message) {
    let socketUser = fs.get('socketUser');
    let user = { id: socketUser.id, name: socketUser.name };
    wsSend('action', { type: 'leave', user });
    fs.set('gameStatus', 'none');
}


export function replayNext() {
    wsSend('replay', { type: 'next' });
}

export function replayPrev() {
    wsSend('replay', { type: 'prev' });
}

export function replayJump(index) {
    wsSend('replay', { type: 'jump', payload: index });
}

export function joinGame() {
    let socketUser = fs.get('socketUser');
    let user = { id: socketUser.id, name: socketUser.name };
    wsSend('action', { type: 'join', user });
}

export function startGame(message) {
    let socketUser = fs.get('socketUser');
    let user = { id: socketUser.id, name: socketUser.name };
    wsSend('action', { type: 'gamestart', user });
}

export function newGame(message) {
    let socketUser = fs.get('socketUser');
    let user = { id: socketUser.id, name: socketUser.name };
    wsSend('action', { type: 'newgame', user });
    fs.set('gameStatus', 'none');
}

export function spawnFakePlayers(message) {
    let socketUser = fs.get('socketUser');
    let user = { id: socketUser.id, name: socketUser.name };
    wsSend('fakeplayer', { type: 'create', user, payload: 1 });
}

export function joinFakePlayer(fakePlayer) {
    let user = { id: fakePlayer.id, name: fakePlayer.name };
    wsSend('action', { type: 'join', user });
}

export function leaveFakePlayer(fakePlayer) {
    let socketUser = fs.get('socketUser');
    let user = { id: fakePlayer.id, name: fakePlayer.name, clientid: socketUser.id };
    wsSend('action', { type: 'leave', user });
}

export function removeFakePlayer(fakePlayer) {
    let socketUser = fs.get('socketUser');
    let user = { id: fakePlayer.id, name: fakePlayer.name, clientid: socketUser.id };
    wsSend('fakeplayer', { type: 'remove', user });
}

export function onLeave(message) {
    try {
        fs.set('wsStatus', 'connected');
        fs.set('gameStatus', 'none');
    }
    catch (e) {
        console.error(e);
    }
}

export function onReplayStats(message) {
    try {
        message = decode(message);
        console.log('REPLAY STATS: ', message);
        if (!message) return;

        fs.set('replayStats', message);
    }
    catch (e) {
        console.error(e);
    }
}

export function onReplay(message) {
    try {
        message = decode(message);
        console.log('REPLAY: ', message);
        if (!message) return;

        GameStateService.updateState(
            message.current,
            message.prev
        );

        updateTimeleft();
        fs.set('gameStatus', message?.current?.room?.status || 'none');
    }
    catch (e) {
        console.error(e);
    }
}

export function onGameUpdate(message) {
    try {
        message = decode(message);
        console.log('GAME UPDATE: ', message);
        if (!message) return;

        GameStateService.updateState(message);

        fs.set('gameStatus', message?.room?.status || 'none');
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

        GameStateService.updateState(message);

        if (message?.room?.status) {
            fs.set('gameStatus', message.room.status);
        }

        fs.set('wsStatus', 'ingame');
    }
    catch (e) {
        console.error(e);
    }
}


export function onFakePlayer(message) {
    message = decode(message);
    console.log('FAKEPLAYER: ', message);
    if (!message || typeof message.type === 'undefined') return;

    let fakePlayers = fs.get('fakePlayers') || {};

    if (message.type == 'created') {

        let newFakePlayers = message.payload;
        for (const fakePlayer of newFakePlayers) {
            fakePlayers[fakePlayer.id] = fakePlayer;
        }
        for (const fakePlayer of newFakePlayers) {
            GamePanelService.createGamePanel(fakePlayer.id);
        }
        fs.set('fakePlayers', fakePlayers);
    }
    else if (message.type == 'join') {
    }
    else if (message.type == 'leave') {

    }
    else if (message.type == 'removed') {
        let id = message?.payload;

        if (id && (id in fakePlayers)) {
            let fakePlayer = fakePlayers[id];
            leaveFakePlayer(fakePlayer);

            delete fakePlayers[id];
            GamePanelService.removeGamePanel(id);
            fs.set('fakePlayers', fakePlayers);

        }
    }

}