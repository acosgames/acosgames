#!/usr/bin/env node
const shelljs = require("shelljs");
const path = require('path');

var children = [];

const cwd = process.cwd();
const cd = __dirname;

process.on('SIGINT', function () {
    console.log('SIGINT');

    for (var i = 0; i < children.length; i++) {
        let child = children[i];
        if (child) {
            child.kill()
            console.log("Killing child: ", i)
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
        callback({ code, signal });
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

function runServer() {
    return new Promise(async (rs, rj) => {


        const cmd = `npx nodemon --inspect --enable-source-maps --watch ./simulator ./simulator/server.js "${cwd}"`;
        console.log("STARTING ACOSGAMES SIMULATOR >>>>>>>", cmd);

        runScript(cd, cmd, async (err) => {
            if (err) {
                console.error(err);
                rj(err);
                return;
            }
            console.log("Finished loading script.");

            await runBrowserSync();

            rs(true);
        })
    })
}

function runBrowserSync() {
    return new Promise((rs, rj) => {


        let gameClientPath = path.join(cwd, '/game-client/**');
        let buildsClientPath = path.join(cwd, '/builds/client/**');
        let projectNodeModulePath = path.join(cwd, '/node_modules');
        const cmd = `npx wait-on http://localhost:3100/ && npx browser-sync start --no-ghost-mode --ws --port 3200 --proxy localhost:3100 --files=${gameClientPath} --files=${buildsClientPath} --ignore=${projectNodeModulePath}`;
        console.log("Running node command: ", cmd);
        runScript(cd, cmd, (err) => {
            if (err) {
                console.error(err);
                rj(err);
                return;
            }
            console.log("Finished loading script.");
            rs(true);
        })
    })
}

function runDeploy() {
    return new Promise((rs, rj) => {

        runScript(cd, `npx nodemon --inspect --enable-source-maps --watch ${cwd}/game-server --watch ./simulator ./simulator/server.js`, (err) => {
            if (err) {
                console.error(err);
                rj(err);
                return;
            }
            console.log("Finished loading script.");
            rs(true);
        })
    })
}

function getCommand(argv) {
    return argv.length <= 2 ? "" : argv[2];
}

const command = getCommand(process.argv);
console.log("RUNNING COMMAND: ", command);
if (command == '') {
    runServer();
}