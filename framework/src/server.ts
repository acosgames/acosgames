// import { EGameStatus } from "./defs";

import { GameStateReader, gs } from "./gamestate.js";

declare global {
    var gamelog: (...msg: any[]) => void;
    var gameerror: (...msg: any[]) => void;
    var commit: (gamestate: GameState) => void;
    var random: () => number;
    var game: () => GameState;
    var actions: () => Action[];
    var killGame: () => void;
    var database: () => any;
    var ignore: () => void;
}

class ACOSServer {
    gameState: GameState | null = null;
    gameStateReader: GameStateReader | null = null;
    currentAction: Action | null = null;
    defaultSeconds: number = 300;
    kickedPlayers: string[] = [];

    private requireGameState = (): GameState => {
        if (!this.gameState) {
            throw new Error("Game state is not initialized");
        }
        return this.gameState;
    };

    init = () => {
        try {
            this.gameState = game();
            this.gameStateReader = gs(this.gameState);
        } catch (e) {
            this.error("Failed to load gameState");
            return;
        }

        this.currentAction = null;
        this.kickedPlayers = [];
    };

    on = (type: string, cb: (action: Action) => boolean): void => {
        let userActions = actions();
        for (var i = 0; i < userActions.length; i++) {
            if (userActions[i].type == type) {
                this.currentAction = userActions[i];
                let result = cb(this.currentAction);
                if (typeof result == "boolean" && !result) {
                    ignore();
                    break;
                }
            }
        }
    };

    ignore(): void {
        ignore();
    }

    commit = (): void => {
        commit(this.requireGameState());
    };

    gameerror = (payload: any): void => {
        gameerror("[Error]:", payload);
        this.gameStateReader?.addEvent(
            "gameerror",
            typeof payload === "undefined" ? true : payload
        );
    };
    gamecancelled = (payload: any): void => {
        this.gameStateReader?.addEvent(
            "gamecancelled",
            typeof payload === "undefined" ? true : payload
        );
    };
    gameover = (payload: any): void => {
        this.gameStateReader?.addEvent(
            "gameover",
            typeof payload === "undefined" ? true : payload
        );
    };

    log = (...msg: any[]): void => {
        gamelog(...msg);
    };
    error = (...msg: any[]): void => {
        gameerror(...msg);
    };

    kickPlayer = (id: string): void => {
        this.kickedPlayers.push(id);
    };

    random(): number {
        return random();
    }

    randomInt = (min: number, max: number): number => {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(random() * (max - min) + min);
    };

    database(): any {
        return database();
    }

    action = (): Action | null => {
        return this.currentAction;
    };

    game = (): GameStateReader | null => {
        return this.gameStateReader;
    };
    
    reachedTimelimit = (action: Action): boolean => {
        if (typeof action.timeleft == "undefined") return false;
        return action.timeleft <= 0;
    };
}

export default new ACOSServer();
