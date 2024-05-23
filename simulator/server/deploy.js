const axios = require("axios");
const path = require("path");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const fs = require("fs");
// var FormDataEncoder = require('form-data-encoder');
const argv = yargs(hideBin(process.argv)).argv;
const { Readable, PassThrough } = require("stream");
const { Transform } = require("node:stream");

let screentype = argv.screentype || 1;
let resow = argv.resow || 4;
let resoh = argv.resoh || 4;
let screenwidth = argv.screenwidth || 1200;

let buildPath = argv.buildPath || path.join(process.cwd(), "/builds");
let isScaled = argv.scaled || false;
let apikey = argv._[0];
let isLocal = argv.local || false;

let settingsPath =
    argv.settings || path.join(process.cwd(), "/game-settings.json");

// console.log(argv);

// const myTransform = new Transform({
//     transform(chunk, encoding, callback) {

//         try {
//             // console.log(chunk, encoding);
//             let output = Buffer.from(chunk).toString('utf-8');
//             // console.log("stream:", output);

//             let jsons = output.split('\n');

//             for (let jsonStr of jsons) {
//                 let json = JSON.parse(jsonStr);

//                 if( json?.loaded ) {
//                     s3LoadedLength -=
//                 }
//                 processResponseChunk(json);
//             }
//             // let json = JSON.parse(output);

//             callback(null, chunk);
//         }
//         catch (e) {
//             console.error(e);
//         }
//     }
// });

function setFormData(formData, filename, fileStream) {
    formData.set(filename, {
        type: "application/octet-stream",
        name: filename,
        // size: assetFileSize,
        [Symbol.toStringTag]: "File",
        stream() {
            return fileStream;
        },
    });
}

const mergeStreams = (...streams) => {
    let pass = new PassThrough();
    for (let stream of streams) {
        const end = stream == streams.at(-1);
        pass = stream.pipe(pass, { end });
    }
    return pass;
};

async function pipe(tap, sink) {
    return new Promise((resolve, reject) => {
        tap.pipe(sink, { end: false });
        tap.on("end", resolve);
        tap.on("error", reject);
    });
}

const removeNewLine = new Transform({
    transform(chunk, encoding, callback) {
        this.push(chunk.toString().replace(/\n|\r\n/g, ""));
        callback();
    },
});

