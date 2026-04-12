// import { EGameStatus } from "./defs";

import { GameStateReader, gs } from "./gamestate";

declare global {
    var gamelog: (...msg: any[]) => void;
    var gameerror: (...msg: any[]) => void;
    var commit: (gamestate: GameState) => void;
    var random: () => number;
    var game: () => GameState;
    var actions: () => Action[];
    var killGame: () => void;
    var database: () => any;
    var ignore: () => void;
}

class ACOSServer {
    gameState: GameState | null = null
    currentAction: Action | null = null;
    defaultSeconds: number = 300;
    kickedPlayers: string[] = [];

    private requireGameState = (): GameState => {
        if (!this.gameState) {
            throw new Error("Game state is not initialized");
        }
        return this.gameState;
    };

    init = () => {
        try {
            this.gameState = game();
        } catch (e) {
            this.error("Failed to load gameState");
            return;
        }

        this.currentAction = null;
        this.kickedPlayers = [];
    };

    on = (type: string, cb: (action: Action) => boolean): void => {
        let userActions = actions();
        for (var i = 0; i < userActions.length; i++) {
            if (userActions[i].type == type) {
                this.currentAction = userActions[i];
                let result = cb(this.currentAction);
                if (typeof result == "boolean" && !result) {
                    ignore();
                    break;
                }
            }
        }
    };

    ignore(): void {
        ignore();
    }

    setGame = (game: GameState): void => {
        const currentGame = this.requireGameState();
        game.players = currentGame.players.slice();
        this.gameState = game;
    };

    commit = (): void => {
        commit(this.requireGameState());
    };

    gameerror = (payload: any): void => {
        gameerror("[Error]:", payload);
        this.events(
            "gameerror",
            typeof payload === "undefined" ? true : payload
        );
    };
    gamecancelled = (payload: any): void => {
        this.events(
            "gamecancelled",
            typeof payload === "undefined" ? true : payload
        );
    };
    gameover = (payload: any): void => {
        this.events(
            "gameover",
            typeof payload === "undefined" ? true : payload
        );
    };

    log = (...msg: any[]): void => {
        gamelog(...msg);
    };
    error = (...msg: any[]): void => {
        gameerror(...msg);
    };

    kickPlayer = (id: string): void => {
        this.kickedPlayers.push(id);
    };

    random(): number {
        return random();
    }

    randomInt = (min: number, max: number): number => {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(random() * (max - min) + min);
    };

    database(): any {
        return database();
    }

    action = (): Action | null => {
        return this.currentAction;
    };

    gamestate = (): GameStateReader | null => {
        return gs(this.gameState);
    };

    room(): Room;
    room(key: string): any;
    room(key: string, value: string | number): any;
    room(key?: string, value?: string | number): any {
        const gameState = this.requireGameState();
        if (typeof key === "undefined") return gameState.room;
        const room = gameState.room as Record<string, any>;
        if (typeof value === "undefined") return room[key];

        room[key] = value;
        return value;
    }
    newState(s: State): void {
        this.requireGameState().state = s;
    }
    state(): State;
    state(key: string): any;
    state(key: string, value: any): any;
    state(key?: string, value?: any): any {
        const state = this.requireGameState().state as Record<string, any>;
        if (typeof key === "undefined") return state;
        if (typeof value === "undefined") return state[key];

        state[key] = value;
        return value;
    }

    players(): Players;
    players(index: number): Player;
    players(index: number, value: Player): Player;
    players(index?: number, value?: Player): any {
        const players = this.requireGameState().players;
        if (typeof index === "undefined") return players;
        if (typeof value === "undefined") return players[index];
        players[index] = value;
        return value;
    }

    playerByShortid = (shortid: string): Player | undefined => {
        let playerid = this.room()._players[shortid];
        return this.players(playerid);
    };

    playerIndex = (shortid: string): number => {
        let playerid = this.room()._players[shortid];
        return playerid !== undefined ? playerid : -1;
    };

    /**
     * Increment a numeric player stat by 1 using the abbreviation defined in game-settings.json
     *
     * @param {string} shortid
     * @param {string} abbreviation
     */
    statIncrement(shortid: string, abbreviation: string): number;
    /**
     * Increment by a specific number for a numeric player stat using the abbreviation defined in game-settings.json
     *
     * @param {string} shortid
     * @param {string} abbreviation
     */
    statIncrement(shortid: string, abbreviation: string, value: number): number;
    statIncrement(
        shortid: string,
        abbreviation: string,
        value?: number
    ): number {
        let player = this.playerByShortid(shortid);
        if (!player) throw new Error(`Player not found: ${shortid}`);
        if (typeof player.stats === "undefined") {
            player.stats = {};
        }

        value = value || 1;
        if (typeof player.stats[abbreviation] === "undefined")
            player.stats[abbreviation] = value;
        else
            player.stats[abbreviation] =
                (player.stats[abbreviation] as number) + value;
        return player.stats[abbreviation] as number;
    }

