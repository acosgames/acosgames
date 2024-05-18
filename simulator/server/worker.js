const { workerData, parentPort } = require("worker_threads");
const fs = require("fs");
// const { VM, VMScript, NodeVM } = require('vm2');
const path = require("path");
const profiler = require("./profiler");
const chokidar = require("chokidar");
const vlq = require("vlq");

const rank = require("./rank");
// const delta = require('../shared/delta');

const NANOID = require("nanoid");
const { isObject } = require("./util");
const DiscreteRandom = require("./DiscreteRandom");
const nanoid = NANOID.customAlphabet("6789BCDFGHJKLMNPQRTW", 6);

const vm = require("vm");

// const ivm = require('isolated-vm');
// let isolate = null;
// Create a new context within this isolate. Each context has its own copy of all the builtin
// Objects. So for instance if one context does Object.prototype.foo = 1 this would not affect any
// other contexts.

var globalRatings = {};

var globalDatabase = null;

var globalGame = {};
var globalActions = [];
var globalResult = {};
var globalDone = null;
var globalIgnore = false;

var globalSkipCount = 0;

var globalGameSettings = {};

// let globals = Object.create(null);

// const globals = {
//     log: new ivm.Callback((args) => {
//         // var args = Array.from(arguments);
//         // console.log.apply(console, args);
//         console.log(args)
//     }),
//     error: new ivm.Callback((...args) => {
//         console.error.apply(console, ...args);
//         // console.error(msg)
//     }),
//     finish: new ivm.Callback((newGame) => {
//         try {
//             globalResult = cloneObj(newGame);
//         }
//         catch (e) {
//             console.error(e);
//         }
//     }),
//     random: new ivm.Callback(() => {
//         try {
//             return DiscreteRandom.random();
//         }
//         catch (e) {
//             console.error(e);
//         }
//     }),
//     game: new ivm.Callback(() => cloneObj(globalGame)),
//     actions: new ivm.Callback(() => {
//         return cloneObj(globalActions)
//     }),
//     killGame: new ivm.Callback(() => {
//         globalDone = true;
//     }),
//     database: new ivm.Callback(() => {
//         return globalDatabase;
//     }),
//     ignore: new ivm.Callback(() => {
//         globalIgnore = true;
//     })
// };

// let vmContext = null;
// isolate = new ivm.Isolate({ memoryLimit: 128, inspector: true, });
// function onVM() {
//     // if (isolate) {
//     //     worker.release();
//     //     isolate = null;
//     // }
//     // isolate = new ivm.Isolate({ memoryLimit: 128, inspector: true, });
//     vmContext = isolate.createContextSync({ inspector: true, });
//     vmContext.global.setSync('global', vmContext.global.derefInto());
//     vmContext.global.setSync('log', globals.log);
//     vmContext.global.setSync('error', globals.error);
//     vmContext.global.setSync('finish', globals.finish);
//     vmContext.global.setSync('random', globals.random);
//     vmContext.global.setSync('game', globals.game);
//     vmContext.global.setSync('actions', globals.actions);
//     vmContext.global.setSync('killGame', globals.killGame);
//     vmContext.global.setSync('database', globals.database);
//     vmContext.global.setSync('ignore', globals.ignore);
// }

// onVM();

// let WebSocket = require('ws');
// // Create an inspector channel on port 10000
// let wss = null;
// let channel = null;

// function onWebsocket() {

//     if (!wss) {
//         wss = new WebSocket.Server({ port: 10000 })
//     } else {
//         return;
//     }

//     wss.on('connection', function (ws) {
//         // Dispose inspector session on websocket disconnect
//         channel = isolate.createInspectorSession();
//         console.log("CREATED DEBUG CONNECTION!");
//         function dispose(e, e2) {
//             try {
//                 //console.error(e, Buffer.from(e2).toString());
//                 channel.dispose();
//             } catch (err) { console.error(err) }
//         }
//         ws.on('error', dispose);
//         ws.on('close', dispose);

//         // Relay messages from frontend to backend
//         ws.on('message', function (message) {
//             try {
//                 // console.log('on message:', JSON.stringify(message.toString(), null, 2));
//                 // console.log('--------------------------------------------------------------');
//                 channel.dispatchProtocolMessage(message.toString());
//             } catch (err) {
//                 console.error(err);
//                 // This happens if inspector session was closed unexpectedly
//                 ws.close();
//             }
//         });

