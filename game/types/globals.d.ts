interface GameState {
    state: { [key: string]: any };
    players: { [key: string]: any };
    teams: { [key: string]: any };
    next: { id: string | string[] };
    events: { [key: string]: any };
    timer: { [key: string]: any };
    room: { [key: string]: any };
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

// declare global {
// interface Global {
declare var gamelog: (...msg: any[]) => void;
declare var gameerror: (...msg: any[]) => void;
declare var finish: (gamestate: GameState) => void;
declare var random: () => number;
declare var game: () => GameState;
declare var actions: () => Action[];
declare var killGame: () => void;
declare var database: () => any;
declare var ignore: () => void;
// }
// }
