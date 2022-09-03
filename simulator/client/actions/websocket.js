import fs from 'flatstore'

const { decode } = require('./encoder');
const { io } = require("socket.io-client");

import { onGamePrivateUpdate, onGameUpdate, onJoin } from './game';



// var latency = 0;
// var latencyStart = 0;
// var offsetTime = 0;

fs.set('socket', null);
fs.set('latency', 0);
fs.set('latencyStart', 0);
fs.set('latencyOffsetTime', 0);


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

    let host = window.location.host;
    console.log(host);
    socket = io('ws://' + host,
        {
            transports: ['websocket'],
            // upgrade: true,
            query: 'username=' + username,
        }
    );

    socket.on('connect', onConnect);
    socket.on('connected', onConnected);
    socket.on('pong', onPong);
    socket.on('lastAction', onLastAction)
    socket.on('join', onJoin)
    socket.on('game', onGameUpdate);
    socket.on('private', onGamePrivateUpdate);
    socket.on('disconnect', onDisconnect);

    fs.set('socket', socket);
}


const onConnect = (evt) => {
    if (onjoin) onjoin(evt);
    // window.sessionStorage.setItem('connected', true);
    fs.set('wsStatus', 'connecting');
}

const onConnected = (message) => {
    //message should have { id, name }
    message = decode(message);
    socket.user = message;
    ping();

    fs.set('wsStatus', 'connected');

}

const ping = () => {
    let latencyStart = new Date().getTime();
    socket.emit('time', encode({ payload: latencyStart }));
    fs.set('latencyStart', latencyStart);
}

const onPong = (message) => {
    message = decode(message);
    let latencyStart = fs.get('latencyStart');
    let serverOffset = message.payload.offset;
    let serverTime = message.payload.serverTime;
    let currentTime = new Date().getTime();
    latency = currentTime - latencyStart;
    offsetTime = currentTime - serverTime;
    let realTime = currentTime + offsetTime + Math.ceil(latency / 2);
    console.log('Latency Start: ', latencyStart);
    console.log('Latency: ', latency);
    console.log('Offset Time: ', offsetTime);
    console.log('Server Offset: ', serverOffset);
    console.log('Server Time: ', serverTime);
    console.log('Client Time: ', currentTime);
    console.log('Real Time: ', realTime);
}

const onLastAction = (message) => {
    message = decode(message);
    console.log('Last Action: ', message);
}

const onDisconnect = () => {
    fs.set('wsStatus', 'disconnected');
}

