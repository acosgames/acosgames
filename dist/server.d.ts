declare global {
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
    gameState: GameState | null;
    currentAction: Action | null;
    defaultSeconds: number;
    kickedPlayers: string[];
    private requireGameState;
    init: () => void;
    on: (type: string, cb: (action: Action) => boolean) => void;
    ignore(): void;
    setGame: (game: GameState) => void;
    save: () => void;
    gameerror: (payload: any) => void;
    gamecancelled: (payload: any) => void;
    gameover: (payload: any) => void;
    log: (...msg: any[]) => void;
    error: (...msg: any[]) => void;
    kickPlayer: (id: string) => void;
    random(): number;
    randomInt: (min: number, max: number) => number;
    database(): any;
    action: () => Action | null;
    gamestate: () => GameState | null;
    room(): Room;
    room(key: string): any;
    room(key: string, value: string | number): any;
    newState(s: State): void;
    state(): State;
    state(key: string): any;
    state(key: string, value: any): any;
    players(): Players;
    players(index: number): Player;
    players(index: number, value: Player): Player;
    playerByShortid: (shortid: string) => Player | undefined;
    playerIndex: (shortid: string) => number;
    /**
     * Increment a numeric player stat by 1 using the abbreviation defined in game-settings.json
     *
     * @param {string} shortid
     * @param {string} abbreviation
     */
    statIncrement(shortid: string, abbreviation: string): number;
    /**
     * Increment by a specific number for a numeric player stat using the abbreviation defined in game-settings.json
     *
     * @param {string} shortid
     * @param {string} abbreviation
     */
    statIncrement(shortid: string, abbreviation: string, value: number): number;
    /**
     * Get a player stat using the abbreviation defined in game-settings.json
     *
     * @param {string} shortid
     * @param {string} abbreviation
     */
    stats(shortid: string, abbreviation: string): number | StatString;
    /**
     * Set a player stat using the abbreviation defined in game-settings.json
     *
     * String values will be added to an object and incremented.  To edit the string count, use stats(shortid, abbreviation) and set the value directly.
     *
     * @param {string} shortid
     * @param {string} abbreviation
     * @param {number | string} value
     */
    stats(shortid: string, abbreviation: string, value: number | string): number | StatString;
    playerList: () => string[];
    playerCount: () => number;
    teams(): Teams;
    teams(team_slug: string): Team | undefined;
    teams(team_slug: string, value: Team): Team;
    teamBySlug: (team_slug: string) => Team | undefined;
    teamByIndex: (teamid: number) => Team | undefined;
    nextPlayer(): NextID | undefined;
    nextPlayer(id: NextID, action: NextAction): NextID | undefined;
    nextTeam(): NextID | undefined;
    nextTeam(id: NextID, action: NextAction): NextID | undefined;
    timer(): Timer;
    setTimer: (seconds: number) => void;
    reachedTimelimit: (action: Action) => boolean;
    events(): ACOSEvents;
    events(name: string): ACOSEvent | undefined;
    events(name: string, payload: any): ACOSEvent | undefined;
    clearEvents: () => void;
}
declare const _default: ACOSServer;
export default _default;
