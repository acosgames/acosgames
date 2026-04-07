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
const { protoEncode, protoDecode, delta, hidden } = require("acos-json-encoder");
require('../shared/acos-encoder-server.js');

const NANOID = require("nanoid");
const nanoid = NANOID.customAlphabet("6789BCDFGHJKLMNPQRTW", 6);

const UserManager = require("./UserManager");
const RoomManagerService = require("./RoomManager");

const port = process.env.PORT || 3100;

const maxActionBytes = 150;

var worker = createWorker(1);

const gameWorkingDirectory = process.argv[2];

const GameSettingsManager = require("./GameSettingsManager");
const { isObject } = require("./rank");
const { cloneObj } = require("./util");
const settings = GameSettingsManager;

settings.start(gameWorkingDirectory, onGameSettingsReloaded);
const RoomManager = new RoomManagerService();
RoomManager.setSettings(settings);

function onGameSettingsReloaded() {
    // let user = UserManager.actionUser(newUser);

    let room = RoomManager.current(); //.create();
    let gamestate = room.getGameState();
    // onAction({ type: 'newgame' }, true);
    // worker.postMessage({
    //     action: { type: "newgame" },
    //     room: room.json(),
    //     gamestate,
    //     gameSettings: settings.get(),
    // });
    io.emit("teaminfo", protoEncode({ type: "teaminfo", payload: room.getTeamInfo() }));
    io.emit("gameSettings", protoEncode({ type: "gameSettings", payload: { gameSettings: settings.get() } }));
}

setInterval(() => {
    let room = RoomManager.current();
    let gamestate =  room.getGameState();
    let deadline = room.getDeadline();
    if (deadline == 0) return;
    let now = Date.now();
    if (now > (deadline + (gamestate?.room?.starttime || 0 ))) {
        let room = RoomManager.current();
       
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
    let name = socket.handshake.query.displayname;
    if (!name) return;

    let isFirstUser = UserManager.isFirstUser();

    console.log("[ACOS] user connected: " + name);
    let newUser = UserManager.register(socket, name);
    // console.log("Registered: ", newUser);
    let user = UserManager.actionUser(newUser);

    socket.user = user;

    // console.log("User Connected: ", user);
    let connectedMsg = {
        user,
        gameSettings: settings.get(),
    };
    socket.emit("connected", protoEncode({ type: "connected", payload: connectedMsg }));

    //join user immediately into game
    let room = RoomManager.current();
    if (room.hasPlayer(user.shortid)) onAction(socket, { type: "join", user }, true);

    let fakePlayers = UserManager.getFakePlayersByParent(user.shortid);
    if (fakePlayers?.length >= 0) {
        socket.emit("fakeplayer", protoEncode({ type: "created", payload: fakePlayers }));

        for (const fakePlayer of fakePlayers) {
            if (room.hasPlayer(fakePlayer.shortid))
                onAction(socket, { type: "join", user: fakePlayer }, true);
        }
    }

    socket.join("gameroom");

    if (isFirstUser) {
        createNewGame(socket, user);
    } else {
        socket.emit("game", protoEncode({ type: "game", payload: room.copyGameState() }));
        io.emit("teaminfo", protoEncode({ type: "teaminfo", payload: room.getTeamInfo() }));
    }

    //user is already in game, just rejoin them and send them full game state
    // let room = RoomManager.current();
    // if (room.hasPlayer(newUser.shortid)) {
    //     onAction(socket, { type: 'join', user }, true);
    // }
}

function onDisconnect(socket, e) {
    let user = UserManager.getUserBySocketId(socket.id);
    if (!user) return;

    console.log("[ACOS] user disconnected: " + user.displayname, e);
}

function onPing(socket, msg) {
    msg = protoDecode(msg);
    let clientTime = msg.payload;
    let serverTime = Date.now();
    let offset = serverTime - clientTime;
    socket.emit("pong", protoEncode({ type: "pong", payload: { offset, serverTime } }));
}

function onNewGameSettings(socket, newGameSettings) {
    newGameSettings = protoDecode(newGameSettings);
    settings.updateGameSettings(newGameSettings.payload ?? newGameSettings);
}

function onFakePlayer(socket, msg) {
    msg = protoDecode(msg).payload;
    let type = msg.type;

    let client = UserManager.getUserBySocketId(socket.id);

    let shortid = client.shortid;

    if (type == "create") {
        let count = msg?.payload.count || 1;
        let newFakePlayers = UserManager.createFakePlayers(shortid, count);
        socket.emit("fakeplayer", protoEncode({ type: "created", payload: newFakePlayers }));
    } else if (type == "remove") {
        let user = msg?.user ?? msg.payload.user;
        onAction(socket, { type: "leave", user }, true);

        UserManager.removeFakePlayer(user.shortid);

        // let newFakePlayers = UserManager.iterateFakePlayers(client.shortid);
        socket.emit("fakeplayer", protoEncode({ type: "removed", payload: { user } }));
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
        onReplay(socket, protoDecode(msg));
    });
    socket.on("action", (msg) => {
        onAction(socket, protoDecode(msg));
    });
    socket.on("reload", (msg) => {
        msg = protoDecode(msg);
        console.log("[ACOS] Incoming Action: ", msg);
        gameHistory = [];
        worker.postMessage([{ type: "reset" }]);
    });
});

