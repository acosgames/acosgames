#!/usr/bin/env node
const shelljs = require("shelljs");
const path = require('path');

var children = [];

const cwd = process.cwd();
const cd = __dirname;

process.on('SIGINT', function () {
    console.log('[ACOS] SIGINT');

    for (var i = 0; i < children.length; i++) {
        let child = children[i];
        if (child) {
            child.kill()
            console.log("[ACOS] Killing child process: ", i)
        }
    }
    process.exit();
});


function runScript(dirPath, command, callback) {

    shelljs.cd(dirPath);
    const child = shelljs.exec(command, { async: true });

    child.stdout.on('data', function (data) {
        // console.log(data);
    })

    child.stderr.on('data', function (data) {
        // console.log(data);
    })

    child.on('spawn', () => {
        callback();
    })

    child.on('error', (err) => {
        callback(err);
    })

    child.on('close', (code, signal) => {
        callback(null, { code, signal });
        // child.exit();
    })

    child.on('disconnect', () => {
        callback('disconnected');
    })

    children.push(child);
    // // keep track of whether callback has been invoked to prevent multiple invocations
    // var invoked = false;
    // args = args || [];
    // var process = childProcess.fork(scriptPath, { execArgv: args});

    // // listen for errors as they may prevent the exit event from firing
    // process.on('error', function (err) {
    //     if (invoked) return;
    //     invoked = true;
    //     callback(err);
    // });

    // // execute the callback once the process has finished running
    // process.on('exit', function (code) {
    //     if (invoked) return;
    //     invoked = true;
    //     var err = code === 0 ? null : new Error('exit code ' + code);
    //     callback(err);
    // });

}

function runServer(isDev) {
    return new Promise(async (rs, rj) => {

        console.log("[ACOS] Starting Simulator Server");

        const cmd = `npx nodemon --inspect --enable-source-maps --watch ./simulator/server --ignore ./simulator/server/public ./simulator/server/server.js "${cwd}" ${isDev ? 'development' : 'production'}`;
        console.log("STARTING ACOSGAMES SIMULATOR >>>>>>>\n", cmd);

        runScript(cd, cmd, async (err, sigint) => {
            if (err) {
                console.error(err);
                rj(err);
                return;
            }
            // console.log("Finished loading ACOS Simulator.");


            rs(true);
        })
    })
}

function runClient() {
    return new Promise(async (rs, rj) => {

        console.log("[ACOS] Starting Simulator Client");

        const cmd = `cd ./simulator/client && npm start`;
        // console.log("STARTING ACOSGAMES SIMULATOR >>>>>>>\n", cmd);

        runScript(cd, cmd, async (err, sigint) => {
            if (err) {
                console.error(err);
                rj(err);
                return;
            }
            // console.log("Finished loading ACOS Simulator.");

            // await runBrowserSync();

            rs(true);
        })
    })
}

function runBrowserSync(isDev) {
    return new Promise((rs, rj) => {

        console.log("[ACOS] Starting Simulator BrowserSync");
        let cmd = '';

        if (isDev) {

            // let gameClientPath = path.join(cwd, '/game-client/**');
            // let buildsClientPath = path.join(cwd, '/builds/client/**');
            // let projectNodeModulePath = path.join(cwd, '/node_modules');
            let serverPublicFiles = "--files=" + path.join(__dirname, './simulator/server/public');

            cmd = `npx wait-on http://localhost:3100/ && npx browser-sync start --no-ghost-mode --ws --port 3200 --proxy localhost:3100  ${serverPublicFiles}`;

        }
        else {
            let gameClientPath = path.join(cwd, '/game-client/**');
            let buildsClientPath = path.join(cwd, '/builds/client/**');
            let projectNodeModulePath = path.join(cwd, '/node_modules');
            let serverPublicFiles = "";

            cmd = `npx wait-on http://localhost:3100/ && npx browser-sync start --no-open --no-ghost-mode --ws --ui-port 3002 --port 3300 --proxy localhost:3100 --files=${gameClientPath} --files=${buildsClientPath}  --ignore=${projectNodeModulePath}`;

        }

        console.log("Running command: ", cmd);
        // console.log("Running BrowserSync: ", cmd);
        runScript(cd, cmd, (err) => {
            if (err) {
                console.error(err);
                rj(err);
                return;
            }
            // console.log("Finished loading BrowserSync.");
            rs(true);
        })
    })
}


function runBrowserOpen() {
    return new Promise((rs, rj) => {

        let url = 'http://localhost:3100';
        console.log("[ACOS] Opening browser to ", url);
        let cmd = `npx wait-on ${url} && start ${url}`;

        // console.log("Running BrowserSync: ", cmd);
        runScript(cd, cmd, (err) => {
            if (err) {
                console.error(err);
                rj(err);
                return;
            }
            // console.log("Finished loading BrowserSync.");
            rs(true);
        })
    })
}


function runDeploy(isDev) {
    return new Promise((rs, rj) => {

        const cmd = `node --inspect ./simulator/server/deploy.js`;
        console.log("[ACOS] Starting Deploy to ACOS.games");
        let buildPath = path.join(cwd, '/builds');
        let gameSettings = path.join(cwd, '/game-settings.json');
        let args = process.argv.splice(3, process.argv.length - 2);
        // console.log(args, process.argv.length);
        let argsStr = args.join(' ') + ' --buildPath=' + buildPath + ' --settings=' + gameSettings;
        console.log("Running Deploy: ", cmd + ' ' + argsStr);
        runScript(cd, cmd + ' ' + argsStr, (err) => {
            if (err) {
                console.error(err);
                rj(err);
                return;
            }
            // console.log("Finished Deploy.");
            rs(true);
        })
    })
}

function getCommand(argv) {
    return argv.length <= 2 ? "" : argv[2];
}

const command = getCommand(process.argv);
// console.log("[ACOS] RUNNING COMMAND!!!: ", command);

async function processCommand() {

    if (command == '') {
        await runServer(false);
        // runClient();
        runBrowserSync(false);
        runBrowserOpen();
    }
    else if (command == 'dev') {
        await runServer(true);
        runClient();
        runBrowserSync(true);
        runBrowserSync(false);
    }
    else if (command == 'deploy') {
        runDeploy();
    }
}

processCommand();