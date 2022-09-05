

// require('source-map-support').install()
const path = require('path');
const fs = require('fs');

const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const options = {
    transports: ['websocket']
}
const io = new Server(server, options);
const { Worker } = require("worker_threads")
const delta = require('../shared/delta');
const { encode, decode } = require('../shared/encoder');

const profiler = require('./profiler');
const chokidar = require('chokidar');
const NANOID = require('nanoid')
const nanoid = NANOID.customAlphabet('6789BCDFGHJKLMNPQRTW', 6)

const Room = require('./Room');

const UserManager = require('./UserManager');
const RoomManager = require('./RoomManager');


const port = process.env.PORT || 3100;

const maxActionBytes = 150;

var userCount = 0;
var clients = {};

let gameHistory = [];
let rooms = [];

// let roomHistory = [];


// var gameHistory = [];
var worker = createWorker(1);
var locked = { seq: 0 };

let gameUsers = {};
let allFakeUsers = {};

var queuedActions = [];
var gameDeadline = 0;

const gameWorkingDirectory = process.argv[2];

const GameSettingsManager = require('./GameSettingsManager');
const { isObject } = require('./rank');
const { cloneObj } = require('./util');
const settings = new GameSettingsManager(gameWorkingDirectory);




function getCurrentGame() {
    if (gameHistory.length > 0)
        return gameHistory[gameHistory.length - 1];
    return null;
}
const stringHashCode = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; ++i) hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
    return hash;
};

const generateShortId = (len) => {
    return nanoid(len || 6)
}



setInterval(() => {
    let room = RoomManager.current();

    let deadline = room.getDeadline();
    if (deadline == 0)
        return;
    let now = (new Date()).getTime();
    if (now > deadline) {
        let room = RoomManager.current();
        let gamestate = room.getGameState();

        room.skipCount++;
        if (room.skipCount > 5) {
            RoomManager.create();
            return;
        }
        worker.postMessage({ action: { type: 'skip' }, room: room.json(), gamestate });
        // worker.postMessage([]);
        room.setDeadline(0);
    }
}, 500)



function onConnect(socket) {
    let name = socket.handshake.query.username;
    if (!name)
        return;

    console.log('[ACOS] user connected: ' + name);
    let newUser = UserManager.register(socket, name);
    let user = UserManager.actionUser(newUser);
    socket.emit('connected', encode({
        user,
        gameSettings: settings.get()
    }));


    //join user immediately into game
    onAction(socket, { type: 'join', user }, true);

    //user is already in game, just rejoin them and send them full game state
    // let room = RoomManager.current();
    // if (room.hasPlayer(newUser.shortid)) {
    //     onAction(socket, { type: 'join', user }, true);
    // }
}

function onDisconnect(socket, e) {
    let user = UserManager.getUserBySocketId(socket.id);
    if (!user) return;

    console.log('[ACOS] user disconnected: ' + user.name, e);

    // UserManager.remove(socket.id);
}

function onPing(socket, msg) {
    msg = decode(msg);
    let clientTime = msg.payload;
    let serverTime = (new Date()).getTime();
    let offset = serverTime - clientTime;
    socket.emit('pong', encode({ payload: { offset, serverTime } }))
}

function onFakeUser(socket, msg) {
    msg = decode(msg);
    let type = msg.type;
    let count = msg.payload;
    let client = clients[socket.id];
    let shortid = client.shortid;
    // let fakeUsers = clients[socket.id].fakeUsers;

    if (type == 'create') {
        let newFakeUsers = createFakeUsers(socket.id, count);
        socket.emit('fakeuser', encode({ type: 'created', payload: newFakeUsers }))
    }
    else if (type == 'join') {
        for (const fakeUser of allFakeUsers) {
            if (fakeUser.clientid != shortid)
                continue;

            let action = {
                type: 'join',
                user: { shortid: fakeUser.shortid, name: fakeUser.name },
                payload: {}
            }
            onAction(socket, action, true);

        }
        socket.emit('fakeuser', encode({ type: 'join', payload: newFakeUsers }))
    }
    else if (type == 'leave') {
        for (const fakeUser of fakeUsers) {
            let action = {
                type: 'leave',
                user: { shortid: fakeUser.shortid, name: fakeUser.name },
                payload: {}
            }
            onAction(socket, action, true);
        }
        socket.emit('fakeuser', encode({ type: 'leave', payload: newFakeUsers }))
    }

    clients[socket.id].fakeUsers = fakeUsers;
}
io.on('connection', (socket) => {

    onConnect(socket);

    socket.on('disconnect', (e) => { onDisconnect(socket, e); });
    socket.on('ping', (msg) => { onPing(socket, msg); })

    socket.on('fakeuser', (msg) => {
        onFakeUser(socket, msg);
    })

    socket.on('action', (msg) => {
        onAction(socket, msg)
    });
    socket.on('reload', (msg) => {
        msg = decode(msg);
        console.log("[ACOS] Incoming Action: ", msg);
        gameHistory = [];
        worker.postMessage([{ type: 'reset' }]);
    })
});

