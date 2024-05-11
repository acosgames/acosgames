// class ACOSG {
// let userActions: Action[];
// let originalState: GameState;
var gameState;
var currentAction;
// let isNewGame: boolean;
var defaultSeconds;
var kickedPlayers;
const init = () => {
    // try {
    //     userActions = JSON.parse(JSON.stringify(actions()));
    // } catch (e) {
    //     error("Failed to load actions");
    //     return;
    // }
    // try {
    //     originalState = JSON.parse(JSON.stringify(game()));
    // } catch (e) {
    //     error("Failed to load originalState");
    //     return;
    // }
    try {
        gameState = JSON.parse(JSON.stringify(game()));
    }
    catch (e) {
        error("Failed to load gameState");
        return;
    }
    currentAction = null;
    // isNewGame = false;
    // markedForDelete = false;
    // defaultSeconds = 15;
    // nextTimeLimit = -1;
    kickedPlayers = [];
};
const on = (type, cb) => {
    // if (type == 'newgame') {
    //     //if (isNewGame) {
    //     currentAction = actions[0];
    //     if (currentAction.type == '')
    //         cb(actions[0]);
    //     isNewGame = false;
    //     //}
    //     return;
    // }
    let userActions = actions();
    for (var i = 0; i < userActions.length; i++) {
        if (userActions[i].type == type) {
            currentAction = userActions[i];
            let result = cb(currentAction);
            if (typeof result == "boolean" && !result) {
                ignore();
                break;
            }
        }
    }
};
// function ignore(): void {
//     ignore();
// }
const setGame = (game) => {
    for (var id in gameState.players) {
        let player = gameState.players[id];
        game.players[id] = player;
    }
    gameState = game;
};
const commit = () => {
    // if (kickedPlayers.length > 0)
    //     gameState.kick = kickedPlayers;
    save(gameState);
};
const gameover = (payload) => {
    event("gameover", payload);
};
const log = (...msg) => {
    gamelog(...msg);
};
const error = (...msg) => {
    gameerror(...msg);
};
const kickPlayer = (id) => {
    kickedPlayers.push(id);
};
// const random():number {
//     return random();
// }
const randomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
};
// const database(): any {
//     return database();
// }
const action = () => {
    return currentAction;
};
const gamestate = () => {
    return gameState;
};
const room = (key, value) => {
    if (typeof key === "undefined")
        return gameState.room;
    if (typeof value === "undefined")
        return gameState.room[key];
    gameState.room[key] = value;
    return value;
};
const state = (key, value) => {
    if (typeof key === "undefined")
        return gameState.state;
    if (typeof value === "undefined")
        return gameState.state[key];
    gameState.state[key] = value;
    return value;
};
const playerList = () => {
    return Object.keys(gameState.players);
};
const playerCount = () => {
    return Object.keys(gameState.players).length;
};
const players = (userid, value) => {
    if (typeof userid === "undefined")
        return gameState.players;
    if (typeof value === "undefined")
        return gameState.players[userid];
    gameState.players[userid] = value;
    return value;
};
const teams = (teamid, value) => {
    if (typeof teamid === "undefined")
        return gameState.teams;
    if (typeof value === "undefined")
        return gameState.teams[teamid];
    gameState.teams[teamid] = value;
};
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
const next = (obj) => {
    if (typeof obj === "object") {
        gameState.next = obj;
    }
    return gameState.next;
};
const setTimelimit = (seconds) => {
    seconds = seconds || 15;
    if (!gameState.timer)
        gameState.timer = {};
    gameState.timer.set = seconds; //Math.min(60, Math.max(10, seconds));
};
const reachedTimelimit = (action) => {
    if (typeof action.timeleft == "undefined")
        return false;
    return action.timeleft <= 0;
};
const event = (name, payload) => {
    if (!payload)
        return gameState.events[name];
    gameState.events[name] = payload || {};
};
const clearEvents = () => {
    gameState.events = {};
};
// events(name) {
//     if (typeof name === 'undefined')
//         return gameState.events;
//     gameState.events.push(name);
// }
// }
export default {
    log: log,
    error: error,
    init: init,
    on: on,
    setGame: setGame,
    commit: commit,
    gameover: gameover,
    kickPlayer: kickPlayer,
    randomInt: randomInt,
    action: action,
    gamestate: gamestate,
    room: room,
    state: state,
    playerList: playerList,
    playerCount: playerCount,
    players: players,
    teams: teams,
    next: next,
    setTimelimit: setTimelimit,
    reachedTimelimit: reachedTimelimit,
    event: event,
    clearEvents: clearEvents,
};
// export default new ACOSG();
