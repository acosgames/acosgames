import fs from "flatstore";
import ENCODER from "acos-json-encoder";
import ACOSDictionary from "shared/acos-dictionary.json";
ENCODER.createDefaultDict(ACOSDictionary);

import { io } from "socket.io-client";

import {
    onFakePlayer,
    onJoin,
    onLeave,
    onSpectate,
    onGameUpdate,
    onReplay,
    onReplayStats,
    onTeamInfo,
} from "./game";

import GamePanelService from "../services/GamePanelService";
import GameStateService from "../services/GameStateService";

// var latency = 0;
// var latencyStart = 0;
// var offsetTime = 0;
const defaultGameSettings = {}; // { minplayers: 1, maxplayers: 1, minteams: 0, maxteams: 0, teams: [], screentype: 3, resow: 4, resoh: 3, screenwidth: 800 };

fs.set("socket", null);
fs.set("latency", 0);
fs.set("latencyStart", 0);
fs.set("latencyOffsetTime", 0);
fs.set("wsStatus", "disconnected");
fs.set("gameStatus", "none");
fs.set("prevGameSettings", defaultGameSettings);
fs.set("gameSettings", defaultGameSettings);
fs.set("localGameSettings", defaultGameSettings);
fs.set("replayStats", { position: 0, total: 0 });
//--------------------------------------------------
//WebSockets Connection / Management
//--------------------------------------------------
export function connect(username) {
    // note.textContent = 'Status: connecting...';
    let socket = fs.get("socket");

    if (socket && !socket.disconnected) {
        // socket.disconnect();
        return;
    }

    username = username || "Player " + Math.floor(Math.random() * 1000);

    fs.set("username", username);

    let host = window.location.host;
    console.log(host);
    socket = io("ws://" + host, {
        // jsonp: false,
        transports: ["websocket"],
        // upgrade: true,
        query: "username=" + username,
    });

    // Global events are bound against socket
    socket.on("reconnect_error", function (e) {
        console.log("Connection Failed", e);
    });

    socket.on("connect_error", (err) => {
        console.log(`connect_error due to ${err.message}`);
    });

    socket.io.on("error", (err) => {
        console.log(`error due to `, err);
    });

    socket.on("connect", onConnect);
    socket.on("gameSettings", onGameSettings);
    socket.on("connected", onConnected);
    socket.on("pong", onPong);
    // socket.on('lastAction', onLastAction)
    socket.on("join", onJoin);
    socket.on("leave", onLeave);
    socket.on("game", onGameUpdate);
    socket.on("newgame", onNewGame);
    socket.on("spectator", onSpectate);
    socket.on("fakeplayer", onFakePlayer);
    socket.on("teaminfo", onTeamInfo);
    // socket.on('private', onGamePrivateUpdate);
    socket.on("disconnect", onDisconnect);

    socket.on("replay", onReplay);
    socket.on("replayStats", onReplayStats);

    fs.set("socket", socket);
}

export function wsSend(type, payload) {
    let socket = fs.get("socket");
    socket.emit(type, ENCODER.encode(payload));
}

export function updateGameSettings(newSettings) {
    fs.set("prevGameSettings", fs.get("gameSettings"));
    fs.set("gameSettings", newSettings);
    let socket = fs.get("socket");
    wsSend("gameSettings", newSettings);
}

export function saveGameSettings() {
    let newSettings = fs.get("gameSettings");
    wsSend("gameSettings", newSettings);
}

const onNewGame = (message) => {
    GameStateService.clearState();
};

const onGameSettings = (message) => {
    try {
        //message should have { id, name }
        message = ENCODER.decode(message);

        fs.set("localGameSettings", message.gameSettings);
        fs.set("prevGameSettings", fs.get("gameSettings"));
        fs.set("gameSettings", message.gameSettings);
    } catch (e) {
        console.error(e);
    }
};

const onConnect = (evt) => {
    fs.set("wsStatus", "connected");
    let socket = fs.get("socket");
    let socketUser = fs.get("socketUser");
};

const onConnected = (message) => {
    try {
        //message should have { id, name }
        message = ENCODER.decode(message);

        let socketUser = message.user;
        let gameSettings = message.gameSettings;
        ping();

        fs.set("localGameSettings", gameSettings);
        fs.set("prevGameSettings", fs.get("gameSettings"));
        fs.set("gameSettings", gameSettings);

        fs.set("socketUser", socketUser);
        fs.set("wsStatus", "connected");

        GamePanelService.createGamePanel(socketUser.id);

        // let fakePlayerList = Object.keys(fakePlayers || {}) || [];
        // if (primaryGamePanel == null && fakePlayerList && fakePlayerList.length >= 7) {
        //     let socketUser = fs.get('socketUser');
        //     if (primaryGamePanel == gamepanels[socketUser.id])
        //         return;
        //     fs.set('primaryGamePanel', gamepanels[socketUser.id]);
        //     fs.set('gamePanelLayout', 'expanded');

        // }
    } catch (e) {
        console.error(e);
    }
};

const ping = () => {
    try {
        let latencyStart = new Date().getTime();
        let socket = fs.get("socket");
        wsSend("ping", { payload: latencyStart });
        fs.set("latencyStart", latencyStart);
    } catch (e) {
        console.error(e);
    }
};

const onPong = (message) => {
    try {
        message = ENCODER.decode(message);
        let latencyStart = fs.get("latencyStart");
        let serverOffset = message.payload.offset;
        let serverTime = message.payload.serverTime;
        let currentTime = new Date().getTime();
        let latency = currentTime - latencyStart;
        let offsetTime = currentTime - serverTime;
        let realTime = currentTime + offsetTime + Math.ceil(latency / 2);
        // console.log("Latency Start: ", latencyStart);
        console.log("Latency: ", latency);
        // console.log("Offset Time: ", offsetTime);
        // console.log("Server Offset: ", serverOffset);
        // console.log("Server Time: ", serverTime);
        // console.log("Client Time: ", currentTime);
        // console.log("Real Time: ", realTime);
    } catch (e) {
        console.error(e);
    }
};

const onLastAction = (message) => {
    try {
        message = ENCODER.decode(message);
        console.log("Last Action: ", message);
    } catch (e) {
        console.error(e);
    }
};

const onDisconnect = (e) => {
    try {
        fs.set("wsStatus", "disconnected");
        fs.set("gameStatus", "none");
        let socket = fs.get("socket");
        console.log(socket.id + " disconnect", e, socket.io.engine);
    } catch (e) {
        console.error(e);
    }
};
