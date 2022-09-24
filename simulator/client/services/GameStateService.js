import fs from 'flatstore';
import DELTA from '../actions/delta';
import GamePanelService from './GamePanelService';

class GameStateService {
    constructor() {
        fs.set('gameState', {});
        fs.set('deltaState', {});
        fs.set('hiddenPlayerState', {});
    }

    getGameState() {
        return fs.get('gameState');
    }

    getPlayers() {
        let gameState = fs.get('gameState');
        let players = gameState?.players || {};
        return players;
    }

    getPlayersArray() {
        let players = this.getPlayers();
        let playerList = [];
        for (const id in players) {
            let player = players[id];
            player.id = id;
            playerList.push(player);
        }
        return playerList;
    }

    getPlayer(id) {
        let players = this.getPlayers();
        if (id in players)
            return players[id];
        return null;
    }

    hasVacancy() {
        let gameSettings = fs.get('gameSettings');

        let gameState = fs.get('gameState');
        let players = gameState?.players || {};
        let playerList = Object.keys(players);
        if (playerList.length >= gameSettings.maxplayers)
            return false;

        return true;
    }

    clearState() {
        fs.set('gameState', {});
        fs.set('deltaState', {});
        fs.set('hiddenPlayerState', {});

        this.updateGamePanels();
    }



    updateState(newState, prevState) {

        let gameState = prevState || fs.get('gameState');
        gameState = JSON.parse(JSON.stringify(gameState));

        let delta = DELTA.delta(gameState, newState, {});
        let hiddenPlayers = DELTA.hidden(delta.players);

        gameState = DELTA.merge(gameState || {}, delta);
        if (!gameState.players) return;

        gameState.delta = delta;

        fs.set('gameState', gameState);
        fs.set('deltaState', delta);
        fs.set('hiddenPlayerState', hiddenPlayers);


        this.updateGamePanels();
    }

    updateGamePanel(id) {
        try {
            let gameState = fs.get('gameState');
            let gamepanels = fs.get('gamepanels');
            let gamepanel = gamepanels[id];

            let pstate = JSON.parse(JSON.stringify(gameState));

            if (!gamepanel?.iframe?.current)
                return;

            if (pstate.private)
                delete pstate.private;

            let hiddenPlayers = fs.set('hiddenPlayerState');
            if (hiddenPlayers && hiddenPlayers[id] && pstate?.players[id]) {
                pstate.local = Object.assign({}, pstate.players[id], hiddenPlayers[id]);
                pstate.private = { players: { [id]: hiddenPlayers[id] } };
            }
            else
                pstate.local = { id };

            pstate.local.id = id;

            GamePanelService.sendFrameMessage(gamepanel, pstate);
        }
        catch (e) {
            console.error(e);
        }

    }

    updateGamePanels() {
        let gamepanels = fs.get('gamepanels');
        for (const id in gamepanels) {
            this.updateGamePanel(id);
        }
    }
}

export default new GameStateService();