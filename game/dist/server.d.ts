declare global {
    interface GameState {
        state: {
            [key: string]: any;
        };
        players: {
            [key: string]: any;
        };
        teams: {
            [key: string]: any;
        };
        next: {
            id: string | string[];
        };
        events: {
            [key: string]: any;
        };
        timer: {
            [key: string]: any;
        };
        room: {
            [key: string]: any;
        };
    }
    interface Action {
        type: string;
        payload: any;
        user: {
            shortid: string;
            displayname: string;
            portraitid: number;
            countrycode: string;
        };
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
declare const _default: {
    log: (...msg: any[]) => void;
    error: (...msg: any[]) => void;
    init: () => void;
    on: (type: string, cb: (action: Action) => boolean) => void;
    setGame: (game: GameState) => void;
    commit: () => void;
    gameover: (payload: any) => void;
    kickPlayer: (id: string) => void;
    randomInt: (min: any, max: any) => number;
    action: () => Action;
    gamestate: () => GameState;
    room: (key: string, value: string | number) => any;
    state: (key: string, value: string | number) => any;
    playerList: () => string[];
    playerCount: () => number;
    players: (userid: string, value: any) => any;
    teams: (teamid: string, value: any) => any;
    next: (obj: {
        id: string | string[];
    }) => {
        id: string | string[];
    };
    setTimelimit: (seconds: number) => void;
    reachedTimelimit: (action: Action) => boolean;
    event: (name: string, payload: any) => any;
    clearEvents: () => void;
};
export default _default;
