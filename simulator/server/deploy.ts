import axios from "axios";
import path from "path";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
import fs from "fs";
import { Readable, PassThrough, Transform } from "stream";

const argv = yargs(hideBin(process.argv)).parseSync();

let screentype: number = (argv.screentype as number) || 1;
let resow: number = (argv.resow as number) || 4;
let resoh: number = (argv.resoh as number) || 4;
let screenwidth: number = (argv.screenwidth as number) || 1200;

let buildPath: string = (argv.buildPath as string) || path.join(process.cwd(), "/builds");
let isScaled: boolean = (argv.scaled as boolean) || false;
let apikey: string = (argv._ as string[])[0] || "";
let isLocal: boolean = (argv.local as boolean) || false;

let settingsPath: string =
    (argv.settings as string) || path.join(process.cwd(), "/game-settings.json");

function setFormData(formData: any, filename: string, fileStream: any): void {
    formData.set(filename, {
        type: "application/octet-stream",
        name: filename,
        [Symbol.toStringTag]: "File",
        stream() {
            return fileStream;
        },
    });
}

const mergeStreams = (...streams: NodeJS.ReadableStream[]): PassThrough => {
    let pass = new PassThrough();
    for (const stream of streams) {
        const end = stream === streams[streams.length - 1];
        pass = (stream as any).pipe(pass, { end });
    }
    return pass;
};

async function pipe(tap: NodeJS.ReadableStream, sink: NodeJS.WritableStream): Promise<void> {
    return new Promise((resolve, reject) => {
        tap.pipe(sink as any, { end: false });
        tap.on("end", resolve as any);
        tap.on("error", reject);
    });
}

const removeNewLine = new Transform({
    transform(chunk: any, encoding: any, callback: () => void) {
        this.push(chunk.toString().replace(/\n|\r\n/g, ""));
        callback();
    },
});

