import fs from 'flatstore';
import { getWithExpiry, removeWithExpiry, setWithExpiry } from '../cache';
import { updateBrowserTitle } from '../browser';


fs.set('gamepanels', []);


export function setCurrentRoom(room_slug) {
    fs.set('room_slug', room_slug);
}

export function getCurrentRoom() {
    return fs.get('room_slug') || null;
}

export function setLastJoinType(type) {
    fs.set('lastJoin', type);
}

export function getLastJoinType() {
    return fs.get('lastJoin');
}

export function setGameState(state) {
    fs.set('gamestate', state || {});
}

export function getGameState() {
    return fs.get('gamestate') || {};
}

export function getGamePanel(id) {
    return fs.get('gamepanel/' + id);
}

export function getGamePanels() {
    return fs.get('gamepanels') || [];
}

export function findGamePanelByRoom(room_slug) {
    let gamepanels = getGamePanels();
    for (let i = 0; i < gamepanels.length; i++) {
        let gp = gamepanels[i];
        if (gp.room.room_slug == room_slug)
            return gp;
    }
    return null;
}

export function findGamePanelByIFrame(iframeRef) {
    let gamepanels = getGamePanels();
    for (let i = 0; i < gamepanels.length; i++) {
        let gp = gamepanels[i];
        if (gp?.iframe?.current == iframeRef)
            return gp;
    }
    return null;
}

export function updateGamePanel(gamepanel) {
    fs.set('gamepanel/' + gamepanel.id, gamepanel);
}

export function getPrimaryGamePanel() {
    let id = fs.get('primaryGamePanel');
    if (id == null)
        return null;

    let gamepanel = fs.get('gamepanel/' + id);
    if (!gamepanel)
        return null;

    return gamepanel;
}
export function setPrimaryGamePanel(gamepanel) {
    if (!gamepanel) {
        fs.set('primaryGamePanel', null);
    }
    else {
        fs.set('primaryGamePanel', gamepanel.id);

        let game_slug = gamepanel?.room?.game_slug;
        if (game_slug) {
            let game = fs.get('games>' + game_slug);
            if (game) {
                updateBrowserTitle(game.name);
            }
        }
    }
}

export function cleanupGamePanel(gamepanel) {
    gamepanel.available = true;
    updateGamePanel(gamepanel);
}


export function setRoomActive(room_slug, active) {
    let gamepanel = findGamePanelByRoom(room_slug)
    gamepanel.active = active;

    updateRoomStatus(room_slug);
    updateGamePanel(gamepanel);
}

export function cleanupGamePanels() {
    let gamepanels = getGamePanels();
    for (let i = 0; i < gamepanels.length; i++) {
        let gp = gamepanels[i];
        if (gp.gamestate?.state?.gamestatus == 'gameover') {
            gp.available = true;
            updateGamePanel(gp);
            fs.set('gamepanels', gamepanels);
            return gp;
        }
    }
}

export function createGamePanel() {
    let gp = {};
    gp.id = -1;
    gp.available = false;
    gp.loaded = false;
    gp.ready = false;
    gp.canvasRef = null;
    gp.gamestate = null;
    gp.gameover = false;
    gp.iframe = null;
    gp.room = null;
    gp.active = true;
    return gp;
}

export function reserveGamePanel() {
    let gamepanels = getGamePanels();
    for (let i = 0; i < gamepanels.length; i++) {
        let gp = gamepanels[i];
        if (gp.available) {
            gp.available = false;

            gp.loaded = false;
            gp.ready = false;
            gp.gamestate = null;
            gp.gameover = false;
            gp.room = null;
            gp.active = true;

            updateGamePanel(gp);
            fs.set('gamepanels', gamepanels);
            return gp;
        }
    }

    let gp = createGamePanel();
    gp.id = gamepanels.length;
    gamepanels.push(gp);
    fs.set('gamepanel/' + gp.id, gp);
    fs.set('gamepanels', gamepanels);
    return gp;
}

export function setIFrameLoaded(room_slug, loaded) {
    let iframes = fs.get('iframes');
    if (!(room_slug in iframes)) {
        return false;
    }
    iframes[room_slug].loaded = loaded;
    fs.set('iframes>' + room_slug, { element: iframeRef, loaded: false });
    return true;
}

export function setIFrame(room_slug, iframeRef) {
    let iframes = fs.get('iframes');
    // iframes[room_slug] = ;
    fs.set('iframes>' + room_slug, { element: iframeRef, loaded: false });
}

export function getIFrame(room_slug) {
    let iframes = fs.get('iframes');
    let iframe = iframes[room_slug];
    return iframe;
}

