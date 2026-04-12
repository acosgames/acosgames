import { workerData, parentPort } from "worker_threads";
import fs from "fs";
import path from "path";
import Profiler from "./profiler";
import chokidar from "chokidar";
import vlq from "./vlq";
import vm from "vm";

import Rank from "./rank";
import { isObject } from "./util";
import DiscreteRandom from "./DiscreteRandom";
import Room from "./Room";
import GameSettingsManager from "./GameSettingsManager";
import { gs, GameStatus } from "@acosgames/framework";
import { customAlphabet } from "nanoid";

// import { GameStatus } from "../shared/enums";
const ROOM = new Room(GameSettingsManager);
const nanoid = customAlphabet("6789BCDFGHJKLMNPQRTW", 6);

let globalRatings: Record<string, any> = {};
let globalDatabase: any = null;
let globalGame: any = {};
let globalActions: any[] = [];
let globalResult: any = {};
let globalDone: boolean | null = null;
let globalIgnore = false;
let globalSkipCount = 0;
let globalGameSettings: any = {};

function cloneObj<T>(obj: T): T {
    if (typeof obj === "object" || Array.isArray(obj)) {
        return JSON.parse(JSON.stringify(obj));
    }
    return obj;
}

interface DecodedSourceMap {
    decoded: number[][][];
    json: any;
}

class FSGWorker {
    private action: any;
    private gameHistory: any[];
    private bundlePath: string;
    private bundleFilename: string;
    private bundleFilePath: string;
    private entryFilePath: string;
    private settingsPath: string;
    private dbPath: string | null;
    private nodeContext: any;
    private gameScript: vm.Script | null;

    constructor() {
        this.action = {};
        this.gameHistory = [];
        this.bundlePath = path.join(workerData.dir, "./builds/");
        this.bundleFilename = "server.bundle.dev.js";
        this.bundleFilePath = path.resolve(this.bundlePath, "server.bundle.dev.js");
        this.entryFilePath = path.join(workerData.dir, "./game-server/index.js");
        this.settingsPath = path.join(workerData.dir, "./game-settings.json");
        this.dbPath = path.join(workerData.dir, "./game-server/database.json");

        this.nodeContext = {};
        if (!fs.existsSync(this.dbPath)) this.dbPath = null;

        this.gameScript = null;
        this.start();
    }

    release(): void {}

    storeGame(game: any): void {
        if (!game || !game.state) return;
        this.gameHistory.push(game);
        globalGame = JSON.parse(JSON.stringify(globalResult));
    }

    makeGame(gameSettings: any): void {
        globalGame = {};
        if (globalGame.killGame) {
            delete globalGame["killGame"];
        }
        globalGame.room = { _teams: {}, _players: {}, events: [] };
        globalGame.state = {};
        globalGame.teams = [];
        globalGame.players = [];

        if (gameSettings) {
            const game = gs(globalGame);
            for (const team of gameSettings.teams) {
                game.addTeam({
                    team_slug: team.team_slug,
                    name: team.team_name,
                    color: team.color,
                    order: team.team_order,
                    players: [],
                    rank: 0,
                    score: 0,
                });
                if (game.teamRoomIndex(team.team_slug) === undefined) {
                    game.setTeamRoomIndex(team.team_slug, game.teamCount() - 1);
                }
            }
        }
    }

    processTimelimit(gameState: any): void {
        const game = gs(gameState);
        const timer = game.room().timerSet;
        if (typeof timer === "undefined") return;

        const seconds = Math.min(3_000_000, Math.max(1, timer));
        const now = Date.now();
        const deadline = now + seconds * 1000;

        game.setDeadline(deadline - game.room().startTime);
        game.setTimerSeconds(seconds);
        game.clearTimerSet();
    }

    generatePortrait = (): number => {
        return Math.floor(Math.random() * (2104 - 1 + 1) + 1);
    };

