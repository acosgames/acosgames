const NANOID = require('nanoid')
const nanoid = NANOID.customAlphabet('6789BCDFGHJKLMNPQRTW', 6)

class UserManager {
    constructor() {

        this.allFakePlayers = {};
        this.users = {};
    }

    register(socket, name, parentid) {

        let shortid = null;
        if (name in this.users) {
            shortid = this.users[name].shortid;
        } else {
            shortid = nanoid(6)
        }

        this.users[name] = {
            shortid,
            name,
            socket,
            socketid: socket.id,
            parentid
        }

        return this.users[name];
    }



    remove(socketid) {
        let user = this.getUserBySocketId(socketid);
        if (user) {
            delete this.users[user.name];
        }
    }


    createFakePlayers = (clientid, count) => {

        let fakeplayers = [];
        let offset = Object.keys(this.allFakePlayers).length;

        for (let i = 0; i < count; i++) {
            let id = nanoid(6);
            //avoid duplicate collisions
            while (id in this.allFakePlayers) {
                id = nanoid(6);
            }
            let fakeplayer = { id, name: 'Player' + (offset + i), clientid };
            this.allFakePlayers[id] = fakeplayer;
            fakeplayers.push(fakeplayer);
        }
        return fakeplayers;
    }

    getFakePlayers() {
        return this.allFakePlayers;
    }

    iterateFakePlayers(clientid, func) {
        let fakePlayers = [];
        for (const shortid in this.allFakePlayers) {
            let fakePlayer = this.allFakePlayers[shortid];
            if (fakePlayer.clientid == clientid) {
                if (func)
                    func(fakePlayer);
                fakePlayers.push(fakePlayer);
            }
        }
        return fakePlayers;
    }

    getFakePlayer(shortid) {
        return this.allFakePlayers[shortid];
    }

    removeFakePlayer(shortid) {
        if (shortid in this.allFakePlayers) {
            delete this.allFakePlayers[shortid];
        }
    }

    getFakePlayersByParent(clientid) {
        let fakePlayers = [];
        for (const shortid in this.allFakePlayers) {
            let fakePlayer = this.allFakePlayers[shortid];
            if (fakePlayer.clientid == clientid) {
                fakePlayers.push(fakePlayer);
            }
        }
        return fakePlayers;
    }


    actionUser(user) {
        return { id: user.shortid, name: user.name };
    }
    // setSocket(name, socket) {
    //     if (name in this.users)
    //         this.users[name].socket = socket;

    //     return this.users[name];
    // }
    getUserByName(name) {
        return this.users[name];
    }

    getParentUser(parentid) {
        for (const name in this.users) {
            if (this.users[name].shortid == parentid) {
                return this.users[name];
            }
        }
    }

    getUserBySocketId(socketid) {
        for (const name in this.users) {
            if (this.users[name].socketid == socketid) {
                return this.users[name];
            }
        }
        return null;
    }

    getUserByShortid(shortid) {
        for (const name in this.users) {
            if (this.users[name].shortid == shortid) {
                return this.users[name];
            }
        }


        return null;
    }

}

module.exports = new UserManager();