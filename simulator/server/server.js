// require('source-map-support').install()
const path = require("path");
const fs = require("fs");

const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const options = {
    transports: ["websocket"],
};
const io = new Server(server, options);
const { Worker } = require("worker_threads");
const delta = require("acos-json-delta");
const { encode, decode, createDefaultDict } = require("acos-json-encoder");

const ACOSDictionary = require("../shared/acos-dictionary.json");
createDefaultDict(ACOSDictionary);

const NANOID = require("nanoid");
const nanoid = NANOID.customAlphabet("6789BCDFGHJKLMNPQRTW", 6);

const UserManager = require("./UserManager");
const RoomManager = require("./RoomManager");

const port = process.env.PORT || 3100;

const maxActionBytes = 150;

var worker = createWorker(1);

const gameWorkingDirectory = process.argv[2];

const GameSettingsManager = require("./GameSettingsManager");
const { isObject } = require("./rank");
const { cloneObj } = require("./util");
const settings = new GameSettingsManager(
    gameWorkingDirectory,
    onGameSettingsReloaded
);

RoomManager.setSettings(settings);

function onGameSettingsReloaded() {
    // let user = UserManager.actionUser(newUser);

    let room = RoomManager.create();
    let gamestate = room.getGameState();
    // onAction({ type: 'newgame' }, true);
    worker.postMessage({
        action: { type: "newgame" },
        room: room.json(),
        gamestate,
        gameSettings: settings.get(),
    });
    io.emit("teaminfo", encode(room.getTeamInfo()));
    io.emit(
        "gameSettings",
        encode({
            gameSettings: settings.get(),
        })
    );
}

setInterval(() => {
    let room = RoomManager.current();

    let deadline = room.getDeadline();
    if (deadline == 0) return;
    let now = new Date().getTime();
    if (now > deadline) {
        let room = RoomManager.current();
        let gamestate = room.getGameState();

        room.skipCount++;
        if (room.skipCount > 5) {
            RoomManager.create();
            return;
        }
        worker.postMessage({
            action: { type: "skip" },
            room: room.json(),
            gamestate,
            gameSettings: settings.get(),
        });
        // worker.postMessage([]);
        room.setDeadline(0);
    }
}, 500);

function onConnect(socket) {
    let name = socket.handshake.query.username;
    if (!name) return;

    console.log("[ACOS] user connected: " + name);
    let newUser = UserManager.register(socket, name);
    let user = UserManager.actionUser(newUser);
    socket.emit(
        "connected",
        encode({
            user,
            gameSettings: settings.get(),
        })
    );

    //join user immediately into game
    let room = RoomManager.current();
    if (room.hasPlayer(user.id)) onAction({ type: "join", user }, true);

    let fakePlayers = UserManager.getFakePlayersByParent(user.id);
    if (fakePlayers?.length > 0) {
        socket.emit(
            "fakeplayer",
            encode({ type: "created", payload: fakePlayers })
        );

        for (const fakePlayer of fakePlayers) {
            if (room.hasPlayer(fakePlayer.id))
                onAction({ type: "join", user: fakePlayer }, true);
        }
    }

    io.emit("teaminfo", encode(room.getTeamInfo()));

    socket.join("gameroom");

    socket.emit("game", encode(room.copyGameState()));

    //user is already in game, just rejoin them and send them full game state
    // let room = RoomManager.current();
    // if (room.hasPlayer(newUser.shortid)) {
    //     onAction(socket, { type: 'join', user }, true);
    // }
}

function onDisconnect(socket, e) {
    let user = UserManager.getUserBySocketId(socket.id);
    if (!user) return;

    console.log("[ACOS] user disconnected: " + user.name, e);

    // UserManager.remove(socket.id);
}

function onPing(socket, msg) {
    msg = decode(msg);
    let clientTime = msg.payload;
    let serverTime = new Date().getTime();
    let offset = serverTime - clientTime;
    socket.emit("pong", encode({ payload: { offset, serverTime } }));
}

function onNewGameSettings(socket, newGameSettings) {
    newGameSettings = decode(newGameSettings);

    settings.updateGameSettings(newGameSettings);
}

