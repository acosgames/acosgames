const NANOID = require('nanoid')
const nanoid = NANOID.customAlphabet('6789BCDFGHJKLMNPQRTW', 6)

class UserManager {
    constructor() {

        this.allFakeUsers = {};
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


    createFakeUsers = (clientid, count) => {

        let fakeusers = [];
        let offset = Object.keys(this.allFakeUsers).length;

        for (let i = 0; i < count; i++) {
            let shortid = generateShortId(6);
            //avoid duplicate collisions
            while (shortid in this.allFakeUsers) {
                shortid = generateShortId(6);
            }
            let fakeuser = { shortid, name: 'Player' + (offset + i), clientid };
            this.allFakeUsers[shortid] = fakeuser;
            fakeusers.push(fakeuser);
        }
        return fakeusers;
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