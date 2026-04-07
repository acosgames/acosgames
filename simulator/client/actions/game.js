import { protoDecode } from "acos-json-encoder";

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

    let deadline = gamestate.room?.starttime + gamestate.room?.timeend;
    if (!deadline) return;

    if (
        gamestate?.room?.status == GameStateService.statusByName("gameover") ||
        gamestate?.room?.status == GameStateService.statusByName("gamecancelled") ||
        gamestate?.room?.status == GameStateService.statusByName("gameerror")
    )
        return;

    let now = Date.now();
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
    btGameStatus.set(0);
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

export function joinGame(teamid) {
    let socketUser = btSocketUser.get();
    let user = {
        shortid: socketUser.shortid,
        displayname: socketUser.displayname,
        teamid,
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
    let gameState = btGameState.get();
    let socketUser = btSocketUser.get();
    await sleep(1000);
    if( !gameState?.room?._players || !(socketUser.shortid in gameState?.room?._players ) ) 
        joinGame();
    await sleep(200);

    gameState = btGameState.get();
    let gameSettings = btGameSettings.get();
    let playerList = gameState?.players || [];
    let fakePlayers = btFakePlayers.get() || {};
    for (let id in fakePlayers) {
        if (playerList.length >= gameSettings.maxplayers) break;
        if(gameState?.room?._players  && !(id in gameState?.room?._players))
        joinFakePlayer(fakePlayers[id]);
        await sleep(300);
        gameState = btGameState.get();
        playerList = gameState?.players || [];
    }
}
export async function newGame(message) {
    let socketUser = btSocketUser.get();
    let user = {
        shortid: socketUser.shortid,
        displayname: socketUser.displayname,
    };
    wsSend("action", { type: "newgame",  user  });
    btGameStatus.set(0);

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
    wsSend("action", { type: "skip",  user });
}

export function spawnFakePlayers(message) {
    let socketUser = btSocketUser.get();
    let user = {
        shortid: socketUser.shortid,
        displayname: socketUser.displayname,
    };
    wsSend("fakeplayer", { type: "create", payload: { user, count: 1 } });

    let autojoin = btAutoJoin.get();
    if (autojoin) {
        autoJoin();
    }
}

export function joinFakePlayer(fakePlayer, teamid) {
    let user = {
        shortid: fakePlayer.shortid,
        displayname: fakePlayer.displayname,
        teamid,
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
        btGameStatus.set(0);
    } catch (e) {
        console.error(e);
    }
}

export function onReplayStats(message) {
    try {
        message = protoDecode(message);
        // console.log("REPLAY STATS: ", message);
        if (!message) return;

        btReplayStats.set(message.payload);
    } catch (e) {
        console.error(e);
    }
}

export function onReplay(message) {
    try {
        message = protoDecode(message);
        console.log("REPLAY: ", message);
        if (!message) return;

        GameStateService.updateState(message.payload.current, message.payload.prev);

        updateTimeleft();
        btGameStatus.set(message?.payload?.current?.room?.status || 0);
    } catch (e) {
        console.error(e);
    }
}

export function onTeamInfo(message) {
    try {
        message = protoDecode(message);
        // console.log("TEAMINFO UPDATE: ", message);
        if (!message) return;

        btTeamInfo.set(message.payload);
    } catch (e) {
        console.error(e);
    }
}

export function onGameUpdate(message) {
    try {
        message = protoDecode(message);
        // console.log("GAME UPDATE: ", message);
        if (!message) return;

        GameStateService.updateState(message.payload);

        btGameStatus.set(message?.payload?.room?.status || 0);
    } catch (e) {
        console.error(e);
    }
}

export function onJoin(message) {
    try {
        message = protoDecode(message);
        console.log("JOINED: ", message);
        if (!message) return;

        GameStateService.updateState(message.payload);

        if (message?.payload?.room?.status) {
            btGameStatus.set(message.payload.room.status);
        }

        btWebsocketStatus.set("ingame");
    } catch (e) {
        console.error(e);
    }
}

export function onSpectate(message) {}

export function onFakePlayer(message) {
    message = protoDecode(message);
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
        let user = message?.payload?.user;
        let id = user?.shortid;
        if (id && id in fakePlayers) {
            let fakePlayer = fakePlayers[id];
            leaveFakePlayer(fakePlayer);

            delete fakePlayers[id];
            GamePanelService.removeGamePanel(id);
            btFakePlayers.set(fakePlayers);
        }
    }
}
