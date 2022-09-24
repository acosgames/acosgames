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


    replayStats() {
        let gamestartIndex = this.getGameStartIndex();

        return {
            total: (this.history.length - gamestartIndex),
            position: ((this.gamestate - gamestartIndex) + 1)
        }
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
        let gamestartIndex = 0;
        for (let i = 0; i < this.history.length; i++) {
            let hist = this.history[i];
            if (hist?.room?.status == 'gamestart') {
                gamestartIndex = i;
                break;
            }
        }
        return gamestartIndex;
    }

    jumpToState(index) {

        let gamestartIndex = this.getGameStartIndex();

        if (index < gamestartIndex)
            index = gamestartIndex;

        if (index >= this.history.length) {
            index = this.history.length - 1;
        }

        let current = this.history[index];
        let prev = ((index - 1) < gamestartIndex) ? {} : this.history[index - 1];
        this.updateGame(current, index);
        this.gamestate = index; //overwwrite the gamestate index

        let now = Date.now();
        if (current?.room?.updated) {
            if (current?.timer?.end) {
                let offset = current.timer.end - current.room.updated;
                current.timer.end = now + offset;
                this.setDeadline(current.timer.end);
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

        return { current, prev };
    }



    updateGame(newGamestate, replayIndex) {
        if (typeof replayIndex === 'undefined') {
            if (this.gamestate < this.history.length - 1) {
                this.history.splice(this.gamestate + 1);
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

    removeSpectator(user) {
        if (Array.isArray(this.spectators))
            this.spectators = this.spectators.filter(u => u.id != user.id);
    }

    addSpectator(user) {
        if (!this.spectators.includes(user.id))
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
        return this.status == 'gameover';
    }

    isPregame() {
        return this.status == 'pregame';
    }

    isGameStart() {
        return this.status == 'gamestart';
    }
}

module.exports = Room;