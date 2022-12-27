import fs from 'flatstore';
import { wsSend } from '../actions/websocket';
import GameStateService from './GameStateService';


const defaultScreenConfig = {
    screentype: 3,
    resow: 4,
    resoh: 4,
    screenwidth: 1024
}

class GamePanelService {

    constructor() {
        fs.set('screenConfig', defaultScreenConfig);
        fs.set('primaryGamePanel', null);
        fs.set('gamepanels', {});

        window.addEventListener('message', this.recvFrameMessage.bind(this), false);
    }

    sendFrameMessage(gamepanel, msg) {
        // let iframe = fs.get('iframe'); 

        if (gamepanel?.iframe?.current && gamepanel.ready)
            gamepanel.iframe.current.contentWindow.postMessage(msg, '*');
        else {
            gamepanel.waitMessages = gamepanel.waitMessages || [];
            gamepanel.waitMessages.push(msg);
        }
    }

    getFrameByEvent(event) {
        return Array.from(document.getElementsByTagName('iframe')).filter(iframe => {
            return iframe.contentWindow === event.source;
        })[0];
    }

    getGamePanelByEvent(event) {
        let iframe = this.getFrameByEvent(event);
        let gamepanels = fs.get('gamepanels');
        let gamepanel = null;
        for (const id in gamepanels) {
            let test = gamepanels[id];
            if (test?.iframe?.current == iframe) {
                gamepanel = test;
                break;
            }
        }
        return gamepanel;
    }

    getUserById(id) {
        let fakePlayers = fs.get('fakePlayers') || {};
        let user = fs.get('socketUser');
        if (fakePlayers[id]) {
            user = fakePlayers[id];
        }
        return user;
    }

    recvFrameMessage(evt) {
        let data = evt.data;
        if (data.type == '__ready') {
            return;
        }

        let gamepanel = this.getGamePanelByEvent(evt);
        if (!gamepanel)
            return;

        let user = this.getUserById(gamepanel.id);
        if (!user)
            return;

        if (data.type == 'ready') {
            console.log(">>>> GAME IS READY ");
            gamepanel.ready = true;
            if (gamepanel?.waitMessages?.length > 0) {
                for (const waitMessage of gamepanel.waitMessages) {
                    this.sendFrameMessage(gamepanel, waitMessage);
                }
            }
            return;
        }
        else if (data.type == 'loaded') {
            console.log(">>>> GAME IS LOADED ");
            gamepanel.ready = true;
            if (gamepanel?.waitMessages?.length > 0) {
                for (const waitMessage of gamepanel.waitMessages) {
                    this.sendFrameMessage(gamepanel, waitMessage);
                }
            } else {
                GameStateService.updateGamePanel(gamepanel.id);
            }
            return;
        }

        let gameState = GameStateService.getGameState();;
        if (!gameState?.players || !(gamepanel.id in gameState.players)) {
            return;
        }

        if (user.id != gamepanel.id)
            return;

        data.user = { id: user.id, name: user.name };
        wsSend('action', data);
    }


    createGamePanel(id) {

        let gp = {};
        gp.id = id;
        gp.available = false;
        gp.loaded = false;
        gp.ready = false;
        gp.canvasRef = null;
        gp.gamestate = null;
        gp.gameover = false;
        gp.iframe = null;
        gp.active = true;

        let gps = fs.get('gamepanels') || {};
        gps[id] = gp;
        fs.set('gamepanels', gps);

        // let primary = fs.get('primaryGamePanel');
        // if (!primary)
        //     fs.set('primaryGamePanel', gp);

        return gp;
    }


    removeGamePanel(id) {
        let gps = fs.get('gamepanels') || {};

        if (id in gps) {
            let gp = gps[id];
            delete gps[id];

            fs.set('gamepanels', gps);
            let primary = fs.get('primaryGamePanel');
            if (gp == primary) {
                let keys = Object.keys(gps);
                if (keys.length > 0) {
                    let randomKey = Math.floor(Math.random() * keys.length)
                    let key = keys[randomKey];
                    fs.set('primaryGamePanel', gps[key])
                }
            }


            return true;
        }
        return false;
    }

}

export default new GamePanelService();