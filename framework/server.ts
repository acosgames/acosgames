import { EGameStatus } from "./defs";

declare global {
    var gamelog: (...msg: any[]) => void;
    var gameerror: (...msg: any[]) => void;
    var save: (gamestate: GameState) => void;
    var random: () => number;
    var game: () => GameState;
    var actions: () => Action[];
    var killGame: () => void;
    var database: () => any;
    var ignore: () => void;
}

class ACOSServer {
    gameState: GameState;
    currentAction: Action | null;
    defaultSeconds: number;
    kickedPlayers: string[];

    init = () => {
        try {
            this.gameState = JSON.parse(JSON.stringify(game()));
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
        for (var id in this.gameState.players) {
            let player = this.gameState.players[id];
            game.players[id] = player;
        }
        this.gameState = game;
    };

    save = (): void => {
        save(this.gameState);
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

    randomInt = (min, max): number => {
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

    gamestate = (): GameState | null => {
        return this.gameState;
    };

    room(): Room;
    room(key: string): any;
    room(key: string, value: string | number): any;
    room(key?: string, value?: string | number): any {
        if (typeof key === "undefined") return this.gameState.room;
        if (typeof value === "undefined") return this.gameState.room[key];

        this.gameState.room[key] = value;
        return value;
    }

    state(): State;
    state(key: string): any;
    state(key: string, value: any): any;
    state(key?: string, value?: any): any {
        if (typeof key === "undefined") return this.gameState.state;
        if (typeof value === "undefined") return this.gameState.state[key];

        this.gameState.state[key] = value;
        return value;
    }

    players(): Players;
    players(shortid: string): Player;
    players(shortid: string, value: any): any;
    players(shortid?: string, value?: any): any {
        if (typeof shortid === "undefined") return this.gameState.players;
        if (typeof value === "undefined")
            return this.gameState.players[shortid];

        this.gameState.players[shortid] = value;
        return value;
    }

    stats(shortid: string, abbreviation: string): number | string;
    stats(
        shortid: string,
        abbreviation: string,
        value: number | string
    ): number | string;
    stats(
        shortid: string,
        abbreviation: string,
        value?: number | string
    ): number | string {
        let player = this.players(shortid);
        if (typeof value === "undefined") return player.stats[abbreviation];
        player.stats[abbreviation] = value;
        return player.stats[abbreviation];
    }

    playerList = (): string[] => Object.keys(this.gameState.players);
    playerCount = (): number => Object.keys(this.gameState.players).length;

    teams(): Teams;
    teams(teamid: string): Team;
    teams(teamid: string, value: any): any;
    teams(teamid?: string, value?: any): any {
        if (typeof teamid === "undefined") return this.gameState.teams;
        if (typeof value === "undefined") return this.gameState.teams[teamid];

        this.gameState.teams[teamid] = value;
    }

    next(): Next;
    next(id: string, action: string | string[]): Next;
    next(id?: string, action?: string | string[]): Next {
        if (typeof id !== "undefined") {
            this.gameState.next = { id, action };
        }
        return this.gameState.next;
    }

    timer(): Timer {
        return this.gameState.timer;
    }

    setTimer = (seconds: number): void => {
        seconds = seconds || 15;
        this.gameState.timer.set = seconds;
    };

    reachedTimelimit = (action: Action): boolean => {
        if (typeof action.timeleft == "undefined") return false;
        return action.timeleft <= 0;
    };

    events(): Events;
    events(name: string): any;
    events(name: string, payload: any): Events | any;
    events(name?: string, payload?: any): Events | any {
        if (typeof name === "undefined") return this.gameState.events as Events;
        if (typeof payload === "undefined")
            return this.gameState.events[name] as any;

        this.gameState.events[name] = payload;
        return this.gameState.events[name] as any;
    }

    clearEvents = (): void => {
        this.gameState.events = {};
    };
}

export default new ACOSServer();
