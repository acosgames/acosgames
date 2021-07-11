const { workerData, parentPort } = require("worker_threads")
const fs = require('fs');
const { VM, VMScript, NodeVM } = require('vm2');
const path = require('path');
const profiler = require('./profiler');
const chokidar = require('chokidar');

var globalDatabase = null;

var globalGame = null;
var globalActions = [];
var globalResult = null;
var globalDone = null;

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
    game: () => globalGame,
    actions: () => {
        return globalActions
    },
    killGame: () => {
        globalDone = true;
    },
    database: () => {
        return globalDatabase;
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
        this.gameScript = null;
        this.start();
    }

    storeGame(game) {
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
        globalGame.prev = {};
        globalGame.events = [];

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

        let seconds = Math.min(60, Math.max(10, timer.set));
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
        profiler.Start("[WorkerOnAction]")
        if (!Array.isArray(actions)) {
            console.log("Not an action: ", actions);
            return;
        }

        // console.log("(1)Executing Action: ", msg);

        if (!globalGame)
            this.makeGame();

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
                if (!userid) {
                    console.error("Invalid player: " + userid);
                    return;
                }

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
            }
        }

        // console.log("(2)Executing Action: ", msg);

        globalGame = cloneObj(globalGame);
        if (!Array.isArray(actions)) {
            actions = [actions];
        }
        globalActions = cloneObj(actions);
        await this.run();


        if (typeof globalDone !== 'undefined' && globalDone && globalResult) {
            globalResult.killGame = true;
            this.makeGame(true);
            globalDone = false;
            this.gameHistory = [];
            globalGame = null;
        }
        else {
            if (globalResult) {
                this.processTimelimit(globalResult.timer);
                this.storeGame(globalResult);
            }
        }

        profiler.End("[WorkerOnAction]")
        var test = 1;
        test = test * test;
        parentPort.postMessage(globalResult);
        globalResult = null;
    }


    async reloadServerDatabase(filepath) {
        profiler.Start('Reload Database');
        {
            filepath = filepath || this.dbPath;
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
            this.gameScript = new VMScript(data, this.bundlePath);
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

            let watchPath2 = this.dbPath.substr(0, this.dbPath.lastIndexOf(path.sep));
            chokidar.watch(watchPath2).on('change', (path) => {
                this.reloadServerDatabase();
                console.log(`${this.dbPath} file Changed`, watchPath2);
            });

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

var worker = new FSGWorker();