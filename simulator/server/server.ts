import path from "path";
import fs from "fs";
import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import { Worker } from "worker_threads";
import { protoEncode, protoDecode, delta } from "acos-json-encoder";


import initACOSProtocol from "../shared/acos-encoder";
initACOSProtocol();

import { customAlphabet } from "nanoid";
const nanoid = customAlphabet("6789BCDFGHJKLMNPQRTW", 6);

import UserManagerInstance from "./UserManager";
import RoomManagerService from "./RoomManager";
import GameSettingsManager from "./GameSettingsManager";
import GameProtocolManager from "./GameProtocolManager";
import { cloneObj, isObject } from "./util";
import { gs } from "@acosgames/framework";

const UserManager = UserManagerInstance;
const app = express();
const server = http.createServer(app);
const io = new Server(server, { transports: ["websocket"] });

const port = process.env.PORT || 3100;
const maxActionBytes = 150;

let worker = createWorker(1);

const gameWorkingDirectory = process.argv[2];

const settings = GameSettingsManager;
settings.start(gameWorkingDirectory, onGameSettingsReloaded);
GameProtocolManager.start(gameWorkingDirectory, onGameProtocolReloaded);
const RoomManager = new RoomManagerService();
RoomManager.setSettings(settings);

function onGameSettingsReloaded(): void {
    const room = RoomManager.current();
    io.emit("teaminfo", protoEncode({ type: "teaminfo", payload: room.getTeamInfo() }));
    io.emit("gameSettings", protoEncode({ type: "gameSettings", payload: { gameSettings: settings.get() } }));
}

function onGameProtocolReloaded(): void {
    const protocol = GameProtocolManager.get();
    if (!protocol) return;
    io.emit("gameProtocol", protoEncode({ type: "gameProtocol", payload: protocol }));
}

setInterval(() => {
    const room = RoomManager.current();
    const gamestate = room.getGameState();
    const deadline = room.getDeadline();
    if (deadline === 0) return;
    const now = Date.now();
    if (now > (deadline + (gamestate?.room?.starttime || 0))) {
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
        room.setDeadline(0);
    }
}, 500);

function onConnect(socket: Socket): void {
    const name = socket.handshake.query.displayname as string;
    if (!name) return;

    const isFirstUser = UserManager.isFirstUser();

    console.log("[ACOS] user connected: " + name);
    const newUser = UserManager.register(socket, name);
    const user = UserManager.actionUser(newUser);

    (socket as any).user = user;

    const connectedMsg = { user, gameSettings: settings.get() };
    socket.emit("connected", protoEncode({ type: "connected", payload: connectedMsg }));

    const gameProtocol = GameProtocolManager.get();
    if (gameProtocol) {
        socket.emit("gameProtocol", protoEncode({ type: "gameProtocol", payload: gameProtocol }));
    }

    const room = RoomManager.current();
    const fakePlayers = UserManager.getFakePlayersByParent(user.shortid);
    if (fakePlayers?.length >= 0) {
        socket.emit("fakeplayer", protoEncode({ type: "created", payload: fakePlayers }));
    }

    socket.join("gameroom");

    if (isFirstUser) {
        createNewGame(socket, user);
    } else {
        socket.emit("game", protoEncode({ type: "game", payload: room.copyGameState() }));
        io.emit("teaminfo", protoEncode({ type: "teaminfo", payload: room.getTeamInfo() }));
    }
}

function onDisconnect(socket: Socket, e: any): void {
    const user = UserManager.getUserBySocketId(socket.id);
    if (!user) return;
    console.log("[ACOS] user disconnected: " + user.displayname, e);
}

function onPing(socket: Socket, msg: any): void {
    msg = protoDecode(msg);
    const clientTime = msg.payload;
    const serverTime = Date.now();
    const offset = serverTime - clientTime;
    socket.emit("pong", protoEncode({ type: "pong", payload: { offset, serverTime } }));
}

function onNewGameSettings(socket: Socket, newGameSettings: any): void {
    newGameSettings = protoDecode(newGameSettings);
    settings.updateGameSettings(newGameSettings.payload ?? newGameSettings);
}

function onFakePlayer(socket: Socket, msg: any): void {
    msg = protoDecode(msg).payload;
    const type = msg.type;
    const client = UserManager.getUserBySocketId(socket.id);
    if (!client) return;
    const shortid = client.shortid;

    if (type === "create") {
        const count = msg?.payload?.count || 1;
        const newFakePlayers = UserManager.createFakePlayers(shortid, count);
        socket.emit("fakeplayer", protoEncode({ type: "created", payload: newFakePlayers }));
    } else if (type === "remove") {
        const user = msg?.user ?? msg.payload.user;
        onAction(socket, { type: "leave", user }, true);
        UserManager.removeFakePlayer(user.shortid);
        socket.emit("fakeplayer", protoEncode({ type: "removed", payload: { user } }));
    }
}

