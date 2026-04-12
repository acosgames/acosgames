import {
    protoEncode,
    protoDecode,
    registerExtension,
    applyExtension,
} from "acos-json-encoder";
import { io, Socket } from "socket.io-client";

import {
    onFakePlayer,
    onJoin,
    onLeave,
    onSpectate,
    onGameUpdate,
    onReplay,
    onReplayStats,
    onTeamInfo,
    autoJoin,
    newGame,
} from "./game";

import GamePanelService from "../services/GamePanelService";
import GameStateService from "../services/GameStateService";
import {
    btAutoJoin,
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

const defaultGameSettings: Record<string, any> = {};

export function connect(displayname?: string): void {
    let socket: Socket | null = btSocket.get();

    if (socket && !socket.disconnected) return;

    displayname = displayname || "Player " + Math.floor(Math.random() * 1000);
    btUsername.set(displayname);

    const host = window.location.host;
    console.log(host);
    socket = io("ws://" + host, {
        transports: ["websocket"],
        query: {"displayname": displayname},
    });

    socket.on("reconnect_error", (e) => { console.log("Connection Failed", e); });
    socket.on("connect_error", (err) => { console.log(`connect_error due to ${err.message}`); });
    socket.io.on("error", (err) => { console.log(`error due to `, err); });

    socket.on("connect", onConnect);
    socket.on("gameSettings", onGameSettings);
    socket.on("gameProtocol", onGameProtocol);
    socket.on("connected", onConnected);
    socket.on("pong", onPong);
    socket.on("join", onJoin);
    socket.on("leave", onLeave);
    socket.on("game", onGameUpdate);
    socket.on("newgame", onNewGame);
    socket.on("spectator", onSpectate);
    socket.on("fakeplayer", onFakePlayer);
    socket.on("teaminfo", onTeamInfo);
    socket.on("disconnect", onDisconnect);
    socket.on("replay", onReplay);
    socket.on("replayStats", onReplayStats);

    btSocket.set(socket);
}

export function wsSend(type: string, payload: unknown): void {
    const socket: Socket = btSocket.get();
    socket.emit(type, protoEncode({ type, payload }));
}

export function updateGameSettings(newSettings: Record<string, any>): void {
    btPrevGameSettings.set(btGameSettings.get());
    btGameSettings.set(newSettings);
    wsSend("gameSettings", newSettings);
}

export function saveGameSettings(): void {
    const newSettings = btGameSettings.get();
    wsSend("gameSettings", newSettings);
}

const onNewGame = (_message: unknown): void => {
    GameStateService.clearState();
};

const onGameSettings = (message: any): void => {
    try {
        const decoded: any = protoDecode(message);
        btLocalGameSettings.set(decoded.payload.gameSettings);
        btPrevGameSettings.set(btGameSettings.get());
        btGameSettings.set(decoded.payload.gameSettings);
    } catch (e) {
        console.error(e);
    }
};

const onGameProtocol = (message: any): void => {
    try {
        const decoded: any = protoDecode(message);
        if (!decoded?.payload) return;
        registerExtension("gameupdate", "game", decoded.payload);
        applyExtension("gameupdate", "game");
    } catch (e) {
        console.error(e);
    }
};

const onConnect = (): void => {
    btWebsocketStatus.set("connected");
};

const onConnected = (message: any): void => {
    try {
        const decoded: any = protoDecode(message);
        const socketUser = decoded.payload.user;
        const gameSettings = decoded.payload.gameSettings;

        btLocalGameSettings.set(gameSettings);
        btPrevGameSettings.set(btGameSettings.get());
        btGameSettings.set(gameSettings);
        btSocketUser.set(socketUser);
        btWebsocketStatus.set("connected");

        GamePanelService.createGamePanel(socketUser.shortid);
    } catch (e) {
        console.error(e);
    }
};

const ping = (): void => {
    try {
        const latencyStart = Date.now();
        wsSend("ping", { payload: latencyStart });
        btLatencyInfo.assign({ latencyStart });
    } catch (e) {
        console.error(e);
    }
};

const onPong = (message: any): void => {
    try {
        const decoded: any = protoDecode(message);
        const latencyStart = btLatencyInfo.get((b: any) => b.latencyStart);
        const { offset: serverOffset, serverTime } = decoded.payload;
        const currentTime = Date.now();
        const latency = currentTime - latencyStart;
        const offsetTime = currentTime - serverTime;
        const realTime = currentTime + offsetTime + Math.ceil(latency / 2);
        console.log("Latency: ", latency);
        btLatencyInfo.assign({ serverOffset, serverTime, currentTime, latency, realTime });
    } catch (e) {
        console.error(e);
    }
};

const onDisconnect = (e: any): void => {
    try {
        btWebsocketStatus.set("disconnected");
        btGameStatus.set(0);
        const socket = btSocket.get();
        console.log(socket?.shortid + " disconnect", e);
    } catch (e) {
        console.error(e);
    }
};
