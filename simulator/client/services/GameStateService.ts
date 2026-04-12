import { playerReady } from "../actions/game";
import GamePanelService from "./GamePanelService";
import { protoEncode, delta, hidden, unhidden } from "acos-json-encoder";
import {
    btDeltaEncoded,
    btDeltaState,
    btGamepanels,
    btGameSettings,
    btGameState,
    btHiddenPlayerState,
    btPlayerTeams,
    btTeamInfo,
} from "../actions/buckets";
import { gs } from "@acosgames/framework";

interface TeamSettingItem {
    team_slug: string;
    team_name: string;
    color: string;
    team_order: number;
    [key: string]: any;
}

interface EncodedSizes {
    total: number;
    state: number;
    players: number;
    teams: number;
    room: number;
    action: number;
    [key: string]: number;
}

class GameStateService {
    statusList: string[];
    statusMap: Record<string, number>;

    constructor() {
        btGameState.set({});
        btDeltaState.set({});
        btHiddenPlayerState.set({});

        this.statusList = [
            "none",
            "waiting",
            "pregame",
            "gamestart",
            "gameover",
            "gamecancelled",
            "gameerror",
        ];

        this.statusMap = {
            none: 0,
            waiting: 1,
            pregame: 2,
            gamestart: 3,
            gameover: 4,
            gamecancelled: 5,
            gameerror: 6,
        };
    }

    statusByName(name: string): number {
        return this.statusMap[name] || 0;
    }

    statusById(id: number): string {
        return this.statusList[id] || "none";
    }

    getGameState(): any {
        return btGameState.copy();
    }

    getPlayers(): any[] {
        const gameState = this.getGameState();
        return gameState?.players || [];
    }

    getPlayersArray(): any[] {
        return this.getPlayers();
    }

    getPlayer(id: string): any {
        const players = this.getPlayers();
        return players.find((p: any) => p.shortid === id) || null;
    }

    hasTeams(): boolean {
        const teaminfo: any[] = btTeamInfo.get() || [];
        return teaminfo.length > 0;
    }

    anyTeamHasVacancy(): boolean {
        const teaminfo: any[] = btTeamInfo.get() || [];
        let vacancyCount = 0;

        for (const team of teaminfo) {
            vacancyCount += team.vacancy;
        }

        if (teaminfo.length === 0) {
            return true;
        }

        return vacancyCount > 0;
    }

    hasVacancy(teamid?: string | number): number | boolean {
        const gameSettings = btGameSettings.get();
        const gameState = btGameState.get();

        if (teamid !== undefined && gameState?.teams) {
            const team = gameState?.teams[teamid];
            if (team) return team.vacancy;
        }

        const players: any[] = gameState?.players || [];
        return gameSettings.maxplayers - players.length;
    }

    clearState(): void {
        btGameState.set({});

        this.initTeamsFromSettings(btGameSettings.get()?.teams || []);
        btDeltaState.set({});
        btHiddenPlayerState.set({});

        this.updateGamePanels();
    }

    initTeamsFromSettings(settingsTeams: TeamSettingItem[]): void {
        const gameState = btGameState.get();
        if (Array.isArray(gameState.teams) && gameState.teams.length > 0) return;

        const seededTeams = settingsTeams.map((t) => ({
            team_slug: t.team_slug,
            name: t.team_name,
            color: t.color,
            order: t.team_order,
            players: [],
            rank: 0,
            score: 0,
        }));

        btGameState.set({ ...gameState, teams: seededTeams });
    }

    validateNextTeam(teamid: string | number): boolean {
        const gamestate = gs(this.getGameState());

        let gameroom = gamestate.room();
        let nextTeam = gameroom.nextTeam;

        if( nextTeam === teamid) return true;
        if( Array.isArray(nextTeam) && nextTeam.includes(teamid)) return true;

        // const nextid = gameroom?.next_team;
        // const room = gameroom;
        // if (room?.status !== this.statusByName("gamestart")) return false;
        // if (nextid === null || nextid === undefined) return false;
        // if (!gamestate.state) return false;
        // if (nextid === teamid) return true;
        // if (Array.isArray(nextid) && nextid.includes(teamid)) return true;
        return false;
    }

    validateNextUser(id: number): boolean {

        const gamestate = gs(this.getGameState());
        const gameroom = gamestate.room();

        let next = gameroom.nextPlayer;

        if( Array.isArray(next) && next.includes(id)) return true;
        
        let player = gamestate.player(id);
        if (!player) return false;

        if( next === id) return true;


        return false;
    }