io.on("connection", (socket) => {
    onConnect(socket);

    socket.on("disconnect", (e) => { onDisconnect(socket, e); });
    socket.on("ping", (msg) => { onPing(socket, msg); });
    socket.on("gameSettings", (newGameSettings) => { onNewGameSettings(socket, newGameSettings); });
    socket.on("fakeplayer", (msg) => { onFakePlayer(socket, msg); });
    socket.on("replay", (msg) => { onReplay(socket, protoDecode(msg)); });
    socket.on("action", (msg) => { onAction(socket, protoDecode(msg)); });
    socket.on("reload", (msg) => {
        msg = protoDecode(msg);
        console.log("[ACOS] Incoming Action: ", msg);
        worker.postMessage([{ type: "reset" }]);
    });
});

const onJoinRequest = (action: any): boolean => {
    const room = RoomManager.current();
    let client = UserManager.getUserByName(action.user.displayname);
    if (!client) {
        client = UserManager.getParentUser(action.user.clientid);
        if (!client) {
            console.error("Invalid client found using: ", action.user);
            return false;
        }
    }

    if (room.hasPlayer(action.user.shortid)) {
        console.log("[ACOS] User already in game: ", action.user.shortid, action.user.displayname);
        sendUserGame(client!, room);
        return false;
    }

    if (!room.hasVacancy()) {
        console.log("[ACOS] Game full, moving to spectator: ", action.user.shortid, action.user.displayname);
        sendUserSpectator(action.user, room);
        return false;
    }

    const teaminfo = room.getTeamInfo();
    if (teaminfo.length > 1) {
        const attempt = room.attemptJoinTeam(action.user.teamid);
        if ("error" in attempt) {
            client!.socket.emit("error", protoEncode({ type: "error", payload: attempt }));
            console.log("[ACOS] [Error] " + attempt.error + ": ", action.user.teamid, ", for user:", action.user.shortid, action.user.displayname);
            return false;
        }
        action.user.teamid = attempt.teamid;
    }

    console.log("[ACOS] Adding user to game: ", action.user.shortid, action.user.displayname);
    return true;
};

const sendUserSpectator = (user: any, room: any): void => {
    // spectator logic intentionally empty
};

const sendUserGame = (client: any, room: any): void => {
    if (!client || !client.socket) return;
    client.socket.join("gameroom");
    const gamestate = room.copyGameState();
    io.emit("replayStats", protoEncode({ type: "replayStats", payload: room.replayStats() }));
    io.emit("game", protoEncode({ type: "game", payload: gamestate }));
};

const onLeaveRequest = (action: any): boolean => {
    const room = RoomManager.current();
    const gamestate = room.getGameState();
    if (!gamestate || !Array.isArray(gamestate.players)) return false;

    if (!gamestate?.room?._players[action?.user?.shortid]) {
        return false;
    }

    io.to(room.room_slug).emit("leave", protoEncode({ type: "leave", payload: { user: action.user } }));
    return true;
};

const onSkipRequest = (_action: any): boolean => true;

const onGameStartRequest = (_action: any): boolean => {
    const room = RoomManager.current();
    room.setDeadline(0);
    return true;
};

const onGameActionRequest = (_action: any): boolean => true;

const onNewGameRequest = (action: any): boolean => {
    const room = RoomManager.create();
    const prevGamestate = room.copyGameState();
    io.emit("replayStats", protoEncode({ type: "replayStats", payload: room.replayStats() }));
    io.to("gameroom").emit("newgame", protoEncode({ type: "newgame", payload: prevGamestate || {} }));
    io.emit("teaminfo", protoEncode({ type: "teaminfo", payload: room.getTeamInfo() }));
    return true;
};

const createNewGame = (socket: Socket, user: any): void => {
    onAction(socket, { type: "newgame", user }, true);
};

const calculateTimeleft = (gamestate: any): number => {
    if (!gamestate || !gamestate.timer || !gamestate.room?.timeend) return 0;
    const deadline = gamestate.room?.starttime + gamestate.room?.timeend;
    return Math.max(0, deadline - Date.now());
};

function onNextRequest(_action: any): void {
    const room = RoomManager.current();
    const states = room.jumpNextState();
    io.emit("replayStats", protoEncode({ type: "replayStats", payload: room.replayStats() }));
    io.emit("replay", protoEncode({ type: "replay", payload: states }));
}