const onJoinRequest = (action) => {
    let lastGame = getCurrentGame();
    lastGame = lastGame || {};

    let room = RoomManager.current();
    let client = UserManager.getUserByShortid(action.user.id);



    if (room.hasPlayer(action.user.id)) {
        console.log('[ACOS] User already in game: ', action.user.id, action.user.name);
        sendUserGame(client, room);
        return false;
    }

    let hasVacancy = room.hasVacancy();

    if (!hasVacancy) {
        console.log('[ACOS] Game full, moving to spectator: ', action.user.id, action.user.name);
        sendUserSpectator(action.user, room);
        return false;
    }

    console.log('[ACOS] Adding user to game: ', action.user.id, action.user.name);
    return true;
}

const sendUserSpectator = (user, room) => {
    let client = UserManager.getParentUser(user.parentid);
    if (!client) {
        console.error("Invalid client found using: ", user);
        return;
    }
    client.socket.join('spectator');
    room.addSpectator(user);
}

const sendUserGame = (client, room) => {

    client.socket.join('gameroom');

    let gamestate = room.copyGameState();
    let hiddenState = delta.hidden(gamestate.state);
    let hiddenPlayers = delta.hidden(gamestate.players);
    io.to('gameroom').emit('join', encode(gamestate));
    if (hiddenPlayers) {
        if (client.shortid in hiddenPlayers) {
            client.socket.emit('private', encode(hiddenPlayers[client.shortid]));
        }
    }
}

const onLeaveRequest = (action) => {
    if (action.user.shortid in allFakeUsers) {

        delete allFakeUsers[action.user.shortid];
    }

    let room = RoomManager.current();
    io.to(room.room_slug).emit('leave', encode({ user: action.user }));
    return true;
}
const onSkipRequest = (action) => {
    return false;
}
const onGameStartRequest = (action) => {
    // gameHistory = [];

    let room = RoomManager.current();
    room.setDeadline(0);
    // gameDeadline = 0;
    return true;
}

const onGameActionRequest = (action) => {
    return true;
}

const onNewGameRequest = (action) => {
    RoomManager.create();
    let client = UserManager.getUserByShortid(action.user.id);
    onAction(client.socket, { type: 'join', user: action.user }, true);
    return false;
}

const actionTypes = {
    'join': onJoinRequest,
    'leave': onLeaveRequest,
    'skip': onSkipRequest,
    'newgame': onNewGameRequest,
    'gamestart': onGameStartRequest,
}

const calculateTimeleft = (gamestate) => {
    if (!gamestate || !gamestate.timer || !gamestate.timer.end)
        return 0;

    let deadline = gamestate.timer.end;
    let now = (new Date()).getTime();
    let timeleft = deadline - now;

    return timeleft;
}

