
const axios = require('axios');
const path = require('path');
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const fs = require('fs');
var FormData = require('form-data');
const argv = yargs(hideBin(process.argv)).argv

// let type = process.argv[process.argv.length - 2];
// let apikey = process.argv[process.argv.length - 1];

let isScaled = argv.scaled || false;
let apikey = argv._[0];
let isLocal = argv.local || false;

console.log(process.argv);
console.log(argv);

console.log("parsed: apikey=", apikey, ", isScaled=", isScaled);

async function deployAll() {
    let url = 'http://localhost:8080/api/v1/dev/update/game/bundle/';
    if (!isLocal) {
        url = 'https://acos.games/api/v1/dev/update/game/bundle/';
    }

    console.log("Current Working Directory: ", process.cwd())
    let filepath = path.resolve(process.cwd() + '/builds/client/client.bundle.js');
    var clientFile = fs.createReadStream(filepath);

    var form_data = new FormData();
    // form_data.append('apikey', apikey || '');
    // form_data.append('scaled', isScaled);
    form_data.append("client", clientFile);

    let hasDb = false;

    try {
        let filepath = path.resolve(process.cwd() + '/game-server/database.json');
        if (!fs.existsSync(filepath)) {
            //file exists
            console.warn('No database exists. It is optional, but this is a reminder just incase you forgot it.  Format should be `database.json`')
        }
        else {
            var dbFile = fs.createReadStream(filepath);
            form_data.append("db", dbFile);
            hasDb = true;
        }
    } catch (err) {
        console.error(err)
    }

    let serverFilePath = path.resolve(process.cwd() + '/builds/server/server.bundle.js');
    var serverFile = fs.createReadStream(serverFilePath);
    form_data.append("server", serverFile);

    let headers = form_data.getHeaders();
    headers['X-GAME-API-KEY'] = apikey || '';
    headers['X-GAME-SCALED'] = isScaled ? 'yes' : 'no';
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
        console.log(response.data);
    }
    catch (e) {
        console.error(e);
    }
}

async function run() {
    await deployAll();
}
run();
// deploy(type);
