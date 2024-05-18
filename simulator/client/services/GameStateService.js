import DELTA from "acos-json-delta";
import { playerReady } from "../actions/game";
import GamePanelService from "./GamePanelService";
import ENCODER from "acos-json-encoder";
import ACOSDictionary from "shared/acos-dictionary.json";
import {
    btDeltaEncoded,
    btDeltaState,
    btGamepanels,
    btGameSettings,
    btGameState,
    btHiddenPlayerState,
    btPlayerTeams,
    btTeamInfo,
} from "../actions/buckets";
ENCODER.createDefaultDict(ACOSDictionary);

class GameStateService {
    constructor() {
        btGameState.set({});
        btDeltaState.set({});
        btHiddenPlayerState.set({});
    }

    getGameState() {
        return btGameState.copy();
    }

    getPlayers() {
        let gameState = this.getGameState();
        let players = gameState?.players || {};
        return players;
    }

    getPlayersArray() {
        let players = this.getPlayers();
        let playerList = [];
        for (const shortid in players) {
            let player = players[shortid];
            player.shortid = shortid;
            playerList.push(player);
        }
        return playerList;
    }

    getPlayer(id) {
        let players = this.getPlayers();
        if (id in players) return players[id];
        return null;
    }

    hasTeams() {
        let teaminfo = btTeamInfo.get() || [];
        return teaminfo.length > 0;
    }

    anyTeamHasVacancy() {
        let teaminfo = btTeamInfo.get() || [];
        let vacancyCount = 0;

        for (const team of teaminfo) {
            vacancyCount += team.vacancy;
        }

        if (teaminfo.length == 0) {
            return true;
        }

        return vacancyCount > 0;
    }

    hasVacancy(team_slug) {
        let gameSettings = btGameSettings.get();
        let teaminfo = btTeamInfo.get() || [];

        let gameState = btGameState.get();

        if (team_slug && gameState?.teams) {
            // if (!gameState?.teams) return true;

            let team = teaminfo.find((t) => t.team_slug == team_slug);
            if (team) return team.vacancy;

            // if (team.vacancy <= 0) return false;
        }

        let players = gameState?.players || {};
        let playerList = Object.keys(players);
        return gameSettings.maxplayers - playerList.length;

        // return true;
    }

    clearState() {
        btGameState.set({});
        btDeltaState.set({});
        btHiddenPlayerState.set({});

        this.updateGamePanels();
    }

    validateNextTeam(teams, teamid) {
        let gamestate = this.getGameState();
        let next = gamestate?.next;
        let nextid = next?.id;

        if (typeof nextid === "string") {
            //anyone can send actions
            if (nextid == "*") return true;

            //validate team has players
            if (!teams || !teams[teamid] || !teams[teamid].players)
                return false;

            //allow players on specified team to send actions
            if (nextid == teamid && Array.isArray(teams[teamid].players)) {
                return true;
            }
        } else if (Array.isArray(nextid)) {
            //multiple users can send actions if in the array
            // if (nextid.includes(userid))
            //     return false;

            //validate teams exist
            if (!teams) return false;

            if (nextid.includes(teamid)) return true;
        }

        return false;
    }

    validateNextUser(shortid) {
        let gamestate = this.getGameState();
        let next = gamestate?.next;
        let nextid = next?.id;
        let room = gamestate.room;

        if (room?.status == "pregame") return false;

        if (!next || !nextid) return false;

        if (!gamestate.state) return false;

        //check if we ven have teams
        let teams = gamestate?.teams;

        if (typeof nextid === "string") {
            //anyone can send actions
            if (nextid == "*") return true;

            //only specific user can send actions
            if (nextid == shortid) return true;

            //validate team has players
            if (!teams || !teams[nextid] || !teams[nextid].players)
                return false;

            //allow players on specified team to send actions
            if (
                Array.isArray(teams[nextid].players) &&
                teams[nextid].players.includes(shortid)
            ) {
                return true;
            }
        } else if (Array.isArray(nextid)) {
            //multiple users can send actions if in the array
            if (nextid.includes(shortid)) return true;

            //validate teams exist
            if (!teams) return false;

            //multiple teams can send actions if in the array
            for (var i = 0; i < nextid.length; i++) {
                let teamid = nextid[i];
                if (
                    Array.isArray(teams[teamid].players) &&
                    teams[teamid].players.includes(shortid)
                ) {
                    return true;
                }
            }
        }

        return false;
    }