export function getGames() {
    let games = fs.get('games') || getWithExpiry('games') || {};
    return games;
}
export function getGame(game_slug) {
    let games = fs.get('games') || getWithExpiry('games') || {};
    return games[game_slug];
}

export function getRoom(room_slug) {
    let rooms = fs.get('rooms') || getWithExpiry('rooms') || {};
    return rooms[room_slug];
}

export function getRooms() {
    let rooms = fs.get('rooms') || getWithExpiry('rooms') || {};
    return rooms;
}
export function getRoomList() {
    let rooms = getRooms();
    let roomList = [];
    for (var room_slug in rooms) {
        roomList.push(rooms[room_slug]);
    }
    return roomList;
}

export function addRooms(roomList) {

    if (!Array.isArray(roomList))
        return;

    let rooms = getRooms();

    let foundFirst = false;
    for (var r of roomList) {
        rooms[r.room_slug] = r;

        let gamestate = r.gamestate;
        //remove from the rooms object, so we can keep it separate
        if (r.gamestate)
            delete r.gamestate;

        let gamepanel = reserveGamePanel();
        gamepanel.room = r;
        gamepanel.gamestate = gamestate;
        updateGamePanel(gamepanel);

        if (!foundFirst) {
            foundFirst = true;
            setPrimaryGamePanel(gamepanel);
        }
    }

    fs.set('rooms', rooms);
    setWithExpiry('rooms', JSON.stringify(rooms), 120);
}


export function addRoom(msg) {

    let gamepanel = fs.get('gamepanel');

    if (gamepanel) {
        return gamepanel;
    }

    let gp = {};
    gp.id = -1;
    gp.available = false;
    gp.loaded = false;
    gp.ready = false;
    gp.canvasRef = null;
    gp.gamestate = null;
    gp.gameover = false;
    gp.iframe = null;
    gp.room = null;
    gp.active = true;

    fs.set('gamepanel', gp);


    gamepanel = reserveGamePanel();
    gamepanel.room = msg.room;
    gamepanel.gamestate = msg.payload;
    updateGamePanel(gamepanel);

    if (!msg.room.isReplay)
        //should we make it primary immediately? might need to change this
        setPrimaryGamePanel(gamepanel);


    rooms[msg.room.room_slug] = msg.room;
    fs.set('rooms', rooms);
    setWithExpiry('rooms', JSON.stringify(rooms), 120);


    return gamepanel;
}

export function clearPrimaryGamePanel() {
    setPrimaryGamePanel(null);
}

export function clearRooms() {
    fs.set('rooms', {});
    removeWithExpiry('rooms');
}

export function clearRoom(room_slug) {

    let gamepanel = findGamePanelByRoom(room_slug);
    cleanupGamePanel(gamepanel);

    // let primaryGamePanel = getPrimaryGamePanel();
    // if (gamepanel == primaryGamePanel) {
    //     setPrimaryGamePanel(null);
    // }

    let rooms = fs.get('rooms');
    if (!rooms[room_slug])
        return;
    delete rooms[room_slug];
    fs.set('rooms', rooms);
    setWithExpiry('rooms', JSON.stringify(rooms), 120);
}


// export function setRoomStatus(status) {
//     fs.set('roomStatus', status);
// }
export function getRoomStatus(room_slug) {
    let gamepanel = findGamePanelByRoom(room_slug);

    return fs.get('gamestatus/' + gamepanel.id) || 'NOTEXIST';
    // return gamepanel?.status || 'NOTEXIST';
}

export function updateRoomStatus(room_slug) {
    let gamepanel = findGamePanelByRoom(room_slug);
    let status = processsRoomStatus(gamepanel);
    gamepanel.status = status;

    fs.set('gamestatus/' + gamepanel.id, status);
    fs.set('gamestatusUpdated', (new Date()).getTime());
    // updateGamePanel(gamepanel);

    console.log("ROOM STATUS = ", status);
    // fs.set('roomStatus', status);
    return status;
}

export function processsRoomStatus(gamepanel) {

    // let rooms = fs.get('rooms');
    // let room = gamepanel.room;// rooms[room_slug];



    let gamestate = gamepanel.gamestate;// fs.get('gamestate');

    if (!gamestate || !gamestate.state | !gamestate.players) {
        return "NOTEXIST";
    }

    if (gamestate?.events?.gameover) {
        return "GAMEOVER";
    }
    if (gamestate?.events?.error) {
        return "ERROR";
    }

    if (gamestate?.events?.noshow) {
        return "NOSHOW";
    }

    // let iframeLoaded = fs.get('iframeLoaded');
    // if (!iframeLoaded) {
    //     return "LOADING";
    // }

    let gameLoaded = gamepanel.loaded;// fs.get('gameLoaded');
    if (!gameLoaded)
        return "LOADING";



    return "GAME";

}