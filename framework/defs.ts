export enum EGameStatus {
    none,
    waiting,
    pregame,
    starting,
    gamestart,
    gameover,
    gamecancelled,
    gameerror,
}

export type GameStatus = keyof typeof EGameStatus;

declare global {
    export interface GameState {
        state: State;
        players: Players;
        teams?: Teams;
        next: Next;
        events: Events;
        timer: Timer;
        room: Room;
    }

    export interface State {
        [custom: string]: any;
    }

    export interface StatString {
        [name: string]: number;
    }
    export interface Stats {
        [abbreviation: string]: number | StatString;
    }

    export interface Player {
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

    export interface Players {
        [shortid: string]: Player;
    }

    export interface Team {
        name: string;
        color: string;
        order: number;
        players: string[];
        rank: number;
        score: number;
        [custom: string]: any;
    }

    export interface Teams {
        [teamid: string]: Team;
    }

    export interface Next {
        id: string | string[];
        action?: string | string[] | any;
    }

    export interface Room {
        room_slug: string;
        status: GameStatus;
        sequence: number;
        starttime: number;
        endtime: number;
        updated: number;
        isreplay?: boolean;
    }

    export interface Timer {
        set?: number;
        sequence: number;
        seconds?: number;
        end?: number;
    }

    export interface Events {
        [eventName: string]: any;
    }

    export interface User {
        shortid: string;
        displayname: string;
        portraitid: number;
        countrycode: string;
    }

    export interface Action {
        type: string;
        payload: any;
        user: User;
        timeleft: number;
        timeseq: number;
    }
}