//         // Relay messages from backend to frontend
//         function send(message) {
//             try {
//                 // console.log('send message:', JSON.stringify(message.toString(), null, 2));
//                 // console.log('--------------------------------------------------------------');
//                 ws.send(message.toString());
//             } catch (err) {
//                 console.error(err);
//                 dispose();
//             }
//         }
//         channel.onResponse = (callId, message) => send(message);
//         channel.onNotification = send;
//     });
//     console.log('Inspector: devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=127.0.0.1:10000');
// }

// vmContext.global.setSync('globals', globalsReference);
// log:
// error:
// finish:
// random:
// game:
// actions:
// killGame:
// database:
// ignore:

// vmContext.global.setSync('global', vmContext.global.derefInto());

// const vm = new VM({
//     console: false,
//     wasm: false,
//     eval: true,
//     fixAsync: false,
//     //timeout: 100,
//     sandbox: { globals },
// });

function cloneObj(obj) {
    if (typeof obj === "object") return JSON.parse(JSON.stringify(obj));
    if (Array.isArray(obj)) {
        return JSON.parse(JSON.stringify(obj));
    }
    return obj;
}

class FSGWorker {
    constructor() {
        this.action = {};
        this.gameHistory = [];
        this.bundlePath = path.join(workerData.dir, "./builds/");
        this.bundleFilename = "server.bundle.dev.js";
        this.bundleFilePath = path.resolve(
            this.bundlePath,
            "server.bundle.dev.js"
        );
        this.entryFilePath = path.join(
            workerData.dir,
            "./game-server/index.js"
        );
        this.settingsPath = path.join(workerData.dir, "./game-settings.json");
        this.dbPath = path.join(workerData.dir, "./game-server/database.json");

        this.nodeContext = {};
        if (!fs.existsSync(this.dbPath)) this.dbPath = null;

        this.gameScript = null;
        this.start();
    }

    release() {
        // if (channel)
        //     channel.dispose();
        // // wss.close();
        // this.gameScript.release();
        // vmContext.release();
        // isolate.dispose();
    }

    storeGame(game) {
        if (!game || !game.state) return;
        this.gameHistory.push(game);
        globalGame = JSON.parse(JSON.stringify(globalResult));
    }

    makeGame(gameSettings) {
        //if (!globalGame)
        // let players = {};
        // if (globalGame.players) {
        //     players = globalGame.players;
        // }

        globalGame = {};
        if (globalGame.killGame) {
            delete globalGame["killGame"];
        }
        globalGame.room = {};
        globalGame.state = {};
        // globalGame.rules = {};
        globalGame.next = {};
        globalGame.teams = {};
        globalGame.players = {};
        globalGame.timer = {};
        if (gameSettings) {
            for (const team of gameSettings.teams) {
                globalGame.teams[team.team_slug] = {
                    name: team.team_name,
                    color: team.color,
                    order: team.team_order,
                    players: [],
                    rank: 0,
                    score: 0,
                };
            }
        }
        globalGame.events = {};

        // let newPlayers = {};
        // for (var id in players) {
        //     let player = players[id];
        //     newPlayers[id] = {
        //         name: player.displayname
        //     }
        // }
        // globalGame.players = newPlayers;
    }

    processTimelimit(timer) {
        if (!timer || !timer.set) return;

        if (typeof timer.set === "undefined") return;

        let seconds = Math.min(3000000, Math.max(1, timer.set));
        // let seconds = Math.min(60, Math.max(10, timer.set));
        let sequence = timer.sequence || 0;
        let now = new Date().getTime();
        let deadline = now + seconds * 1000;
        let timeleft = deadline - now;

        timer.end = deadline;
        timer.seconds = seconds;
        // timer.data = [deadline, seconds];
        timer.sequence = sequence + 1;
        delete timer.set;
    }

    generatePortrait = () => {
        let portraitid = Math.floor(Math.random() * (2104 - 1 + 1) + 1);
        return portraitid;
    };