    async onAction({ action, gamestate, gameSettings }: { action: any; gamestate: any; gameSettings: any }): Promise<void> {
        try {
            console.log("[ACOS] Executing Action: ", action);
            globalGame = gamestate;

            globalIgnore = false;
            if (!globalGame) this.makeGame(gameSettings);
            const game = gs(globalGame);
            game.clearEvents();

            const room = game.room();

            if (action.type === "join") {
                const shortid = action.user.shortid;
                const username = action.user.displayname;

                if (!shortid) {
                    console.error("Invalid player: " + shortid);
                    return;
                }

                game.ensurePlayers();

                if (game.playerCount() === 0) {
                    game.ensureState();
                    game.setStatus(ROOM.statusByName("pregame"));
                    game.setSequence(0);
                }

                let playerId = game.playerRoomIndex(shortid);
                let player = playerId === undefined ? null : game.player(playerId);
                if (!player) {
                    playerId = game.playerCount();
                    player = game.addPlayer({
                        id: playerId,
                        shortid,
                        displayname: username,
                        portraitid: this.generatePortrait(),
                    });
                    game.setPlayerRoomIndex(shortid, playerId);
                } else {
                    player.setDisplayname(username);
                    player.setPortraitId(this.generatePortrait());
                }

                if (game.hasTeams() && action?.user?.teamid !== undefined) {
                    const teamid = action.user.teamid;
                    game.teamAt(teamid)?.addPlayer(playerId);
                    if (playerId !== undefined) game.player(playerId)?.setTeamId(teamid);
                }

                action.user.id = playerId;

            } else if (action.type === "leave") {
                const shortid = action.user.shortid;
                const leavingPlayerId = game.playerRoomIndex(shortid);
                if (leavingPlayerId !== undefined) game.player(leavingPlayerId)?.setInGame(false);

            } else if (action.type === "reset" || action.type === "newgame") {
                this.makeGame(gameSettings);
                gs(globalGame).setStartTime(Date.now());

            } else if (action.type === "ready") {
                if (room.status !== ROOM.statusByName("pregame")) return;
                const playerId = action.user.id;
                if (game.player(playerId) && (typeof action.payload === "boolean" || typeof action.payload === "undefined"))
                    game.player(playerId)?.setReady(action.payload ?? true);

            } else if (action.type === "loaded") {
                const seedStr = room.slug + room.startTime + room.sequence;
                DiscreteRandom.seed(seedStr);
                return;

            } else if (action.type === "gamestart") {
                game.setStatus(GameStatus.gamestart);

            } else if (action.type === "skip") {
                globalSkipCount++;
                if (globalGame.action && globalGame.action.type === "skip" && globalSkipCount > 5) {
                    game.setStatus(GameStatus.gamecancelled);
                    game.incrementSequence();
                    game.setUpdatedAt(Date.now() - room.startTime);
                    globalResult.room = room.raw();
                    globalResult.action = action;
                    parentPort!.postMessage(globalResult);
                    globalResult = {};
                    return;
                }
            }

            if (action.type !== "skip") {
                globalSkipCount = 0;
            }

            globalActions = cloneObj([action]);
            globalGame.room = room.raw();

            // RUN GAME SERVER SCRIPT
            const passed = await this.run();

            if (globalIgnore) {
                Profiler.End("[WorkerOnAction]");
                return;
            }

            const result = gs(globalResult);

            const eventMap: Record<string, any> = {};
            for (const event of result.events()) {
                eventMap[event.type] = event;
            }

            if (eventMap["gameover"]) {
                result.setStatus(GameStatus.gameover);
                result.setEndTime(Date.now() - room.startTime);
            } else if (eventMap["gamecancelled"]) {
                result.setStatus(GameStatus.gamecancelled);
            } else if (!passed || eventMap["gameerror"]) {
                result.setStatus(GameStatus.gameerror);
            } else {
                if (action.type === "join") {
                    const shortid = action.user.shortid;
                    let joinEvent = eventMap["join"];
                    if (!joinEvent) {
                        joinEvent = { type: "join", payload: [] };
                        result.addEvent(joinEvent);
                        eventMap["join"] = joinEvent;
                    }
                    if (joinEvent) {
                        joinEvent.payload.push(result.playerRoomIndex(shortid));
                    }
                }

                if (action.type === "leave") {
                    const playerId = action.user.id;
                    if (!eventMap["leave"]) {
                        eventMap["leave"] = { type: "leave", payload: [] };
                        result.addEvent(eventMap["leave"]);
                    }
                    eventMap["leave"].payload.push(playerId);
                    result.player(playerId)?.setInGame(false);

                } else if (action.type === "reset") {
                    result.setStatus(GameStatus.pregame);
                    result.setSequence(0);
                } else if (action.type === "gamestart") {
                    result.setStatus(GameStatus.gamestart);
                }

                this.processTimelimit(globalResult);
            }

            result.incrementSequence();
            const now = Date.now();
            result.setUpdatedAt(now - room.startTime);
            // if (result.room().nextPlayer) game.setNextPlayer(result.room().nextPlayer);
            // if (result.room().nextTeam) game.setNextTeam(result.room().nextTeam);
            // if (result.room().nextAction) game.setNextAction(result.room().nextAction);
            // result.setDeadline(result.room().deadline);
            // result.setTimerSeconds(result.room().timerSeconds);
            // result.setRoomEvents(result.events());
			if (room.events.length === 0) room.clearEvents();
			// globalResult.room = room.raw();
            globalResult.action = action;
            
            result.ensureServerOnly(globalGame);

            parentPort!.postMessage(globalResult);
            globalResult = {};
        } catch (e) {
            console.error(e);
        }
    }

