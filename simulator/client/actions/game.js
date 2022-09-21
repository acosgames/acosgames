import DELTA from './delta';
const { decode, encode } = require('./encoder');
import fs from 'flatstore';

import GamePanelService from '../services/GamePanelService';
import { wsSend } from './websocket';
import GameStateService from '../services/GameStateService';

export function leaveGame(message) {
    let socketUser = fs.get('socketUser');
    let user = { id: socketUser.id, name: socketUser.name };
    wsSend('action', { type: 'leave', user });
    fs.set('gameStatus', 'none');
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

export function onLeave(message) {
    try {
        fs.set('wsStatus', 'connected');
        fs.set('gameStatus', 'none');
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
        let id = message?.user?.id;

        if (id && (id in fakePlayers)) {
            delete fakePlayers[id];
            fs.set('fakePlayers', fakePlayers);
            GamePanelService.removeGamePanel(id);
        }
    }

}