import { customAlphabet } from "nanoid";
import GameSettingsManager, { GameSettings } from "./GameSettingsManager";
import { cloneObj } from "./util";

const nanoid = customAlphabet("6789BCDFGHJKLMNPQRTW", 6);

export interface TeamInfo {
    team_slug: string;
    maxplayers: number;
    minplayers: number;
    vacancy: number;
    players: string[];
    captains: string[];
}

export interface GameState {
    room?: RoomState;
    state?: Record<string, unknown>;
    players?: Player[];
    teams?: TeamData[];
    timer?: unknown;
    [key: string]: unknown;
}

export interface RoomState {
    status?: number;
    _players: Record<string, number>;
    _teams?: Record<string, number>;
    _sequence?: number;
    starttime?: number;
    timeend?: number;
    timeset?: number;
    timesec?: number;
    updated?: number;
    events?: GameEvent[];
    isreplay?: boolean;
    next_player?: number | number[] | null;
    next_team?: number | number[] | null;
    [key: string]: unknown;
}

export interface GameEvent {
    type: string;
    payload?: unknown;
}

export interface Player {
    id?: number;
    shortid?: string;
    displayname?: string;
    portraitid?: number;
    ingame?: boolean;
    ready?: boolean;
    teamid?: number;
    mu?: number;
    sigma?: number;
    rank?: number;
    score?: number;
    [key: string]: unknown;
}

export interface TeamData {
    team_slug: string;
    name: string;
    color: string;
    order?: number;
    players: number[];
    rank: number;
    score: number;
    [key: string]: unknown;
}

class Room {
    readonly statusList: string[];
    readonly statusMap: Record<string, number>;

    room_slug: string;
    status: number;
    sequence: number;
    starttime: number;
    endtime: number;
    spectators: string[];
    history: GameState[];
    gamestate: number;
    gsm: typeof GameSettingsManager;
    deadline: number;
    skipCount: number;
    teaminfo: TeamInfo[];
    _sequence?: number;

    constructor(settings?: typeof GameSettingsManager) {
        this.statusList = [
            "none", "waiting", "pregame", "starting",
            "gamestart", "gameover", "gamecancelled", "gameerror",
        ];

        this.statusMap = {
            none: 0, waiting: 1, pregame: 2, starting: 3,
            gamestart: 4, gameover: 5, gamecancelled: 6, gameerror: 7,
        };

        this.room_slug = nanoid(8);
        this.status = 2;
        this.sequence = 0;
        this.starttime = Date.now();
        this.endtime = 0;
        this.spectators = [];
        this.history = [];
        this.gamestate = 0;
        this.gsm = GameSettingsManager;
        if (settings) this.gsm = settings;

        this.deadline = 0;
        this.skipCount = 0;
        this.teaminfo = [];

        if (this.gsm.get()) {
            this.createTeamsBySize();
        } else {
            console.error("GSM DOES NOT EXIST!! ?!");
        }
    }

    json(): object {
        return {
            room_slug: this.room_slug,
            status: this.status,
            _sequence: this._sequence,
            starttime: this.starttime,
        };
    }

    hasVacancy(): boolean {
        return this._sequence == 0 || (this.isPregame() && !this.isFull());
    }

    replayStats(): { total: number; position: number } {
        const gamestartIndex = this.getGameStartIndex();
        return {
            total: Math.max(0, this.history.length - gamestartIndex),
            position: Math.max(0, this.gamestate - gamestartIndex + 1),
        };
    }

    getGameState(): GameState {
        return this.history[this.gamestate];
    }

    getPrevGameState(): GameState {
        if (this.gamestate - 1 > 0) {
            return this.history[this.gamestate - 1];
        }
        return {};
    }

    jumpPrevState(): { current: GameState; prev: GameState } {
        return this.jumpToState(this.gamestate - 1);
    }

    jumpNextState(): { current: GameState; prev: GameState } {
        return this.jumpToState(this.gamestate + 1);
    }

    getGameStartIndex(): number {
        return 0;
    }

    jumpToState(index: number): { current: GameState; prev: GameState } {
        const gamestartIndex = this.getGameStartIndex();

        if (index < gamestartIndex) index = gamestartIndex;
        if (index >= this.history.length) index = this.history.length - 1;

        let current = this.history[index];
        let prev = index - 1 < gamestartIndex ? {} : this.history[index - 1];
        this.updateGame(current, index);
        this.gamestate = index;

        const now = Date.now();
        if (current?.room?.updated) {
            if (current.room.timeend) {
                current.room.timeend = 0;
                this.setDeadline(0);
            }
            current.room.updated = now - (current.room.starttime ?? 0);
        }

        if (prev?.room?.updated) {
            if (prev.room.timeend) {
                prev.room.timeend = 0;
            }
            prev.room.updated = now - (prev.room.starttime ?? 0);
        }

        if (current?.room) current.room.isreplay = true;

        return { current, prev };
    }

