export declare enum EGameStatus {
    none = 0,
    waiting = 1,
    pregame = 2,
    starting = 3,
    gamestart = 4,
    gameover = 5,
    gamecancelled = 6,
    gameerror = 7
}
export type GameStatus = EGameStatus;
declare global {
    export interface GameState {
        state: State;
        players: Players;
        teams?: Teams;
        room: Room;
    }
    export interface State {
        [custom: string]: any;
    }
    /**
     * StatString to count repeated uses of a specific string
     *
     * @interface StatString
     * @member {[name: string]: number} string and its increment count
     */
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
    export type Players = Player[];
    export interface Team {
        team_slug: string;
        name: string;
        color: string;
        order: number;
        players: string[];
        rank: number;
        score: number;
        [custom: string]: any;
    }
    export type Teams = Team[];
    export interface Next {
        id: string | string[];
        action?: string | string[] | any;
    }
    export interface NextID {
        /** number = player array index; string = "*" or team slug */
        id: number | number[] | string | string[];
    }
    export interface NextAction {
        action: string | string[] | any;
    }
    export interface PlayerRef {
        [shortid: string]: number;
    }
    export interface TeamRef {
        [team_slug: string]: number;
    }
    export interface Room {
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
    export interface Timer {
        set?: number;
        seconds?: number;
        end?: number;
    }
    export interface ACOSEvent {
        type: string;
        payload: any;
    }
    export type ACOSEvents = ACOSEvent[];
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
