const { workerData, parentPort } = require("worker_threads")
const fs = require('fs');
const { VM, VMScript, NodeVM } = require('vm2');
const path = require('path');
const profiler = require('./profiler');
const chokidar = require('chokidar');
const vlq = require('vlq');

const rank = require('./rank');
const delta = require('../shared/delta');

var globalRatings = {};

var globalDatabase = null;

var globalGame = {};
var globalActions = [];
var globalResult = {};
var globalDone = null;
var globalIgnore = false;

var globals = {
    log: (msg) => { console.log(msg) },
    error: (msg) => { console.error(msg) },
    finish: (newGame) => {
        try {
            globalResult = cloneObj(newGame);
        }
        catch (e) {
            console.error(e);
        }
    },
    game: () => cloneObj(globalGame),
    actions: () => {
        return cloneObj(globalActions)
    },
    killGame: () => {
        globalDone = true;
    },
    database: () => {
        return globalDatabase;
    },
    ignore: () => {
        globalIgnore = true;
    }
};

const vm = new VM({
    console: false,
    wasm: false,
    eval: true,
    fixAsync: false,
    //timeout: 100,
    sandbox: { globals },
});

function cloneObj(obj) {
    if (typeof obj === 'object')
        return JSON.parse(JSON.stringify(obj));
    if (Array.isArray(obj)) {
        return JSON.parse(JSON.stringify(obj));
    }
    return obj;
}

class FSGWorker {
    constructor() {
        this.action = {};
        this.gameHistory = [];
        this.bundlePath = path.join(workerData.dir, './builds/server/');
        this.bundleFilename = 'server.dev.bundle.js';
        this.bundleFilePath = path.join(this.bundlePath, 'server.dev.bundle.js');
        this.entryFilePath = path.join(workerData.dir, './game-server/index.js');
        this.dbPath = path.join(workerData.dir, './game-server/database.json');
        if (!fs.existsSync(this.dbPath))
            this.dbPath = null;

        this.gameScript = null;
        this.start();
    }

    storeGame(game) {
        if (!game || !game.state)
            return;
        this.gameHistory.push(game);
        globalGame = JSON.parse(JSON.stringify(globalResult));
    }

    makeGame(clearPlayers) {
        //if (!globalGame)
        let players = {};
        if (globalGame.players) {
            players = globalGame.players;
        }

        globalGame = {};
        if (globalGame.killGame) {
            delete globalGame['killGame'];
        }
        globalGame.state = {};
        globalGame.rules = {};
        globalGame.next = {};
        globalGame.teams = {};
        globalGame.events = {};

        if (clearPlayers) {
            globalGame.players = {}
        }
        else {
            let newPlayers = {};
            for (var id in players) {
                let player = players[id];
                newPlayers[id] = {
                    name: player.name
                }
            }
            globalGame.players = newPlayers;
        }

    }

    processTimelimit(timer) {

        if (!timer || !timer.set)
            return;

        if (typeof timer.set === 'undefined')
            return;


        let seconds = Math.min(3000000, Math.max(1, timer.set));
        // let seconds = Math.min(60, Math.max(10, timer.set));
        let sequence = timer.seq || 0;
        let now = (new Date()).getTime();
        let deadline = now + (seconds * 1000);
        let timeleft = deadline - now;

        timer.end = deadline;
        timer.seconds = seconds;
        // timer.data = [deadline, seconds];
        timer.seq = sequence + 1;
        delete timer.set;
    }

    calculateTimeleft(game) {
        if (!game || !game.timer || !game.timer.end)
            return 0;

        let deadline = game.timer.end;
        let now = (new Date()).getTime();
        let timeleft = deadline - now;
        // if (action.type == 'skip') {
        //     if (now < deadline)
        //         return false;
        // }


        return timeleft;
    }