function onFakePlayer(socket, msg) {
    msg = decode(msg);
    let type = msg.type;

    let client = UserManager.getUserBySocketId(socket.id);

    let shortid = client.shortid;

    if (type == "create") {
        let count = msg.payload || 1;
        let newFakePlayers = UserManager.createFakePlayers(shortid, count);
        socket.emit(
            "fakeplayer",
            encode({ type: "created", payload: newFakePlayers })
        );
    } else if (type == "remove") {
        msg.type = "leave";
        onAction(msg, true);

        UserManager.removeFakePlayer(msg.user.id);

        // let newFakePlayers = UserManager.iterateFakePlayers(client.shortid);
        socket.emit(
            "fakeplayer",
            encode({ type: "removed", payload: msg.user.id })
        );
    }
}
io.on("connection", (socket) => {
    onConnect(socket);

    socket.on("disconnect", (e) => {
        onDisconnect(socket, e);
    });
    socket.on("ping", (msg) => {
        onPing(socket, msg);
    });

    socket.on("gameSettings", (newGameSettings) => {
        onNewGameSettings(socket, newGameSettings);
    });

    socket.on("fakeplayer", (msg) => {
        onFakePlayer(socket, msg);
    });
    socket.on("replay", (msg) => {
        onReplay(msg);
    });
    socket.on("action", (msg) => {
        onAction(msg);
    });
    socket.on("reload", (msg) => {
        msg = decode(msg);
        console.log("[ACOS] Incoming Action: ", msg);
        gameHistory = [];
        worker.postMessage([{ type: "reset" }]);
    });
});

const onJoinRequest = (action) => {
    let room = RoomManager.current();
    let client = UserManager.getUserByShortid(action.user.id);
    if (!client) {
        client = UserManager.getParentUser(action.user.clientid);
        if (!client) {
            console.error("Invalid client found using: ", user);
            return;
        }
    }

    if (room.hasPlayer(action.user.id)) {
        console.log(
            "[ACOS] User already in game: ",
            action.user.id,
            action.user.name
        );
        sendUserGame(client, room);
        return false;
    }

    let hasVacancy = room.hasVacancy();

    if (!hasVacancy) {
        console.log(
            "[ACOS] Game full, moving to spectator: ",
            action.user.id,
            action.user.name
        );
        sendUserSpectator(action.user, room);
        return false;
    }

    //check if team is available
    let teaminfo = room.getTeamInfo();
    if (teaminfo.length > 1) {
        let attempt = room.attemptJoinTeam(action.user.team_slug);
        if (attempt.error) {
            client.socket.emit("error", encode(attempt));
            console.log(
                "[ACOS] [Error] " + attempt.error + ": ",
                action.user.team_slug,
                ", for user:",
                action.user.id,
                action.user.name
            );
            return false;
        }

        action.user.team_slug = attempt.team_slug;
    }

    console.log(
        "[ACOS] Adding user to game: ",
        action.user.id,
        action.user.name
    );
    return true;
};

const sendUserSpectator = (user, room) => {
    let client = UserManager.getUserByShortid(user.id);
    if (!client) {
        client = UserManager.getParentUser(user.clientid);
        if (!client) {
            console.error("Invalid client found using: ", user);
            return;
        }
    }
    // client.socket.join('spectator');
    // UserManager.setSpectator(user.id);

    // io.to.emit('spectator', encode({ type: 'join', user }));
    // room.addSpectator(user);
};

const sendUserGame = (client, room) => {
    if (!client || !client.socket) return;

    client.socket.join("gameroom");

    let gamestate = room.copyGameState();
    // let hiddenState = delta.hidden(gamestate.state);
    // let hiddenPlayers = delta.hidden(gamestate.players);
    io.emit("replayStats", encode(room.replayStats()));
    io.emit("game", encode(gamestate));
    // if (hiddenPlayers) {
    //     if (client.shortid in hiddenPlayers) {
    //         client.socket.emit('private', encode(hiddenPlayers[client.shortid]));
    //     }
    // }
};

