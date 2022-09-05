
const Room = require('./Room');

class RoomManager {
    constructor() {

        this.rooms = [];

    }

    create() {

        let room = new Room();
        this.rooms.push(room);

        return room;
    }


    gameover() {
        let room = this.current();
        if (!room)
            return null;

        room.roomstatus = 'gameover';
        return room;
    }

    update(gamestate) {
        let room = this.current();
        if (!room)
            return null;

        room.update(gamestate);

        return room;
    }

    gamestate(room) {
        return room ? room.getGameState() : this.current().getGameState();
    }

    current() {
        let currentRoom = null;
        if (this.rooms.length > 0) {
            currentRoom = this.rooms[this.rooms.length - 1];
        }

        if (currentRoom) {
            if (currentRoom.isGameOver()) {
                return this.create();
            }
            return currentRoom;
        }
        return this.create();
    }

    getActiveRoom() {
        for (const room_slug in rooms) {
            let room = rooms[room_slug];
            if (room.status = 'gamestart') {
                return room;
            }
        }
        return null;
    }

    getOpenRoom() {
        for (const room_slug in rooms) {
            let room = rooms[room_slug];
            if (room.status = 'pregame') {
                return room;
            }
        }
        return null;
    }


}

module.exports = new RoomManager();