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
import {
    btGameSettings,
    btGameStatus,
    btLatencyInfo,
    btLocalGameSettings,
    btPrevGameSettings,
    btSocket,
    btSocketUser,
    btUsername,
    btWebsocketStatus,
} from "./buckets";

// var latency = 0;
// var latencyStart = 0;
// var offsetTime = 0;
const defaultGameSettings = {}; // { minplayers: 1, maxplayers: 1, minteams: 0, maxteams: 0, teams: [], screentype: 3, resow: 4, resoh: 3, screenwidth: 800 };

//--------------------------------------------------
//WebSockets Connection / Management
//--------------------------------------------------
export function connect(displayname) {
    // note.textContent = 'Status: connecting...';
    let socket = btSocket.get();

    if (socket && !socket.disconnected) {
        // socket.disconnect();
        return;
    }

    displayname = displayname || "Player " + Math.floor(Math.random() * 1000);

    btUsername.set(displayname);

    let host = window.location.host;
    console.log(host);
    socket = io("ws://" + host, {
        // jsonp: false,
        transports: ["websocket"],
        // upgrade: true,
        query: "displayname=" + displayname,
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

    btSocket.set(socket);
}

export function wsSend(type, payload) {
    let socket = btSocket.get();
    socket.emit(type, ENCODER.encode(payload));
}

export function updateGameSettings(newSettings) {
    btPrevGameSettings.set(btGameSettings.get());
    btGameSettings.set(newSettings);
    wsSend("gameSettings", newSettings);
}

export function saveGameSettings() {
    let newSettings = btGameSettings.get();
    wsSend("gameSettings", newSettings);
}

const onNewGame = (message) => {
    GameStateService.clearState();
};

const onGameSettings = (message) => {
    try {
        //message should have { id, name }
        message = ENCODER.decode(message);

        btLocalGameSettings.set(message.gameSettings);
        btPrevGameSettings.set(btGameSettings.get());
        btGameSettings.set(message.gameSettings);
    } catch (e) {
        console.error(e);
    }
};

const onConnect = (evt) => {
    btWebsocketStatus.set("connected");
    let socket = btSocket.get();
    let socketUser = btSocketUser.get();
};

const onConnected = (message) => {
    try {
        //message should have { id, name }
        message = ENCODER.decode(message);

        let socketUser = message.user;
        let gameSettings = message.gameSettings;

        btLocalGameSettings.set(gameSettings);
        btPrevGameSettings.set(btGameSettings.get());
        btGameSettings.set(gameSettings);

        btSocketUser.set(socketUser);
        btWebsocketStatus.set("connected");

        GamePanelService.createGamePanel(socketUser.shortid);

        setTimeout(() => {
            ping();
        }, 200);
    } catch (e) {
        console.error(e);
    }
};

const ping = () => {
    try {
        let latencyStart = new Date().getTime();
        wsSend("ping", { payload: latencyStart });

        btLatencyInfo.assign({ latencyStart });
    } catch (e) {
        console.error(e);
    }
};

const onPong = (message) => {
    try {
        message = ENCODER.decode(message);
        let latencyStart = btLatencyInfo.get((b) => b.latencyStart);
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
        btLatencyInfo.assign({
            serverOffset,
            serverTime,
            currentTime,
            latency,
            realTime,
        });
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
        btWebsocketStatus.set("disconnected");
        btGameStatus.set("none");
        let socket = btSocket.get();
        console.log(socket.shortid + " disconnect", e, socket.io.engine);
    } catch (e) {
        console.error(e);
    }
};