const onJoinRequest = (action) => {
    let room = RoomManager.current();
    let client = UserManager.getUserByName(action.user.displayname);
    if (!client) {
        client = UserManager.getParentUser(action.user.clientid);
        if (!client) {
            console.error("Invalid client found using: ", action.user);
            return;
        }
    }

    if (room.hasPlayer(action.user.shortid)) {
        console.log(
            "[ACOS] User already in game: ",
            action.user.shortid,
            action.user.displayname
        );
        sendUserGame(client, room);
        return false;
    }

    let hasVacancy = room.hasVacancy();

    if (!hasVacancy) {
        console.log(
            "[ACOS] Game full, moving to spectator: ",
            action.user.shortid,
            action.user.displayname
        );
        sendUserSpectator(action.user, room);
        return false;
    }

    //check if team is available
    let teaminfo = room.getTeamInfo();
    if (teaminfo.length > 1) {
        let attempt = room.attemptJoinTeam(action.user.teamid);
        if (attempt.error) {
            client.socket.emit("error", protoEncode({ type: "error", payload: attempt }));
            console.log(
                "[ACOS] [Error] " + attempt.error + ": ",
                action.user.teamid,
                ", for user:",
                action.user.shortid,
                action.user.displayname
            );
            return false;
        }

        action.user.teamid = attempt.teamid;
    }

    console.log(
        "[ACOS] Adding user to game: ",
        action.user.shortid,
        action.user.displayname
    );
    return true;
};

const sendUserSpectator = (user, room) => {
    let client = UserManager.getUserByName(user.displayname);
    if (!client) {
        client = UserManager.getParentUser(user.clientid);
        if (!client) {
            console.error("Invalid client found using: ", user);
            return;
        }
    }
    // client.socket.join('spectator');
    // UserManager.setSpectator(user.shortid);

    // io.to.emit('spectator', encode({ type: 'join', user }));
    // room.addSpectator(user);
};

const sendUserGame = (client, room) => {
    if (!client || !client.socket) return;

    client.socket.join("gameroom");

    let gamestate = room.copyGameState();
    // let hiddenState = delta.hidden(gamestate.state);
    // let hiddenPlayers = delta.hidden(gamestate.players);
    io.emit("replayStats", protoEncode({ type: "replayStats", payload: room.replayStats() }));
    io.emit("game", protoEncode({ type: "game", payload: gamestate }));
    // if (hiddenPlayers) {
    //     if (client.shortid in hiddenPlayers) {
    //         client.socket.emit('private', encode(hiddenPlayers[client.shortid]));
    //     }
    // }
};

const onLeaveRequest = (action) => {
    if (action?.user?.shortid in UserManager.getFakePlayers()) {
        // let fakePlayers = UserManager.getFakePlayersByParent(action.user.clientid)
        // for (const fakePlayer of fakePlayers) {
        // if (action.user.clientid) {
        //     let client = UserManager.getUserByName(action.user.displayname);
        // client.socket.emit('fakeplayer', encode({ type: 'removed', user: action.user }));
        // }
        // UserManager.removeFakePlayer(action.user.shortid);
        // }
    }

    let room = RoomManager.current();
    let gamestate = room.getGameState();
    if (!gamestate || !Array.isArray(gamestate.players)) return false;

    if (!gamestate?.room?._players[action?.user?.shortid]) {
        return false;
    }

    io.to(room.room_slug).emit("leave", protoEncode({ type: "leave", payload: { user: action.user } }));
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
    let client = UserManager.getUserByName(action.user.displayname);
    let room = RoomManager.create();
    // onAction(client.socket, { type: 'join', user: action.user }, true);
    let prevGamestate = room.copyGameState();
    io.emit("replayStats", protoEncode({ type: "replayStats", payload: room.replayStats() }));
    io.to("gameroom").emit("newgame", protoEncode({ type: "newgame", payload: prevGamestate || {} }));
    io.emit("teaminfo", protoEncode({ type: "teaminfo", payload: room.getTeamInfo() }));

    return true;
};
const createNewGame = (socket, user) => {
    onAction(socket, { type: "newgame",  user }, true);
};