const onLeaveRequest = (action) => {
    if (action.user.id in UserManager.getFakePlayers()) {
        // let fakePlayers = UserManager.getFakePlayersByParent(action.user.clientid)
        // for (const fakePlayer of fakePlayers) {
        // if (action.user.clientid) {
        //     let client = UserManager.getUserByShortid(action.user.clientid);
        // client.socket.emit('fakeplayer', encode({ type: 'removed', user: action.user }));
        // }
        // UserManager.removeFakePlayer(action.user.id);
        // }
    }

    let room = RoomManager.current();
    let gamestate = room.getGameState();
    if (!gamestate || !gamestate.players) return false;

    if (!(action.user.id in gamestate?.players)) {
        return false;
    }

    io.to(room.room_slug).emit("leave", encode({ user: action.user }));
    return true;
};
const onSkipRequest = (action) => {
    return true;
};
const onGameStartRequest = (action) => {
    // gameHistory = [];

    let room = RoomManager.current();
    room.setDeadline(0);
    // gameDeadline = 0;
    return true;
};

const onGameActionRequest = (action) => {
    return true;
};

const onNewGameRequest = (action) => {
    let room = RoomManager.create();
    let client = UserManager.getUserByShortid(action.user.id);
    // onAction(client.socket, { type: 'join', user: action.user }, true);
    let prevGamestate = room.copyGameState();
    io.emit("replayStats", encode(room.replayStats()));
    io.to("gameroom").emit("newgame", encode(prevGamestate));
    io.emit("teaminfo", encode(room.getTeamInfo()));

    return true;
};

const calculateTimeleft = (gamestate) => {
    if (!gamestate || !gamestate.timer || !gamestate.timer.end) return 0;

    let deadline = gamestate.timer.end;
    let now = new Date().getTime();
    let timeleft = deadline - now;

    return timeleft;
};

function onNextRequest(action) {
    let room = RoomManager.current();
    let states = room.jumpNextState();
    io.emit("replayStats", encode(room.replayStats()));
    io.emit("replay", encode(states));
}

function onPrevRequest(action) {
    let room = RoomManager.current();
    let states = room.jumpPrevState();
    io.emit("replayStats", encode(room.replayStats()));
    io.emit("replay", encode(states));
}

function onJumpRequest(action) {
    let room = RoomManager.current();
    let states = room.jumpToState(action.payload);
    io.emit("replayStats", encode(room.replayStats()));
    io.emit("replay", encode(states));
}

function onLoadRequest(action) {}

const replayTypes = {
    next: onNextRequest,
    prev: onPrevRequest,
    jump: onJumpRequest,
    load: onLoadRequest,
};

const actionTypes = {
    join: onJoinRequest,
    leave: onLeaveRequest,
    skip: onSkipRequest,
    newgame: onNewGameRequest,
    gamestart: onGameStartRequest,
};

function noop() {
    return false;
}

function onReplay(action, skipDecode) {
    if (!skipDecode) action = decode(action);
    // msg.userid = socket.user.userid;
    if (typeof action !== "object" || !("type" in action)) return;

    let replayFunc = replayTypes[action.type] || noop;
    if (!replayFunc(action)) return;
}

function onAction(action, skipDecode) {
    if (!skipDecode) action = decode(action);
    // msg.userid = socket.user.userid;
    if (typeof action !== "object" || !("type" in action)) return;
    let msgStr = JSON.stringify(action);
    let msgBuffer = Buffer.from(msgStr, "utf-8");

    if (msgBuffer.length > maxActionBytes) {
        let warning =
            "!WARNING! User Action is over limit of " +
            maxActionBytes +
            " bytes.";
        console.log("[ACOS] \x1b[33m%s\x1b[0m", warning);
    }

    //find the user by the action shortid
    let user = null;
    let client = UserManager.getUserByShortid(action.user.id);
    if (!client) {
        user = UserManager.getFakePlayer(action.user.id);
    } else {
        user = UserManager.actionUser(client);
    }

    if (!user) return;

    let room = RoomManager.current();
    let gamestate = room.getGameState();

    let status = room.status;
    if (action.type == "newgame") {
        status = "pregame";
    }
    //set the action to this user
    action.user = Object.assign({}, action.user, user);

    let actionFunc = actionTypes[action.type] || onGameActionRequest;

    if (actionFunc == onGameActionRequest) {
        if (!validateNextUser(status, gamestate, action.user.id)) {
            console.warn("[ACOS] User not allowed to run action:", action);
            return;
        }
    }

    if (!actionFunc(action)) {
        return;
    }

    room = RoomManager.current();
    gamestate = room.getGameState();
    let timeleft = calculateTimeleft(gamestate);

    //add timing sequence
    action.timeseq = gamestate?.timer?.sequence || 0;
    action.timeleft = timeleft;

    // io.to('gameroom').emit('lastAction', encode({ action, gamestate }));
    // io.to('spectator').emit('lastAction', encode({ action, gamestate }));
    worker.postMessage({
        action,
        room: room.json(),
        gamestate,
        gameSettings: settings.get(),
    });
}

