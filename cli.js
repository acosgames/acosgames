#!/usr/bin/env node
const shelljs = require("shelljs");
const path = require('path');
let { spawn } = require('child_process');

var oldSpawn = spawn;
function mySpawn() {
    console.log('spawn called');
    console.log(arguments);
    var result = oldSpawn.apply(this, arguments);
    return result;
}
spawn = mySpawn;

var children = [];

const cwd = process.cwd();
const cd = __dirname;

function getCommand(argv) {
    return argv.length <= 2 ? "" : argv[2];
}

const acosCommand = getCommand(process.argv);
let serverApp = null;

function onExit() {
    console.log('[ACOS] SIGINT');

    // if (serverApp) {
    //     serverApp.send('quit');
    // }

    for (var i = 0; i < children.length; i++) {
        let child = children[i];
        if (child) {
            if (child.send) {
                child.send('quit');
            }
            child.kill()
            console.log("[ACOS] Killing child process: ", i)
        }
    }
    process.exit();
}
process.on('SIGINT', onExit);
process.on('SIGQUIT', onExit);
process.on('SIGTERM', onExit);

function runScript(dirPath, command, callback, options) {

    options = (options && Object.assign({ async: true }, options)) || { async: true, };
    // console.log("Options: ", options);
    shelljs.cd(dirPath);
    const child = shelljs.exec(command, options);

    // child.stdout.on('data', function (data) {
    //     console.log('[ACOS]', data);
    // })

    // child.stderr.on('data', function (data) {
    //     console.error('[ACOS]', data);
    // })
    // if (!child || !child.on)
    //     return;

    child.on('spawn', () => {
        callback();
    })

    child.on('error', (err) => {
        console.error('[SIMULATOR ERROR', err);
        callback(err);
    })

    child.on('close', (code, signal) => {
        console.error('[SIMULATOR CLOSING', code, signal);
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

        // console.log("[ACOS] Starting Simulator Server");
        let nodemonPath = path.join(__dirname, 'node_modules/.bin/nodemon')
        const cmd = `${nodemonPath} --inspect --delay 2 --enable-source-maps --watch ./simulator/server --ignore ./simulator/server/public ./simulator/server/server.js "${cwd}" ${isDev ? 'development' : 'production'}`;
        // console.log("STARTING ACOSGAMES SIMULATOR >>>>>>>\n", cmd);

        // let nodemonPath = path.join(__dirname, 'node_modules/.bin/nodemon')
        // serverApp = spawn('npx', ['nodemon', '--inspect', '--enable-source-maps', '--watch', './simulator/server', '--ignore', './simulator/server/public', './simulator/server/server.js', '"' + cwd + '"', isDev ? 'development' : 'production'], {
        //     cwd,
        //     // the important part is the 4th option 'ipc'
        //     // this way `process.send` will be available in the child process (nodemon)
        //     // so it can communicate back with parent process (through `.on()`, `.send()`)
        //     // https://nodejs.org/api/child_process.html#child_process_options_stdio
        //     stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
        // })

        // serverApp.on('error', (err) => {
        //     console.error(err);
        // })
        // serverApp.on('message', (event) => {
        //     console.error(event);
        // })


        // rs(serverApp);
        runScript(cd, cmd, async (err, sigint) => {
            if (err) {
                console.error(err);
                rj(err);
                return;
            }
            // console.log("Finished loading ACOS Simulator.");


            rs(true);
        })

        let buildPath = path.join(cwd, '/builds');
        let gameSettings = path.join(cwd, '/game-settings.json');
        console.log("------------------------------------------------------------------------------");
        console.log("-");
        console.log("-\tACOS Simulator Started\t\t");
        console.log("-");
        console.log('-\tProject:\t' + cwd);
        console.log('-\tBuild:\t\t' + buildPath);
        console.log('-\tSettings:\t' + gameSettings);
        console.log("-");
        console.log("-\tOpen browser:\thttp://localhost:3300/");
        console.log("-");
        console.log("------------------------------------------------------------------------------");
    });
}

function runClient(isDev) {
    return new Promise(async (rs, rj) => {

        // console.log("[ACOS] Starting Simulator Client");

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

        // console.log("[ACOS] Starting Simulator BrowserSync");
        let cmd = '';

        let waitOnPath = path.join(__dirname, 'node_modules/.bin/wait-on')
        let browserSyncPath = path.join(__dirname, 'node_modules/.bin/browser-sync')

        if (isDev) {
            let serverPublicFiles = "--files=" + path.join(__dirname, './simulator/server/public');
            cmd = `${waitOnPath} http://localhost:3100/ && ${browserSyncPath} start --no-ghost-mode --ws --port 3300 --ui-port 3201 --proxy localhost:3100  ${serverPublicFiles}`;
        }
        else {
            let gameClientPath = path.join(cwd, '/game-client/**');
            let buildsClientPath = path.join(cwd, '/builds/client/**');
            let projectNodeModulePath = path.join(cwd, '/node_modules');
            cmd = `${waitOnPath} http://localhost:3100/ && ${browserSyncPath} start --no-ghost-mode --ws  --port 3300 --ui-port 3301 --proxy localhost:3100 --files=${gameClientPath} --files=${buildsClientPath}  --ignore=${projectNodeModulePath}`;

        }

        // console.log("Running command: ", cmd);
        // console.log("Running BrowserSync: ", cmd);
        runScript(cd, cmd, (err) => {
            if (err) {
                console.error(err);
                rj(err);
                return;
            }
            // console.log("Finished loading BrowserSync.");
            rs(true);
        }, { silent: true })
    })
}

//doesn't work properly
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

//doesn't work properly
function runBrowserOpenDevTools() {
    return new Promise((rs, rj) => {

        // let url = 'devtools://devtools/bundled/inspector.html?experiments=true&v8only=true&ws=127.0.0.1:10000';
        // let url = "http://localhost:3100/devtools";
        let url = "chrome://inspect";
        console.log("[ACOS] Opening browser to devtools: ", url);
        let cmd = `start ${url}`;

        // require('child_process').exec(cmd);

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
        // console.log("[ACOS] Starting Deploy to ACOS.games");
        let buildPath = path.join(cwd, '/builds');
        let gameSettings = path.join(cwd, '/game-settings.json');
        let args = process.argv.splice(3, process.argv.length - 2);
        // console.log(args, process.argv.length);
        let argsStr = args.join(' ') + ' --buildPath=' + buildPath + ' --settings=' + gameSettings;
        // console.log("Running Deploy: ", cmd + ' ' + argsStr);
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


// console.log("[ACOS] RUNNING COMMAND!!!: ", command);

function processACOSCommand() {

    if (acosCommand == '') {
        runServer(false);
        // runClient();


        runBrowserSync(false);
        // runBrowserOpen();


    }
    else if (acosCommand == 'dev') {

        runServer(true);
        runClient(true);
        runBrowserSync(true);
        runBrowserSync(false);
        // runBrowserOpenDevTools();
    }
    else if (acosCommand == 'deploy') {
        runDeploy();
    }
}

processACOSCommand();