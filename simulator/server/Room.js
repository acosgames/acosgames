const NANOID = require("nanoid");
const GameSettingsManager = require("./GameSettingsManager");
const { cloneObj } = require("./util");
const nanoid = NANOID.customAlphabet("6789BCDFGHJKLMNPQRTW", 6);

class Room {
    constructor(settings) {


        this.statusList = [
            "none",
            "waiting",
            "pregame",
            "starting",
            "gamestart",
            "gameover",
            "gamecancelled",
            "gameerror",
        ]

        this.statusMap = {
            "none": 0,
            "waiting": 1,
            "pregame": 2,
            "starting": 3,
            "gamestart": 4,
            "gameover": 5,
            "gamecancelled": 6,
            "gameerror": 7,
        }

        this.room_slug = nanoid(8);
        this.status = 2;
        this.sequence = 0;
        this.starttime = Date.now();
        this.endtime = 0;
        this.spectators = [];
        this.history = [];
        this.gamestate = 0;
        this.gsm = GameSettingsManager; //game settings manager
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

    json() {
        return {
            room_slug: this.room_slug,
            status: this.status,
            _sequence: this._sequence,
            starttime: this.starttime,
            // endtime: this.endtime,
        };
    }

    hasVacancy() {
        return this._sequence == 0 || (this.isPregame() && !this.isFull());
    }

    replayStats() {
        let gamestartIndex = this.getGameStartIndex();

        return {
            total: Math.max(0, this.history.length - gamestartIndex),
            position: Math.max(0, this.gamestate - gamestartIndex + 1),
        };
    }

    getGameState() {
        return this.history[this.gamestate];
    }

    getPrevGameState() {
        if (this.gamestate - 1 > 0) {
            return this.history[this.gamestate - 1];
        }
        return {};
    }

    jumpPrevState() {
        return this.jumpToState(this.gamestate - 1);
    }

    jumpNextState() {
        return this.jumpToState(this.gamestate + 1);
    }

    getGameStartIndex() {
        return 0;
        let gamestartIndex = -1;
        for (let i = 0; i < this.history.length; i++) {
            let hist = this.history[i];
            if (hist?.room?.status == "gamestart") {
                gamestartIndex = i;
                break;
            }
        }
        return gamestartIndex;
    }

    jumpToState(index) {
        let gamestartIndex = this.getGameStartIndex();

        if (index < gamestartIndex) index = gamestartIndex;

        if (index >= this.history.length) {
            index = this.history.length - 1;
        }

        let current = this.history[index];
        let prev = index - 1 < gamestartIndex ? {} : this.history[index - 1];
        this.updateGame(current, index);
        this.gamestate = index; //overwwrite the gamestate index

        let now = Date.now();
        if (current?.room?.updated) {
            if (current?.room.timeend) {
                let updatedTime = current?.room?.starttime + current?.room?.updated;
                let offset = current.timeend - updatedTime;
                current.timeend = (now + offset) - current?.room?.starttime;
                this.setDeadline(0);
            }
            current.room.updated = now - current?.room?.starttime;
        }

        if (prev?.room?.updated) {
            if (prev?.room?.timeend) {
                let updatedTime = prev?.room?.starttime + prev?.room?.updated;
                let offset = prev.timeend - updatedTime;
                prev.timeend = (now + offset) - prev?.room?.starttime;
            }
            prev.room.updated = now - prev?.room?.starttime;
        }

        if (current?.room) current.room.isreplay = true;

        return { current, prev };
    }

    updateGame(newGamestate, replayIndex) {
        if (typeof replayIndex === "undefined") {
            if (this.gamestate < this.history.length - 1) {
                this.history.splice(this.gamestate + 1);
            }

            if (newGamestate?.room && newGamestate?.room?.isreplay) {
                delete newGamestate.room.isreplay;
            }

            this.history.push(newGamestate);
            this.gamestate = this.history.length - 1;
        } else {
            this.gamestate = replayIndex;
        }

        if (newGamestate?.room?.status) {
            this.status = newGamestate.room.status;
        }

        if (newGamestate?.room?._sequence) {
            this._sequence = newGamestate.room._sequence;
        }

        if (this.isGameOver()) {
            this.setDeadline(0);
            // this.endtime = Date.now();
        } else if (newGamestate?.room?.timeend) {
            this.setDeadline(newGamestate.room.timeend);
        }
    }

    createTeamsBySize() {
        let gameSettings = this.gsm.get();
        //create the game defined team vacancy sizes and player list
        //parties that have leftover players will be pushed to spectator list
        let teamsBySize = [];
        let maxTeamSize = 0;
        //free for all scenario
        if (!gameSettings.maxteams) {
            // for (let i = 0; i < gameSettings.maxplayers; i++) {
            //     let teamid = i + 1;
            //     teamsBySize.push({ team_slug: 'team_' + teamid, maxplayers: 1, minplayers: 1, vacancy: 1, players: [], captains: [] })
            // }
            // maxTeamSize = 1;
        }
        //battlegrounds scenario
        else if (gameSettings.maxteams == 1) {
            let team = gameSettings.teams[0];
            let maxteamcount = Math.floor(
                gameSettings.maxplayers / team.maxplayers
            );
            for (let i = 0; i < maxteamcount; i++) {
                let teamid = i + 1;
                teamsBySize.push({
                    team_slug: "team_" + teamid,
                    maxplayers: team.maxplayers,
                    minplayers: team.minplayers,
                    vacancy: team.maxplayers,
                    players: [],
                    captains: [],
                });
            }
            maxTeamSize = team.maxplayers;
        }
        //traditional team scenario
        else {
            for (const team of gameSettings.teams) {
                if (team.maxplayers > maxTeamSize)
                    maxTeamSize = team.maxplayers;
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
        //sort in descending order, so we can fill largest vacancies first
        teamsBySize.sort((a, b) => {
            b.vacancy - a.vacancy;
        });

        if (this.history.length > 1) return;

        let gameState = this.history[0] || {};
        if (teamsBySize.length > 0) {
            // gameState.teams = {};

            // for (const team of teamsBySize) {
            //     gameState.teams[team.team_slug] = { players: [] };
            // }

            // this.history[0] = gameState;

            this.teaminfo = teamsBySize;
        }
    }

    attemptJoinTeam(teamid) {
        // for (let i = 0; i < this.teaminfo.length; i++) {
            let team = this.teaminfo[teamid];
            if (team) {
                if (team.vacancy > 0) {
                    team.vacancy -= 1;
                    return { teamid };
                }
            }
        // }

        for (let i = 0; i < this.teaminfo.length; i++) {
            let team = this.teaminfo[i];
            if (team.vacancy > 0) {
                team.vacancy -= 1;
                return { teamid: i };
            }
        }
        return { error: "No teams available" };
    }

    getTeamInfo() {
        return this.teaminfo;
    }

    setDeadline(deadline) {
        this.deadline = deadline;
    }

    getDeadline() {
        return this.deadline;
    }

    getRoomSlug() {
        return this.room_slug;
    }

    removeSpectator(user) {
        if (Array.isArray(this.spectators))
            this.spectators = this.spectators.filter(
                (u) => u.shortid != user.shortid
            );
    }

    addSpectator(user) {
        if (!this.spectators.includes(user.shortid))
            this.spectators.push(user.shortid);
    }

    setSettings(settings) {
        this.gsm = settings;

        this.createTeamsBySize();
    }

    isFull() {
        let gameSettings = this.gsm.get();
        let gamestate = this.getGameState();
        let players = gamestate?.players || [];
        let maxplayers = gameSettings?.maxplayers || 0;
        if (players.length >= maxplayers) {
            return true;
        }
        return false;
    }
    hasPlayer(shortid) {
        let gamestate = this.getGameState();
        return gamestate?.room?._players[shortid];// Array.isArray(gamestate?.players) && gamestate.players.some(p => p.shortid === shortid);
    }

    copyGameState() {
        return cloneObj(this.getGameState());
    }

    getAllStatus() {
        return this.statusList;
    }

    statusById(id) {
        return this.statusList[id];
    }

    statusByName(name) {
        return this.statusMap[name];
    }

    isGameOver() {
        return (
            this.status == this.statusByName("gameover") ||
            this.status == this.statusByName("gamecancelled") ||
            this.status == this.statusByName("gameerror")
        );
    }

    isPregame() {
        return this.status == this.statusByName("pregame");
    }

    isGameStart() {
        return this.status == this.statusByName("gamestart");
    }
}

module.exports = Room;