function validateNextUser(status, gamestate, userid) {
    let next = gamestate?.next;
    let nextid = next?.id;

    if (status == "pregame") return true;

    if (!next || !nextid) return false;

    if (!gamestate.state) return false;

    //check if we ven have teams
    let teams = gamestate?.teams;

    if (typeof nextid === "string") {
        //anyone can send actions
        if (nextid == "*") return true;

        //only specific user can send actions
        if (nextid == userid) return true;

        //validate team has players
        if (!teams || !teams[nextid] || !teams[nextid].players) return false;

        //allow players on specified team to send actions
        if (
            Array.isArray(teams[nextid].players) &&
            teams[nextid].players.includes(userid)
        ) {
            return true;
        }
    } else if (Array.isArray(nextid)) {
        //multiple users can send actions if in the array
        if (nextid.includes(userid)) return true;

        //validate teams exist
        if (!teams) return false;

        //multiple teams can send actions if in the array
        for (var i = 0; i < nextid.length; i++) {
            let teamid = nextid[i];
            if (
                Array.isArray(teams[teamid].players) &&
                teams[teamid].players.includes(userid)
            ) {
                return true;
            }
        }
    }

    return false;
}

function stringify(obj) {
    return JSON.stringify(
        obj,
        function (k, v) {
            if (v instanceof Array && !delta.isObject(v[0]))
                return JSON.stringify(v);
            return v;
        },
        2
    );
}

function createWorker(index) {
    // console.log(
    //     "[ACOS] Worker current directory: ",
    //     process.cwd(),
    //     process.argv
    // );
    const worker = new Worker(__dirname + "/worker.js", {
        workerData: { dir: process.argv[2] },
    });
    worker.on("message", (gamestate) => {
        // console.time('[ACOS] [WorkerOnMessage]')
        if (!gamestate || !isObject(gamestate)) {
            return;
        }

        let room = RoomManager.current();

        let prevGamestate = room.copyGameState();
        prevGamestate.events = {};
        let deltaGamestate = delta.delta(
            prevGamestate,
            cloneObj(gamestate),
            {}
        );

        // console.log("[ACOS] Delta: ", stringify(deltaGamestate));
        // console.log("[ACOS] Merged Game: ", stringify(gamestate));

        //remove private variables and send individually to palyers
        // let copy = JSON.parse(JSON.stringify(deltaGamestate));
        // let hiddenState = delta.hidden(copy.state);
        // let hiddenPlayers = delta.hidden(copy.players);

        if (gamestate?.events?.join) {
            for (const shortid of gamestate.events.join) {
                let client = UserManager.getUserByShortid(shortid);
                if (!client) {
                    let fakeUser = UserManager.getFakePlayer(shortid);
                    if (fakeUser)
                        client = UserManager.getParentUser(fakeUser.clientid);
                }
                client.socket.join("gameroom");
            }
        }

        io.to("gameroom").emit("game", encode(gamestate));

        if (room.spectators.length > 0) {
            io.to("spectator").emit("spectator", encode(gamestate));
        }

        // if (hiddenPlayers)
        //     for (var id in hiddenPlayers) {
        //         let client = UserManager.getUserByShortid(id);
        //         if (client)
        //             client.emit('private', encode({ players: { [id]: hiddenPlayers[id] } }))
        //     }

        room.updateGame(gamestate);

        io.emit("replayStats", encode(room.replayStats()));
        io.emit("teaminfo", encode(room.getTeamInfo()));

        // console.timeEnd('[ACOS] [WorkerOnMessage]')
        // console.timeEnd('[ACOS] [ActionLoop]')
    });
    worker.on("online", (err) => {});
    worker.on("error", (err) => {
        console.error(err);
    });
    worker.on("exit", (code) => {
        if (code !== 0) {
            console.error(code);
            throw new Error(`Worker stopped with exit code ${code}`);
        }
    });

    return worker;
}