    updateState(newState: any, prevState?: any): void {
        const gameState = prevState || btGameState.get();

        if (Array.isArray(newState.teams) && newState.teams.length > 0) {
            const existingTeams = gameState.teams || [];
            if (Array.isArray(existingTeams) && existingTeams.length > 0) {
                newState.teams = newState.teams.map((incoming: any) => {
                    const existing = existingTeams.find(
                        (e: any) => e.team_slug === incoming.team_slug
                    );
                    return existing ? { ...existing, ...incoming } : incoming;
                });
            }
        }

        const copyGameState = JSON.parse(JSON.stringify(gameState));
        const copyNewState = JSON.parse(JSON.stringify(newState));

        delete copyGameState?.room?.events;
        if (copyGameState.delta) delete copyGameState.delta;

        let msgDelta: any;
        try {
            for (const player of copyNewState.players || [])
                if (player.portrait) delete player.portrait;
            for (const player of copyGameState.players || [])
                if (player.portrait) delete player.portrait;

            msgDelta = delta(copyGameState, copyNewState);
        } catch (e) {
            console.log(
                JSON.stringify(copyGameState),
                JSON.stringify(copyNewState)
            );
            console.error(e);
            return;
        }

        const hiddenPlayers = hidden(msgDelta.players);
        hidden(msgDelta.state);
        hidden(msgDelta.room);

        if ("$" in msgDelta) delete msgDelta["$"];

        if (msgDelta?.room?.isreplay) delete msgDelta.room.isreplay;

        if (msgDelta?.action?.user?.shortid)
            msgDelta.action.user = msgDelta.action.user.shortid;

        if (msgDelta?.action && "timeseq" in msgDelta.action)
            delete msgDelta.action.timeseq;

        if (msgDelta?.action && "timeleft" in msgDelta.action)
            delete msgDelta.action.timeleft;

        if (msgDelta["local"]) delete msgDelta["local"];

        this.calculateEncodedSizes(msgDelta);

        newState.delta = msgDelta;

        btDeltaState.set(msgDelta);
        btHiddenPlayerState.set(hiddenPlayers);

        const playerTeams: Record<string, string> = {};
        if (Array.isArray(newState.teams)) {
            for (const team of newState.teams) {
                const players: string[] = team.players;
                for (const id of players) {
                    playerTeams[id] = team.team_slug;
                }
            }
        }
        btPlayerTeams.set(playerTeams);

        if (newState.players) {
            for (const player of newState.players) {
                player.portrait = `https://assets.acos.games/images/portraits/assorted-${
                    player?.portraitid || 1
                }-medium.webp`;
            }
        }

        btGameState.set(newState);

        this.updateGamePanels();
    }

    calculateEncodedSizes(msgDelta: any): void {
        const encodedSizes: EncodedSizes = {
            total: 0,
            state: 0,
            players: 0,
            teams: 0,
            room: 0,
            action: 0,
        };

        const withoutAction = JSON.parse(JSON.stringify(msgDelta));
        if (withoutAction.action) delete withoutAction.action;
        let encoded: ArrayBuffer = protoEncode({ type: "gameupdate", payload: withoutAction });
        encodedSizes.total = encoded.byteLength;

        if (!msgDelta.state) {
            encodedSizes.state = 0;
        } else {
            encoded = protoEncode({ type: "gameupdate", payload: { state: msgDelta.state } });
            encodedSizes.state = encoded.byteLength - 1;
        }

        if (!msgDelta.players && !msgDelta["#players"]) {
            encodedSizes.players = 0;
        } else {
            if (msgDelta.players)
                encoded = protoEncode({ type: "gameupdate", payload: { players: msgDelta.players } });
            else
                encoded = protoEncode({ type: "gameupdate", payload: { "#players": msgDelta["#players"] } });
            encodedSizes.players = encoded.byteLength - 1;
        }

        if (!msgDelta.teams && !msgDelta["#teams"]) {
            encodedSizes.teams = 0;
        } else {
            if (msgDelta.teams)
                encoded = protoEncode({ type: "gameupdate", payload: { teams: msgDelta.teams } });
            else
                encoded = protoEncode({ type: "gameupdate", payload: { "#teams": msgDelta["#teams"] } });
            encodedSizes.teams = encoded.byteLength - 1;
        }

        if (!msgDelta.room) {
            encodedSizes.room = 0;
        } else {
            const removeHidden = hidden(msgDelta.room);
            encoded = protoEncode({ type: "gameupdate", payload: { room: msgDelta.room } });
            unhidden(msgDelta.room, removeHidden);
            encodedSizes.room = encoded.byteLength - 1;
        }

        if (!msgDelta.action) {
            encodedSizes.action = 0;
        } else {
            encoded = protoEncode({ type: "gameupdate", payload: { action: msgDelta.action } });
            encodedSizes.action = encoded.byteLength - 1;
        }

        btDeltaEncoded.set(encodedSizes);
    }

    updateGamePanel(shortid: string): void {
        try {
            const gameState = btGameState.get();
            const gamepanels = btGamepanels.get();
            const gamepanel = gamepanels[shortid];

            const pstate = JSON.parse(JSON.stringify(gameState));

            if (!gamepanel?.iframe?.current) return;

            if (pstate.private) delete pstate.private;

            if (pstate?.room && pstate?.room?.isreplay) {
                delete pstate.room.isreplay;
            }

            const hiddenPlayers = btHiddenPlayerState.get();
            const pstatePlayer = pstate?.players?.find((p: any) => p.shortid === shortid);
            if (hiddenPlayers && hiddenPlayers[shortid] && pstatePlayer) {
                pstate.local = Object.assign({}, pstatePlayer, hiddenPlayers[shortid]);
                pstate.private = {
                    players: [{ ...hiddenPlayers[shortid], shortid }],
                };
            }

            if (pstatePlayer) {
                pstate.local = JSON.parse(JSON.stringify(pstatePlayer));
                pstate.local.shortid = shortid;
            }

            GamePanelService.sendFrameMessage(gamepanel, pstate);

            const joinEvent = pstate?.room?.events?.find(
                (e: any) =>
                    e.type === "join" &&
                    Array.isArray(e.payload) &&
                    e.payload.includes(shortid)
            );
            if (joinEvent) {
                const player = pstate?.players?.find((p: any) => p.shortid === shortid);
                if (player) {
                    const user = GamePanelService.getUserById(player.shortid);
                    if (gamepanel.ready && !gameState.room.isreplay) playerReady(user);
                }
            }
        } catch (e) {
            console.error(e);
        }
    }

    updateGamePanels(): void {
        const gamepanels = btGamepanels.get();
        for (const id in gamepanels) {
            this.updateGamePanel(id);
        }
    }
}

export default new GameStateService();