    async onAction(actions) {
        try {


            profiler.Start("[WorkerOnAction]")
            if (!Array.isArray(actions)) {
                console.log("[ACOS] Not an action: ", actions);
                return;
            }

            let before = {};
            console.log("[ACOS] Executing Action: ", actions);
            globalIgnore = false;
            if (!globalGame)
                this.makeGame();
            else {
                globalGame.events = {};
                before = cloneObj(globalGame);
            }

            let timeleft = this.calculateTimeleft(globalGame);
            if (globalGame.timer) {
                for (var i = 0; i < actions.length; i++) {
                    actions[i].seq = globalGame.timer.seq || 0;
                    actions[i].timeleft = timeleft;
                }

            }



            if (actions.length == 1) {
                if (actions[0].type == 'join') {
                    let shortid = actions[0].user.id;
                    let username = actions[0].user.name;

                    if (!globalRatings[shortid]) {
                        globalRatings[shortid] = {
                            rating: 2500,
                            mu: 25.0,
                            sigma: 5.0
                        }
                    }

                    if (!shortid) {
                        console.error("Invalid player: " + shortid);
                        return;
                    }

                    if (!globalGame.players)
                        globalGame.players = {};

                    if (!(shortid in globalGame.players)) {
                        globalGame.players[shortid] = {
                            name: username
                        }
                    }
                    else {
                        globalGame.players[shortid].name = username;
                    }

                    if (!globalGame?.events?.join) {
                        globalGame.events.join = [];
                    }
                    globalGame.events.join.push(shortid);
                }
                else if (actions[0].type == 'reset') {
                    this.makeGame();
                    before = {};
                }
                else if (actions[0].type == 'gamestart') {
                    this.makeGame();
                    before = {};
                }
            }

            // console.log("(2)Executing Action: ", msg);

            globalGame = cloneObj(globalGame);
            if (!Array.isArray(actions)) {
                actions = [actions];
            }
            globalActions = cloneObj(actions);

            //RUN GAME SERVER SCRIPT 
            await this.run();

            if (globalIgnore)
                return;

            //should we kill the game?
            if (globalResult && globalResult.events && globalResult.events.gameover) {

                // this.processPlayerRatings(globalResult.players, globalResult.teams);


                // this.makeGame(true);
                //before = {};
                // globalDone = false;
                this.gameHistory = [];
                globalGame = {};
            }
            //game still live, process timer and history
            else {
                if (globalResult) {
                    if (actions[0].type == 'join') {
                        let shortid = actions[0].user.id;

                        if (!globalResult?.events?.join) {
                            if (!globalResult?.events)
                                globalResult.events = {};
                            globalResult.events.join = [];
                        }
                        globalResult.events.join.push(shortid);
                    }
                    else if (actions[0].type == 'reset') {

                    }
                    else if (actions[0].type == 'gamestart') {
                        if (globalResult.state)
                            globalResult.state.gamestatus = 'gamestart';
                    }




                    this.processTimelimit(globalResult.timer);
                    this.storeGame(globalResult);
                }
            }

            let diff = delta.delta(before, globalResult, {});

            profiler.End("[WorkerOnAction]")
            parentPort.postMessage(diff);
            globalResult = {};
        }
        catch (e) {
            console.error(e);
        }
    }

    processPlayerRatings(players, teams) {
        //add saved ratings to players
        let playerRatings = {};
        for (var id in players) {
            let player = players[id];

            if (!(id in globalRatings)) {
                continue;
            }
            if ((typeof player.rank === 'undefined')) {
                console.error("Player [" + id + "] (" + player.name + ") is missing rank")
                return;
            }
            // if ((typeof player.score === 'undefined')) {
            //     console.error("Player [" + id + "] (" + player.name + ") is missing score")
            //     return;
            // }
            let playerRating = globalRatings[id];
            playerRating.rank = player.rank;
            //playerRating.score = player.score;
            playerRatings[id] = playerRating;
        }

        console.log("[ACOS] Before Rating: ", playerRatings);

        //run OpenSkill rating system
        rank.calculateRanks(playerRatings, teams);

        //update player ratings
        for (var id in players) {
            let player = players[id];

            if (!(id in playerRatings)) {
                continue;
            }
            let rating = playerRatings[id];
            player.rating = rating.rating;
        }

        console.log("[ACOS] After Rating: ", globalRatings);
    }


