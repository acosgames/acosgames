import { playerReady } from "../actions/game";
import GamePanelService from "./GamePanelService";
import { protoEncode, delta, merge, hidden } from "acos-json-encoder";
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

class GameStateService {
    constructor() {
        btGameState.set({});
        btDeltaState.set({});
        btHiddenPlayerState.set({});

        this.statusList = [
            "none",
            "waiting",
            "pregame",
            "gamestart",
            "gameover",
            "gamecancelled",
            "gameerror",
        ]

        this.statusMap = {
            "none": 0,
            "waiting": 1,
            "pregame": 2,
            "gamestart": 3,
            "gameover": 4,
            "gamecancelled": 5,
            "gameerror": 6,
        }

    }

    statusByName(name) {
        return this.statusMap[name] || 0;
    }
    statusById(id) {
        return this.statusList[id] || "none";
    }

    getGameState() {
        return btGameState.copy();
    }

    getPlayers() {
        let gameState = this.getGameState();
        let players = gameState?.players || [];
        return players;
    }

    getPlayersArray() {
        return this.getPlayers();
    }

    getPlayer(id) {
        let players = this.getPlayers();
        return players.find(p => p.shortid === id) || null;
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

    hasVacancy(teamid) {
        let gameSettings = btGameSettings.get();
        let teaminfo = btTeamInfo.get() || [];

        let gameState = btGameState.get();

        if (teamid !== undefined && gameState?.teams) {
            // if (!gameState?.teams) return true;

            let team = gameState?.teams[teamid];
            if (team) return team.vacancy;

            // if (team.vacancy <= 0) return false;
        }

        let players = gameState?.players || [];
        return gameSettings.maxplayers - players.length;

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
        // let next = gamestate?.room?.next_id;
        let nextid = gamestate?.room?.next_id;

        if (typeof nextid === "string") {
            //anyone can send actions
            if (nextid == "*") return true;

            //validate team has players
            if (!teams || !teams[teamid]?.players)
                return false;

            //allow players on specified team to send actions
            if (nextid == teamid && Array.isArray(teams[teamid]?.players)) {
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

    validateNextUser(id) {
        let gamestate = this.getGameState();
        let nextid = gamestate?.room?.next_player;
        let room = gamestate.room;

        if (room?.status != this.statusByName("gamestart")) return false;
        if (nextid === null || nextid === undefined) return false;
        if (!gamestate.state) return false;

        if (nextid === id) return true;
        if (Array.isArray(nextid) && nextid.includes(id)) return true;

        let player = gamestate?.players[id];
        if(!player) return false;
        
        let teamid = player.teamid;
        if( this.validateNextTeam(teamid) ) return true;

        return false;
    }   

    validateNextTeam(teamid) {
        let gamestate = this.getGameState();
        let nextid = gamestate?.room?.next_team;
        let room = gamestate.room;
        if (room?.status != this.statusByName("gamestart")) return false;
        if (nextid === null || nextid === undefined) return false;
        if (!gamestate.state) return false;
        if (nextid === teamid) return true;
        if (Array.isArray(nextid) && nextid.includes(teamid)) return true;
        return false;
    }

    updateState(newState, prevState) {
        let gameState = prevState || btGameState.get();

        let copyGameState = JSON.parse(JSON.stringify(gameState));
        let copyNewState = JSON.parse(JSON.stringify(newState));

        delete copyGameState?.room?.events;
        // if (copyGameState.action) delete copyGameState.action;
        if (copyGameState.delta) delete copyGameState.delta;
        // if (copyNewState.action) delete copyNewState.action;

        let msgDelta, copyDelta;
        try {
            for (let player of (copyNewState.players || []))
                if (player.portrait) delete player.portrait;
            for (let player of (copyGameState.players || []))
                if (player.portrait) delete player.portrait;

            msgDelta = delta(copyGameState, copyNewState, {});
            copyDelta = JSON.parse(JSON.stringify(msgDelta));
        } catch (e) {
            console.log(
                JSON.stringify(copyGameState),
                JSON.stringify(copyNewState)
            );
            console.error(e);
        }

        let hiddenState = hidden(msgDelta.state);
        let hiddenPlayers = hidden(msgDelta.players);
        let hiddenRoom = hidden(msgDelta.room);

        if ("$" in msgDelta) delete msgDelta["$"];

        if (msgDelta?.room?.isreplay) delete msgDelta.room.isreplay;

        if (msgDelta?.action?.user?.shortid)
            msgDelta.action.user = msgDelta.action.user.shortid;

        if (msgDelta?.action && "timeseq" in msgDelta.action)
            delete msgDelta.action.timeseq;

        if (msgDelta?.action && "timeleft" in msgDelta.action)
            delete msgDelta.action.timeleft;

        if (msgDelta["local"])
            delete msgDelta["local"];
    

        this.calculateEncodedSizes(msgDelta);

        newState.delta = msgDelta;

        // console.log("AFTER", newState.players);
        btDeltaState.set(msgDelta);
        btHiddenPlayerState.set(hiddenPlayers);

        let playerTeams = {};
        if (Array.isArray(newState.teams)) {
            for (const team of newState.teams) {
                let players = team.players;
                for (const id of players) {
                    playerTeams[id] = team.team_slug;
                }
            }
        }
        btPlayerTeams.set(playerTeams);

        if (newState.players) {
            for (const player of newState.players) {
                player.portrait = `https://assets.acos.games/images/portraits/assorted-${
                    player?.portraitid || 1
                }-medium.webp`;
            }
        }

        btGameState.set(newState);

        this.updateGamePanels();
    }

    calculateEncodedSizes(msgDelta) {
        let encodedSizes = {};
        let withoutAction = JSON.parse(JSON.stringify(msgDelta));
        if (withoutAction.action) delete withoutAction.action;
        let encoded = protoEncode({ type: "update", payload: withoutAction });
        encodedSizes.total = encoded.byteLength;

        if (!msgDelta.state) {
            encodedSizes.state = 0;
        } else {
            encoded = protoEncode({ type: "update", payload: { state: msgDelta.state } });
            encodedSizes.state = encoded.byteLength - 3;
        }

        if (!msgDelta.players && !msgDelta["#players"]) {
            encodedSizes.players = 0;
        } else {
            if (msgDelta.players)
                encoded = protoEncode({ type: "update", payload: { players: msgDelta.players } });
            else encoded = protoEncode({ type: "update", payload: { "#players": msgDelta["#players"] } });
            encodedSizes.players = encoded.byteLength - 3;
        }

        if (!msgDelta.teams && !msgDelta["#teams"]) {
            encodedSizes.teams = 0;
        } else {
            if (msgDelta.teams) encoded = protoEncode({ type: "update", payload: { teams: msgDelta.teams } });
            else encoded = protoEncode({ type: "update", payload: { "#teams": msgDelta["#teams"] } });
            encodedSizes.teams = encoded.byteLength - 3;
        }

        if (!msgDelta.room) {
            encodedSizes.room = 0;
        } else {
            encoded = protoEncode({ type: "update", payload: { room: msgDelta.room } });
            encodedSizes.room = encoded.byteLength - 3;
        }

        if (!msgDelta.action) {
            encodedSizes.action = 0;
        } else {
            encoded = protoEncode({ type: "update", payload: { action: msgDelta.action } });
            encodedSizes.action = encoded.byteLength - 3;
        }

        btDeltaEncoded.set(encodedSizes);
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

            let hiddenPlayers = btHiddenPlayerState.get();
            let pstatePlayer = pstate?.players?.find(p => p.shortid === shortid);
            if (
                hiddenPlayers &&
                hiddenPlayers[shortid] &&
                pstatePlayer
            ) {
                pstate.local = Object.assign(
                    {},
                    pstatePlayer,
                    hiddenPlayers[shortid]
                );
                pstate.private = {
                    players: [{ ...hiddenPlayers[shortid], shortid }],
                };
            }

            if (pstatePlayer) {
                pstate.local = JSON.parse(
                    JSON.stringify(pstatePlayer)
                );
                pstate.local.shortid = shortid;
            }

            GamePanelService.sendFrameMessage(gamepanel, pstate);

            let joinEvent = pstate?.room?.events?.find(e => e.type === "join" && Array.isArray(e.payload) && e.payload.includes(shortid));
            if (joinEvent) {
                let player = pstate?.players?.find(p => p.shortid === shortid);
                if (player) {
                    let user = GamePanelService.getUserById(player.shortid);

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
