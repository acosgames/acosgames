
const axios = require('axios');
const path = require('path');
const yargs = require('yargs/yargs')
const fs = require('fs');
var FormData = require('form-data');
const argv = yargs(process.argv).argv

let apikey = process.argv[process.argv.length - 1];



async function deployClient() {

    let url = 'http://localhost:8080/api/v1/dev/update/client/bundle/';

    console.log("Current Working Directory: ", process.cwd())
    let filepath = path.resolve(process.cwd() + '/builds/client/client.bundle.js');
    var newFile = fs.createReadStream(filepath);

    var form_data = new FormData();
    form_data.append('apikey', apikey || '');
    form_data.append("bundle", newFile);

    let headers = form_data.getHeaders();
    headers['X-GAME-API-KEY'] = apikey || '';
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

async function deployServer() {
    let url = 'http://localhost:8080/api/v1/dev/update/server/bundle/';

    console.log("Current Working Directory: ", process.cwd())
    let filepath = path.resolve(process.cwd() + '/builds/server/server.bundle.js');
    var newFile = fs.createReadStream(filepath);

    var form_data = new FormData();
    form_data.append('apikey', apikey || '');
    form_data.append("bundle", newFile);

    let headers = form_data.getHeaders();
    headers['X-GAME-API-KEY'] = apikey || '';
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

async function deploy() {
    deployClient();
    deployServer();
}

deploy();
