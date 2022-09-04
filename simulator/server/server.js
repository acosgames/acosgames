

// require('source-map-support').install()
const path = require('path');
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

io.on('connection', (socket) => {
    userCount++;
    let name = socket.handshake.query.username;
    if (!name)
        return;

    let id = socket.id;
    let shortid = "USER" + stringHashCode(name);
    let user = { shortid, name, id }
    clients[socket.id] = { socket, ...user };

    console.log('[ACOS] user connected: ' + name);
    socket.emit('connected', encode(user));



    socket.on('disconnect', (e) => {
        let client = clients[socket.id];
        if (!client) return;

        console.log('[ACOS] user disconnected: ' + client.name, e);
        delete clients[socket.id];
        userCount--;
    });

    socket.on('ping', (msg) => {
        msg = decode(msg);
        let clientTime = msg.payload;
        let serverTime = (new Date()).getTime();
        let offset = serverTime - clientTime;
        socket.emit('pong', encode({ payload: { offset, serverTime } }))
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
            console.log('[ACOS] \x1b[33m%s\x1b[0m', warning);
        }

        let client = clients[socket.id];
        if (!client) return;

        action.user = { id: client.shortid, name: client.name };

        if (action && action.type) {

            let lastGame = getLastGame();
            if (lastGame && lastGame.killGame)
                return;

            if (action.type == 'join') {
                lastGame = lastGame || {};
                let dlta = JSON.parse(JSON.stringify(lastGame));
                let hiddenState = delta.hidden(dlta.state);
                let hiddenPlayers = delta.hidden(dlta.players);

                io.emit('join', encode(dlta));
                if (hiddenPlayers)
                    for (var id in hiddenPlayers) {
                        if (hiddenPlayers[action.user.id] && clients[action.user.id])
                            clients[id].socket.emit('private', encode(hiddenPlayers[id]))
                    }

                // socket.emit('join', encode(lastGame || {}));
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

            io.emit('lastAction', encode(action));
            worker.postMessage([action]);
        }

    });

    socket.on('reload', (msg) => {
        msg = decode(msg);
        console.log("[ACOS] Incoming Action: ", msg);
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
    console.log("[ACOS] Worker current directory: ", process.cwd(), process.argv);
    const worker = new Worker(__dirname + '/worker.js', { workerData: { dir: process.argv[2] }, });
    worker.on("message", (dlta) => {
        console.time('[ACOS] [WorkerOnMessage]')
        if (!dlta || dlta.status) {
            return;
        }


        let game = getLastGame() || {};
        game = delta.merge(game, dlta);
        console.log("[ACOS] Delta: ", stringify(dlta));
        console.log("[ACOS] Merged Game: ", stringify(game));

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
                // for (var id in clients) {
                //     clients[id].disconnect();
                // }
                gameHistory = [];
            }, 1000);

        }
        else if (game.timer && game.timer.end) {
            gameDeadline = game.timer.end;
        }

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