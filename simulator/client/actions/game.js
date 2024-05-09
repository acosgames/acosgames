import ENCODER from "acos-json-encoder";
import ACOSDictionary from "shared/acos-dictionary.json";
ENCODER.createDefaultDict(ACOSDictionary);

import fs from "flatstore";

import GamePanelService from "../services/GamePanelService";
import { wsSend } from "./websocket";
import GameStateService from "../services/GameStateService";

var timerHandle = 0;
export function timerLoop(cb) {
    if (cb) cb();

    if (timerHandle) {
        clearTimeout(timerHandle);
        timerHandle = 0;
    }

    timerHandle = setTimeout(() => {
        timerLoop(cb);
    }, 30);

    updateTimeleft();
}

timerLoop();

export function updateTimeleft() {
    let gamestate = GameStateService.getGameState();
    if (!gamestate) return;

    let timer = gamestate.timer;
    if (!timer) {
        return;
    }

    let deadline = timer.end;
    if (!deadline) return;

    if (gamestate?.room?.status == "gameover") return;

    let now = new Date().getTime();
    let elapsed = deadline - now;

    if (elapsed <= 0) {
        elapsed = 0;
    }

    fs.set("timeleft", elapsed);
    fs.set("timeleftUpdated", Date.now());
}

export function leaveGame(message) {
    let socketUser = fs.get("socketUser");
    let user = { id: socketUser.id, name: socketUser.name };
    wsSend("action", { type: "leave", user });
    fs.set("gameStatus", "none");
}

export function replayNext() {
    wsSend("replay", { type: "next" });
}

export function replayPrev() {
    wsSend("replay", { type: "prev" });
}

export function replayJump(index) {
    wsSend("replay", { type: "jump", payload: index });
}

export function joinGame(team_slug) {
    let socketUser = fs.get("socketUser");
    let user = { id: socketUser.id, name: socketUser.name, team_slug };
    wsSend("action", { type: "join", user });
}

export function playerReady(user) {
    wsSend("action", { type: "ready", user });
}

export function startGame(message) {
    let socketUser = fs.get("socketUser");
    let user = { id: socketUser.id, name: socketUser.name };
    wsSend("action", { type: "gamestart", user });
}

export function newGame(message) {
    let socketUser = fs.get("socketUser");
    let user = { id: socketUser.id, name: socketUser.name };
    wsSend("action", { type: "newgame", user });
    fs.set("gameStatus", "none");
}

export function skip(message) {
    let socketUser = fs.get("socketUser");
    let user = { id: socketUser.id, name: socketUser.name };
    wsSend("action", { type: "skip", user });
    // fs.set('gameStatus', 'none');
}

export function spawnFakePlayers(message) {
    let socketUser = fs.get("socketUser");
    let user = { id: socketUser.id, name: socketUser.name };
    wsSend("fakeplayer", { type: "create", user, payload: 1 });
}

export function joinFakePlayer(fakePlayer, team_slug) {
    let user = { id: fakePlayer.id, name: fakePlayer.name, team_slug };
    wsSend("action", { type: "join", user });
}

export function leaveFakePlayer(fakePlayer) {
    let socketUser = fs.get("socketUser");
    let user = {
        id: fakePlayer.id,
        name: fakePlayer.name,
        clientid: socketUser.id,
    };
    wsSend("action", { type: "leave", user });
}

export function removeFakePlayer(fakePlayer) {
    let socketUser = fs.get("socketUser");
    let user = {
        id: fakePlayer.id,
        name: fakePlayer.name,
        clientid: socketUser.id,
    };
    wsSend("fakeplayer", { type: "remove", user });
}

export function onLeave(message) {
    try {
        fs.set("wsStatus", "connected");
        fs.set("gameStatus", "none");
    } catch (e) {
        console.error(e);
    }
}

export function onReplayStats(message) {
    try {
        message = ENCODER.decode(message);
        // console.log("REPLAY STATS: ", message);
        if (!message) return;

        fs.set("replayStats", message);
    } catch (e) {
        console.error(e);
    }
}

export function onReplay(message) {
    try {
        message = ENCODER.decode(message);
        console.log("REPLAY: ", message);
        if (!message) return;

        GameStateService.updateState(message.current, message.prev);

        updateTimeleft();
        fs.set("gameStatus", message?.current?.room?.status || "none");
    } catch (e) {
        console.error(e);
    }
}

export function onTeamInfo(message) {
    try {
        message = ENCODER.decode(message);
        // console.log("TEAMINFO UPDATE: ", message);
        if (!message) return;

        fs.set("teaminfo", message);
    } catch (e) {
        console.error(e);
    }
}

export function onGameUpdate(message) {
    try {
        message = ENCODER.decode(message);
        // console.log("GAME UPDATE: ", message);
        if (!message) return;

        GameStateService.updateState(message);

        fs.set("gameStatus", message?.room?.status || "none");
    } catch (e) {
        console.error(e);
    }
}

export function onJoin(message) {
    try {
        message = ENCODER.decode(message);
        console.log("JOINED: ", message);
        if (!message) return;

        GameStateService.updateState(message);

        if (message?.room?.status) {
            fs.set("gameStatus", message.room.status);
        }

        fs.set("wsStatus", "ingame");
    } catch (e) {
        console.error(e);
    }
}

export function onSpectate(message) {}

export function onFakePlayer(message) {
    message = ENCODER.decode(message);
    // console.log("FAKEPLAYER: ", message);
    if (!message || typeof message.type === "undefined") return;

    let fakePlayers = fs.get("fakePlayers") || {};

    if (message.type == "created") {
        let newFakePlayers = message.payload;
        for (const fakePlayer of newFakePlayers) {
            fakePlayers[fakePlayer.id] = fakePlayer;
        }
        for (const fakePlayer of newFakePlayers) {
            GamePanelService.createGamePanel(fakePlayer.id);
        }
        fs.set("fakePlayers", fakePlayers);
    } else if (message.type == "join") {
    } else if (message.type == "leave") {
    } else if (message.type == "removed") {
        let id = message?.payload;

        if (id && id in fakePlayers) {
            let fakePlayer = fakePlayers[id];
            leaveFakePlayer(fakePlayer);

            delete fakePlayers[id];
            GamePanelService.removeGamePanel(id);
            fs.set("fakePlayers", fakePlayers);
        }
    }
}