async function deployAll(got: any, FormData: any, FormDataEncoder: any): Promise<void> {
    let game_slug = "";
    const apikeyParts = apikey.split(".");
    if (apikeyParts.length === 2) {
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

    const form_data = new FormData();
    let contentLength = 0;
    let filesizes = "";
    let hasCSS = false;

    //VALIDATE ASSETS FOLDER IS FLATTENED
    try {
        const assetFolderPath = path.join(buildPath, "/assets");
        const assetDirectory = fs.opendirSync(assetFolderPath);
        let assetFile;
        while ((assetFile = assetDirectory.readSync()) !== null) {
            const isDir = fs
                .lstatSync(path.join(assetFolderPath, assetFile.name))
                .isDirectory();

            if (isDir) {
                console.log(assetFile);
                throw "[ERROR] [ACOS] Your builds/assets folder has directories. Assets should only be in the '/builds/assets' root folder.";
            }
        }
        assetDirectory.closeSync();

        //UPLOAD ASSETS
        const assetDirectory2 = fs.opendirSync(assetFolderPath);
        let assetFile2;
        while ((assetFile2 = assetDirectory2.readSync()) !== null) {
            const filename = assetFile2.name;
            if (filename.endsWith(".js") || filename === "database.json") continue;

            const assetFilePath = path.join(assetFolderPath, filename);

            if (filename.endsWith(".css")) {
                hasCSS = true;
            }

            let assetFileSize = fs.statSync(assetFilePath).size;
            const assetFileContent = fs.createReadStream(assetFilePath);
            contentLength += assetFileSize;
            filesizes += filename + "=" + assetFileSize + ";";
            assetFileSize = Number((assetFileSize / 1000).toFixed(2));

            setFormData(form_data, filename, assetFileContent);
        }
        assetDirectory2.closeSync();
    } catch (e) {
        console.log("[ACOS] No assets found.");
    }

    //UPLOAD CLIENT
    console.log("[ACOS] current working directory: ", buildPath);
    const clientFilePath = path.join(buildPath, "/client.bundle.js");
    const clientFile = fs.createReadStream(clientFilePath);
    let clientFileSize = fs.statSync(clientFilePath).size;
    contentLength += clientFileSize;
    filesizes += "client.bundle.js=" + clientFileSize + ";";
    clientFileSize = Number((clientFileSize / 1000).toFixed(2));

    const passthrough = new PassThrough();
    clientFile.pipe(passthrough);

    form_data.set("client", {
        type: "application/javascript",
        name: "client.bundle.js",
        [Symbol.toStringTag]: "File",
        stream() {
            return passthrough;
        },
    });

    //UPLOAD Client Sourcemap
    const clientSourcemapFilePath = path.join(buildPath, "/client.bundle.js.map");
    let clientSourcemapFileSize = fs.statSync(clientSourcemapFilePath).size;
    const clientSourcemapFile = fs.createReadStream(clientSourcemapFilePath);
    contentLength += clientSourcemapFileSize;
    filesizes += "client.bundle.js.map=" + clientSourcemapFileSize + ";";
    clientSourcemapFileSize = Number((clientSourcemapFileSize / 1000).toFixed(2));
    form_data.set("clientmap", {
        type: "application/javascript",
        name: "client.bundle.js.map",
        [Symbol.toStringTag]: "File",
        stream() {
            return clientSourcemapFile;
        },
    });

    //UPLOAD DATABASE
    let hasDb = false;
    let dbFileSize = 0;
    try {
        const dbFilePath = path.join(buildPath, "../game-server/database.json");
        if (!fs.existsSync(dbFilePath)) {
            console.warn(
                "[ACOS] No database exists. It is optional, but this is a reminder just incase you forgot it. File should be at `./game-server/database.json`"
            );
        } else {
            dbFileSize = fs.statSync(dbFilePath).size;
            contentLength += dbFileSize;
            filesizes += "database.json=" + dbFileSize + ";";
            dbFileSize = Number((dbFileSize / 1000).toFixed(2));

            const dbFile = fs.createReadStream(dbFilePath);
            form_data.set("db", {
                type: "application/javascript",
                name: "database.json",
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
    const serverFilePath = path.join(buildPath, "/server.bundle.js");
    let serverFileSize = fs.statSync(serverFilePath).size;
    const serverFile = fs.createReadStream(serverFilePath);
    contentLength += serverFileSize;
    filesizes += "server.bundle.js=" + serverFileSize + ";";
    serverFileSize = Number((serverFileSize / 1000).toFixed(2));
    form_data.set("server", {
        type: "application/javascript",
        name: "server.bundle.js",
        [Symbol.toStringTag]: "File",
        stream() {
            return serverFile;
        },
    });

    //BUILD HEADERS
    const encoder = new FormDataEncoder(form_data);
    const headers: Record<string, string> = JSON.parse(JSON.stringify(encoder.headers));

    //ADD GAMESETTINGS HEADER
    try {
        if (!fs.existsSync(settingsPath)) {
            console.error(
                "[ACOS] game-settings.json is missing. File path should be `<project>/game-settings.json`.",
                settingsPath
            );
            return;
        } else {
            const settingsFile = fs.readFileSync(settingsPath, "utf-8");
            const settings = JSON.parse(settingsFile);
            headers["X-GAME-SETTINGS"] = JSON.stringify(settings);
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
        const fileLengths: Record<string, number> = {};

        //TRACK UPLOAD PROGRESS TO WEBSERVER
        stream.on("uploadProgress", (progress: any) => {
            let pct = progress.transferred / contentLength;
            pct = Math.min(100, Math.round(pct * 100)) * 0;
            if (pct === prevPct) return;

            process.stdout.write(
                "[ACOS] Uploading... " +
                    Math.round(Number.parseInt(String(pct)) + Number.parseInt(String(s3Percent))) +
                    "%\r"
            );

            prevPct = pct;
            actualContentLength = progress.transferred;
        });

        //TRACK UPLOAD PROGRESS TO S3
        const processResponseChunk = (json: any): boolean => {
            if (json?.error) {
                console.log("[ACOS] Upload failed: ");
                console.log(json.error);
                console.log(" ");
                console.log("----------------------------------------------------------");
                return false;
            } else if (json?.ecode) {
                // handle ecode
            } else if (json?.loaded) {
                fileLengths[json.key] = json.loaded;

                s3ContentLength = 0;
                for (const key in fileLengths) {
                    s3ContentLength += fileLengths[key];
                }

                s3Percent = s3ContentLength / contentLength;
                s3Percent = Math.min(100, Math.round(s3Percent * 100)) * 1;
            } else if (json?.exists) {
                fileLengths[json.key] = json.size;
                let fsize: string = (json.size / 1000).toFixed(2) + " kb";
                fsize = fsize.padEnd(13, " ");
                console.log("[ACOS] Exists:   ", fsize, json.key);
            } else if (json?.ETag) {
                let fsize: string = (fileLengths[json.key] / 1000).toFixed(2) + " kb";
                fsize = fsize.padEnd(13, " ");
                console.log("[ACOS] Uploaded: ", fsize, json.key);
            } else if (json?.maxplayers) {
                const filesizeInMB = (s3ContentLength / 1000).toFixed(2) + " kb";
                console.log("[ACOS] Total:     " + filesizeInMB);
                console.log(" ");
                console.log(`[ACOS] Deployed Game Information: `, JSON.stringify(json));
                console.log(" ");
                console.log(`[ACOS] Deployed version ${json.version} successfully`);
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
                console.log("----------------------------------------------------------");
            }

            return true;
        };

        //TRACK HTTP RESPONSE STREAM
        stream.on("data", function (data: Buffer) {
            const output = Buffer.from(data).toString("utf-8");
            const jsons = output.split("\n");

            for (const jsonStr of jsons) {
                if (!jsonStr || jsonStr.length === 0) continue;
                const json = JSON.parse(jsonStr);

                if (!processResponseChunk(json)) {
                    stream.destroy();
                }
            }
        });

        stream.on("error", (err: Error) => {
            console.error(err);
        });
    } catch (e) {
        console.error(e);
    }
}

async function run(): Promise<void> {
    (async () => {
        const module1 = await import("got");
        const module2 = await import("formdata-node");
        const module3 = await import("form-data-encoder");

        try {
            await deployAll(module1.got, module2.FormData, module3.FormDataEncoder);
        } catch (e) {
            console.error(e);
        }
    })();
}

run();