    async onAction({ room, action, gamestate, gameSettings }) {
        try {
            // profiler.Start("[WorkerOnAction]")
            console.log("[ACOS] Executing Action: ", action);
            globalGame = gamestate;

            //validate gamestate
            globalIgnore = false;
            if (!globalGame) this.makeGame(gameSettings);
            else {
                globalGame.events = {};
            }

            //pre process actions
            if (action.type == "join") {
                let shortid = action.user.shortid;
                let username = action.user.displayname;

                if (!shortid) {
                    console.error("Invalid player: " + shortid);
                    return;
                }

                if (!("players" in globalGame)) globalGame.players = {};

                //first player joined, begin pregame mode
                if (Object.keys(globalGame.players).length == 0) {
                    if (!("state" in globalGame)) globalGame.state = {};

                    room.status = "pregame";
                    room.sequence = 0;
                }

                //add player into the game
                if (!(shortid in globalGame.players))
                    globalGame.players[shortid] = {};
                globalGame.players[shortid].displayname = username;
                globalGame.players[shortid].shortid = shortid;
                globalGame.players[shortid].portraitid =
                    this.generatePortrait();

                if (globalGame.teams) {
                    if (action?.user?.team_slug) {
                        let team_slug = action.user.team_slug;
                        if (!(team_slug in globalGame.teams)) {
                            globalGame.teams[team_slug] = { players: [] };
                        }
                        globalGame.teams[team_slug].players.push(shortid);
                        globalGame.players[shortid].teamid = team_slug;
                    }
                }
            } else if (action.type == "leave") {
                let shortid = action.user.shortid;
                globalGame.players[shortid].ingame = false;
            } else if (action.type == "reset" || action.type == "newgame") {
                this.makeGame(gameSettings);
            } else if (action.type == "ready") {
                if (room.status != "pregame") return;
                let shortid = action.user.shortid;
                if (
                    typeof action.payload === "boolean" ||
                    typeof action.payload === "undefined"
                )
                    globalGame.players[shortid].ready = action.payload || true;
            } else if (action.type == "loaded") {
                return;
            } else if (action.type == "gamestart") {
                room.status = "gamestart";
            } else if (action.type == "skip") {
                globalSkipCount++;
                //on repeated 2nd skip kill the game
                // developer should have handled it, too bad so sad
                if (
                    globalGame.action &&
                    globalGame.action.type == "skip" &&
                    globalSkipCount > 5
                ) {
                    room.status = "gameover";
                    room.sequence = room.sequence + 1;
                    room.updated = Date.now();
                    globalResult.room = room;
                    globalResult.action = action;

                    parentPort.postMessage(globalResult);
                    globalResult = {};
                    return;
                }
            }

            if (action.type != "skip") {
                globalSkipCount = 0;
            }

            globalActions = cloneObj([action]);

            //add room data to gamestate
            globalGame.room = room;

            let seedStr = room.room_slug + room.starttime + room.sequence;
            DiscreteRandom.seed(seedStr);
            //------------------------------------
            //RUN GAME SERVER SCRIPT
            await this.run();

            if (globalIgnore) {
                profiler.End("[WorkerOnAction]");
                return;
            }
            //------------------------------------

            //should we kill the game?
            if (globalResult?.events?.gameover) {
                room.status = "gameover";
            }
            //game still live, process timer and history
            else {
                //post process actions
                if (action.type == "join") {
                    let shortid = action.user.shortid;

                    if (
                        !globalResult?.events?.join ||
                        !Array.isArray(globalResult.events.join)
                    ) {
                        if (!globalResult?.events) globalResult.events = {};
                        globalResult.events.join = [];
                    }
                    globalResult.events.join.push(shortid);
                }
                if (action.type == "leave") {
                    let shortid = action.user.shortid;

                    if (!globalResult?.events?.leave) {
                        if (!globalResult?.events) globalResult.events = {};
                        globalResult.events.leave = [];
                    }
                    globalResult.events.leave.push(shortid);

                    globalResult.players[shortid].ingame = false;
                } else if (action.type == "reset") {
                    room.status = "pregame";
                    room.sequence = 0;
                } else if (action.type == "gamestart") {
                    // this.gameHistory = [];
                    room.status = "gamestart";
                }

                this.processTimelimit(globalResult.timer);
            }

            room.sequence = room.sequence + 1;
            room.updated = Date.now();
            globalResult.room = room;

            globalResult.action = action;

            // this.storeGame(globalResult);

            // profiler.End("[WorkerOnAction]")
            parentPort.postMessage(globalResult);
            globalResult = {};
        } catch (e) {
            console.error(e);
        }
    }

    validateGameResult() {
        if (!isObject(globalResult)) {
            globalResult = m;
        }
    }

