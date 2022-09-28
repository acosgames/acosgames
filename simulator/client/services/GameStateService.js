import fs from 'flatstore';
import DELTA from '../actions/delta';
import { playerReady } from '../actions/game';
import GamePanelService from './GamePanelService';
import { encode } from '../actions/encoder';

class GameStateService {
    constructor() {
        fs.set('gameState', {});
        fs.set('deltaState', {});
        fs.set('hiddenPlayerState', {});
    }

    getGameState() {
        return fs.copy('gameState');
    }

    getPlayers() {
        let gameState = this.getGameState();
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
        let copyGameState = JSON.parse(JSON.stringify(gameState));
        let copyNewState = JSON.parse(JSON.stringify(newState));
        let delta = DELTA.delta(copyGameState, copyNewState, {});
        let hiddenState = DELTA.hidden(delta.state);
        let hiddenPlayers = DELTA.hidden(delta.players);


        let encoded = encode(delta);
        fs.set('deltaEncoded', encoded.byteLength);

        if ('$' in delta)
            delete delta['$'];

        if ('action' in delta)
            delete delta['action'];

        newState.delta = delta;

        console.log('AFTER', newState.players);
        fs.set('gameState', newState);
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

            if (pstate?.room && pstate?.room?.isreplay) {
                delete pstate.room.isreplay;
            }

            let hiddenPlayers = fs.set('hiddenPlayerState');
            if (hiddenPlayers && hiddenPlayers[id] && pstate?.players[id]) {
                pstate.local = Object.assign({}, pstate.players[id], hiddenPlayers[id]);
                pstate.private = { players: { [id]: hiddenPlayers[id] } };
            }
            else
                pstate.local = { id };

            pstate.local.id = id;

            GamePanelService.sendFrameMessage(gamepanel, pstate);

            if (pstate?.events?.join && Array.isArray(pstate.events.join)) {
                if (pstate?.events?.join.includes(id)) {
                    let user = GamePanelService.getUserById(id);

                    if (gamepanel.ready && !gameState.room.isreplay)
                        playerReady(user)
                }
            }
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