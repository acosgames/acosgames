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

    getPlayer(id) {
        let players = this.getPlayers();
        if (id in players)
            return players[id];
        return null;
    }

    updateState(newState) {

        let gameState = fs.get('gameState');
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
            pstate.local = pstate.players[id] || {};

        pstate.local.id = id;

        GamePanelService.sendFrameMessage(gamepanel, pstate);
    }

    updateGamePanels() {
        let gamepanels = fs.get('gamepanels');
        for (const id in gamepanels) {
            this.updateGamePanel(id);
        }
    }
}

export default new GameStateService();