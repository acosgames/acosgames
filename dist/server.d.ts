declare global {
    interface GameState {
        state: State;
        players: Players;
        teams: Teams;
        next: Next;
        events: Events;
        timer: Timer;
        room: Room;
    }
    interface State {
        [custom: string]: any;
    }
    interface Stats {
        [abbreviation: string]: number | string;
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
    interface Players {
        [shortid: string]: Player;
    }
    interface Team {
        name: string;
        color: string;
        order: number;
        players: string[];
        rank: number;
        score: number;
        [custom: string]: any;
    }
    interface Teams {
        [teamid: string]: Team;
    }
    interface Next {
        id: string | string[];
        action?: string | string[] | any;
    }
    interface Room {
        room_slug: string;
        status: "waiting" | "pregame" | "starting" | "gamestart" | "gameover";
        sequence: number;
        starttime: number;
        endtime: number;
        updated: number;
    }
    interface Timer {
        set?: number;
        sequence: number;
        seconds?: number;
        end?: number;
    }
    interface Events {
        [eventName: string]: any;
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
    var gamelog: (...msg: any[]) => void;
    var gameerror: (...msg: any[]) => void;
    var save: (gamestate: GameState) => void;
    var random: () => number;
    var game: () => GameState;
    var actions: () => Action[];
    var killGame: () => void;
    var database: () => any;
    var ignore: () => void;
}
declare class ACOSServer {
    gameState: GameState;
    currentAction: Action | null;
    defaultSeconds: number;
    kickedPlayers: string[];
    init: () => void;
    on: (type: string, cb: (action: Action) => boolean) => void;
    ignore(): void;
    setGame: (game: GameState) => void;
    commit: () => void;
    gameover: (payload: any) => void;
    log: (...msg: any[]) => void;
    error: (...msg: any[]) => void;
    kickPlayer: (id: string) => void;
    random(): number;
    randomInt: (min: any, max: any) => number;
    database(): any;
    action: () => Action | null;
    gamestate: () => GameState | null;
    room(): Room;
    room(key: string): any;
    room(key: string, value: string | number): any;
    state(): State;
    state(key: string): any;
    state(key: string, value: any): any;
    players(): Players;
    players(shortid: string): Player;
    players(shortid: string, value: any): any;
    stats(shortid: string, abbreviation: string): number | string;
    stats(shortid: string, abbreviation: string, value: number | string): number | string;
    playerList: () => string[];
    playerCount: () => number;
    teams(): Teams;
    teams(teamid: string): Team;
    teams(teamid: string, value: any): any;
    next(): Next;
    next(id: string, action: string | string[]): Next;
    timer(): Timer;
    setTimelimit: (seconds: number) => void;
    reachedTimelimit: (action: Action) => boolean;
    events(): Events;
    events(name: string): any;
    events(name: string, payload: any): Events | any;
    clearEvents: () => void;
}
declare const _default: ACOSServer;
export default _default;
