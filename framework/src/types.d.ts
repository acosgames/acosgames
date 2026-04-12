
import { GameStatus } from './enums';

declare global {
   
    
    // type GameStatus = EGameStatus;
    type Teams = Team[];
    type Players = Player[];
    type ACOSEvents = ACOSEvent[];

    interface GameState {
        state: State;
        players: Players;
        teams?: Teams;
        room: Room;
    }

    interface State {
        [custom: string]: any;
    }

    interface StatString {
        [name: string]: number;
    }

    interface Stats {
        [abbreviation: string]: number | StatString;
    }

    interface Player {
        shortid: string;
        displayname: string;
        portraitid: number;
        countrycode: string;
        rating: number;
        rank: number;
        score: number;
        teamid?: string;
        stats?: Stats;
        [custom: string]: any;
    }

    interface Team {
        team_slug: string;
        name: string;
        color: string;
        order: number;
        players: string[];
        rank: number;
        score: number;
        [custom: string]: any;
    }

    interface Next {
        id: string | string[];
        action?: string | string[] | any;
    }

    interface NextID {
        id: number | number[] | string | string[];
    }

    interface NextAction {
        action: string | string[] | any;
    }

    interface PlayerRef {
        [shortid: string]: number;
    }

    interface TeamRef {
        [team_slug: string]: number;
    }

    interface Room {
        room_slug: string;
        status: GameStatus;
        _sequence: number;
        starttime: number;
        timeset: number;
        timesec: number;
        timeend: number;
        events: ACOSEvents;
        next_player?: NextID;
        next_team?: NextID;
        next_action?: NextAction;
        _players: PlayerRef;
        _teams: TeamRef;
        endtime: number;
        updated: number;
        isreplay?: boolean;
    }

    interface Timer {
        set?: number;
        seconds?: number;
        end?: number;
    }

    interface ACOSEvent {
        type: string;
        payload: any;
    }

    interface User {
        shortid: string;
        displayname: string;
        portraitid: number;
        countrycode: string;
    }

    interface Action {
        type: string;
        payload: any;
        user: User;
        timeleft: number;
        timeseq: number;
    }
}


export {};