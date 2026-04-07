// import { EGameStatus } from "./defs";
class ACOSServer {
    constructor() {
        this.gameState = null;
        this.currentAction = null;
        this.defaultSeconds = 300;
        this.kickedPlayers = [];
        this.requireGameState = () => {
            if (!this.gameState) {
                throw new Error("Game state is not initialized");
            }
            return this.gameState;
        };
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
            const currentGame = this.requireGameState();
            game.players = currentGame.players.slice();
            this.gameState = game;
        };
        this.save = () => {
            save(this.requireGameState());
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
        this.playerByShortid = (shortid) => {
            let playerid = this.room()._players[shortid];
            return this.players(playerid);
        };
        this.playerIndex = (shortid) => {
            let playerid = this.room()._players[shortid];
            return playerid !== undefined ? playerid : -1;
        };
        this.playerList = () => this.requireGameState().players.map(p => p.shortid);
        this.playerCount = () => this.requireGameState().players.length;
        this.teamBySlug = (team_slug) => {
            let team = this.room()._teams[team_slug];
            return team !== undefined ? this.teams(team_slug) : undefined;
        };
        this.teamByIndex = (teamid) => {
            let teams = this.teams();
            return teams[teamid];
        };
        this.setTimer = (seconds) => {
            seconds = seconds || 15;
            this.requireGameState().room.timeset = seconds;
        };
        this.reachedTimelimit = (action) => {
            if (typeof action.timeleft == "undefined")
                return false;
            return action.timeleft <= 0;
        };
        this.clearEvents = () => {
            this.requireGameState().room.events = [];
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
        const gameState = this.requireGameState();
        if (typeof key === "undefined")
            return gameState.room;
        const room = gameState.room;
        if (typeof value === "undefined")
            return room[key];
        room[key] = value;
        return value;
    }
    newState(s) {
        this.requireGameState().state = s;
    }
    state(key, value) {
        const state = this.requireGameState().state;
        if (typeof key === "undefined")
            return state;
        if (typeof value === "undefined")
            return state[key];
        state[key] = value;
        return value;
    }
    players(index, value) {
        const players = this.requireGameState().players;
        if (typeof index === "undefined")
            return players;
        if (typeof value === "undefined")
            return players[index];
        players[index] = value;
        return value;
    }
    statIncrement(shortid, abbreviation, value) {
        let player = this.playerByShortid(shortid);
        if (!player)
            throw new Error(`Player not found: ${shortid}`);
        if (typeof player.stats === "undefined") {
            player.stats = {};
        }
        value = value || 1;
        if (typeof player.stats[abbreviation] === "undefined")
            player.stats[abbreviation] = value;
        else
            player.stats[abbreviation] =
                player.stats[abbreviation] + value;
        return player.stats[abbreviation];
    }
    stats(shortid, abbreviation, value) {
        let player = this.playerByShortid(shortid);
        if (!player)
            throw new Error(`Player not found: ${shortid}`);
        if (typeof player.stats === "undefined") {
            player.stats = {};
        }
        if (typeof value === "undefined")
            return player.stats[abbreviation];
        if (typeof value == "string") {
            let obj = player.stats[abbreviation];
            if (!obj)
                obj = {};
            if (value in obj)
                obj[value] += 1;
            else
                obj[value] = 1;
            player.stats[abbreviation] = obj;
        }
        else
            player.stats[abbreviation] = value;
        return player.stats[abbreviation];
    }
    teams(team_slug, value) {
        const gameState = this.requireGameState();
        const room = gameState.room;
        if (!gameState.teams)
            gameState.teams = [];
        if (typeof team_slug === "undefined")
            return gameState.teams;
        const idx = room._teams[team_slug];
        if (typeof value === "undefined")
            return gameState.teams[idx];
        if (idx >= 0)
            gameState.teams[idx] = value;
        else
            gameState.teams.push(value);
        return value;
    }
    nextPlayer(id, action) {
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
    nextTeam(id, action) {
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
    timer() {
        const room = this.requireGameState().room;
        return {
            seconds: room.timesec,
            end: room.timeend,
        };
    }
    events(name, payload) {
        const room = this.requireGameState().room;
        if (typeof name === "undefined")
            return room.events;
        if (typeof payload === "undefined")
            return room.events.find(e => e.type == name);
        if (!room.events)
            room.events = [];
        room.events.push({ type: name, payload });
        return room.events.find(e => e.type == name);
    }
}
export default new ACOSServer();
//# sourceMappingURL=server.js.map