    processPlayerRatings(players, teams) {
        //add saved ratings to players
        let playerRatings = {};
        for (var shortid in players) {
            let player = players[shortid];

            if (!(shortid in globalRatings)) {
                continue;
            }
            if (typeof player.rank === "undefined") {
                console.error(
                    "Player [" +
                        shortid +
                        "] (" +
                        player.displayname +
                        ") is missing rank"
                );
                return;
            }
            // if ((typeof player.score === 'undefined')) {
            //     console.error("Player [" + id + "] (" + player.displayname + ") is missing score")
            //     return;
            // }
            let playerRating = globalRatings[shortid];
            playerRating.rank = player.rank;
            //playerRating.score = player.score;
            playerRatings[shortid] = playerRating;
        }

        console.log("[ACOS] Before Rating: ", playerRatings);

        //run OpenSkill rating system
        rank.calculateRanks(playerRatings, teams);

        //update player ratings
        for (var shortid in players) {
            let player = players[shortid];

            if (!(shortid in playerRatings)) {
                continue;
            }
            let rating = playerRatings[shortid];
            player.rating = rating.rating;
        }

        console.log("[ACOS] After Rating: ", globalRatings);
    }

    async reloadServerDatabase(filepath) {
        filepath = filepath || this.dbPath;
        if (!filepath) return this.gameScript;

        profiler.Start("Reloaded Server Database in");
        {
            var data = await fs.promises.readFile(filepath, "utf8");
            globalDatabase = Object.freeze(JSON.parse(data));
        }
        profiler.End("Reloaded Server Database in");

        let filename = filepath.split(/\/|\\/gi);
        filename = filename[filename.length - 1];
        // console.log("[ACOS] Reloaded Server Database in " + filename);

        return this.gameScript;
    }

    async reloadServerBundle(filepath) {
        let options = {
            // filename: "*"
            filename: "file:///" + this.bundleFilePath.replace(/\\/gi, "/"),
            // filename: 'http://localhost:3100/server.bundle.dev.js'
            // filename: 'server.bundle.dev.js'
        };
        profiler.Start(
            `Reloaded Server Bundle ${options.filename.replace(
                "file:///",
                ""
            )} in`
        );
        {
            // console.log("reloadServerBundle: ", options);
            filepath = filepath || this.bundleFilePath;
            var data = await fs.promises.readFile(filepath, "utf8");
            // if (this.gameScript) {
            // onVM();
            // onWebsocket();
            // }

            this.gameScript = new vm.Script(data, {
                filename: options.filename,
            });

            // this.nodeContext = vm.createContext(globals);

            // this.gameScript = isolate.compileScriptSync(data, options);

            // this.gameScript = new VMScript(data, this.bundleFilePath).compile();
        }
        profiler.End(
            `Reloaded Server Bundle ${options.filename.replace(
                "file:///",
                ""
            )} in`
        );

        let filename = filepath.split(/\/|\\/gi);
        filename = filename[filename.length - 1];
        // console.log("[ACOS] Bundle Reloaded: " + filename);

        return this.gameScript;
    }

    async start() {
        try {
            this.reloadServerBundle();
            this.reloadServerDatabase();

            let watchPath = this.bundleFilePath.substr(
                0,
                this.bundleFilePath.lastIndexOf(path.sep)
            );
            chokidar.watch(watchPath).on("change", (path) => {
                this.reloadServerBundle();
                console.log(
                    `[ACOS] ${this.bundleFilePath} file Changed`,
                    watchPath
                );
            });

            if (this.dbPath) {
                let watchPath2 = this.dbPath.substr(
                    0,
                    this.dbPath.lastIndexOf(path.sep)
                );
                chokidar.watch(watchPath2).on("change", (path) => {
                    this.reloadServerDatabase();
                    console.log(
                        `[ACOS] ${this.dbPath} file Changed`,
                        watchPath2
                    );
                });
            }

            parentPort.on("message", this.onAction.bind(this));
            // parentPort.postMessage({ status: "READY" });
        } catch (e) {
            console.error(e);
        }
    }

