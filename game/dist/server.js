class ACOSServer {
    constructor() {
        this.init = () => {
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
                this.gameState = JSON.parse(JSON.stringify(game()));
            }
            catch (e) {
                this.error("Failed to load gameState");
                return;
            }
            this.currentAction = null;
            // isNewGame = false;
            // markedForDelete = false;
            // defaultSeconds = 15;
            // nextTimeLimit = -1;
            this.kickedPlayers = [];
        };
        this.on = (type, cb) => {
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
                    this.currentAction = userActions[i];
                    let result = cb(this.currentAction);
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
        this.setGame = (game) => {
            for (var id in this.gameState.players) {
                let player = this.gameState.players[id];
                game.players[id] = player;
            }
            this.gameState = game;
        };
        this.commit = () => {
            // if (kickedPlayers.length > 0)
            //     gameState.kick = kickedPlayers;
            save(this.gameState);
        };
        this.gameover = (payload) => {
            this.event("gameover", payload);
        };
        this.log = (...msg) => {
            gamelog(...msg);
        };
        this.error = (...msg) => {
            gameerror(...msg);
        };
        this.kickPlayer = (id) => {
            this.kickedPlayers.push(id);
        };
        // const random():number {
        //     return random();
        // }
        this.randomInt = (min, max) => {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
        };
        // const database(): any {
        //     return database();
        // }
        this.action = () => {
            return this.currentAction;
        };
        this.gamestate = () => {
            return this.gameState;
        };
        this.room = (key, value) => {
            if (typeof key === "undefined")
                return this.gameState.room;
            if (typeof value === "undefined")
                return this.gameState.room[key];
            this.gameState.room[key] = value;
            return value;
        };
        this.state = (key, value) => {
            if (typeof key === "undefined")
                return this.gameState.state;
            if (typeof value === "undefined")
                return this.gameState.state[key];
            this.gameState.state[key] = value;
            return value;
        };
        this.playerList = () => {
            return Object.keys(this.gameState.players);
        };
        this.playerCount = () => {
            return Object.keys(this.gameState.players).length;
        };
        this.players = (userid, value) => {
            if (typeof userid === "undefined")
                return this.gameState.players;
            if (typeof value === "undefined")
                return this.gameState.players[userid];
            this.gameState.players[userid] = value;
            return value;
        };
        this.teams = (teamid, value) => {
            if (typeof teamid === "undefined")
                return this.gameState.teams;
            if (typeof value === "undefined")
                return this.gameState.teams[teamid];
            this.gameState.teams[teamid] = value;
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
        this.next = (obj) => {
            if (typeof obj === "object") {
                this.gameState.next = obj;
            }
            return this.gameState.next;
        };
        this.setTimelimit = (seconds) => {
            seconds = seconds || 15;
            if (!this.gameState.timer)
                this.gameState.timer = {};
            this.gameState.timer.set = seconds; //Math.min(60, Math.max(10, seconds));
        };
        this.reachedTimelimit = (action) => {
            if (typeof action.timeleft == "undefined")
                return false;
            return action.timeleft <= 0;
        };
        this.event = (name, payload) => {
            if (!payload)
                return this.gameState.events[name];
            this.gameState.events[name] = payload || {};
        };
        this.clearEvents = () => {
            this.gameState.events = {};
        };
        // events(name) {
        //     if (typeof name === 'undefined')
        //         return gameState.events;
        //     gameState.events.push(name);
        // }
    }
}
// export default {
//     log: log,
//     error: error,
//     init: init,
//     on: on,
//     setGame: setGame,
//     commit: commit,
//     gameover: gameover,
//     kickPlayer: kickPlayer,
//     randomInt: randomInt,
//     action: action,
//     gamestate: gamestate,
//     room: room,
//     state: state,
//     playerList: playerList,
//     playerCount: playerCount,
//     players: players,
//     teams: teams,
//     next: next,
//     setTimelimit: setTimelimit,
//     reachedTimelimit: reachedTimelimit,
//     event: event,
//     clearEvents: clearEvents,
// };
export default new ACOSServer();
