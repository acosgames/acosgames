const NANOID = require('nanoid');
const { cloneObj } = require('./util');
const nanoid = NANOID.customAlphabet('6789BCDFGHJKLMNPQRTW', 6)






class Room {
    constructor() {

        this.room_slug = nanoid(8);
        this.status = 'pregame';
        this.sequence = 0;
        this.starttime = Date.now();
        this.endtime = 0;
        this.spectators = [];
        this.history = [{}];
        this.gamestate = 0;
        this.gamesettings = {};

        this.deadline = 0;
        this.skipCount = 0;

    }

    json() {
        return {
            room_slug: this.room_slug,
            status: this.status,
            sequence: this.sequence,
            starttime: this.starttime,
            endtime: this.endtime
        }
    }

    hasVacancy() {
        return this.sequence == 0 || (this.isPregame() && !this.isFull());
    }
    getGameState() {
        return this.history[this.gamestate];
    }

    updateGame(newGamestate) {
        this.history.push(newGamestate);
        this.gamestate = this.history.length - 1;

        if (newGamestate?.room?.status) {
            this.status = newGamestate.room.status;
        }

        if (newGamestate?.room?.sequence) {
            this.sequence = newGamestate.room.sequence;
        }

        if (this.isGameOver()) {
            this.setDeadline(0);
            this.endtime = Date.now();
        }
        else if (newGamestate?.timer?.end) {
            this.setDeadline(newGamestate.timer.end);
        }

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

    addSpectator(user) {
        this.spectators.push(user.id);
    }

    setSettings(settings) {
        this.gamesettings = settings;
    }

    isFull() {
        let players = this.gamestate?.players || {};
        let playerList = Object.keys(players);
        if (playerList.length >= this.gamesettings.maxplayers) {
            return true;
        }
        return false;
    }
    hasPlayer(shortid) {
        let gamestate = this.getGameState();
        return gamestate?.players && (shortid in gamestate?.players);
    }

    copyGameState() {
        return cloneObj(this.getGameState());
    }


    isGameOver() {
        return this.roomstatus == 'gameover';
    }

    isPregame() {
        return this.roomstatus == 'pregame';
    }

    isGameStart() {
        return this.roomstatus == 'gamestart';
    }
}

module.exports = Room;