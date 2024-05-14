#!/usr/bin/env node
const shelljs = require("shelljs");
const path = require("path");
let { spawn } = require("child_process");

const fs = require("fs");

const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const argv = yargs(hideBin(process.argv)).argv;

var oldSpawn = spawn;
function mySpawn() {
    console.log("spawn called");
    console.log(arguments);
    var result = oldSpawn.apply(this, arguments);
    return result;
}
spawn = mySpawn;

var children = [];

const cwd = process.cwd();
const cd = __dirname;

// function getCommand(argv) {
//     return argv.length <= 2 ? "" : argv[2];
// }

const acosClientType = argv.client || "vite";
const acosCommand = argv._[0]; // getCommand(process.argv);
let serverApp = null;

function onExit() {
    console.log("[ACOS] SIGINT");

    // if (serverApp) {
    //     serverApp.send('quit');
    // }
    if (process.platform == "win32") {
        shelljs.exec("taskkill /t", {
            async: true,
        });
    }
    for (var i = 0; i < children.length; i++) {
        let child = children[i];
        if (child) {
            if (child.send) {
                child.send("quit");
            }
            child.kill();
            console.log("[ACOS] Killing child process: ", i);
        }
    }

    process.exit();
}
process.on("SIGINT", onExit);
process.on("SIGQUIT", onExit);
process.on("SIGTERM", onExit);
process.on("SIGUSR1", onExit);
process.on("SIGUSR2", onExit);
process.on("uncaughtException", onExit);

function runScript(dirPath, command, callback, options) {
    options = (options && Object.assign({ async: true }, options)) || {
        async: true,
    };
    // console.log("DirPath:", dirPath);
    // console.log("Command:", command);
    // console.log("Options:", options);
    // console.log("-------------");
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

    child.on("spawn", () => {
        callback();
    });

    child.on("error", (err) => {
        console.error("[SIMULATOR ERROR]", err);
        callback(err);
    });

    child.on("close", (code, signal) => {
        console.error("[SIMULATOR CLOSING]", code, signal);
        callback(null, { code, signal });
        // child.exit();
    });

    child.on("disconnect", () => {
        callback("disconnected");
    });

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
        let nodemonPath = path.join(__dirname, "node_modules/.bin/nodemon");
        if (!fs.existsSync(nodemonPath)) {
            nodemonPath = path.join(
                __dirname,
                "../../node_modules/.bin/nodemon"
            );
        }
        const cmd = `${nodemonPath} --inspect --enable-source-maps --watch ./simulator/server --ignore ./simulator/server/public ./simulator/server/server.js "${cwd}" ${
            isDev ? "development" : "production"
        } "${acosClientType}"`;
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
        runScript(
            cd,
            cmd,
            async (err, sigint) => {
                if (err) {
                    console.error(err);
                    rj(err);
                    return;
                }
                // console.log("Finished loading ACOS Simulator.");

                rs(true);
            }
            // { silent: !isDev }
        );

        let buildPath = path.join(cwd, "/builds");
        let gameSettings = path.join(cwd, "/game-settings.json");
        console.log(
            "\x1b[92m------------------------------------------------------------------------------\x1b[0m"
        );
        console.log("\x1b[92m-\x1b[0m");
        console.log(
            `\x1b[92m-\x1b[0m\t\x1b[93mACOS Simulator Started\x1b[0m\t\t`
        );
        console.log("\x1b[92m-\x1b[0m");
        if (isDev) {
            console.log("\x1b[92m-\x1b[0m\t\x1b[94mMode:\x1b[0m\tdevelopment");
        }
        console.log(
            "\x1b[92m-\x1b[0m\t\x1b[94mClient Type:\x1b[0m\t" + acosClientType
        );
        console.log("\x1b[92m-\x1b[0m\t\x1b[94mProject:\x1b[0m\t" + cwd);
        console.log("\x1b[92m-\x1b[0m\t\x1b[94mBuild:\x1b[0m\t\t" + buildPath);
        console.log(
            "\x1b[92m-\x1b[0m\t\x1b[94mSettings:\x1b[0m\t" + gameSettings
        );
        console.log("\x1b[92m-\x1b[0m");
        console.log(
            "\x1b[92m-\x1b[0m\t\x1b[93mOpen browser:\x1b[0m\t\x1b[96mhttp://localhost:3100/\x1b[0m"
        );
        console.log("\x1b[92m-\x1b[0m");
        console.log(
            "\x1b[92m------------------------------------------------------------------------------\x1b[0m"
        );
    });
}

