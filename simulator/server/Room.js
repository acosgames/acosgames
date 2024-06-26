const NANOID = require("nanoid");
const GameSettingsManager = require("./GameSettingsManager");
const { cloneObj } = require("./util");
const nanoid = NANOID.customAlphabet("6789BCDFGHJKLMNPQRTW", 6);

class Room {
    constructor(settings) {
        this.room_slug = nanoid(8);
        this.status = "pregame";
        this.sequence = 0;
        this.starttime = Date.now();
        this.endtime = 0;
        this.spectators = [];
        this.history = [{}];
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
            sequence: this.sequence,
            starttime: this.starttime,
            endtime: this.endtime,
        };
    }

    hasVacancy() {
        return this.sequence == 0 || (this.isPregame() && !this.isFull());
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
            if (current?.timer?.end) {
                let offset = current.timer.end - current.room.updated;
                current.timer.end = now + offset;
                this.setDeadline(0);
            }
            current.room.updated = now;
        }

        if (prev?.room?.updated) {
            if (prev?.timer?.end) {
                let offset = prev.timer.end - prev.room.updated;
                prev.timer.end = now + offset;
            }
            prev.room.updated = now;
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

        if (newGamestate?.room?.sequence) {
            this.sequence = newGamestate.room.sequence;
        }

        if (this.isGameOver()) {
            this.setDeadline(0);
            this.endtime = Date.now();
        } else if (newGamestate?.timer?.end) {
            this.setDeadline(newGamestate.timer.end);
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

        let gameState = this.history[0];
        gameState.teams = {};

        for (const team of teamsBySize) {
            gameState.teams[team.team_slug] = { players: [] };
        }

        this.history[0] = gameState;

        this.teaminfo = teamsBySize;
    }

    attemptJoinTeam(team_slug) {
        for (const team of this.teaminfo) {
            if (team.team_slug == team_slug) {
                if (team.vacancy > 0) {
                    team.vacancy -= 1;
                    return { team_slug: team.team_slug };
                }
            }
        }

        for (const team of this.teaminfo) {
            if (team.vacancy > 0) {
                team.vacancy -= 1;
                return { team_slug: team.team_slug };
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
        let players = gamestate?.players || {};
        let playerList = Object.keys(players);
        let maxplayers = gameSettings?.maxplayers || 0;
        if (playerList.length >= maxplayers) {
            return true;
        }
        return false;
    }
    hasPlayer(shortid) {
        let gamestate = this.getGameState();
        return gamestate?.players && shortid in gamestate?.players;
    }

    copyGameState() {
        return cloneObj(this.getGameState());
    }

    isGameOver() {
        return (
            this.status == "gameover" ||
            this.status == "gamecancelled" ||
            this.status == "gameerror"
        );
    }

    isPregame() {
        return this.status == "pregame";
    }

    isGameStart() {
        return this.status == "gamestart";
    }
}

module.exports = Room;
