import { GET, POST } from './http';
import fs from 'flatstore';
import { findDevGames } from './devgame';
// import history from "./history";
import { getWithExpiry, setWithExpiry, removeWithExpiry } from '../cache';
import { wsRejoinRoom, reconnect, disconnect, wsRejoinQueues, wsJoinQueues } from './connection';
import { addGameQueue, addJoinQueues, clearGameQueues, getJoinQueues } from './queue';
import { clearRooms, getLastJoinType, getRoomList, getRooms, setLastJoinType } from './room';


fs.set('loggedIn', 'LURKER');

export async function createDisplayName(displayname) {

    try {
        let response = await POST('/api/v1/person/create/displayname', { displayname });
        let user = response.data;

        let existing = fs.get('user');
        Object.assign(existing, user);

        fs.set('user', existing);
        fs.set('userid', existing.id);

        disconnect();

        console.log(existing);
        return existing;
    }
    catch (e) {
        console.error(e);
        return e.response.data;
    }
}

export async function createTempUser(displayname) {

    try {
        let response = await POST('/login/temp', { displayname });
        let user = response.data;

        console.log('Created Temp User: ', user);
        let exp = user.exp;
        let now = Math.round((new Date()).getTime() / 1000);
        let diff = exp - now;
        console.log("User expires in " + diff + " seconds.");
        setWithExpiry('user', user, diff)
        setLoginMode(user);
        fs.set('user', user);
        fs.set('userid', user.id);
        fs.set('profile', user);

        disconnect();

        console.log(user);
        return user;
    }
    catch (e) {
        console.error(e);
        return e.response.data;
    }
}

export async function logout() {
    try {

        let response = await GET('/logout');
        let result = response.data;

        if (!result.status || result.status != 'success') {
            return false;
        }

        setLoginMode();
        fs.set('user', null);
        fs.set('userid', 0);
        fs.set('player_stats', {});
        fs.set('isCreateDisplayName', null);
        removeWithExpiry('user');

        clearRooms();
        clearGameQueues();
        setLastJoinType('');

        await disconnect();

        return true;
    }
    catch (e) {
        console.error(e);
        return e.response.data;
    }
}

export function isUserLoggedIn() {
    let loggedIn = fs.get('loggedIn');
    return !(!loggedIn || loggedIn == 'LURKER');
}

export async function getPlayer(displayname) {
    try {
        let response = await GET('/api/v1/person/' + displayname);
        let player = response.data;

        if (player.ecode) {
            console.error('Player not found: ', displayname);
            fs.set('profile', null);
            return null;
        }

        fs.set('profile', player);
    }
    catch (e) {

    }
}

export async function getUser() {

    fs.set('loadingUser', true);

    let user = fs.get('user');
    if (!user) {
        user = await getUserProfile();
    }


    reconnect(true, true);

    fs.set('loadingUser', false);

    if (!user) {
        return false;
    }




    return user;
}

export async function login() {

    let isLoginShowing = fs.get('isCreateDisplayName');
    if (isLoginShowing)
        return;

    let game = fs.get('game');
    if (game) {
        let mode = getLastJoinType();
        addJoinQueues(game.game_slug, mode);
    }

    fs.set('loginFrom', 'game');
    fs.set('isCreateDisplayName', true);

}

export async function loginComplete() {
    fs.set('isCreateDisplayName', false);
    fs.set('justCreatedName', true);

    let joinqueues = getJoinQueues();

    let queues = joinqueues.queues || [];
    let isJoiningQueues = queues.length > 0;

    if (isJoiningQueues) {
        wsJoinQueues(joinqueues.queues, joinqueues.owner);
    }
}

export async function setLoginMode(user) {
    let loginMode = 'LURKER';

    if (user) {
        if (user.email) {
            loginMode = 'USER';
        }
        else if (user.displayname)
            loginMode = 'TEMP';
    }

    fs.set('loggedIn', loginMode);
    return loginMode;

}

export async function getUserProfile() {
    try {

        // fs.set('userCheckedLogin', false);
        // let user = getWithExpiry('user');
        // if (!user) {
        let response = await GET('/api/v1/person');
        let user = response.data;

        if (user.ecode) {
            console.error('[ERROR] Login failed. Please login again.');
            setLoginMode();
            fs.set('user', null);
            return null;
        }
        // }

        console.log('getUserProfile', user);
        let exp = user.exp;
        let now = Math.round((new Date()).getTime() / 1000);
        let diff = exp - now;
        console.log("User expires in " + diff + " seconds.");
        setWithExpiry('user', user, diff)
        setLoginMode(user);
        fs.set('user', user);
        fs.set('userid', user.id);
        fs.set('profile', user);

        // if (user.isdev)
        //     await findDevGames(user.id)


        if (!user.displayname || user.displayname.length == 0) {
            let history = fs.get('history');
            history.push('/player/create');
            return user;
        }

        try {
            let roomList = getRoomList();// localStorage.getItem('rooms') || {};
            if (roomList.length > 0) {
                reconnect();
            }
            wsRejoinQueues();
        }
        catch (e) {
            console.error(e);
        }

        // fs.set('userCheckedLogin', true);
        return user;
    }
    catch (e) {
        // fs.set('userCheckedLogin', true);
        setLoginMode();
        fs.set('user', null);
        fs.set('userid', 0);

        console.error('[Profile] Login failed. Please login again.');
        console.error(e);


        //if( e )
        //return e.response.data;
    }
    return null;
}


export async function requestCreateRoom() {

}