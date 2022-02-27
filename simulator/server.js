// require('source-map-support').install()
const path = require('path');
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const { Worker } = require("worker_threads")
const delta = require('./delta');
const { encode, decode } = require('./encoder');
const port = process.env.PORT || 3100;

const maxActionBytes = 150;

var userCount = 0;
var clients = {};
var gameHistory = [];
var worker = createWorker(1);
var locked = { seq: 0 };


var queuedActions = [];
var gameDeadline = 0;

function getLastGame() {
    if (gameHistory.length > 0)
        return gameHistory[gameHistory.length - 1];
    return null;
}
const stringHashCode = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; ++i) hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
    return hash;
};

io.on('connection', (socket) => {
    userCount++;
    let name = socket.handshake.query.username;
    if (!name)
        return;

    let id = stringHashCode(name);
    socket.user = { name, id }
    clients[socket.user.id] = socket;

    console.log('user connected: ' + socket.user.name);
    socket.emit('connected', encode(socket.user));

    setInterval(() => {
        if (gameDeadline == 0)
            return;
        let now = (new Date()).getTime();
        if (now > gameDeadline) {
            if (queuedActions.length > 0) {
                worker.postMessage(queuedActions);
                queuedActions = [];
                gameDeadline = 0;
                return;
            }

            worker.postMessage([{ type: 'skip' }]);
            gameDeadline = 0;
        }
    }, 500)

    socket.on('disconnect', () => {
        console.log('user disconnected: ' + socket.user.name);
        delete clients[socket.user.id];
        userCount--;
    });

    socket.on('time', (msg) => {
        msg = decode(msg);
        let clientTime = msg.payload;
        let serverTime = (new Date()).getTime();
        let offset = serverTime - clientTime;
        socket.emit('time', encode({ payload: { offset, serverTime } }))
    })

    socket.on('action', (action) => {
        action = decode(action);
        // msg.userid = socket.user.userid;
        if (typeof action !== 'object')
            return;
        let msgStr = JSON.stringify(action);
        let msgBuffer = Buffer.from(msgStr, 'utf-8');

        if (msgBuffer.length > maxActionBytes) {
            let warning = '!WARNING! User Action is over limit of ' + maxActionBytes + ' bytes.'
            console.log('\x1b[33m%s\x1b[0m', warning);
        }

        action.user = socket.user;

        if (action && action.type) {

            let lastGame = getLastGame();
            if (lastGame && lastGame.killGame)
                return;

            if (action.type == 'join') {
                socket.emit('join', encode(lastGame || {}));
                // if (lastGame && lastGame.players && lastGame.players[action.user.id]) {
                //     socket.emit('game', lastGame);
                //     return;
                // }
            }
            else if (action.type == 'leave') {
                socket.disconnect();
            }
            else if (action.type == 'skip') {
                return;
            }
            else if (action.type == 'gamestart') {
                gameHistory = [];
                gameDeadline = 0;
            }
            else {
                if (lastGame) {
                    let nextPlayers = lastGame?.next?.id;
                    let userid = action.user.id;

                    if (!validateNextUser(lastGame, userid))
                        return;

                }
            }


            worker.postMessage([action]);
        }

    });

    socket.on('reload', (msg) => {
        msg = decode(msg);
        console.log("Incoming Action: ", msg);
        gameHistory = [];
        worker.postMessage([{ type: 'reset' }]);
    })
});

function validateNextUser(gameState, userid) {
    let next = gameState?.next;
    let nextid = next?.id;

    if (!next || !nextid)
        return false;

    if (!gameState.state)
        return;

    //check if we ven have teams
    let teams = gameState?.teams;


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
    const worker = new Worker('./node_modules/acosgames/simulator/worker.js', { workerData: { dir: process.cwd() }, });
    worker.on("message", (dlta) => {
        console.time('[WorkerOnMessage]')
        if (!dlta || dlta.status) {
            return;
        }


        let game = getLastGame() || {};
        game = delta.merge(game, dlta);
        console.log("Delta: ", stringify(dlta));
        console.log("Merged Game: ", stringify(game));

        //remove private variables and send individually to palyers
        let copy = JSON.parse(JSON.stringify(dlta));
        let hiddenState = delta.hidden(copy.state);
        let hiddenPlayers = delta.hidden(copy.players);

        io.emit('game', encode(copy));
        if (hiddenPlayers)
            for (var id in hiddenPlayers) {
                if (clients[id])
                    clients[id].emit('private', encode(hiddenPlayers[id]))
            }

        //do after the game update, so they can see the result of their kick
        if (game.kick) {
            var kickPlayers = game.kick;
            for (var id = 0; i < kickPlayers.length; id++) {
                if (game.players && game.players[id])
                    delete game.players[id];
            }

            setTimeout(() => {
                for (var id = 0; i < kickPlayers.length; id++) {
                    if (clients[id]) {
                        clients[id].disconnect();
                    }
                }
            }, 1000);
        }


        gameHistory.push(game);

        if (game.events && game.events.gameover) {
            gameDeadline = 0;
            lastGame = {};
            setTimeout(() => {
                for (var id in clients) {
                    clients[id].disconnect();
                }
                gameHistory = [];
            }, 1000);

        }
        else if (game.timer && game.timer.end) {
            gameDeadline = game.timer.end;
        }

        console.timeEnd('[WorkerOnMessage]')
        console.timeEnd('[ActionLoop]')
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
    res.sendFile(path.join(__dirname, './client-simulator.js'));
});

app.get('/delta.js', function (req, res) {
    res.sendFile(path.join(__dirname, './delta.js'));
});

app.get('/encoder.js', function (req, res) {
    res.sendFile(path.join(__dirname, './encoder.js'));
});

app.get('/client.bundle.dev.js', function (req, res) {
    res.sendFile(path.join(process.cwd(), './builds/client/client.bundle.dev.js'));
});

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, './index.html'));
});

app.get('/iframe', function (req, res) {
    res.sendFile(path.join(__dirname, './iframe.html'));
});

server.listen(port, () => {
    console.log('Server started at http://localhost:' + port);


});


process.on('SIGINT', () => process.exit(1));