function onPrevRequest(_action: any): void {
    const room = RoomManager.current();
    const states = room.jumpPrevState();
    io.emit("replayStats", protoEncode({ type: "replayStats", payload: room.replayStats() }));
    io.emit("replay", protoEncode({ type: "replay", payload: states }));
}

function onJumpRequest(action: any): void {
    const room = RoomManager.current();
    const states = room.jumpToState(action.payload);
    io.emit("replayStats", protoEncode({ type: "replayStats", payload: room.replayStats() }));
    io.emit("replay", protoEncode({ type: "replay", payload: states }));
}

function onLoadRequest(_action: any): void { }

const replayTypes: Record<string, (a: any) => void> = {
    next: onNextRequest,
    prev: onPrevRequest,
    jump: onJumpRequest,
    load: onLoadRequest,
};

const actionTypes: Record<string, (a: any) => boolean> = {
    ready: () => true,
    join: onJoinRequest,
    leave: onLeaveRequest,
    skip: onSkipRequest,
    newgame: onNewGameRequest,
    gamestart: onGameStartRequest,
};

function noop(): boolean { return false; }

function onReplay(socket: Socket, action: any, fromServer?: boolean): void {
    if (!fromServer) action = action.payload;
    if (typeof action !== "object" || !("type" in action)) return;
    const replayFunc = replayTypes[action.type] || noop;
    replayFunc(action);
}

function onAction(socket: Socket, action: any, fromServer?: boolean): void {
    if (!fromServer) action = action.payload;
    if (typeof action !== "object" || !("type" in action)) return;

    const msgStr = JSON.stringify(action);
    const msgBuffer = Buffer.from(msgStr, "utf-8");
    if (msgBuffer.length > maxActionBytes) {
        console.log("[ACOS] \x1b[33m%s\x1b[0m", `!WARNING! User Action is over limit of ${maxActionBytes} bytes.`);
    }

    let user: any = null;
    const client = UserManager.getUserByShortid(action?.user?.shortid);
    if (!client) {
        user = UserManager.getFakePlayer(action?.user?.shortid);
    } else {
        user = UserManager.actionUser(client);
    }
    if (!user) return;

    const room = RoomManager.current();
    const gamestate = room.getGameState();
    const status = room.status;

    if (status !== room.statusByName("gamestart") && !(action.type in actionTypes)) return;

    if (action.type === "newgame") {
        // allow through
    }

    action.user = Object.assign({}, (socket as any)?.user, user);
    action.user.id = gamestate?.room?._players[action.user.shortid];
    if (action.user.id === undefined) action.user.id = -1;

    const actionFunc = actionTypes[action.type] || onGameActionRequest;

    if (actionFunc === onGameActionRequest) {
        if (!validateNextUser(status, gamestate, action.user.id)) {
            console.warn("[ACOS] User not allowed to run action:", action);
            return;
        }
    }

    if (!actionFunc(action)) return;

    const currentRoom = RoomManager.current();
    const currentGamestate = currentRoom.getGameState();
    const timeleft = calculateTimeleft(currentGamestate);

    action.user.timeseq = currentGamestate?.room?._sequence || 0;
    action.user.timeleft = timeleft;

    worker.postMessage({
        action,
        gamestate: currentGamestate,
        gameSettings: settings.get(),
    });
}

function validateNextUser(status: number, gamestate: any, userid: number): boolean {

    gamestate = gs(gamestate);
    let gameroom = gamestate.room();
    let next = gameroom.nextPlayer;

    if (Array.isArray(next) && next.includes(userid)) return true;

    let player = gamestate.player(userid);
    if (!player) return false;

    if (next === userid) return true;

    if( validateNextTeam(gamestate, player.teamid) ) return true;

    return false;

    // // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // const nextid = gamestate?.room?.next_player as any;
    // const room = gamestate.room;
    // const roomManager = RoomManager.current();

    // if (room?.status !== roomManager.statusByName("gamestart")) return false;
    // if (nextid === null || nextid === undefined) return false;
    // if (!gamestate.state) return false;
    // if (nextid === userid) return true;
    // if (Array.isArray(nextid) && nextid.includes(userid)) return true;

    // const player = gamestate?.players?.[userid];
    // if (!player) return false;
    // if (validateNextTeam(gamestate, player.teamid)) return true;

    // return false;
}

function validateNextTeam(gamestate: any, teamid: number): boolean {

    gamestate = gs(gamestate);
    const gameroom = gamestate.room();

    let next = gameroom.nextPlayer;

    if (Array.isArray(next) && next.includes(teamid)) return true;

    let player = gamestate.player(teamid);
    if (!player) return false;

    if (next === teamid) return true;


    return false;

    // // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // const nextid = gamestate?.room?.next_team as any;
    // const room = gamestate.room;
    // const roomManager = RoomManager.current();

    // if (room?.status !== roomManager.statusByName("gamestart")) return false;
    // if (nextid === null || nextid === undefined) return false;
    // if (!gamestate.state) return false;
    // if (nextid === teamid) return true;
    // if (Array.isArray(nextid) && nextid.includes(teamid)) return true;
    // return false;
}