    validateGameResult(): void {
        if (!isObject(globalResult)) {
            globalResult = {};
        }
    }

    processPlayerRatings(players: any[], teams: any[]): void {
        const playerRatings: Record<string, any> = {};
        for (const player of players) {
            const shortid = player.shortid;
            if (!(shortid in globalRatings)) continue;
            if (typeof player.rank === "undefined") {
                console.error("Player [" + shortid + "] (" + player.displayname + ") is missing rank");
                return;
            }
            const playerRating = globalRatings[shortid];
            playerRating.rank = player.rank;
            playerRatings[shortid] = playerRating;
        }

        console.log("[ACOS] Before Rating: ", playerRatings);
        Rank.calculateRanks(playerRatings, teams);

        for (const player of players) {
            const shortid = player.shortid;
            if (!(shortid in playerRatings)) continue;
            const r = playerRatings[shortid];
            player.rating = r.rating;
        }

        console.log("[ACOS] After Rating: ", globalRatings);
    }

    async reloadServerDatabase(filepath?: string): Promise<vm.Script | null> {
        filepath = filepath || this.dbPath!;
        if (!filepath) return this.gameScript;

        Profiler.Start("Reloaded Server Database in");
        const data = await fs.promises.readFile(filepath, "utf8");
        globalDatabase = Object.freeze(JSON.parse(data));
        Profiler.End("Reloaded Server Database in");

        return this.gameScript;
    }

    async reloadServerBundle(filepath?: string): Promise<vm.Script | null> {
        const options = {
            filename: "file:///" + this.bundleFilePath.replace(/\\/gi, "/"),
        };
        Profiler.Start(`Reloaded Server Bundle ${options.filename.replace("file:///", "")} in`);

        filepath = filepath || this.bundleFilePath;
        const data = fs.readFileSync(filepath, "utf8");

        this.gameScript = new vm.Script(data, { filename: options.filename });

        Profiler.End(`Reloaded Server Bundle ${options.filename.replace("file:///", "")} in`);
        return this.gameScript;
    }

    async start(): Promise<void> {
        try {
            this.reloadServerBundle();
            this.reloadServerDatabase();

            const watchPath = this.bundleFilePath.substring(
                0,
                this.bundleFilePath.lastIndexOf(path.sep)
            );
            chokidar.watch(watchPath).on("change", () => {
                this.reloadServerBundle();
                console.log(`[ACOS] ${this.bundleFilePath} file Changed`, watchPath);
            });

            if (this.dbPath) {
                const watchPath2 = this.dbPath.substring(0, this.dbPath.lastIndexOf(path.sep));
                chokidar.watch(watchPath2).on("change", () => {
                    this.reloadServerDatabase();
                    console.log(`[ACOS] ${this.dbPath} file Changed`, watchPath2);
                });
            }

            parentPort!.on("message", this.onAction.bind(this));
        } catch (e) {
            console.error(e);
        }
    }