function onAction(socket, action, skipDecode) {
    if (!skipDecode)
        action = decode(action);
    // msg.userid = socket.user.userid;
    if (typeof action !== 'object' || !('type' in action))
        return;
    let msgStr = JSON.stringify(action);
    let msgBuffer = Buffer.from(msgStr, 'utf-8');

    if (msgBuffer.length > maxActionBytes) {
        let warning = '!WARNING! User Action is over limit of ' + maxActionBytes + ' bytes.'
        console.log('[ACOS] \x1b[33m%s\x1b[0m', warning);
    }

    //find the user by the action shortid
    let client = UserManager.getUserByShortid(action.user.id);
    if (!client) return;
    let user = UserManager.actionUser(client);

    let room = RoomManager.current();
    let gamestate = room.getGameState();
    let timeleft = calculateTimeleft(gamestate);

    //set the action to this user
    action.user = user;

    //add timing sequence
    action.timeseq = gamestate?.timer?.seq || 0;
    action.timeleft = timeleft;

    let actionFunc = actionTypes[action.type] || onGameActionRequest;

    if (actionFunc == onGameActionRequest) {
        if (!validateNextUser(room, gamestate, action.user.id)) {
            console.warn("[ACOS] User not allowed to run action:", action);
            return;
        }
    }

    if (!actionFunc(action)) {
        return;
    }

    io.to('gameroom').emit('lastAction', encode({ action, gamestate }));
    worker.postMessage({ action, room: room.json(), gamestate });
}


function validateNextUser(room, gamestate, userid) {
    let next = gamestate?.next;
    let nextid = next?.id;

    if (room.status == 'pregame')
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


function stringify(obj) {
    return JSON.stringify(obj, function (k, v) {
        if (v instanceof Array && !delta.isObject(v[0]))
            return JSON.stringify(v);
        return v;
    }, 2);
}

function createWorker(index) {
    console.log("[ACOS] Worker current directory: ", process.cwd(), process.argv);
    const worker = new Worker(__dirname + '/worker.js', { workerData: { dir: process.argv[2] }, });
    worker.on("message", (gamestate) => {
        console.time('[ACOS] [WorkerOnMessage]')
        if (!gamestate || !isObject(gamestate)) {
            return;
        }

        let room = RoomManager.current();

        let prevGamestate = room.copyGameState();
        prevGamestate.events = {};
        let deltaGamestate = delta.delta(prevGamestate, cloneObj(gamestate), {});

        console.log("[ACOS] Delta: ", stringify(deltaGamestate));
        console.log("[ACOS] Merged Game: ", stringify(gamestate));

        //remove private variables and send individually to palyers
        let copy = JSON.parse(JSON.stringify(deltaGamestate));
        let hiddenState = delta.hidden(copy.state);
        let hiddenPlayers = delta.hidden(copy.players);

        if (gamestate?.events?.join) {
            for (const shortid of gamestate.events.join) {
                let client = UserManager.getUserByShortid(shortid);
                client.socket.join('gameroom');
            }
        }

        io.to('gameroom').emit('game', encode(copy));

        if (hiddenPlayers)
            for (var id in hiddenPlayers) {
                let client = UserManager.getUserByShortid(id);
                if (client)
                    client.emit('private', encode({ players: { [id]: hiddenPlayers[id] } }))
            }


        room.updateGame(gamestate);


        console.timeEnd('[ACOS] [WorkerOnMessage]')
        console.timeEnd('[ACOS] [ActionLoop]')
    });
    worker.on("online", (err) => {

    })
    worker.on("error", (err) => {
        console.error(err);
    })
    worker.on("exit", code => {
        if (code !== 0) {
            console.error(code);
            throw new Error(`Worker stopped with exit code ${code}`)
        }
    })

    return worker;
}

app.get('/client-simulator.js', function (req, res) {
    res.sendFile(path.join(__dirname, './public/client-simulator.js'));
});

app.get('/delta.js', function (req, res) {
    res.sendFile(path.join(__dirname, './delta.js'));
});

app.get('/encoder.js', function (req, res) {
    res.sendFile(path.join(__dirname, './encoder.js'));
});
app.get('/jsonViewer.js', function (req, res) {
    res.sendFile(path.join(__dirname, './jsonViewer.js'));
});

app.get('/client.bundle.dev.js', function (req, res) {
    res.sendFile(path.join(process.argv[2], './builds/client/client.bundle.dev.js'));
});

app.get('/bundle.js', function (req, res) {
    res.sendFile(path.join(__dirname, './public/bundle.js'));
})

app.get('/index2.html', function (req, res) {
    res.sendFile(path.join(__dirname, './public/index2.html'));
});

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, './public/index.html'));
});

app.get('/iframe.html', function (req, res) {
    res.sendFile(path.join(__dirname, './public/iframe.html'));
});

server.listen(port, () => {
    console.log('[ACOS] Server started at http://localhost:' + port);


});

process.on('SIGINT', () => {
    process.exit()
});