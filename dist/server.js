class ACOSServer {
    constructor() {
        this.init = () => {
            try {
                this.gameState = JSON.parse(JSON.stringify(game()));
            }
            catch (e) {
                this.error("Failed to load gameState");
                return;
            }
            this.currentAction = null;
            this.kickedPlayers = [];
        };
        this.on = (type, cb) => {
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
        this.setGame = (game) => {
            for (var id in this.gameState.players) {
                let player = this.gameState.players[id];
                game.players[id] = player;
            }
            this.gameState = game;
        };
        this.commit = () => {
            save(this.gameState);
        };
        this.gameerror = (payload) => {
            gameerror("[Error]:", payload);
            this.events("gameerror", typeof payload === "undefined" ? true : payload);
        };
        this.gamecancelled = (payload) => {
            this.events("gamecancelled", typeof payload === "undefined" ? true : payload);
        };
        this.gameover = (payload) => {
            this.events("gameover", typeof payload === "undefined" ? true : payload);
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
        this.randomInt = (min, max) => {
            min = Math.ceil(min);
            max = Math.floor(max);
            return Math.floor(random() * (max - min) + min);
        };
        this.action = () => {
            return this.currentAction;
        };
        this.gamestate = () => {
            return this.gameState;
        };
        this.playerList = () => Object.keys(this.gameState.players);
        this.playerCount = () => Object.keys(this.gameState.players).length;
        this.setTimer = (seconds) => {
            seconds = seconds || 15;
            this.gameState.timer.set = seconds;
        };
        this.reachedTimelimit = (action) => {
            if (typeof action.timeleft == "undefined")
                return false;
            return action.timeleft <= 0;
        };
        this.clearEvents = () => {
            this.gameState.events = {};
        };
    }
    ignore() {
        ignore();
    }
    random() {
        return random();
    }
    database() {
        return database();
    }
    room(key, value) {
        if (typeof key === "undefined")
            return this.gameState.room;
        if (typeof value === "undefined")
            return this.gameState.room[key];
        this.gameState.room[key] = value;
        return value;
    }
    state(key, value) {
        if (typeof key === "undefined")
            return this.gameState.state;
        if (typeof value === "undefined")
            return this.gameState.state[key];
        this.gameState.state[key] = value;
        return value;
    }
    players(shortid, value) {
        if (typeof shortid === "undefined")
            return this.gameState.players;
        if (typeof value === "undefined")
            return this.gameState.players[shortid];
        this.gameState.players[shortid] = value;
        return value;
    }
    stats(shortid, abbreviation, value) {
        let player = this.players(shortid);
        if (typeof value === "undefined")
            return player.stats[abbreviation];
        player.stats[abbreviation] = value;
        return player.stats[abbreviation];
    }
    teams(teamid, value) {
        if (typeof teamid === "undefined")
            return this.gameState.teams;
        if (typeof value === "undefined")
            return this.gameState.teams[teamid];
        this.gameState.teams[teamid] = value;
    }
    next(id, action) {
        if (typeof id !== "undefined") {
            this.gameState.next = { id, action };
        }
        return this.gameState.next;
    }
    timer() {
        return this.gameState.timer;
    }
    events(name, payload) {
        if (typeof name === "undefined")
            return this.gameState.events;
        if (typeof payload === "undefined")
            return this.gameState.events[name];
        this.gameState.events[name] = payload;
        return this.gameState.events[name];
    }
}
export default new ACOSServer();
