
const axios = require('axios');
const path = require('path');
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const fs = require('fs');
// var FormDataEncoder = require('form-data-encoder');
const { Readable } = require("stream");
const argv = yargs(hideBin(process.argv)).argv


// import got from 'got';
// let got = null;



// import('got')
//     .then((module) => {
//         got = module.default();
//         // → logs 'Hi from the default export!'
//         //   module.doStuff();
//         // → logs 'Doing stuff…'
//     });

// let type = process.argv[process.argv.length - 2];
// let apikey = process.argv[process.argv.length - 1];

let screentype = argv.screentype || 1;
let resow = argv.resow || 4;
let resoh = argv.resoh || 4;
let screenwidth = argv.screenwidth || 1200;

let buildPath = argv.buildPath || path.join(process.cwd(), '/builds');
let isScaled = argv.scaled || false;
let apikey = argv._[0];
let isLocal = argv.local || false;

let settingsPath = argv.settings || path.join(process.cwd(), '/game-settings.json');

// console.log(process.argv);
console.log(argv);

// console.log("parsed: apikey=", apikey, ", isScaled=", isScaled);

// let settingsPath = path.join(gameWorkingDirectory, './game-settings.json');

async function deployAll(got, FormData, FormDataEncoder) {
    let url = 'http://localhost:8080/api/v1/dev/update/game/bundle/';
    if (!isLocal) {
        url = 'https://acos.games/api/v1/dev/update/game/bundle/';
    }

    let contentLength = 0;


    console.log("[ACOS] current working directory: ", buildPath)
    let clientFilePath = path.join(buildPath, '/client/client.bundle.js');
    var clientFile = fs.createReadStream(clientFilePath);
    let clientFileSize = fs.statSync(clientFilePath).size;
    contentLength += clientFileSize;
    clientFileSize = (clientFileSize / 1000).toFixed(2)

    var form_data = new FormData();

    form_data.set("client", {
        type: "application/javascript",
        name: "client.bundle.js",
        [Symbol.toStringTag]: "File",
        stream() {
            return clientFile
        }
    })


    let hasDb = false;
    let dbFileSize = 0;
    try {
        let dbFilePath = path.join(buildPath, '../game-server/database.json');
        if (!fs.existsSync(dbFilePath)) {
            //file exists
            console.warn('[ACOS] No database exists. It is optional, but this is a reminder just incase you forgot it.  Format should be `./game-server/database.json`')
        }
        else {
            dbFileSize = fs.statSync(dbFilePath).size;
            contentLength += dbFileSize;
            dbFileSize = (dbFileSize / 1000).toFixed(2)

            var dbFile = fs.createReadStream(dbFilePath);
            form_data.set("server", {
                type: "application/javascript",
                name: "database.json",
                [Symbol.toStringTag]: "File",
                stream() {
                    return dbFile
                }
            })
            hasDb = true;
        }
    } catch (err) {
        console.error(err)
    }


    let serverFilePath = path.join(buildPath, '/server/server.bundle.js');
    let serverFileSize = fs.statSync(serverFilePath).size;
    var serverFile = fs.createReadStream(serverFilePath);
    contentLength += serverFileSize;
    serverFileSize = (serverFileSize / 1000).toFixed(2)
    // form_data.append("server", serverFile);
    form_data.set("server", {
        type: "application/javascript",
        name: "server.bundle.js",
        [Symbol.toStringTag]: "File",
        stream() {
            return serverFile
        }
    })

    let encoder = new FormDataEncoder(form_data);
    let headers = JSON.parse(JSON.stringify(encoder.headers));

    try {
        if (!fs.existsSync(settingsPath)) {
            console.warn('[ACOS] No game-settings exists. It is optional, but this is a reminder just incase you forgot it.  File path should be `./game-server/database.json`', settingsPath)
        }
        else {
            var settingsFile = fs.readFileSync(settingsPath, 'utf-8');
            let settings = JSON.parse(settingsFile);
            headers['X-GAME-SETTINGS'] = JSON.stringify(settings); //puts json into a single line
        }
    } catch (err) {
        console.error(err)
    }

    headers['X-GAME-API-KEY'] = apikey || '';
    headers['X-GAME-HASDB'] = hasDb ? 'yes' : 'no';
    // headers['Content-Length'] = contentLength;

    // console.log("headers", headers);
    // console.log("encoder", encoder);

    try {
        const stream = got.stream.post(url, {
            body: Readable.from(encoder),
            headers,
        });


        let s3LoadedLength = 0;
        let s3Percent = 0;

        let prevPct = 0;
        let actualContentLength = 0;

        // stream.resume();
        stream.on('uploadProgress', progress => {

            let pct = progress.transferred / contentLength;
            pct = Math.min(99, Math.round(pct * 100)) * 0.8;
            if (pct == prevPct)
                return;

            console.log("[ACOS] progress: ", progress);
            process.stdout.write("[ACOS] Uploading... " + pct + "%\r");
            // console.log("Uploading...", pct + '%');

            prevPct = pct;

            actualContentLength = progress.transferred;
            if (progress.percent == 1) {
                actualContentLength = progress.transferred;
                // process.exit(0);
            }
        });

        const { Transform } = require('node:stream');

        const processResponseChunk = (json) => {
            if (json?.game_slug) {

                // if (response.headers.age > 3600) {
                //     console.log('Failure - response too old');
                //     readStream.destroy(); // Destroy the stream to prevent hanging resources.
                //     return;
                // }
                process.stdout.write("[ACOS] Uploading... 100%\n");

                console.log("[ACOS] Uploaded client.bundle.js: " + clientFileSize + ' kb')
                console.log("[ACOS] Uploaded server.bundle.js: " + serverFileSize + ' kb')
                if (dbFileSize > 0)
                    console.log("[ACOS] Uploaded database.json:" + dbFileSize + ' kb')

                let filesizeInMB = (contentLength / 1000).toFixed(2);
                console.log("[ACOS] Total uploaded: " + filesizeInMB + ' kb')
                // console.log("Uploading... 100%")

                // let responseData = JSON.parse(response.body);


                console.log(`[ACOS] Deployed Game Information: `, JSON.stringify(json));
                console.log(`[ACOS] Deployed version ${json.version} successfully`);


            }
        }
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


        stream.on('data', function (data) {
            console.log('DATA: ', data);

            // console.log(data);
            let output = Buffer.from(data).toString('utf-8');
            console.log("stream:", output);

            let jsons = output.split('\n');

            for (let jsonStr of jsons) {
                if (!jsonStr || jsonStr.length == 0)
                    continue;
                let json = JSON.parse(jsonStr);
                processResponseChunk(json);
            }

        })

        stream.on('response', async response => {



            // response.pipe(myTransform);


            // process.exit(0);
            stream.off('error', console.error);
        })

        stream.on('error', (err) => { console.error(err); });
    }
    catch (e) {
        console.error(e);
    }

    // let config = {
    //     url,
    //     method: 'post',
    //     headers,
    //     data: form_data,
    //     onUploadProgress: function (progressEvent) {
    //         var percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
    //         console.log(percentCompleted)
    //     }
    // }
    // try {
    //     let response = await axios.request(config);
    //     let ver = response.data;
    //     console.log(`[ACOS] Deployed Game Information: `, ver);
    //     console.log(`[ACOS] Deployed version ${ver.version} successfully`);
    //     // console.log(`[ACOS] Screen Type: ${ver.screentype}${ver.screentype > 1 ? (', Resolution: ' + ver.resow + ':' + ver.resoh) : ''}${ver.screentype == 3 ? (', Width: ' + ver.screenwidth + 'px') : ''}`);
    // }
    // catch (e) {
    //     console.error('[ACOS] Error Deploying:', e);
    // }

    // process.exit(0);
}

async function run() {

    (async () => {
        const moduleSpecifier = 'got';
        let module = await import(moduleSpecifier)
        // got = module.got;

        let module2 = await import('formdata-node')
        // var FormData = require('formdata-node');

        let module3 = await import('form-data-encoder');

        // var FormDataEncoder = require('form-data-encoder');

        // // → logs 'Hi from the default export!'
        // module.doStuff();
        // → logs 'Doing stuff…'

        await deployAll(module.got, module2.FormData, module3.FormDataEncoder);
    })();


}
run();
// deploy(type);
