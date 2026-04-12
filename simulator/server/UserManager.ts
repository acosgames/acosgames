import { Socket } from "socket.io";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("6789BCDFGHJKLMNPQRTW", 6);

export interface User {
    shortid: string;
    displayname: string;
    socket: Socket;
    socketid: string;
    parentid?: string;
    spectator?: boolean;
}

export interface FakePlayer {
    shortid: string;
    displayname: string;
    clientid: string;
}

export type ActionUser = Pick<User, "shortid" | "displayname">;

class UserManager {
    private users: Record<string, User>;
    private allFakePlayers: Record<string, FakePlayer>;
    private fakePlayerNames: Record<string, FakePlayer>;
    private fakePlayerCounter: number;

    constructor() {
        this.allFakePlayers = {};
        this.fakePlayerNames = {};
        this.users = {};
        this.fakePlayerCounter = 0;
    }

    register(socket: Socket, displayname: string, parentid?: string): User {
        let shortid: string;
        if (displayname in this.users) {
            shortid = this.users[displayname].shortid;
        } else {
            shortid = nanoid(6);
        }

        this.users[displayname] = {
            shortid,
            displayname,
            socket,
            socketid: socket.id,
            parentid,
        };

        return this.users[displayname];
    }

    remove(socketid: string): void {
        const user = this.getUserBySocketId(socketid);
        if (user) {
            delete this.users[user.displayname];
        }
    }

    isFirstUser(): boolean {
        const userList = Object.keys(this.users);
        const fakePlayerList = Object.keys(this.allFakePlayers);
        return userList.length + fakePlayerList.length === 0;
    }

    createFakePlayers = (clientid: string, count: number): FakePlayer[] => {
        const fakeplayers: FakePlayer[] = [];

        for (let i = 1; i <= count; i++) {
            let shortid = nanoid(6);
            while (shortid in this.allFakePlayers) {
                shortid = nanoid(6);
            }
            const fakeplayer: FakePlayer = {
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

    getFakePlayers(): Record<string, FakePlayer> {
        return this.allFakePlayers;
    }

    iterateFakePlayers(clientid: string, func?: (fp: FakePlayer) => void): FakePlayer[] {
        const fakePlayers: FakePlayer[] = [];
        for (const shortid in this.allFakePlayers) {
            const fakePlayer = this.allFakePlayers[shortid];
            if (fakePlayer.clientid === clientid) {
                if (func) func(fakePlayer);
                fakePlayers.push(fakePlayer);
            }
        }
        return fakePlayers;
    }

    getFakePlayer(shortid: string): FakePlayer | undefined {
        const fakePlayer = this.allFakePlayers[shortid];
        if (!fakePlayer) return undefined;
        return {
            shortid: fakePlayer.shortid,
            displayname: fakePlayer.displayname,
            clientid: fakePlayer.clientid,
        };
    }

    removeFakePlayer(shortid: string): void {
        if (shortid in this.allFakePlayers) {
            const fakeplayer = this.allFakePlayers[shortid];
            delete this.allFakePlayers[shortid];
            delete this.fakePlayerNames[fakeplayer.displayname];
        }
    }

    setSpectator(shortid: string): void {
        let user: User | FakePlayer | null = this.getUserByShortid(shortid);
        if (!user) user = this.allFakePlayers[shortid] || null;
        if (user) {
            (user as any).spectator = true;
        }
    }

    getFakePlayersByParent(clientid: string): FakePlayer[] {
        const fakePlayers: FakePlayer[] = [];
        for (const shortid in this.allFakePlayers) {
            const fakePlayer = this.allFakePlayers[shortid];
            if (fakePlayer.clientid === clientid) {
                fakePlayers.push(fakePlayer);
            }
        }
        return fakePlayers;
    }

    actionUser(user: User | FakePlayer): ActionUser {
        return { shortid: user.shortid, displayname: user.displayname };
    }

    getUserByName(name: string): User | undefined {
        return this.users[name];
    }

    getParentUser(parentid: string): User | undefined {
        for (const name in this.users) {
            if (this.users[name].shortid === parentid) {
                return this.users[name];
            }
        }
        return undefined;
    }

    getUserBySocketId(socketid: string): User | null {
        for (const name in this.users) {
            if (this.users[name].socketid === socketid) {
                return this.users[name];
            }
        }
        return null;
    }

    getUserByShortid(shortid: string): User | null {
        for (const name in this.users) {
            if (this.users[name].shortid === shortid) {
                return this.users[name];
            }
        }
        return null;
    }

    getPlayerId(shortid: string): string | null {
        const user = this.getUserByShortid(shortid);
        if (user) return user.shortid;
        return null;
    }
}

export default new UserManager();
