const NANOID = require("nanoid");
const nanoid = NANOID.customAlphabet("6789BCDFGHJKLMNPQRTW", 6);

class UserManager {
    constructor() {
        this.allFakePlayers = {};
        this.fakePlayerNames = {};
        this.users = {};
        this.fakePlayerCounter = 0;
    }

    register(socket, displayname, parentid) {
        let shortid = null;
        if (displayname in this.users) {
            shortid = this.users[displayname].shortid;
        } else {
            shortid = nanoid(6);
        }

        // console.log("Registering...", shortid, displayname);
        this.users[displayname] = {
            shortid,
            displayname,
            socket,
            socketid: socket.id,
            parentid,
        };

        return this.users[displayname];
    }

    remove(socketid) {
        let user = this.getUserBySocketId(socketid);
        if (user) {
            delete this.users[user.displayname];
        }
    }

    isFirstUser() {
        let userList = Object.keys(this.users);
        let fakePlayerList = Object.keys(this.allFakePlayers);
        let total = userList.length + fakePlayerList.length;
        return total == 0;
    }

    createFakePlayers = (clientid, count) => {
        let fakeplayers = [];
        // let offset = Object.keys(this.allFakePlayers).length;

        for (let i = 1; i <= count; i++) {
            let shortid = nanoid(6);
            //avoid duplicate collisions
            while (shortid in this.allFakePlayers) {
                shortid = nanoid(6);
            }
            let fakeplayer = {
                shortid,
                displayname: "Player_" + (this.fakePlayerCounter + i),
                clientid,
            };
            this.allFakePlayers[shortid] = fakeplayer;
            this.fakePlayerNames[fakeplayer.displayname] = fakeplayer;

            fakeplayers.push(fakeplayer);

            this.fakePlayerCounter++;
        }
        return fakeplayers;
    };

    getFakePlayers() {
        return this.allFakePlayers;
    }

    iterateFakePlayers(clientid, func) {
        let fakePlayers = [];
        for (const shortid in this.allFakePlayers) {
            let fakePlayer = this.allFakePlayers[shortid];
            if (fakePlayer.clientid == clientid) {
                if (func) func(fakePlayer);
                fakePlayers.push(fakePlayer);
            }
        }
        return fakePlayers;
    }

    getFakePlayer(shortid) {
        let fakePlayer = this.allFakePlayers[shortid];
        if (!fakePlayer) return;
        return {
            shortid: fakePlayer.shortid,
            displayname: fakePlayer.displayname,
            clientid: fakePlayer.clientid,
        };
    }

    removeFakePlayer(shortid) {
        if (shortid in this.allFakePlayers) {
            let fakeplayer = this.allFakePlayers[shortid];
            delete this.allFakePlayers[shortid];
            delete this.fakePlayerNames[fakeplayer.displayname];
        }
    }

    setSpectator(shortid) {
        let user = this.getUserByShortid(shortid);
        if (!user && this.allFakePlayers[shortid]) {
            user = this.allFakePlayers[shortid];
        }

        if (user) {
            user.spectator = true;
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
        return { shortid: user.shortid, displayname: user.displayname };
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