    run(): Promise<boolean> {
        if (!this.gameScript) {
            console.error("Game script is not loaded.");
            return Promise.resolve(false);
        }

        return new Promise<boolean>(async (resolve) => {
            try {
                Profiler.Start("Game Logic");
                const globals = {
                    gamelog: (...args: any[]) => { console.log(...args); },
                    gameerror: (...args: any[]) => { console.error(...args); },
                    commit: (newGame: any) => {
                        try { globalResult = cloneObj(newGame); } catch (e) { console.error(e); }
                    },
                    random: () => {
                        try { return DiscreteRandom.random(); } catch (e) { console.error(e); }
                    },
                    game: () => cloneObj(globalGame),
                    actions: () => cloneObj(globalActions),
                    killGame: () => { globalDone = true; },
                    database: () => globalDatabase,
                    ignore: () => { globalIgnore = true; },
                };
                vm.createContext(globals);
                if( !this.gameScript) {
                    console.error("Game script is not loaded.");
                    resolve(false);
                    return;
                }
                this.gameScript.runInNewContext(globals);
                Profiler.End("Game Logic", 100);
                resolve(true);
            } catch (e: any) {
                const fixed = this.convertStack(e.stack || "");
                console.error(e.message, fixed);
                resolve(false);
            }
        });
    }

    convertStack(stackTrace: string): string {
        const regex = /server\.bundle\.dev\.js:([0-9]+):([0-9]+)/gi;
        const matches = [...stackTrace.matchAll(regex)];
        const sourcemap = this.decodeSourceMap();
        const sourcePath = "file:///" + this.bundleFilePath.replace(/\\/gi, "/");

        for (const match of matches) {
            const lineNumber = Number.parseInt(match[1]) - 1;
            if (lineNumber >= sourcemap.decoded.length) continue;
            const lineInfo = this.findLineInfo(sourcemap, lineNumber);
            const targetFilepath = path.join(workerData.dir, "./game-server/", lineInfo[0]);
            const newLineTrace = targetFilepath + ":" + lineInfo[1] + ":" + match[2];
            stackTrace = stackTrace.replace(sourcePath + ":" + match[1] + ":" + match[2], newLineTrace);
            stackTrace = stackTrace.replace(sourcePath + ":" + match[1], newLineTrace);
        }

        return stackTrace;
    }

    decodeSourceMap(): DecodedSourceMap {
        const sourceMapPath = path.join(this.bundlePath, this.bundleFilename + ".map");
        const jsonStr = fs.readFileSync(sourceMapPath, "utf8");
        const json = JSON.parse(jsonStr);

        const mappings: string = json.mappings;
        const vlqs = mappings.split(";").map((line) => line.split(","));

        let sourceFileIndex = 0;
        let sourceCodeLine = 0;
        let sourceCodeColumn = 0;
        let nameIndex = 0;

        const decoded = vlqs.map((line) => {
            let generatedCodeColumn = 0;
            return line.map((segment) => {
                const decoded = vlq.decode(segment);
                if (decoded.length === 0) return [];
                generatedCodeColumn += decoded[0];
                const result = [generatedCodeColumn];
                if (decoded.length === 1) return result;
                sourceFileIndex += decoded[1];
                sourceCodeLine += decoded[2];
                sourceCodeColumn += decoded[3];
                result.push(sourceFileIndex, sourceCodeLine, sourceCodeColumn);
                if (decoded.length === 5) {
                    nameIndex += decoded[4];
                    result.push(nameIndex);
                }
                return result;
            });
        });

        return { decoded, json };
    }

    findLineInfo(sourcemap: DecodedSourceMap, compiledLineNumber: number): [string, number, number] {
        const { json, decoded } = sourcemap;
        const lineMapping = decoded[compiledLineNumber][0];
        const sourceFile = json.sources[lineMapping[1]].replace("file:///", "");
        const lineNumber = Number.parseInt(String(lineMapping[2])) + 1;
        const columnNumber = Number.parseInt(String(lineMapping[3])) + 1;
        return [sourceFile, lineNumber, columnNumber];
    }
}

process.on("SIGINT", () => {
    process.exit();
});

const worker = new FSGWorker();