function runClient(isDev) {
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
        });
    });
}

function runBrowserSync(isDev) {
    return new Promise((rs, rj) => {
        // console.log("[ACOS] Starting Simulator BrowserSync");
        let cmd = "";

        let waitOnPath = path.join(__dirname, "node_modules/.bin/wait-on");
        if (!fs.existsSync(waitOnPath)) {
            waitOnPath = path.join(
                __dirname,
                "../../node_modules/.bin/wait-on"
            );
        }

        let browserSyncPath = path.join(
            __dirname,
            "node_modules/.bin/browser-sync"
        );
        if (!fs.existsSync(browserSyncPath)) {
            browserSyncPath = path.join(
                __dirname,
                "../../node_modules/.bin/browser-sync"
            );
        }

        // if (isDev) {
        //     let serverPublicFiles =
        //         "--files=" + path.join(__dirname, "./simulator/server/public");
        //     cmd = `${waitOnPath} http://localhost:3100/ && ${browserSyncPath} start --no-ghost-mode --ws --port 3300 --ui-port 3201 --proxy localhost:3100  ${serverPublicFiles}`;
        //     // cmd = `${waitOnPath} http://localhost:3100/`;
        // }
        // else {
        let gameClientPath = path.join(cwd, "/game-client/**");
        let buildsClientPath = path.join(cwd, "/builds/client*");
        let projectNodeModulePath = path.join(cwd, "/node_modules");
        cmd = `${waitOnPath} http://localhost:3100/ && ${browserSyncPath} start --no-ghost-mode --ws  --port 3300 --ui-port 3301 --proxy localhost:3100 --no-open --files=${gameClientPath} --files=${buildsClientPath}  --ignore=${projectNodeModulePath}`;
        // }

        // console.log("Running command: ", cmd);
        // console.log("Running BrowserSync: ", cmd);
        runScript(
            cd,
            cmd,
            (err) => {
                if (err) {
                    console.error(err);
                    rj(err);
                    return;
                }
                // console.log("Finished loading BrowserSync.");
                rs(true);
            },
            { silent: true }
        );
    });
}

//doesn't work properly
function runBrowserOpen() {
    return new Promise((rs, rj) => {
        let url = "http://localhost:3100";
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
        });
    });
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
        });
    });
}

function runDeploy(isDev) {
    return new Promise((rs, rj) => {
        const cmd = `node --inspect ./simulator/server/deploy.js`;
        // console.log("[ACOS] Starting Deploy to ACOS.games");
        let buildPath = path.join(cwd, "/builds");
        let gameSettings = path.join(cwd, "/game-settings.json");
        let args = process.argv.splice(3, process.argv.length - 2);
        // console.log(args, process.argv.length);
        let argsStr =
            args.join(" ") +
            " --buildPath=" +
            buildPath +
            " --settings=" +
            gameSettings;
        // console.log("Running Deploy: ", cmd + ' ' + argsStr);
        runScript(cd, cmd + " " + argsStr, (err) => {
            if (err) {
                console.error(err);
                rj(err);
                return;
            }
            // console.log("Finished Deploy.");
            rs(true);
        });
    });
}

// console.log("[ACOS] RUNNING COMMAND!!!: ", command);

function processACOSCommand() {
    // console.log("[ACOS] Command: ", argv);
    if (acosCommand == "dev") {
        runServer(true);
        setTimeout(() => {
            runClient(true);
        }, 100);
        // runBrowserSync(true);
        if (acosClientType == "webpack" || acosClientType == "bundle")
            runBrowserSync(false);
        // runBrowserOpenDevTools();
    } else if (acosCommand == "deploy") {
        runDeploy();
    } else {
        runServer(false);
        // runClient();
        if (acosClientType == "webpack" || acosClientType == "bundle")
            runBrowserSync(false);
        // runBrowserOpen();
    }
}

processACOSCommand();
