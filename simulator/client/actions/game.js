import ENCODER from "acos-json-encoder";
import ACOSDictionary from "shared/acos-dictionary.json";
ENCODER.createDefaultDict(ACOSDictionary);

import GamePanelService from "../services/GamePanelService";
import { wsSend } from "./websocket";
import GameStateService from "../services/GameStateService";
import {
    btAutoJoin,
    btFakePlayers,
    btGameSettings,
    btGameState,
    btGameStatus,
    btReplayStats,
    btSocketUser,
    btTeamInfo,
    btTimeleft,
    btTimeleftUpdated,
    btWebsocketStatus,
} from "./buckets";

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

    btTimeleft.set(elapsed);
    btTimeleftUpdated.set(Date.now());
}

export function leaveGame(message) {
    let socketUser = btSocketUser.get();
    let user = {
        shortid: socketUser.shortid,
        displayname: socketUser.displayname,
    };
    wsSend("action", { type: "leave", user });
    btGameStatus.set("none");
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
    let socketUser = btSocketUser.get();
    let user = {
        shortid: socketUser.shortid,
        displayname: socketUser.displayname,
        team_slug,
    };
    wsSend("action", { type: "join", user });
}

export function playerReady(user) {
    wsSend("action", { type: "ready", user });
}

export function startGame(message) {
    let socketUser = btSocketUser.get();
    let user = {
        shortid: socketUser.shortid,
        displayname: socketUser.displayname,
    };
    wsSend("action", { type: "gamestart", user });
}

export async function autoJoin() {
    await sleep(300);
    joinGame();
    await sleep(300);
    let gameSettings = btGameSettings.get();
    let gameState = btGameState.get();
    let playerList = Object.keys(gameState?.players);
    let fakePlayers = btFakePlayers.get() || {};
    for (let id in fakePlayers) {
        if (playerList.length >= gameSettings.maxplayers) break;
        joinFakePlayer(fakePlayers[id]);
        await sleep(300);
        gameState = btGameState.get();
        playerList = Object.keys(gameState?.players);
    }
}
export async function newGame(message) {
    let socketUser = btSocketUser.get();
    let user = {
        shortid: socketUser.shortid,
        displayname: socketUser.displayname,
    };
    wsSend("action", { type: "newgame", user });
    btGameStatus.set("none");

    let autojoin = btAutoJoin.get();
    if (autojoin) {
        autoJoin();
    }
}

export function skip(message) {
    let socketUser = btSocketUser.get();
    let user = {
        shortid: socketUser.shortid,
        displayname: socketUser.displayname,
    };
    wsSend("action", { type: "skip", user });
}

export function spawnFakePlayers(message) {
    let socketUser = btSocketUser.get();
    let user = {
        shortid: socketUser.shortid,
        displayname: socketUser.displayname,
    };
    wsSend("fakeplayer", { type: "create", user, payload: 1 });

    let autojoin = btAutoJoin.get();
    if (autojoin) {
        autoJoin();
    }
}

export function joinFakePlayer(fakePlayer, team_slug) {
    let user = {
        shortid: fakePlayer.shortid,
        displayname: fakePlayer.displayname,
        team_slug,
    };
    wsSend("action", { type: "join", user });
}

export function leaveFakePlayer(fakePlayer) {
    let socketUser = btSocketUser.get();
    let user = {
        shortid: fakePlayer.shortid,
        displayname: fakePlayer.displayname,
        clientid: socketUser.shortid,
    };
    wsSend("action", { type: "leave", user });
}

export function removeFakePlayer(fakePlayer) {
    let socketUser = btSocketUser.get();
    let user = {
        shortid: fakePlayer.shortid,
        displayname: fakePlayer.displayname,
        clientid: socketUser.shortid,
    };
    wsSend("fakeplayer", { type: "remove", user });
}

export function onLeave(message) {
    try {
        btWebsocketStatus.set("connected");
        btGameStatus.set("none");
    } catch (e) {
        console.error(e);
    }
}

export function onReplayStats(message) {
    try {
        message = ENCODER.decode(message);
        // console.log("REPLAY STATS: ", message);
        if (!message) return;

        btReplayStats.set(message);
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
        btGameStatus.set(message?.current?.room?.status || "none");
    } catch (e) {
        console.error(e);
    }
}

export function onTeamInfo(message) {
    try {
        message = ENCODER.decode(message);
        // console.log("TEAMINFO UPDATE: ", message);
        if (!message) return;

        btTeamInfo.set(message);
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

        btGameStatus.set(message?.room?.status || "none");
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
            btGameStatus.set(message.room.status);
        }

        btWebsocketStatus.set("ingame");
    } catch (e) {
        console.error(e);
    }
}

export function onSpectate(message) {}

export function onFakePlayer(message) {
    message = ENCODER.decode(message);
    // console.log("FAKEPLAYER: ", message);
    if (!message || typeof message.type === "undefined") return;

    let fakePlayers = btFakePlayers.get() || {};

    if (message.type == "created") {
        let newFakePlayers = message.payload;
        for (const fakePlayer of newFakePlayers) {
            fakePlayers[fakePlayer.shortid] = fakePlayer;
        }
        for (const fakePlayer of newFakePlayers) {
            GamePanelService.createGamePanel(fakePlayer.shortid);
        }
        if (newFakePlayers.length == 0) {
            let socketUser = btSocketUser.get();
            GamePanelService.removeAllButUserGamePanel(socketUser.shortid);

            btFakePlayers.set({});
        } else btFakePlayers.set(fakePlayers);
    } else if (message.type == "join") {
    } else if (message.type == "leave") {
    } else if (message.type == "removed") {
        let id = message?.payload;

        if (id && id in fakePlayers) {
            let fakePlayer = fakePlayers[id];
            leaveFakePlayer(fakePlayer);

            delete fakePlayers[id];
            GamePanelService.removeGamePanel(id);
            btFakePlayers.set(fakePlayers);
        }
    }
}