    updateState(newState, prevState) {
        let gameState = prevState || btGameState.get();
        let copyGameState = JSON.parse(JSON.stringify(gameState));
        let copyNewState = JSON.parse(JSON.stringify(newState));
        let delta = DELTA.delta(copyGameState, copyNewState, {});
        let copyDelta = JSON.parse(JSON.stringify(delta));

        // let encoded2 = encode(copyDelta);

        // let decoded = decode(encoded2);

        // copyGameState = JSON.parse(JSON.stringify(gameState));
        // let merged = DELTA.merge(copyGameState, decoded);

        // let mergedStr = JSON.stringify(merged);
        // let newStateStr = JSON.stringify(newState);

        // let deltaError = DELTA.delta(newState, merged, {});

        // // if (Object.keys(deltaError).length > 0)
        // {

        //     console.error("MERGE ERROR: ", deltaError);
        // }

        let hiddenState = DELTA.hidden(delta.state);
        let hiddenPlayers = DELTA.hidden(delta.players);

        if ("$" in delta) delete delta["$"];

        if (delta.events && "$" in delta.events) delete delta.events["$"];

        if (delta?.action?.user?.shortid)
            delta.action.user = delta.action.user.shortid;

        if (delta?.action && "timeseq" in delta.action)
            delete delta.action.timeseq;

        if (delta?.action && "timeleft" in delta.action)
            delete delta.action.timeleft;

        let encoded = ENCODER.encode(delta);
        btDeltaEncoded.set(encoded.byteLength);

        newState.delta = delta;

        // console.log("AFTER", newState.players);
        btDeltaState.set(delta);
        btHiddenPlayerState.set(hiddenPlayers);

        let playerTeams = {};
        if (newState.teams) {
            for (const team in newState.teams) {
                let players = newState.teams[team].players;
                for (const id of players) {
                    playerTeams[id] = team;
                }
            }
        }
        btPlayerTeams.set(playerTeams);

        if (newState.players) {
            for (const id in newState.players) {
                newState.players[id].id = id;
                newState.players[
                    id
                ].portrait = `https://assets.acos.games/images/portraits/assorted-${
                    newState?.players[id]?.portraitid || 1
                }-medium.webp`;
            }
        }

        btGameState.set(newState);

        this.updateGamePanels();
    }

    updateGamePanel(shortid) {
        try {
            let gameState = btGameState.get();
            let gamepanels = btGamepanels.get();
            let gamepanel = gamepanels[shortid];

            let pstate = JSON.parse(JSON.stringify(gameState));

            if (!gamepanel?.iframe?.current) return;

            if (pstate.private) delete pstate.private;

            if (pstate?.room && pstate?.room?.isreplay) {
                delete pstate.room.isreplay;
            }

            let hiddenPlayers = btHiddenPlayerState.set();
            if (
                hiddenPlayers &&
                hiddenPlayers[shortid] &&
                pstate?.players &&
                pstate?.players[shortid]
            ) {
                pstate.local = Object.assign(
                    {},
                    pstate.players[shortid],
                    hiddenPlayers[shortid]
                );
                pstate.private = {
                    players: { [shortid]: hiddenPlayers[shortid] },
                };
            }

            if (pstate?.players && pstate?.players[shortid]) {
                pstate.local = JSON.parse(
                    JSON.stringify(pstate.players[shortid])
                );
                pstate.local.shortid = shortid;
            }

            GamePanelService.sendFrameMessage(gamepanel, pstate);

            if (pstate?.events?.join && Array.isArray(pstate.events.join)) {
                if (pstate?.events?.join.includes(shortid)) {
                    let user = GamePanelService.getUserById(shortid);

                    if (gamepanel.ready && !gameState.room.isreplay)
                        playerReady(user);
                }
            }
        } catch (e) {
            console.error(e);
        }
    }

    updateGamePanels() {
        let gamepanels = btGamepanels.get();
        for (const id in gamepanels) {
            this.updateGamePanel(id);
        }
    }
}

export default new GameStateService();