function createWorker(index: number): Worker {
    const w = new Worker(__dirname + "/worker.js", {
        workerData: { dir: process.argv[2] },
    });

    w.on("message", (gamestate: any) => {
        if (!gamestate || !isObject(gamestate)) return;

        const room = RoomManager.current();
        const prevGamestate = room.copyGameState();
        if (prevGamestate?.room) prevGamestate.room.events = [];
        const deltaGamestate = delta(prevGamestate, cloneObj(gamestate));

        const joinEvent = (gamestate as any)?.room?.events?.find(
            (e: any) => e.type === "join" && Array.isArray(e.payload)
        );
        if (joinEvent) {
            for (const playerid of joinEvent.payload) {
                const player = (gamestate as any)?.players[playerid];
                if (!player) continue;
                let client = UserManager.getUserByName(player.displayname);
                if (!client) {
                    const fakeUser = UserManager.getFakePlayer(player.shortid);
                    if (fakeUser) client = UserManager.getParentUser(fakeUser.clientid);
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

        room.updateGame(gamestate);

        io.emit("replayStats", protoEncode({ type: "replayStats", payload: room.replayStats() }));
        io.emit("teaminfo", protoEncode({ type: "teaminfo", payload: room.getTeamInfo() }));
    });

    w.on("online", () => { });
    w.on("error", (err) => { console.error(err); });
    w.on("exit", (code) => {
        if (code !== 0) {
            console.error(code);
            throw new Error(`Worker stopped with exit code ${code}`);
        }
    });

    return w;
}

// Static file routes
app.get("/client.bundle.dev.js", (req, res) => {
    res.sendFile(path.join(process.argv[2], "./builds/client.bundle.dev.js"));
});
app.get("/server.bundle.dev.js", (req, res) => {
    res.sendFile(path.join(process.argv[2], "./builds/server.bundle.dev.js"));
});
app.get("/server.bundle.dev.js.map", (req, res) => {
    res.sendFile(path.join(process.argv[2], "./builds/server.bundle.dev.js.map"));
});
app.get("/bundle.js", (req, res) => {
    console.log("Using bundle: ", path.join(__dirname, "../../public/bundle." + process.argv[3] + ".js"));
    res.sendFile(path.join(__dirname, "../../public/bundle." + process.argv[3] + ".js"));
});
app.get("/bundle.css", (req, res) => {
    console.log("Using bundle: ", path.join(__dirname, "../../public/bundle." + process.argv[3] + ".css"));
    res.sendFile(path.join(__dirname, "../../public/bundle." + process.argv[3] + ".css"));
});
app.get("/main.jsx", (req, res) => {
    res.sendFile(path.join(__dirname, "../../public/main.jsx"));
});
app.get("/devtools", (req, res) => {
    res.redirect("devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=127.0.0.1:10000");
});
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../../public/index-" + process.argv[3] + ".html"));
});

const assetPath = path.join(process.argv[2], "./builds/assets");
app.use("/assets/*", (req, res) => {
    res.sendFile(path.join(assetPath, req.path));
    console.log(req.path);
});
app.use("/game-client/assets/*", (req, res) => {
    res.sendFile(path.join(process.argv[2], req.baseUrl));
    console.log(req.path);
});
app.get("/routes", (req, res) => {
    if (process.argv[4] === "webpack" || process.argv[4] === "bundle") {
        res.json({ iframe: "//localhost:3300/iframe.html" });
    } else {
        res.json({ iframe: "//localhost:3100/iframe.html" });
    }
});
app.get("/iframe.html", (req, res) => {
    if (process.argv[4] === "vite") {
        res.sendFile(path.join(__dirname, "../../public/iframe-" + process.argv[3] + "-vite.html"));
    } else if (process.argv[4] === "webpack" || process.argv[4] === "bundle") {
        res.sendFile(path.join(__dirname, "../../public/iframe-" + process.argv[3] + "-webpack.html"));
    } else {
        res.sendFile(path.join(__dirname, "../../public/iframe-" + process.argv[3] + ".html"));
    }
});
app.get("/favicon.ico", (req, res) => {
    res.sendFile(path.join(__dirname, "../../public/favicon.ico"));
});

server.listen(port, () => {
    // console.log("[ACOS] Server started at http://localhost:" + port);
});

process.on("SIGINT", () => {
    process.exit();
});
