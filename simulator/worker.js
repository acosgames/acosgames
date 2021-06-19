const { workerData, parentPort } = require("worker_threads")
const fs = require('fs');
const { VM, VMScript, NodeVM } = require('vm2');
const path = require('path');
const profiler = require('./profiler');
const chokidar = require('chokidar');

var globalGame = null;
var globalAction = {};
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
    action: () => globalAction,
    killGame: () => {
        globalDone = true;
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
    return obj;
}

class FSGWorker {
    constructor() {
        this.action = {};
        this.gameHistory = [];
        this.bundlePath = path.join(__dirname, '../../builds/server/server.bundle.js');
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

        timer.data = [deadline, seconds];
        timer.seq = sequence + 1;
        delete timer.set;
    }

    calculateTimeleft(action, game) {
        if (!game || !game.timer || !game.timer.data)
            return true;

        let deadline = game.timer.data[0];
        let now = (new Date()).getTime();
        let timeleft = deadline - now;
        if (action.type == 'skip') {
            if (now < deadline)
                return false;
        }

        action.timeleft = timeleft;
        return true;
    }

    async onAction(msg) {
        profiler.Start("[WorkerOnAction]")
        if (!msg.type) {
            console.log("Not an action: ", msg);
            return;
        }

        // console.log("(1)Executing Action: ", msg);

        if (!globalGame)
            this.makeGame();

        if (globalGame.timer) {
            msg.seq = globalGame.timer.seq || 0;
        }
        if (!this.calculateTimeleft(msg, globalGame))
            return;


        if (msg.type == 'join') {
            let userid = msg.user.id;
            let username = msg.user.name;
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
        else if (msg.type == 'reset') {
            this.makeGame();
        }
        // console.log("(2)Executing Action: ", msg);

        globalGame = cloneObj(globalGame);
        globalAction = cloneObj(msg);
        await this.run();


        if (typeof globalDone !== 'undefined' && globalDone) {
            globalResult.killGame = true;
            this.makeGame(true);
            globalDone = false;
            this.gameHistory = [];
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

            let watchPath = this.bundlePath.substr(0, this.bundlePath.lastIndexOf(path.sep));
            chokidar.watch(watchPath).on('change', (path) => {
                this.reloadServerBundle();
                console.log(`${this.bundlePath} file Changed`, watchPath);
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