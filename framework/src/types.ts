
import { GameStatus } from './enums.js';

export type Teams = Team[];
export type Players = Player[];
export type ACOSEvents = ACOSEvent[];

export interface GameState {
    state: State;
    players: Players;
    teams?: Teams;
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

export interface Next {
    id: string | string[];
    action?: string | string[] | any;
}

export interface NextID {
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

// Re-export all types into the global scope so existing code that
// relies on implicit globals continues to work without imports.
declare global {
    type Teams = import('./types.js').Teams;
    type Players = import('./types.js').Players;
    type ACOSEvents = import('./types.js').ACOSEvents;
    type GameState = import('./types.js').GameState;
    type State = import('./types.js').State;
    type StatString = import('./types.js').StatString;
    type Stats = import('./types.js').Stats;
    type Player = import('./types.js').Player;
    type Team = import('./types.js').Team;
    type Next = import('./types.js').Next;
    type NextID = import('./types.js').NextID;
    type NextAction = import('./types.js').NextAction;
    type PlayerRef = import('./types.js').PlayerRef;
    type TeamRef = import('./types.js').TeamRef;
    type Room = import('./types.js').Room;
    type Timer = import('./types.js').Timer;
    type ACOSEvent = import('./types.js').ACOSEvent;
    type User = import('./types.js').User;
    type Action = import('./types.js').Action;
}