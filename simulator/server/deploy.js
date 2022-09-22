
const axios = require('axios');
const path = require('path');
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const fs = require('fs');
var FormData = require('form-data');
const argv = yargs(hideBin(process.argv)).argv

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
// console.log(argv);

// console.log("parsed: apikey=", apikey, ", isScaled=", isScaled);

// let settingsPath = path.join(gameWorkingDirectory, './game-settings.json');

async function deployAll() {
    let url = 'http://localhost:8080/api/v1/dev/update/game/bundle/';
    if (!isLocal) {
        url = 'https://acos.games/api/v1/dev/update/game/bundle/';
    }

    console.log("[ACOS] current working directory: ", buildPath)
    let filepath = path.join(buildPath, '/client/client.bundle.js');
    var clientFile = fs.createReadStream(filepath);

    var form_data = new FormData();
    // form_data.append('apikey', apikey || '');
    // form_data.append('scaled', isScaled);
    form_data.append("client", clientFile);

    let hasDb = false;

    try {
        let filepath = path.join(buildPath, '../game-server/database.json');
        if (!fs.existsSync(filepath)) {
            //file exists
            console.warn('[ACOS] No database exists. It is optional, but this is a reminder just incase you forgot it.  Format should be `./game-server/database.json`')
        }
        else {
            var dbFile = fs.createReadStream(filepath);
            form_data.append("db", dbFile);
            hasDb = true;
        }
    } catch (err) {
        console.error(err)
    }





    let serverFilePath = path.join(buildPath, '/server/server.bundle.js');
    var serverFile = fs.createReadStream(serverFilePath);
    form_data.append("server", serverFile);

    let headers = form_data.getHeaders();
    headers['X-GAME-API-KEY'] = apikey || '';
    // headers['X-GAME-SCALED'] = isScaled ? 'yes' : 'no';

    try {
        if (!fs.existsSync(settingsPath)) {
            //file exists
            console.warn('[ACOS] No database exists. It is optional, but this is a reminder just incase you forgot it.  Format should be `./game-server/database.json`')
        }
        else {
            var settingsFile = fs.readFileSync(settingsPath, 'utf-8');
            let settings = JSON.parse(settingsFile);
            headers['X-GAME-SETTINGS'] = JSON.stringify(settings); //puts json into a single line
        }
    } catch (err) {
        console.error(err)
    }


    headers['X-GAME-SCREENTYPE'] = screentype;
    headers['X-GAME-RESOW'] = resow;
    headers['X-GAME-RESOH'] = resoh;
    headers['X-GAME-SCREENWIDTH'] = screenwidth;

    headers['X-GAME-HASDB'] = hasDb ? 'yes' : 'no';
    // console.log(headers);
    let config = {
        url,
        method: 'post',
        headers,
        data: form_data
    }
    try {
        let response = await axios.request(config);
        let ver = response.data;
        console.log(`[ACOS] Deployed Game Information: `, ver);
        console.log(`[ACOS] Deployed version ${ver.version} successfully`);
        // console.log(`[ACOS] Screen Type: ${ver.screentype}${ver.screentype > 1 ? (', Resolution: ' + ver.resow + ':' + ver.resoh) : ''}${ver.screentype == 3 ? (', Width: ' + ver.screenwidth + 'px') : ''}`);
    }
    catch (e) {
        console.error('[ACOS] Error Deploying:', e);
    }

    process.exit(0);
}

async function run() {
    await deployAll();
}
run();
// deploy(type);