const calculateTimeleft = (gamestate) => {
    if (!gamestate || !gamestate.timer || !gamestate.room?.timeend) return 0;

    let deadline = gamestate.room?.starttime + gamestate.room?.timeend;
    let now = Date.now();
    let timeleft = deadline - now;

    return timeleft;
};

function onNextRequest(action) {
    let room = RoomManager.current();
    let states = room.jumpNextState();
    io.emit("replayStats", protoEncode({ type: "replayStats", payload: room.replayStats() }));
    io.emit("replay", protoEncode({ type: "replay", payload: states }));
}

function onPrevRequest(action) {
    let room = RoomManager.current();
    let states = room.jumpPrevState();
    io.emit("replayStats", protoEncode({ type: "replayStats", payload: room.replayStats() }));
    io.emit("replay", protoEncode({ type: "replay", payload: states }));
}

function onJumpRequest(action) {
    let room = RoomManager.current();
    let states = room.jumpToState(action.payload);
    io.emit("replayStats", protoEncode({ type: "replayStats", payload: room.replayStats() }));
    io.emit("replay", protoEncode({ type: "replay", payload: states }));
}

function onLoadRequest(action) {}

const replayTypes = {
    next: onNextRequest,
    prev: onPrevRequest,
    jump: onJumpRequest,
    load: onLoadRequest,
};

const actionTypes = {
    ready: () => true,
    join: onJoinRequest,
    leave: onLeaveRequest,
    skip: onSkipRequest,
    newgame: onNewGameRequest,
    gamestart: onGameStartRequest,
};

function noop() {
    return false;
}

function onReplay(socket, action, fromServer) {
    if (!fromServer) 
        action = action.payload;
    // msg.userid = socket.user.userid;
    if (typeof action !== "object" || !("type" in action)) return;

    let replayFunc = replayTypes[action.type] || noop;
    if (!replayFunc(action)) return;
}

function onAction(socket, action, fromServer) {
    if (!fromServer) 
        action = action.payload;
        // action = protoDecode(action);

    
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
    let client = UserManager.getUserByShortid(action?.user?.shortid);
    if (!client) {
        user = UserManager.getFakePlayer(action?.user?.shortid);
    } else {
        user = UserManager.actionUser(client);
    }

    if (!user) return;

    let room = RoomManager.current();
    let gamestate = room.getGameState();

    let status = room.status;

    if (status != room.statusByName("gamestart") && !(action.type in actionTypes)) return;

    if (action.type == "newgame") {
        status = room.statusByName("pregame");
    }
    //set the action to this user
    action.user = Object.assign({}, socket?.user, user);
    action.user.id = gamestate?.room?._players[action.user.shortid];
    if( action.user.id == undefined ) {
        action.user.id = -1;
    }


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
    action.user.timeseq = gamestate?.room?._sequence || 0;
    action.user.timeleft = timeleft;

    // io.to('gameroom').emit('lastAction', encode({ action, gamestate }));
    // io.to('spectator').emit('lastAction', encode({ action, gamestate }));
    worker.postMessage({
        action,
        // room: room.json(),
        gamestate,
        gameSettings: settings.get(),
    });
}

    function validateNextUser(status, gamestate, userid) {
        // let gamestate = this.getGameState();
        let nextid = gamestate?.room?.next_player;
        let room = gamestate.room;

        let roomManager = RoomManager.current();
        if (room?.status != roomManager.statusByName("gamestart")) return false;
        if (nextid === null || nextid === undefined) return false;
        if (!gamestate.state) return false;

        if (nextid === userid) return true;
        if (Array.isArray(nextid) && nextid.includes(userid)) return true;

        let player = gamestate?.players[userid];
        if(!player) return false;
        
        let teamid = player.teamid;
        if( validateNextTeam(teamid) ) return true;

        return false;
    }   

    function validateNextTeam(gamestate, teamid) {
        // let gamestate = this.getGameState();
        let nextid = gamestate?.room?.next_team;
        let room = gamestate.room;
        let roomManager = RoomManager.current();
        if (room?.status != roomManager.statusByName("gamestart")) return false;
        if (nextid === null || nextid === undefined) return false;
        if (!gamestate.state) return false;
        if (nextid === teamid) return true;
        if (Array.isArray(nextid) && nextid.includes(teamid)) return true;
        return false;
    }

