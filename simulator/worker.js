const { workerData, parentPort } = require("worker_threads")
const fs = require('fs');
const { VM, VMScript, NodeVM } = require('vm2');
const path = require('path');
const profiler = require('./profiler');
const chokidar = require('chokidar');

const rank = require('./rank');
const delta = require('./delta');

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
        return globalActions
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
    eval: false,
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
        this.bundlePath = path.join(workerData.dir, './builds/server/server.bundle.js');
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
        if (!globalGame)
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
            for (var id in globalGame.players) {
                let player = globalGame.players[id];
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
                console.log("Not an action: ", actions);
                return;
            }

            let before = {};
            // console.log("(1)Executing Action: ", msg);
            globalIgnore = false;
            if (!globalGame)
                this.makeGame();
            else
                before = cloneObj(globalGame);

            let timeleft = this.calculateTimeleft(globalGame);
            if (globalGame.timer) {
                for (var i = 0; i < actions.length; i++) {
                    actions[i].seq = globalGame.timer.seq || 0;
                    actions[i].timeleft = timeleft;
                }

            }


            if (actions.length == 1) {
                if (actions[0].type == 'join') {
                    let userid = actions[0].user.id;
                    let username = actions[0].user.name;

                    if (!globalRatings[userid]) {
                        globalRatings[userid] = {
                            rating: 2500,
                            mu: 25.0,
                            sigma: 5.0
                        }
                    }

                    if (!userid) {
                        console.error("Invalid player: " + userid);
                        return;
                    }

                    if (!globalGame.players)
                        globalGame.players = {};

                    if (!(userid in globalGame.players)) {
                        globalGame.players[userid] = {
                            name: username
                        }
                    }
                    else {
                        globalGame.players[userid].name = username;
                    }
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
            await this.run();

            if (globalIgnore)
                return;

            //should we kill the game?
            if (globalResult && globalResult.events && globalResult.events.gameover) {

                this.processPlayerRatings(globalResult.players, globalResult.teams);


                // this.makeGame(true);
                //before = {};
                // globalDone = false;
                this.gameHistory = [];
                globalGame = {};
            }
            //game still live, process timer and history
            else {
                if (globalResult) {

                    if (actions[0].type == 'gamestart') {
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

        console.log("Before Rating: ", playerRatings);

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

        console.log("After Rating: ", globalRatings);
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
        console.log("Database Reloaded: " + filename);

        return this.gameScript;
    }

    async reloadServerBundle(filepath) {
        profiler.Start('Reload Bundle');
        {
            filepath = filepath || this.bundlePath;
            var data = await fs.promises.readFile(filepath, 'utf8');
            this.gameScript = new VMScript(data, this.bundlePath).compile();
        }
        profiler.End('Reload Bundle');

        let filename = filepath.split(/\/|\\/ig);
        filename = filename[filename.length - 1];
        console.log("Bundle Reloaded: " + filename);

        return this.gameScript;
    }

    async start() {
        try {
            this.reloadServerBundle();
            this.reloadServerDatabase();

            let watchPath = this.bundlePath.substr(0, this.bundlePath.lastIndexOf(path.sep));
            chokidar.watch(watchPath).on('change', (path) => {
                this.reloadServerBundle();
                console.log(`${this.bundlePath} file Changed`, watchPath);
            });

            if (this.dbPath) {
                let watchPath2 = this.dbPath.substr(0, this.dbPath.lastIndexOf(path.sep));
                chokidar.watch(watchPath2).on('change', (path) => {
                    this.reloadServerDatabase();
                    console.log(`${this.dbPath} file Changed`, watchPath2);
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
                console.error(e);
                rs(false);
            }
        })

    }
}

process.on('SIGINT', () => process.exit(1));

var worker = new FSGWorker();