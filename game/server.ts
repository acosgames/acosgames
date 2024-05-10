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

var global = {};

declare global {
    // interface Global {
    var gamelog: (...msg: any[]) => void;
    var gameerror: (...msg: any[]) => void;
    var finish: (gamestate: GameState) => void;
    var random: () => number;
    var game: () => GameState;
    var actions: () => Action[];
    var killGame: () => void;
    var database: () => any;
    var ignore: () => void;
    // }
}

// declare var global.gamelog: (...msg: any[]) => void;
// declare var global.gameerror: (...msg: any[]) => void;
// declare var global.finish: (gamestate: GameState) => void;
// declare var global.random: () => number;
// declare var global.game: () => GameState;
// declare var global.actions: () => Action[];
// declare var killGame: () => void;
// declare var database: () => any;
// declare var global.ignore: () => void;

// class ACOSG {
let userActions: Action[];
let originalState: GameState;
let gameState: GameState;
let currentAction: Action | null;
let isNewGame: boolean;
let defaultSeconds: number;
let kickedPlayers: string[];

function init() {
    try {
        userActions = JSON.parse(JSON.stringify(global.actions()));
    } catch (e) {
        error("Failed to load actions");
        return;
    }
    try {
        originalState = JSON.parse(JSON.stringify(global.game()));
    } catch (e) {
        error("Failed to load originalState");
        return;
    }
    try {
        gameState = JSON.parse(JSON.stringify(global.game()));
    } catch (e) {
        error("Failed to load gameState");
        return;
    }

    currentAction = null;

    isNewGame = false;
    // markedForDelete = false;
    defaultSeconds = 15;
    // nextTimeLimit = -1;
    kickedPlayers = [];

    // if (!gameState || !gameState.rules || Object.keys(gameState.rules).length == 0) {
    //     isNewGame = true;
    //     error('Missing Rules');
    // }

    if (gameState) {
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

        gameState.events = {};
    }
}

function on(type: string, cb: (action: Action) => boolean): void {
    // if (type == 'newgame') {
    //     //if (isNewGame) {
    //     currentAction = actions[0];
    //     if (currentAction.type == '')
    //         cb(actions[0]);
    //     isNewGame = false;
    //     //}

    //     return;
    // }

    for (var i = 0; i < userActions.length; i++) {
        if (userActions[i].type == type) {
            currentAction = userActions[i];
            let result = cb(currentAction);
            if (typeof result == "boolean" && !result) {
                global.ignore();
                break;
            }
        }
    }
}

// function ignore(): void {
//     ignore();
// }

function setGame(game: GameState): void {
    for (var id in gameState.players) {
        let player = gameState.players[id];
        game.players[id] = player;
    }
    gameState = game;
}

function submit(): void {
    // if (kickedPlayers.length > 0)
    //     gameState.kick = kickedPlayers;

    global.finish(gameState);
}

function gameover(payload: any): void {
    event("gameover", payload);
}

function output(...msg: any[]): void {
    global.gamelog(...msg);
}
function error(...msg: any[]): void {
    global.gameerror(...msg);
}

function kickPlayer(id: string): void {
    kickedPlayers.push(id);
}

// function random():number {
//     return random();
// }

function randomInt(min, max): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(global.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

// function database(): any {
//     return database();
// }

function action(): Action | null {
    return currentAction;
}

function gamestate(): GameState | null {
    return gameState;
}

function room(key: string, value: string | number): any {
    if (typeof key === "undefined") return gameState.room;
    if (typeof value === "undefined") return gameState.room[key];

    gameState.room[key] = value;
    return value;
}

function state(key: string, value: string | number): any {
    if (typeof key === "undefined") return gameState.state;
    if (typeof value === "undefined") return gameState.state[key];

    gameState.state[key] = value;
    return value;
}

function playerList(): string[] {
    return Object.keys(gameState.players);
}
function playerCount(): number {
    return Object.keys(gameState.players).length;
}

function players(userid: string, value: any): any {
    if (typeof userid === "undefined") return gameState.players;
    if (typeof value === "undefined") return gameState.players[userid];

    gameState.players[userid] = value;
    return value;
}

function teams(teamid: string, value: any): any {
    if (typeof teamid === "undefined") return gameState.teams;
    if (typeof value === "undefined") return gameState.teams[teamid];

    gameState.teams[teamid] = value;
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

function next(obj: { id: string | string[] }): {
    id: string | string[];
} {
    if (typeof obj === "object") {
        gameState.next = obj;
    }
    return gameState.next;
}

function setTimelimit(seconds: number): void {
    seconds = seconds || defaultSeconds;
    if (!gameState.timer) gameState.timer = {};
    gameState.timer.set = seconds; //Math.min(60, Math.max(10, seconds));
}

function reachedTimelimit(action: Action): boolean {
    if (typeof action.timeleft == "undefined") return false;
    return action.timeleft <= 0;
}

function event(name: string, payload: any): any | void {
    if (!payload) return gameState.events[name];

    gameState.events[name] = payload || {};
}

function clearEvents(): void {
    gameState.events = {};
}
// events(name) {
//     if (typeof name === 'undefined')
//         return gameState.events;
//     gameState.events.push(name);
// }
// }
export default {
    output,
    error,
    init,
    on,
    setGame,
    submit,
    gameover,
    kickPlayer,
    randomInt,
    action,
    gamestate,
    room,
    state,
    playerList,
    playerCount,
    players,
    teams,
    next,
    setTimelimit,
    reachedTimelimit,
    event,
    clearEvents,
};

// export default new ACOSG();
