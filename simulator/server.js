require('source-map-support').install()
const path = require('path');
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const { Worker } = require("worker_threads")

const port = process.env.PORT || 3100;

var userCount = 0;
var clients = {};
var gameHistory = [];
var worker = createWorker(1);
var locked = { seq: 0 };

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
    socket.emit('connected', socket.user);

    socket.on('disconnect', () => {
        console.log('user disconnected: ' + socket.user.name);
        delete clients[socket.user.id];
        userCount--;
    });

    socket.on('time', (msg) => {
        let clientTime = msg.payload;
        let serverTime = (new Date()).getTime();
        let offset = serverTime - clientTime;
        socket.emit('time', { payload: { offset, serverTime } })
    })

    socket.on('action', (msg) => {
        console.time('[ActionLoop]')
        console.time('[SocketOnAction]')
        msg.user = socket.user;
        // msg.userid = socket.user.userid;
        if (msg && msg.type) {
            console.log("Incoming Action: ", msg);
            let lastGame = getLastGame();
            if (lastGame && lastGame.killGame)
                return;

            if (msg.type == 'join') {
                if (lastGame && lastGame.players && lastGame.players[msg.user.id]) {
                    socket.emit('game', lastGame);
                    return;
                }
            }
            else if (msg.type == 'leave') {
                socket.disconnect();
            }
            else {
                if (msg.type == 'skip') {
                    if (locked.seq == lastGame.timer.seq) {
                        return;
                    }

                    locked.seq = lastGame.timer.seq;

                }
                else if (lastGame) {
                    if (lastGame.next.id != '*' && lastGame.next.id != msg.user.id)
                        return;
                }
            }

            console.timeEnd('[SocketOnAction]')
            worker.postMessage(msg);
        }

    });

    socket.on('reload', (msg) => {
        console.log("Incoming Action: ", msg);
        gameHistory = [];
        worker.postMessage({ type: 'reset' });
    })
});



function createWorker(index) {
    const worker = new Worker('./fivesecondgames/simulator/worker.js', { workerData: { index }, });
    worker.on("message", (game) => {
        console.time('[WorkerOnMessage]')
        if (!game || game.status) {
            return;
        }



        console.log("Outgoing Game: ", game);


        io.emit('game', game);

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

        if (game.killGame) {
            setTimeout(() => {
                for (var id in clients) {
                    clients[id].disconnect();
                }
                gameHistory = [];
            }, 1000);

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


app.get('/client.bundle.js', function (req, res) {
    res.sendFile(path.join(__dirname, '../../builds/client/client.bundle.js'));
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