// function validateNextUser(status, gamestate, userid) {
//     // let next = gamestate?.room?.next;
//     let nextid = gamestate?.room?.next_player;

//     if (status == "pregame") return true;

//     if (nextid === null || nextid === undefined) return false;

//     if (!gamestate.state) return false;

//     //check if we have teams
//     let teams = gamestate?.teams;

//     // find this user's player index in the array
//     let userIndex = Array.isArray(gamestate.players)
//         ? gamestate.players.findIndex(p => p.shortid === userid)
//         : -1;

//     if (typeof nextid === "string") {
//         //anyone can send actions
//         if (nextid == "*") return true;

//         //team slug — validate team has this player
//         if (!teams || !teams.find(t => t.team_slug === nextid)?.players) return false;

//         //allow players on specified team to send actions
//         if (
//             Array.isArray(teams.find(t => t.team_slug === nextid).players) &&
//             teams.find(t => t.team_slug === nextid).players.includes(userid)
//         ) {
//             return true;
//         }
//     } else if (typeof nextid === "number") {
//         //specific player index
//         if (nextid === userIndex) return true;
//     } else if (Array.isArray(nextid)) {
//         //multiple player indices or team slugs
//         if (userIndex >= 0 && nextid.includes(userIndex)) return true;

//         //validate teams exist
//         if (!teams) return false;

//         //check team slugs in the array
//         for (var i = 0; i < nextid.length; i++) {
//             let item = nextid[i];
//             if (typeof item === "string") {
//                 let itemTeam = Array.isArray(teams) ? teams.find(t => t.team_slug === item) : undefined;
//                 if (
//                     Array.isArray(itemTeam?.players) &&
//                     itemTeam.players.includes(userid)
//                 ) {
//                     return true;
//                 }
//             }
//         }
//     }

//     return false;
// }

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
        if (prevGamestate?.room) prevGamestate.room.events = [];
        let deltaGamestate = delta(
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

        let joinEvent = gamestate?.room?.events?.find(e => e.type === "join" && Array.isArray(e.payload));
        if (joinEvent) {
            for (const playerid of joinEvent.payload) {
                let player = gamestate?.players[playerid];
                if (!player) continue;
                let client = UserManager.getUserByName(player.displayname);
                if (!client) {
                    let fakeUser = UserManager.getFakePlayer(player.shortid);
                    if (fakeUser)
                        client = UserManager.getParentUser(fakeUser.clientid);
                }
                if (client) {
                    client.socket.join("gameroom");
                }
            }
        }

        io.to("gameroom").emit("game", protoEncode({ type: "game", payload: gamestate }));

        if (room.spectators.length > 0) {
            io.to("spectator").emit("spectator", protoEncode({ type: "spectator", payload: gamestate }));
        }

        // if (hiddenPlayers)
        //     for (var id in hiddenPlayers) {
        //         let client = UserManager.getUserByShortid(id);
        //         if (client)
        //             client.emit('private', encode({ players: { [id]: hiddenPlayers[id] } }))
        //     }

        room.updateGame(gamestate);

        io.emit("replayStats", protoEncode({ type: "replayStats", payload: room.replayStats() }));
        io.emit("teaminfo", protoEncode({ type: "teaminfo", payload: room.getTeamInfo() }));

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
    res.sendFile(path.join(process.argv[2], "./builds/client.bundle.dev.js"));
});
app.get("/server.bundle.dev.js", function (req, res) {
    res.sendFile(path.join(process.argv[2], "./builds/server.bundle.dev.js"));
});
app.get("/server.bundle.dev.js.map", function (req, res) {
    res.sendFile(
        path.join(process.argv[2], "./builds/server.bundle.dev.js.map")
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

let assetPath = path.join(process.argv[2], "./builds/assets");
app.use("/assets/*", (req, res, next) => {
    res.sendFile(path.join(assetPath, req.path));
    console.log(req.path);
});

app.use("/game-client/assets/*", (req, res, next) => {
    res.sendFile(path.join(process.argv[2], req.baseUrl));
    console.log(req.path);
});

app.get("/routes", function (req, res) {
    if (process.argv[4] == "webpack" || process.argv[4] == "bundle") {
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
    } else if (process.argv[4] == "webpack" || process.argv[4] == "bundle") {
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