async function deployAll(got, FormData, FormDataEncoder) {
    let game_slug = "";
    let apikeyParts = apikey.split(".");
    if (apikeyParts.length == 2) {
        game_slug = apikeyParts[0];
    }
    let url = "http://localhost:8080/api/v1/dev/update/game/bundle/";
    if (!isLocal) {
        url = "https://acos.games/api/v1/dev/update/game/bundle/";
    }

    console.log("----------------------------------------------------------");
    console.log(" ");
    console.log("[ACOS] Deploying ", game_slug, "to", url);
    console.log(" ");

    let form_data = new FormData();
    let contentLength = 0;

    let filesizes = "";

    //combine all css files to inject into client.bundle.js
    let cssStreams = [];
    let cssStreamLengths = [];

    let hasCSS = false;
    //VALIDATE ASSETS FOLDER IS FLATTENED
    try {
        let assetFolderPath = path.join(buildPath, "/assets");
        const assetDirectory = fs.opendirSync(assetFolderPath);
        let assetFile;
        while ((assetFile = assetDirectory.readSync()) !== null) {
            let isDir = fs
                .lstatSync(path.join(assetFolderPath, assetFile.name))
                .isDirectory();

            if (isDir) {
                console.log(assetFile);
                throw "[ERROR] [ACOS] Your builds/assets folder has directories.  Assets should only be in the '/builds/assets' root folder.";
            }
            // console.log(assetFile.name, assetFile.isDirectory())
        }
        assetDirectory.closeSync();

        //UPLOAD ASSETS
        let assetNames = {};
        const assetDirectory2 = fs.opendirSync(assetFolderPath);
        let assetFile2;
        let assetData = {};
        while ((assetFile2 = assetDirectory2.readSync()) !== null) {
            let filename = assetFile2.name;
            if (filename.endsWith(".js") || filename == "database.json")
                continue;

            let assetFilePath = path.join(assetFolderPath, filename);

            if (filename.endsWith(".css")) {
                hasCSS = true;
                //     let fileRawData = fs.readFileSync(assetFilePath, "utf-8");
                //     // cssString += fileRawData;
                //     cssStreamLengths.push(fs.statSync(assetFilePath).size);
                //     cssStreams.push(fs.createReadStream(assetFilePath));
                //     continue;
            }

            let assetFileSize = fs.statSync(assetFilePath).size;
            var assetFileContent = fs.createReadStream(assetFilePath);
            contentLength += assetFileSize;
            assetNames[filename] = assetFileSize;
            filesizes += filename + "=" + assetFileSize + ";";
            assetFileSize = (assetFileSize / 1000).toFixed(2);

            setFormData(form_data, filename, assetFileContent);

            // console.log(assetFile.name, assetFile.isDirectory())
        }
        assetDirectory2.closeSync();
    } catch (e) {
        console.log("[ACOS] No assets found.");
    }

    //UPLOAD CLIENT
    console.log("[ACOS] current working directory: ", buildPath);
    let clientFilePath = path.join(buildPath, "/client.bundle.js");
    var clientFile = fs.createReadStream(clientFilePath);
    let clientFileSize = fs.statSync(clientFilePath).size;
    contentLength += clientFileSize;
    filesizes += "client.bundle.js=" + clientFileSize + ";";
    clientFileSize = (clientFileSize / 1000).toFixed(2);

    const passthrough = new PassThrough();

    //inject css files if exists at top of file
    // if (cssStreams.length > 0) {
    //     const cssPrefixString = `(function(){"use strict";try{if(typeof document<"u"){var e=document.createElement("style");e.appendChild(document.createTextNode('`;
    //     const cssPrefix = Readable.from(cssPrefixString);
    //     const cssSuffixString = `')),document.head.appendChild(e)}}catch(o){console.error("[ACOS] CSS Injection failed to client.bundle.js",o)}})();\n`;
    //     const cssSuffix = Readable.from(cssSuffixString);
    //     clientFileSize += Buffer.byteLength(cssPrefixString, "utf8");
    //     clientFileSize += Buffer.byteLength(cssSuffixString, "utf8");
    //     await pipe(cssPrefix, passthrough);
    //     for (let i = 0; i < cssStreams.length; i++) {
    //         clientFileSize += cssStreamLengths[i];
    //         await pipe(cssStreams[i].pipe(removeNewLine), passthrough);
    //     }
    //     await pipe(cssSuffix, passthrough);
    // }

    // await pipe(clientFile, passthrough);
    clientFile.pipe(passthrough);

    // passthrough.emit("end");

    form_data.set("client", {
        type: "application/javascript",
        name: "client.bundle.js",
        // size: clientFileSize,
        [Symbol.toStringTag]: "File",
        stream() {
            return passthrough;
        },
    });

    //UPLOAD Client Sourcemap
    let clientSourcemapFilePath = path.join(buildPath, "/client.bundle.js.map");
    let clientSourcemapFileSize = fs.statSync(clientSourcemapFilePath).size;
    var clientSourcemapFile = fs.createReadStream(clientSourcemapFilePath);
    contentLength += clientSourcemapFileSize;
    filesizes += "client.bundle.js.map=" + clientSourcemapFileSize + ";";
    clientSourcemapFileSize = (clientSourcemapFileSize / 1000).toFixed(2);
    form_data.set("clientmap", {
        type: "application/javascript",
        name: "client.bundle.js.map",
        // size: serverFileSize,
        [Symbol.toStringTag]: "File",
        stream() {
            return clientSourcemapFile;
        },
    });

    //UPLOAD DATABASE
    let hasDb = false;
    let dbFileSize = 0;
    try {
        let dbFilePath = path.join(buildPath, "../game-server/database.json");
        if (!fs.existsSync(dbFilePath)) {
            console.warn(
                "[ACOS] No database exists. It is optional, but this is a reminder just incase you forgot it.  File should be at `./game-server/database.json`"
            );
        } else {
            dbFileSize = fs.statSync(dbFilePath).size;
            contentLength += dbFileSize;
            filesizes += "database.json=" + dbFileSize + ";";
            dbFileSize = (dbFileSize / 1000).toFixed(2);

            var dbFile = fs.createReadStream(dbFilePath);
            form_data.set("db", {
                type: "application/javascript",
                name: "database.json",
                // size: dbFileSize,
                [Symbol.toStringTag]: "File",
                stream() {
                    return dbFile;
                },
            });

            hasDb = true;
        }
    } catch (err) {
        console.error(err);
    }

    //UPLOAD SERVER
    let serverFilePath = path.join(buildPath, "/server.bundle.js");
    let serverFileSize = fs.statSync(serverFilePath).size;
    var serverFile = fs.createReadStream(serverFilePath);
    contentLength += serverFileSize;
    filesizes += "server.bundle.js=" + serverFileSize + ";";
    serverFileSize = (serverFileSize / 1000).toFixed(2);
    form_data.set("server", {
        type: "application/javascript",
        name: "server.bundle.js",
        // size: serverFileSize,
        [Symbol.toStringTag]: "File",
        stream() {
            return serverFile;
        },
    });

    //BUILD HEADERS
    let encoder = new FormDataEncoder(form_data);
    let headers = JSON.parse(JSON.stringify(encoder.headers));

    //ADD GAMESETTINGS HEADER
    try {
        if (!fs.existsSync(settingsPath)) {
            console.error(
                "[ACOS] game-settings.json is missing. File path should be `<project>/game-settings.json`.",
                settingsPath
            );
            return false;
        } else {
            var settingsFile = fs.readFileSync(settingsPath, "utf-8");
            let settings = JSON.parse(settingsFile);
            headers["X-GAME-SETTINGS"] = JSON.stringify(settings); //puts json into a single line
        }
    } catch (err) {
        console.error(err);
    }

    //API KEY HEADER
    headers["X-GAME-API-KEY"] = apikey || "";

    //HAS DATABASE HEADER
    headers["X-GAME-HASDB"] = hasDb ? "yes" : "no";

    //HAS CSS HEADER
    headers["X-GAME-HASCSS"] = hasCSS ? "yes" : "no";

    headers["X-GAME-FILESIZES"] = filesizes;

    try {
        console.log(" ");

        //BEGIN HTTP UPLOAD
        const stream = got.stream.post(url, {
            body: Readable.from(encoder),
            headers,
        });

        let prevPct = 0;
        let actualContentLength = 0;
        let s3ContentLength = 0;
        let s3Percent = 0;

        let fileLengths = {};

        //TRACK UPLOAD PROGRESS TO WEBSERVER
        stream.on("uploadProgress", (progress) => {
            let pct = progress.transferred / contentLength;
            pct = Math.min(100, Math.round(pct * 100)) * 0;
            if (pct == prevPct) return;

            // console.log("[ACOS] progress: ", progress);
            process.stdout.write(
                "[ACOS] Uploading... " +
                    Math.round(
                        Number.parseInt(pct) + Number.parseInt(s3Percent)
                    ) +
                    "%\r"
            );

            if (pct >= 99) {
                // process.stdout.write("[ACOS] Uploading to webserver... 100%\n");
            }

            prevPct = pct;
            actualContentLength = progress.transferred;
        });

        //TRACK UPLOAD PROGRESS TO S3
        const processResponseChunk = (json) => {
            if (json?.error) {
                console.log("[ACOS] Upload failed: ");
                console.log(json.error);
                console.log(" ");
                console.log(
                    "----------------------------------------------------------"
                );
                return false;
            } else if (json?.ecode) {
                // console.log(())
            } else if (json?.loaded) {
                fileLengths[json.key] = json.loaded;

                s3ContentLength = 0;
                for (const key in fileLengths) {
                    s3ContentLength += fileLengths[key];
                }

                s3Percent = s3ContentLength / contentLength;
                s3Percent = Math.min(100, Math.round(s3Percent * 100)) * 1;

                // process.stdout.write("[ACOS] Uploading... " + Math.round(Number.parseInt(prevPct) + Number.parseInt(s3Percent)) + "%\r");
            } else if (json?.exists) {
                fileLengths[json.key] = json.size;
                fsize = (json.size / 1000).toFixed(2) + " kb";
                fsize = fsize.padEnd(13, " ");
                console.log("[ACOS] Exists:   ", fsize, json.key);
            } else if (json?.ETag) {
                let fsize = fileLengths[json.key];
                fsize = (fsize / 1000).toFixed(2) + " kb";
                fsize = fsize.padEnd(13, " ");
                console.log("[ACOS] Uploaded: ", fsize, json.key);
            } else if (json?.maxplayers) {
                // process.stdout.write("[ACOS] Uploading... 100%\n");

                // console.log("[ACOS] Uploaded client.bundle.js: " + clientFileSize + ' kb')
                // console.log("[ACOS] Uploaded server.bundle.js: " + serverFileSize + ' kb')

                // if (dbFileSize > 0)
                //     console.log("[ACOS] Uploaded database.json:" + dbFileSize + ' kb')

                // for (const assetName in assetNames) {
                //     let fsize = assetNames[assetName];
                //     fsize = (fsize / 1000).toFixed(2)
                //     console.log("[ACOS] Uploaded " + assetName + ": " + fsize + ' kb')
                // }

                let filesizeInMB = (s3ContentLength / 1000).toFixed(2) + " kb";
                // filesizeInMB = fsize.padEnd(12, ' ');
                console.log("[ACOS] Total:     " + filesizeInMB);

                console.log(" ");

                console.log(
                    `[ACOS] Deployed Game Information: `,
                    JSON.stringify(json)
                );
                console.log(" ");
                console.log(
                    `[ACOS] Deployed version ${json.version} successfully`
                );
                console.log(" ");

                if (json.gameid) {
                    if (isLocal) {
                        console.log(
                            "[ACOS] Manage your game online at: http://localhost:8000:/dev/game/" +
                                json.gameid
                        );
                        console.log(" ");
                        console.log(
                            "[ACOS] Play your game online at: http://localhost:8000/g/" +
                                json.game_slug
                        );
                        console.log(" ");
                    } else {
                        console.log(
                            "[ACOS] Manage your game online at: https://acos.games/dev/game/" +
                                json.gameid
                        );
                        console.log(" ");
                        console.log(
                            "[ACOS] Play your game online at: https://acos.games/g/" +
                                json.game_slug
                        );
                        console.log(" ");
                    }
                }
                console.log(
                    "----------------------------------------------------------"
                );
            }

            return true;
        };

        //TRACK HTTP RESPONSE STREAM
        stream.on("data", function (data) {
            // console.log('DATA: ', data);

            // console.log(data);
            let output = Buffer.from(data).toString("utf-8");
            // console.log("stream:", output);

            let jsons = output.split("\n");

            for (let jsonStr of jsons) {
                if (!jsonStr || jsonStr.length == 0) continue;
                let json = JSON.parse(jsonStr);

                if (!processResponseChunk(json)) {
                    stream.destroy();
                }
            }
        });

        //TRACK RESPONSE COMPLETED
        // stream.on('response', async response => {
        //     stream.off('error', console.error);
        // })

        stream.on("error", (err) => {
            console.error(err);
        });
    } catch (e) {
        console.error(e);
    }
}

async function run() {
    (async () => {
        let module = await import("got");
        let module2 = await import("formdata-node");
        let module3 = await import("form-data-encoder");

        try {
            await deployAll(
                module.got,
                module2.FormData,
                module3.FormDataEncoder
            );
        } catch (e) {
            console.error(e);
        }
    })();
}

run();