    async reloadServerDatabase(filepath) {
        filepath = filepath || this.dbPath;
        if (!filepath)
            return this.gameScript;

        profiler.Start('Reload Database');
        {
            var data = await fs.promises.readFile(filepath, 'utf8');
            globalDatabase = Object.freeze(JSON.parse(data));
        }
        profiler.End('Reload Database');

        let filename = filepath.split(/\/|\\/ig);
        filename = filename[filename.length - 1];
        console.log("[ACOS] Database Reloaded: " + filename);

        return this.gameScript;
    }

    async reloadServerBundle(filepath) {
        profiler.Start('Reload Bundle');
        {
            filepath = filepath || this.bundleFilePath;
            var data = await fs.promises.readFile(filepath, 'utf8');
            this.gameScript = new VMScript(data, this.bundleFilePath).compile();
        }
        profiler.End('Reload Bundle');

        let filename = filepath.split(/\/|\\/ig);
        filename = filename[filename.length - 1];
        console.log("[ACOS] Bundle Reloaded: " + filename);

        return this.gameScript;
    }

    async start() {
        try {
            this.reloadServerBundle();
            this.reloadServerDatabase();

            let watchPath = this.bundleFilePath.substr(0, this.bundleFilePath.lastIndexOf(path.sep));
            chokidar.watch(watchPath).on('change', (path) => {
                this.reloadServerBundle();
                console.log(`[ACOS] ${this.bundleFilePath} file Changed`, watchPath);
            });

            if (this.dbPath) {
                let watchPath2 = this.dbPath.substr(0, this.dbPath.lastIndexOf(path.sep));
                chokidar.watch(watchPath2).on('change', (path) => {
                    this.reloadServerDatabase();
                    console.log(`[ACOS] ${this.dbPath} file Changed`, watchPath2);
                });
            }


            parentPort.on('message', this.onAction.bind(this));
            parentPort.postMessage({ status: "READY" });
        }
        catch (e) {
            console.error(e);
        }
    }

    run() {
        if (!this.gameScript) {
            console.error("Game script is not loaded.");
            return;
        }

        return new Promise((rs, rj) => {
            try {
                profiler.Start('Game Logic');
                {
                    vm.run(this.gameScript);
                }
                profiler.End('Game Logic', 100);
                rs(true);
            }
            catch (e) {
                console.error(this.bundleFilePath);
                let fixed = this.convertStack(e.stack);
                console.error(e.message, fixed);
                rs(false);
            }
        })

    }

    convertStack(stackTrace) {
        let regex = /server\.dev\.bundle\.js:([0-9]+):([0-9]+)/ig
        let matches = [...stackTrace.matchAll(regex)]


        let sourcemap = this.decodeSourceMap();


        for (const match of matches) {
            let lineNumber = Number.parseInt(match[1]) - 1;
            if (lineNumber >= sourcemap.decoded.length) {
                continue;
            }
            let lineInfo = this.findLineInfo(sourcemap, lineNumber);
            let newLineTrace = lineInfo[0] + ':' + lineInfo[1] + ':' + match[2];
            stackTrace = stackTrace.replace(this.bundleFilePath + ':' + match[1] + ':' + match[2], newLineTrace);
        }

        return stackTrace;
    }

    decodeSourceMap() {
        let sourceMapPath = path.join(this.bundlePath, this.bundleFilename + '.map');
        let jsonStr = fs.readFileSync(sourceMapPath);
        let json = JSON.parse(jsonStr);

        let mappings = json.mappings;
        let vlqs = mappings.split(';').map(line => line.split(','));
        let decoded = vlqs.map(line => line.map(vlq.decode));

        let sourceFileIndex = 0;   // second field
        let sourceCodeLine = 0;    // third field
        let sourceCodeColumn = 0;  // fourth field
        let nameIndex = 0;         // fifth field

        decoded = decoded.map(line => {
            let generatedCodeColumn = 0; // first field - reset each time

            return line.map(segment => {
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

process.on('SIGINT', () => {
    process.exit()
});

var worker = new FSGWorker();