// app.get('/client-simulator.js', function (req, res) {
//     res.sendFile(path.join(__dirname, './public/client-simulator.js'));
// });

// app.get('/delta.js', function (req, res) {
//     res.sendFile(path.join(__dirname, './delta.js'));
// });

// app.get('/encoder.js', function (req, res) {
//     res.sendFile(path.join(__dirname, './encoder.js'));
// });
// app.get('/jsonViewer.js', function (req, res) {
//     res.sendFile(path.join(__dirname, './jsonViewer.js'));
// });

app.get("/client.bundle.dev.js", function (req, res) {
    res.sendFile(
        path.join(process.argv[2], "./builds/client/client.bundle.dev.js")
    );
});
app.get("/server.bundle.dev.js", function (req, res) {
    res.sendFile(
        path.join(process.argv[2], "./builds/server/server.bundle.dev.js")
    );
});
app.get("/server.bundle.dev.js.map", function (req, res) {
    res.sendFile(
        path.join(process.argv[2], "./builds/server/server.bundle.dev.js.map")
    );
});

app.get("/bundle.js", function (req, res) {
    console.log(
        "Using bundle: ",
        path.join(__dirname, "./public/bundle." + process.argv[3] + ".js")
    );
    res.sendFile(
        path.join(__dirname, "./public/bundle." + process.argv[3] + ".js")
    );
});

app.get("/bundle.css", function (req, res) {
    console.log(
        "Using bundle: ",
        path.join(__dirname, "./public/bundle." + process.argv[3] + ".css")
    );
    res.sendFile(
        path.join(__dirname, "./public/bundle." + process.argv[3] + ".css")
    );
});

app.get("/main.jsx", function (req, res) {
    res.sendFile(path.join(__dirname, "./public/main.jsx"));
});

// app.get('/index2.html', function (req, res) {
//     res.sendFile(path.join(__dirname, './public/index2.html'));
// });

app.get("/devtools", (req, res) => {
    res.redirect(
        "devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=127.0.0.1:10000"
    );
});
app.get("/", function (req, res) {
    res.sendFile(
        path.join(__dirname, "./public/index-" + process.argv[3] + ".html")
    );
});

let assetPath = path.join(process.argv[2], "./builds/client/assets");
app.use("/assets/", (req, res, next) => {
    res.sendFile(path.join(assetPath, req.path));
    console.log(req.path);
});

app.get("/routes", function (req, res) {
    if (process.argv[4] == "webpack") {
        res.json({
            iframe: "//localhost:3300/iframe.html",
        });
    } else {
        res.json({
            iframe: "//localhost:3100/iframe.html",
        });
    }
});

app.get("/iframe.html", function (req, res) {
    if (process.argv[4] == "vite") {
        res.sendFile(
            path.join(
                __dirname,
                "./public/iframe-" + process.argv[3] + "-vite.html"
            )
        );
    } else if (process.argv[4] == "webpack") {
        res.sendFile(
            path.join(
                __dirname,
                "./public/iframe-" + process.argv[3] + "-webpack.html"
            )
        );
    } else {
        res.sendFile(
            path.join(__dirname, "./public/iframe-" + process.argv[3] + ".html")
        );
    }
});

app.get("/favicon.ico", function (req, res) {
    res.sendFile(path.join(__dirname, "./public/favicon.ico"));
});

// app.get('/', function (req, res) {
//     res.sendFile(path.join(__dirname, './public/iframe-' + process.argv[3] + '.html'));
// });

server.listen(port, () => {
    // console.log("[ACOS] Server started at http://localhost:" + port);
});

process.on("SIGINT", () => {
    process.exit();
});