    updateGame(newGamestate: GameState, replayIndex?: number): void {
        if (typeof replayIndex === "undefined") {
            if (this.gamestate < this.history.length - 1) {
                this.history.splice(this.gamestate + 1);
            }

            if (newGamestate?.room?.isreplay) {
                delete newGamestate.room.isreplay;
            }

            this.history.push(newGamestate);
            this.gamestate = this.history.length - 1;
        } else {
            this.gamestate = replayIndex;
        }

        if (newGamestate?.room?.status) {
            this.status = newGamestate.room.status as number;
        }

        if (newGamestate?.room?._sequence) {
            this._sequence = newGamestate.room._sequence;
        }

        if (this.isGameOver()) {
            this.setDeadline(0);
        } else if (newGamestate?.room?.timeend) {
            this.setDeadline(newGamestate.room.timeend as number);
        }
    }

    createTeamsBySize(): void {
        const gameSettings = this.gsm.get();
        const teamsBySize: TeamInfo[] = [];

        if (!gameSettings.maxteams) {
            // Free for all — no team structure
        } else if (gameSettings.maxteams === 1) {
            const team = gameSettings.teams[0];
            const maxteamcount = Math.floor(
                gameSettings.maxplayers / team.maxplayers
            );
            for (let i = 0; i < maxteamcount; i++) {
                const teamid = i + 1;
                teamsBySize.push({
                    team_slug: "team_" + teamid,
                    maxplayers: team.maxplayers,
                    minplayers: team.minplayers,
                    vacancy: team.maxplayers,
                    players: [],
                    captains: [],
                });
            }
        } else {
            for (const team of gameSettings.teams) {
                teamsBySize.push({
                    team_slug: team.team_slug,
                    maxplayers: team.maxplayers,
                    minplayers: team.minplayers,
                    vacancy: team.maxplayers,
                    players: [],
                    captains: [],
                });
            }
        }

        teamsBySize.sort((a, b) => b.vacancy - a.vacancy);

        if (this.history.length > 1) return;
        if (teamsBySize.length > 0) {
            this.teaminfo = teamsBySize;
        }
    }

    attemptJoinTeam(teamid: number): { teamid: number } | { error: string } {
        const team = this.teaminfo[teamid];
        if (team && team.vacancy > 0) {
            team.vacancy -= 1;
            return { teamid };
        }

        for (let i = 0; i < this.teaminfo.length; i++) {
            const t = this.teaminfo[i];
            if (t.vacancy > 0) {
                t.vacancy -= 1;
                return { teamid: i };
            }
        }
        return { error: "No teams available" };
    }

    getTeamInfo(): TeamInfo[] {
        return this.teaminfo;
    }

    setDeadline(deadline: number): void {
        this.deadline = deadline;
    }

    getDeadline(): number {
        return this.deadline;
    }

    getRoomSlug(): string {
        return this.room_slug;
    }

    removeSpectator(user: { shortid: string }): void {
        if (Array.isArray(this.spectators))
            this.spectators = this.spectators.filter((id) => id !== user.shortid);
    }

    addSpectator(user: { shortid: string }): void {
        if (!this.spectators.includes(user.shortid))
            this.spectators.push(user.shortid);
    }

    setSettings(settings: typeof GameSettingsManager): void {
        this.gsm = settings;
        this.createTeamsBySize();
    }

    isFull(): boolean {
        const gameSettings = this.gsm.get();
        const gamestate = this.getGameState();
        const players = gamestate?.players || [];
        const maxplayers = gameSettings?.maxplayers || 0;
        return players.length >= maxplayers;
    }

    hasPlayer(shortid: string): number | undefined {
        const gamestate = this.getGameState();
        return gamestate?.room?._players[shortid];
    }

    copyGameState(): GameState {
        return cloneObj(this.getGameState());
    }

    getAllStatus(): string[] {
        return this.statusList;
    }

    statusById(id: number): string {
        return this.statusList[id];
    }

    statusByName(name: string): number {
        return this.statusMap[name];
    }

    isGameOver(): boolean {
        return (
            this.status === this.statusByName("gameover") ||
            this.status === this.statusByName("gamecancelled") ||
            this.status === this.statusByName("gameerror")
        );
    }

    isPregame(): boolean {
        return this.status === this.statusByName("pregame");
    }

    isGameStart(): boolean {
        return this.status === this.statusByName("gamestart");
    }
}

export default Room;
