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



    validateNextUser(userid) {
        let gamestate = this.getGameState();
        let next = gamestate?.next;
        let nextid = next?.id;
        let room = gamestate.room;

        if (room?.status == 'pregame')
            return true;

        if (!next || !nextid)
            return false;

        if (!gamestate.state)
            return false;

        //check if we ven have teams
        let teams = gamestate?.teams;


        if (typeof nextid === 'string') {
            //anyone can send actions
            if (nextid == '*')
                return true;

            //only specific user can send actions
            if (nextid == userid)
                return true;

            //validate team has players
            if (!teams || !teams[nextid] || !teams[nextid].players)
                return false;

            //allow players on specified team to send actions
            if (Array.isArray(teams[nextid].players) && teams[nextid].players.includes(userid)) {
                return true;
            }
        }
        else if (Array.isArray(nextid)) {

            //multiple users can send actions if in the array
            if (nextid.includes(userid))
                return true;

            //validate teams exist
            if (!teams)
                return false;

            //multiple teams can send actions if in the array
            for (var i = 0; i < nextid.length; i++) {
                let teamid = nextid[i];
                if (Array.isArray(teams[teamid].players) && teams[teamid].players.includes(userid)) {
                    return true;
                }
            }
        }

        return false;
    }

    updateState(newState, prevState) {

        let gameState = prevState || fs.get('gameState');
        gameState = JSON.parse(JSON.stringify(gameState));

        let delta = DELTA.delta(gameState, newState, {});
        let hiddenPlayers = DELTA.hidden(delta.players);

        gameState = DELTA.merge(gameState || {}, delta);
        if (!gameState.players) return;

        if ('$' in delta)
            delete delta['$'];

        if ('action' in delta)
            delete delta['action'];

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