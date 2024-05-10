interface GameState {
    state: { [key: string]: any };
    players: { [key: string]: any };
    teams: { [key: string]: any };
    next: { id: string | string[] };
    events: { [key: string]: any };
    timer: { [key: string]: any };
    room: { [key: string]: any };
}

interface Action {
    type: string;
    payload: any;
    user: {
        shortid: string;
        displayname: string;
        portraitid: number;
        countrycode: string;
    };
    timeleft: number;
    timeseq: number;
}

export declare var gamelog: (msg: any) => void;
export declare var gameerror: (msg: any) => void;
export declare var finish: (gamestate: GameState) => void;
export declare var random: () => number;
export declare var game: () => GameState;
export declare var actions: () => Action[];
export declare var killGame: () => void;
export declare var database: () => any;
export declare var ignore: () => void;

class ACOSServerClass {
    userActions: Action[];
    originalState: GameState;
    gameState: GameState;
    currentAction: Action | null;
    isNewGame: boolean;
    defaultSeconds: number;
    kickedPlayers: string[];

    constructor() {
        try {
            this.userActions = JSON.parse(JSON.stringify(actions()));
        } catch (e) {
            this.error("Failed to load actions");
            return;
        }
        try {
            this.originalState = JSON.parse(JSON.stringify(game()));
        } catch (e) {
            this.error("Failed to load originalState");
            return;
        }
        try {
            this.gameState = JSON.parse(JSON.stringify(game()));
        } catch (e) {
            this.error("Failed to load gameState");
            return;
        }

        this.currentAction = null;

        this.isNewGame = false;
        // markedForDelete = false;
        this.defaultSeconds = 15;
        // nextTimeLimit = -1;
        this.kickedPlayers = [];

        // if (!gameState || !gameState.rules || Object.keys(gameState.rules).length == 0) {
        //     isNewGame = true;
        //     error('Missing Rules');
        // }

        if (this.gameState) {
            // if (!('timer' in gameState)) {
            //     gameState.timer = {};
            // }
            // if (!('state' in gameState)) {
            //     gameState.state = {};
            // }

            // if (!('players' in gameState)) {
            //     gameState.players = {};
            // }

            //if (!('prev' in gameState)) {
            // gameState.prev = {};
            //}

            // if (!('next' in gameState)) {
            //     gameState.next = {};
            // }

            // if (!('rules' in gameState)) {
            //     gameState.rules = {};
            // }

            this.gameState.events = {};
        }
    }

    on(type: string, cb: (action: Action) => boolean): void {
        // if (type == 'newgame') {
        //     //if (isNewGame) {
        //     currentAction = actions[0];
        //     if (currentAction.type == '')
        //         cb(actions[0]);
        //     isNewGame = false;
        //     //}

        //     return;
        // }

        for (var i = 0; i < this.userActions.length; i++) {
            if (this.userActions[i].type == type) {
                this.currentAction = this.userActions[i];
                let result = cb(this.currentAction);
                if (typeof result == "boolean" && !result) {
                    ignore();
                    break;
                }
            }
        }
    }

    //  ignore(): void {
    //     ignore();
    // }

    setGame(game: GameState): void {
        for (var id in this.gameState.players) {
            let player = this.gameState.players[id];
            game.players[id] = player;
        }
        this.gameState = game;
    }

    submit(): void {
        // if (kickedPlayers.length > 0)
        //     gameState.kick = kickedPlayers;

        finish(this.gameState);
    }

    gameover(payload: any): void {
        this.event("gameover", payload);
    }

    log(msg: string): void {
        gamelog(msg);
    }
    error(msg: string): void {
        gameerror(msg);
    }

    kickPlayer(id: string): void {
        this.kickedPlayers.push(id);
    }

    //  random():number {
    //     return random();
    // }

    randomInt(min, max): number {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
    }

    //  database(): any {
    //     return database();
    // }

    action(): Action | null {
        return this.currentAction;
    }

    gamestate(): GameState | null {
        return this.gameState;
    }

    room(key: string, value: string | number): any {
        if (typeof key === "undefined") return this.gameState.room;
        if (typeof value === "undefined") return this.gameState.room[key];

        this.gameState.room[key] = value;
        return value;
    }

    state(key: string, value: string | number): any {
        if (typeof key === "undefined") return this.gameState.state;
        if (typeof value === "undefined") return this.gameState.state[key];

        this.gameState.state[key] = value;
        return value;
    }

    playerList(): string[] {
        return Object.keys(this.gameState.players);
    }
    playerCount(): number {
        return Object.keys(this.gameState.players).length;
    }

    players(userid: string, value: any): any {
        if (typeof userid === "undefined") return this.gameState.players;
        if (typeof value === "undefined") return this.gameState.players[userid];

        this.gameState.players[userid] = value;
        return value;
    }

    teams(teamid: string, value: any): any {
        if (typeof teamid === "undefined") return this.gameState.teams;
        if (typeof value === "undefined") return this.gameState.teams[teamid];

        this.gameState.teams[teamid] = value;
    }

    // rules(rule, value) {
    //     if (typeof rule === 'undefined')
    //         return gameState.rules;
    //     if (typeof value === 'undefined')
    //         return gameState.rules[rule];

    //     gameState.rules[rule] = value;
    // }

    // prev(obj) {
    //     if (typeof obj === 'object') {
    //         gameState.prev = obj;
    //     }
    //     return gameState.prev;
    // }

    next(obj: { id: string | string[] }): {
        id: string | string[];
    } {
        if (typeof obj === "object") {
            this.gameState.next = obj;
        }
        return this.gameState.next;
    }

    setTimelimit(seconds: number): void {
        seconds = seconds || this.defaultSeconds;
        if (!this.gameState.timer) this.gameState.timer = {};
        this.gameState.timer.set = seconds; //Math.min(60, Math.max(10, seconds));
    }

    reachedTimelimit(action: Action): boolean {
        if (typeof action.timeleft == "undefined") return false;
        return action.timeleft <= 0;
    }

    event(name: string, payload: any): any | void {
        if (!payload) return this.gameState.events[name];

        this.gameState.events[name] = payload || {};
    }

    clearEvents(): void {
        this.gameState.events = {};
    }
    // events(name) {
    //     if (typeof name === 'undefined')
    //         return gameState.events;
    //     gameState.events.push(name);
    // }
}
// export default {
//     log,
//     error,
//     // finish,
//     // random,
//     // game,
//     // actions,
//     // killGame,
//     // database,
//     // ignore,
//     init,
//     on,
//     setGame,
//     submit,
//     gameover,
//     kickPlayer,
//     randomInt,
//     action,
//     gamestate,
//     room,
//     state,
//     playerList,
//     playerCount,
//     players,
//     teams,
//     next,
//     setTimelimit,
//     reachedTimelimit,
//     event,
//     clearEvents,
// };

export default ACOSServerClass;
