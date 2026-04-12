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

export const sleep = (ms: number): Promise<void> =>
    new Promise((r) => setTimeout(r, ms));

let timerHandle = 0;

export function timerLoop(cb?: () => void): void {
    if (cb) cb();

    if (timerHandle) {
        clearTimeout(timerHandle);
        timerHandle = 0;
    }

    timerHandle = setTimeout(() => {
        timerLoop(cb);
    }, 30) as unknown as number;

    updateTimeleft();
}

timerLoop();

export function updateTimeleft(): void {
    const gamestate = GameStateService.getGameState();
    if (!gamestate) return;

    const deadline = (gamestate.room?.starttime ?? 0) + (gamestate.room?.timeend ?? 0);
    if (!deadline) return;

    const status = gamestate?.room?.status;
    if (
        status === GameStateService.statusByName("gameover") ||
        status === GameStateService.statusByName("gamecancelled") ||
        status === GameStateService.statusByName("gameerror")
    )
        return;

    const now = Date.now();
    const elapsed = Math.max(0, deadline - now);

    btTimeleft.set(elapsed);
    btTimeleftUpdated.set(Date.now());
}

export function leaveGame(_message?: unknown): void {
    const socketUser = btSocketUser.get();
    const user = {
        shortid: socketUser.shortid,
        displayname: socketUser.displayname,
    };
    wsSend("action", { type: "leave", user });
    btGameStatus.set(0);
}

export function replayNext(): void {
    wsSend("replay", { type: "next" });
}

export function replayPrev(): void {
    wsSend("replay", { type: "prev" });
}

export function replayJump(index: number): void {
    wsSend("replay", { type: "jump", payload: index });
}

export function joinGame(teamid?: number): void {
    const socketUser = btSocketUser.get();
    const user = {
        shortid: socketUser.shortid,
        displayname: socketUser.displayname,
        teamid,
    };
    wsSend("action", { type: "join", user });
}

export function playerReady(user: any): void {
    wsSend("action", { type: "ready", user });
}

export function startGame(_message?: unknown): void {
    const socketUser = btSocketUser.get();
    const user = {
        shortid: socketUser.shortid,
        displayname: socketUser.displayname,
    };
    wsSend("action", { type: "gamestart", user });
}

export async function autoJoin(): Promise<void> {
    joinGame();
    await sleep(100);

    const gameState = btGameState.get();
    const gameSettings = btGameSettings.get();
    let playerList: any[] = gameState?.players || [];
    const fakePlayers = btFakePlayers.get() || {};

    for (const id in fakePlayers) {
        if (playerList.length >= gameSettings.maxplayers) break;
        joinFakePlayer(fakePlayers[id]);
        const gs = btGameState.get();
        playerList = gs?.players || [];
    }
}

export async function newGame(_message?: unknown): Promise<void> {
    const socketUser = btSocketUser.get();
    const user = {
        shortid: socketUser.shortid,
        displayname: socketUser.displayname,
    };
    wsSend("action", { type: "newgame", user });
    btGameStatus.set(0);

    const autojoin = btAutoJoin.get();
    if (autojoin) {
        autoJoin();
    }
}

export function skip(_message?: unknown): void {
    const socketUser = btSocketUser.get();
    const user = {
        shortid: socketUser.shortid,
        displayname: socketUser.displayname,
    };
    wsSend("action", { type: "skip", user });
}

export function spawnFakePlayers(_message?: unknown): void {
    const socketUser = btSocketUser.get();
    const user = {
        shortid: socketUser.shortid,
        displayname: socketUser.displayname,
    };
    wsSend("fakeplayer", { type: "create", payload: { user, count: 1 } });

    const autojoin = btAutoJoin.get();
    if (autojoin) {
        autoJoin();
    }
}

export function joinFakePlayer(fakePlayer: any, teamid?: number): void {
    const user = {
        shortid: fakePlayer.shortid,
        displayname: fakePlayer.displayname,
        teamid,
    };
    wsSend("action", { type: "join", user });
}

export function leaveFakePlayer(fakePlayer: any): void {
    const socketUser = btSocketUser.get();
    const user = {
        shortid: fakePlayer.shortid,
        displayname: fakePlayer.displayname,
        clientid: socketUser.shortid,
    };
    wsSend("action", { type: "leave", user });
}

export function removeFakePlayer(fakePlayer: any): void {
    const socketUser = btSocketUser.get();
    const user = {
        shortid: fakePlayer.shortid,
        displayname: fakePlayer.displayname,
        clientid: socketUser.shortid,
    };
    wsSend("fakeplayer", { type: "remove", user });
}

export function onLeave(_message: unknown): void {
    try {
        btWebsocketStatus.set("connected");
        btGameStatus.set(0);
    } catch (e) {
        console.error(e);
    }
}

export function onReplayStats(message: any): void {
    try {
        const decoded: any = protoDecode(message);
        if (!decoded) return;
        btReplayStats.set(decoded.payload);
    } catch (e) {
        console.error(e);
    }
}

export function onReplay(message: any): void {
    try {
        const decoded: any = protoDecode(message);
        console.log("REPLAY: ", decoded);
        if (!decoded) return;

        GameStateService.updateState(decoded.payload.current, decoded.payload.prev);
        updateTimeleft();
        btGameStatus.set(decoded?.payload?.current?.room?.status || 0);
    } catch (e) {
        console.error(e);
    }
}

export function onTeamInfo(message: any): void {
    try {
        const decoded: any = protoDecode(message);
        if (!decoded) return;
        btTeamInfo.set(decoded.payload);
    } catch (e) {
        console.error(e);
    }
}

export function onGameUpdate(message: any): void {
    try {
        const decoded: any = protoDecode(message);
        if (!decoded) return;
        GameStateService.updateState(decoded.payload);
        btGameStatus.set(decoded?.payload?.room?.status || 0);
    } catch (e) {
        console.error(e);
    }
}

export function onJoin(message: any): void {
    try {
        const decoded: any = protoDecode(message);
        console.log("JOINED: ", decoded);
        if (!decoded) return;
        GameStateService.updateState(decoded.payload);
        if (decoded?.payload?.room?.status) {
            btGameStatus.set(decoded.payload.room.status);
        }
        btWebsocketStatus.set("ingame");
    } catch (e) {
        console.error(e);
    }
}

export function onSpectate(_message: any): void {}

export function onFakePlayer(message: any): void {
    const decoded: any = protoDecode(message);
    if (!decoded || typeof decoded.type === "undefined") return;

    let fakePlayers = btFakePlayers.get() || {};

    if (decoded.type === "created") {
        const newFakePlayers: any[] = decoded.payload;
        for (const fakePlayer of newFakePlayers) {
            fakePlayers[fakePlayer.shortid] = fakePlayer;
        }
        for (const fakePlayer of newFakePlayers) {
            GamePanelService.createGamePanel(fakePlayer.shortid);
        }
        if (newFakePlayers.length === 0) {
            const socketUser = btSocketUser.get();
            GamePanelService.removeAllButUserGamePanel(socketUser.shortid);
            btFakePlayers.set({});
        } else {
            btFakePlayers.set(fakePlayers);
        }
    } else if (decoded.type === "removed") {
        const user = decoded?.payload?.user;
        const id = user?.shortid;
        if (id && id in fakePlayers) {
            const fakePlayer = fakePlayers[id];
            leaveFakePlayer(fakePlayer);
            delete fakePlayers[id];
            GamePanelService.removeGamePanel(id);
            btFakePlayers.set(fakePlayers);
        }
    }
}