    run() {
        if (!this.gameScript) {
            console.error("Game script is not loaded.");
            return;
        }

        return new Promise(async (rs, rj) => {
            try {
                profiler.Start("Game Logic");
                {
                    const globals = {
                        gamelog: () => {
                            // var args = Array.from(arguments);
                            // console.log.apply(console, args);
                            // console.log(args);
                            console.log.apply(console, ...arguments);
                        },
                        gameerror: () => {
                            console.error.apply(console, ...arguments);
                            // console.error(msg)
                        },
                        save: (newGame) => {
                            try {
                                globalResult = cloneObj(newGame);
                            } catch (e) {
                                console.error(e);
                            }
                        },
                        random: () => {
                            try {
                                return DiscreteRandom.random();
                            } catch (e) {
                                console.error(e);
                            }
                        },
                        game: () => cloneObj(globalGame),
                        actions: () => {
                            return cloneObj(globalActions);
                        },
                        killGame: () => {
                            globalDone = true;
                        },
                        database: () => {
                            return globalDatabase;
                        },
                        ignore: () => {
                            globalIgnore = true;
                        },
                    };
                    // await this.gameScript.run(vmContext, { timeout: 200 })
                    vm.createContext(globals);
                    this.gameScript.runInNewContext(globals);
                    // console.log(globals);
                    // onWebsocket();
                    // .catch(err => {
                    //     if (!err) {
                    //         rs(true);
                    //         return;
                    //     }

                    //     console.error(err);
                    // });
                    //vm.run(this.gameScript);
                }
                profiler.End("Game Logic", 100);
                rs(true);
            } catch (e) {
                // console.error(this.bundleFilePath);
                // console.error(e);
                // console.error("stack:", e.stack);
                let fixed = this.convertStack(e.stack);
                console.error(e.message, fixed);
                rs(false);
            }
        });
    }

    convertStack(stackTrace) {
        let regex = /server\.bundle\.dev\.js:([0-9]+):([0-9]+)/gi;
        let matches = [...stackTrace.matchAll(regex)];

        let sourcemap = this.decodeSourceMap();

        let sourcePath = "file:///" + this.bundleFilePath.replace(/\\/gi, "/");
        for (const match of matches) {
            let lineNumber = Number.parseInt(match[1]) - 1;
            if (lineNumber >= sourcemap.decoded.length) {
                continue;
            }
            let lineInfo = this.findLineInfo(sourcemap, lineNumber);
            let newLineTrace = lineInfo[0] + ":" + lineInfo[1] + ":" + match[2];
            stackTrace = stackTrace.replace(
                sourcePath + ":" + match[1] + ":" + match[2],
                newLineTrace
            );
            stackTrace = stackTrace.replace(
                sourcePath + ":" + match[1],
                newLineTrace
            );
        }

        return stackTrace;
    }

    decodeSourceMap() {
        let sourceMapPath = path.join(
            this.bundlePath,
            this.bundleFilename + ".map"
        );
        let jsonStr = fs.readFileSync(sourceMapPath);
        let json = JSON.parse(jsonStr);

        let mappings = json.mappings;
        let vlqs = mappings.split(";").map((line) => line.split(","));
        let decoded = vlqs.map((line) => line.map(vlq.decode));

        let sourceFileIndex = 0; // second field
        let sourceCodeLine = 0; // third field
        let sourceCodeColumn = 0; // fourth field
        let nameIndex = 0; // fifth field

        decoded = decoded.map((line) => {
            let generatedCodeColumn = 0; // first field - reset each time

            return line.map((segment) => {
                if (segment.length === 0) {
                    return [];
                }
                generatedCodeColumn += segment[0];

                const result = [generatedCodeColumn];

                if (segment.length === 1) {
                    // only one field!
                    return result;
                }

                sourceFileIndex += segment[1];
                sourceCodeLine += segment[2];
                sourceCodeColumn += segment[3];

                result.push(sourceFileIndex, sourceCodeLine, sourceCodeColumn);

                if (segment.length === 5) {
                    nameIndex += segment[4];
                    result.push(nameIndex);
                }

                return result;
            });
        });

        // console.log(decoded);
        return { decoded, json };
    }

    findLineInfo(sourcemap, compiledLineNumber) {
        let json = sourcemap.json;
        let decoded = sourcemap.decoded;
        let lineMapping = decoded[compiledLineNumber][0];

        let sourceFile = json.sources[lineMapping[1]].replace("file:///", "");
        let lineNumber = Number.parseInt(lineMapping[2]) + 1;
        let columnNumber = Number.parseInt(lineMapping[3]) + 1;

        return [sourceFile, lineNumber, columnNumber];
    }
}

process.on("SIGINT", () => {
    // wss.close();
    // worker.release();
    process.exit();
});

var worker = new FSGWorker();