    /**
     * Get a player stat using the abbreviation defined in game-settings.json
     *
     * @param {string} shortid
     * @param {string} abbreviation
     */
    stats(shortid: string, abbreviation: string): number | StatString;
    /**
     * Set a player stat using the abbreviation defined in game-settings.json
     *
     * String values will be added to an object and incremented.  To edit the string count, use stats(shortid, abbreviation) and set the value directly.
     *
     * @param {string} shortid
     * @param {string} abbreviation
     * @param {number | string} value
     */
    stats(
        shortid: string,
        abbreviation: string,
        value: number | string
    ): number | StatString;
    stats(
        shortid: string,
        abbreviation: string,
        value?: number | string
    ): number | StatString {
        let player = this.playerByShortid(shortid);
        if (!player) throw new Error(`Player not found: ${shortid}`);
        if (typeof player.stats === "undefined") {
            player.stats = {};
        }
        if (typeof value === "undefined") return player.stats[abbreviation];
        if (typeof value == "string") {
            let obj = player.stats[abbreviation] as StatString;
            if (!obj) obj = {};
            if (value in obj) obj[value] += 1;
            else obj[value] = 1;
            player.stats[abbreviation] = obj;
        } else player.stats[abbreviation] = value;
        return player.stats[abbreviation];
    }

    playerList = (): string[] => this.requireGameState().players.map(p => p.shortid);
    playerCount = (): number => this.requireGameState().players.length;

    teams(): Teams;
    teams(team_slug: string): Team | undefined;
    teams(team_slug: string, value: Team): Team;
    teams(team_slug?: string, value?: Team): any {
        const gameState = this.requireGameState();
        const room = gameState.room;
        if (!gameState.teams) gameState.teams = [] as Teams;
        if (typeof team_slug === "undefined") return gameState.teams;
        const idx = room._teams[team_slug];
        if (typeof value === "undefined")
            return gameState.teams[ idx ];

        if (idx >= 0) gameState.teams[idx] = value;
        else gameState.teams.push(value);
        return value;
    }

    teamBySlug = (team_slug: string): Team | undefined => {
        let team = this.room()._teams[team_slug];
        return team !== undefined ? this.teams(team_slug) : undefined;
    };

    teamByIndex = (teamid: number): Team | undefined => {
        let teams = this.teams();
        return teams[teamid];
    };

    nextPlayer(): NextID | undefined;
    nextPlayer(id: NextID, action: NextAction): NextID | undefined;
    nextPlayer(id?: NextID, action?: NextAction): NextID | undefined {
        const room = this.requireGameState().room;
        if (typeof id === "undefined") {
            return room.next_player;
        }
        if (typeof action === "undefined") {
            room.next_player = id;
            return room.next_player;
        }

        room.next_player = id;
        room.next_action = action;
        return room.next_player;
    }

    nextTeam(): NextID | undefined;
    nextTeam(id: NextID, action: NextAction): NextID | undefined;
    nextTeam(id?: NextID, action?: NextAction): NextID | undefined {
        const room = this.requireGameState().room;
        if (typeof id === "undefined") {
            return room.next_team;
        }
        if (typeof action === "undefined") {
            room.next_team = id;
            return room.next_team;
        }

        room.next_team = id;
        room.next_action = action;
        return room.next_team;
    }

    timer(): Timer {
        const room = this.requireGameState().room;
        return {
            seconds: room.timesec,
            end: room.timeend,
        };
    }

    setTimer = (seconds: number): void => {
        seconds = seconds || 15;
        this.requireGameState().room.timeset = seconds;
    };

    reachedTimelimit = (action: Action): boolean => {
        if (typeof action.timeleft == "undefined") return false;
        return action.timeleft <= 0;
    };

    events(): ACOSEvents;
    events(name: string): ACOSEvent | undefined;
    events(name: string, payload: any): ACOSEvent | undefined;
    events(name?: string, payload?: any): ACOSEvent | ACOSEvents | undefined {
        const room = this.requireGameState().room;
        if (typeof name === "undefined")
            return room.events as ACOSEvents;
        if (typeof payload === "undefined")
            return room.events.find(e => e.type == name);

        if (!room.events) room.events = [];
        room.events.push({ type: name, payload });
        return room.events.find(e => e.type == name);
    }

    clearEvents = (): void => {
        this.requireGameState().room.events = [];
    };
}

export default new ACOSServer();
