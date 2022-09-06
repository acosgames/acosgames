import fs from 'flatstore'

import { decode, encode } from './encoder';
import { io } from "socket.io-client";

import { onFakePlayer, onGamePrivateUpdate, onGameUpdate, onJoin, onLeave, onSpectate } from './game';



// var latency = 0;
// var latencyStart = 0;
// var offsetTime = 0;

fs.set('socket', null);
fs.set('latency', 0);
fs.set('latencyStart', 0);
fs.set('latencyOffsetTime', 0);
fs.set('wsStatus', 'disconnected');
fs.set('gameStatus', 'none');

//--------------------------------------------------
//WebSockets Connection / Management 
//--------------------------------------------------
export function connect(username) {
    // note.textContent = 'Status: connecting...';
    let socket = fs.get('socket');

    if (socket && !socket.disconnected) {
        // socket.disconnect();
        return;
    }

    username = username || "Player " + (Math.floor(Math.random() * 1000));

    fs.set('username', username);

    let host = window.location.host;
    console.log(host);
    socket = io('ws://localhost:3200',
        {
            // jsonp: false,
            transports: ['websocket'],
            // upgrade: true,
            query: 'username=' + username,
        }
    );

    // Global events are bound against socket
    socket.on('reconnect_error', function (e) {
        console.log('Connection Failed', e);
    });

    socket.on("connect_error", (err) => {
        console.log(`connect_error due to ${err.message}`);
    });


    socket.io.on("error", (err) => {
        console.log(`error due to `, err);
    });

    socket.on('connect', onConnect);
    socket.on('connected', onConnected);
    socket.on('pong', onPong);
    socket.on('lastAction', onLastAction)
    socket.on('join', onJoin)
    socket.on('leave', onLeave);
    socket.on('game', onGameUpdate);
    socket.on('spectate', onSpectate);
    socket.on('fakeplayer', onFakePlayer);
    socket.on('private', onGamePrivateUpdate);
    socket.on('disconnect', onDisconnect);

    fs.set('socket', socket);
}


const onConnect = (evt) => {
    fs.set('wsStatus', 'connected');
    let socket = fs.get('socket');
    let socketUser = fs.get('socketUser');


}

const onConnected = (message) => {
    try {
        //message should have { id, name }
        message = decode(message);

        let socketUser = message.user;
        let gameSettings = message.gameSettings;
        ping();

        fs.set('gameSettings', gameSettings);
        fs.set('socketUser', socketUser);
        fs.set('wsStatus', 'connected');
    }
    catch (e) {
        console.error(e);
    }

}

const ping = () => {
    try {
        let latencyStart = new Date().getTime();
        let socket = fs.get('socket');
        socket.emit('ping', encode({ payload: latencyStart }));
        fs.set('latencyStart', latencyStart);
    }
    catch (e) {
        console.error(e);
    }
}

const onPong = (message) => {
    try {
        message = decode(message);
        let latencyStart = fs.get('latencyStart');
        let serverOffset = message.payload.offset;
        let serverTime = message.payload.serverTime;
        let currentTime = new Date().getTime();
        let latency = currentTime - latencyStart;
        let offsetTime = currentTime - serverTime;
        let realTime = currentTime + offsetTime + Math.ceil(latency / 2);
        console.log('Latency Start: ', latencyStart);
        console.log('Latency: ', latency);
        console.log('Offset Time: ', offsetTime);
        console.log('Server Offset: ', serverOffset);
        console.log('Server Time: ', serverTime);
        console.log('Client Time: ', currentTime);
        console.log('Real Time: ', realTime);
    }
    catch (e) {
        console.error(e);
    }
}

const onLastAction = (message) => {
    try {
        message = decode(message);
        console.log('Last Action: ', message);
    }
    catch (e) {
        console.error(e);
    }
}

const onDisconnect = (e) => {
    try {
        fs.set('wsStatus', 'disconnected');
        fs.set('gameStatus', 'none');
        let socket = fs.get('socket');
        console.log(socket.id + ' disconnect', e, socket.io.engine);
    }
    catch (e) {
        console.error(e);
    }
}

