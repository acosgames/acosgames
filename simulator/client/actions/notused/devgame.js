import { POST, GET, POSTFORM } from './http';

import { validateSimple, validateField } from 'shared/util/validation';
// import { genShortId } from 'shared/util/idgen.js';
import { getWithExpiry, setWithExpiry } from '../cache';
import fs from 'flatstore';

import config from '../config'


import { toast, useToast } from '@chakra-ui/react';
fs.set('devgameimages', []);
fs.set('devgame', {});
fs.set('devgames', []);
fs.set('devgameerror', []);

fs.set('devClientsImages', []);
fs.set('devClients', []);
fs.set('devClientsError', []);

fs.set('devServerImages', []);
fs.set('devServers', []);
fs.set('devServerError', []);

function imagesToMap(images) {
    let obj = {};
    images.forEach((v, i) => {
        v.file.index = i;
        obj[v.file.name] = v;
    });
    return obj;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}



export async function addImages(imgstore, nextImages, uploadFunc) {

    let game = fs.get('devgame');
    let curImages = fs.get('devgameimages');
    if (!curImages)
        return;

    let curMap = imagesToMap(curImages);
    let nextMap = imagesToMap(nextImages);

    let added = [];
    let deleted = [];
    for (var key in curMap) {
        if (!(key in nextMap)) {
            deleted.push(curMap[key]);
        }
    }

    for (var key in nextMap) {
        if (!(key in curMap)) {
            let image = nextMap[key];

            added.push(image);
        }
    }

    if (added.length > 0) {

        if (uploadFunc) {
            uploadFunc(added, nextImages);

        }
    }


    fs.set('devgameimages', nextImages);
}

export async function findClients(gameid) {
    try {
        let response = await GET('/api/v1/dev/find/clients/' + gameid);
        let clients = response.data;

        for (var i = 0; i < clients.length; i++) {
            let client = clients[i];
            if (client.preview_images) {
                let images = [];
                let list = client.preview_images.split(',');
                for (var i = 0; i < list.length; i++) {
                    let url = config.https.cdn + client.gameid + '/clients/preview/' + list[i];
                    images.push({ data_url: url, file: {} });
                }
                fs.set('devclientimages_' + client.id, images);
            }
        }

        fs.set('devclientserror', []);
        console.log(clients);
        fs.set('devclients', clients);
        return clients;
    }
    catch (e) {
        console.error(e);

        if (e.response) {
            const { response } = e;
            const data = response.data;
            fs.set('devclientserror', [data]);
        }
    }
    return null;
}

function rowsToMap(list) {
    let map = {};
    for (var i = 0; i < list.length; i++) {
        let obj = list[i];
        map[obj.id] = obj;
    }
    return map;
}

export async function findDevGames(userid) {
    try {
        fs.set('loadingGames', true);
        let games = getWithExpiry('devgames');
        if (!games) {
            let response = await GET('/api/v1/dev/games/' + userid);
            games = response.data;

            setWithExpiry('devgames', games, 60);
        }

        fs.set('loadingGames', false);
        fs.set('devgames', games);

        return games;
    }
    catch (e) {
        console.error(e);

        if (e.response) {
            const { response } = e;
            const data = response.data;
            fs.set('devgameerror', [data]);
        }
    }
    return null;
}


export async function findGameTemplates() {
    try {
        let games = getWithExpiry('devgames');
        if (!games) {
            let response = await GET('/api/v1/dev/gametemplates');
            games = response.data;

            setWithExpiry('gametemplates', games, 60);
        }

        fs.set('gametemplates', games);

        return games;
    }
    catch (e) {
        console.error(e);

        if (e.response) {
            const { response } = e;
            const data = response.data;
            fs.set('devgameerror', [data]);
        }
    }
    return null;
}


export async function findGame(gameid) {
    try {
        let response = await GET('/api/v1/dev/find/game/' + gameid);
        let game = response.data;

        if (game.preview_images) {
            let images = [];
            let list = game.preview_images.split(',');
            for (var i = 0; i < list.length; i++) {
                let url = config.https.cdn + 'g/' + game.game_slug + '/preview/' + list[i];
                images.push({ data_url: url, file: {} });
            }
            fs.set('devgameimages', images);
        }

        fs.set('devgameerror', []);
        console.log(game);
        fs.set('devgame', game);

        fs.set('loaded/devgame', Date.now())
        if (game.teams) {
            fs.set('devgameteams', game.teams);
        }

        // fs.set('devClientsCnt', game.clients.length);
        // for (var i = 0; i < game.clients.length; i++) {
        //     updateClient(game.clients[i]);
        // }


        // fs.set('devServersCnt', game.servers.length);
        // fs.set('devServers', rowsToMap(game.servers));

        return game;
    }
    catch (e) {
        console.error(e);

        if (e.response) {
            const { response } = e;
            const data = response.data;
            fs.set('devgameerror', [data]);
        }
    }
    return null;
}

function updateClient(client) {
    let game = fs.get('devgame');
    let clients = game.clients;
    if (!clients)
        return;

    fs.set('devClients-' + client.env, client);

    var storageURL = config.https.cdn;
    var storagePath = client.gameid + '/client/' + client.id + '/'
    if (client.preview_images) {
        let images = [];
        let list = client.preview_images.split(',');
        for (var j = 0; j < list.length; j++) {
            let url = storageURL + storagePath + list[j];
            images.push({ data_url: url, file: {} });
        }
        fs.set('devclientimages_' + client.id, images);

        let bundleURL = storageURL + storagePath + client.build_client;
        fs.set('devClientBundle_' + client.id, bundleURL);
    }
}

export async function uploadClientBundle(client, file) {

    let progress = {
        onUploadProgress: progressEvent => {
            console.log(progressEvent.loaded)
        }
    };

    var formData = new FormData();
    formData.append('clientid', client.id);
    formData.append('gameid', client.gameid);
    //images.forEach(image => {
    formData.append("bundle", file);
    //})

    let response = await POST('/api/v1/dev/update/client/bundle/' + client.id, formData, progress);
    let updatedClient = response.data;

    updateClient(updatedClient);

    console.log(updatedClient);

    return updatedClient
}


export async function uploadClientImages(images, nextImages) {
    var client = fs.get('devclient');
    var preview_images = null;
    for (var i = 0; i < images.length; i++) {
        let image = images[i];

        let response = await uploadClientImage(client, image);
        preview_images = response.images;
        console.log(preview_images);
    }

    if (preview_images) {
        for (var i = 0; i < preview_images.length; i++) {
            if (nextImages[i]) {
                let url = config.https.cdn + client.gameid + '/client/' + client.id + '/' + preview_images[i];
                nextImages[i].data_url = url;
            }
        }
    }
}

export async function uploadClientImage(client, image) {
    try {
        let progress = {
            onUploadProgress: progressEvent => {
                console.log(progressEvent.loaded)
            }
        };

        var formData = new FormData();
        formData.append('clientid', client.id);
        formData.append('gameid', client.gameid);
        //images.forEach(image => {
        formData.append("images", image.file);
        //})

        let response = await POST('/api/v1/dev/update/client/images/' + client.id, formData, progress);
        let client = response.data;
        updateClient(client);
        console.log(client);

        return client;
    }
    catch (e) {
        console.error(e);

        if (e.response) {
            const { response } = e;
            const data = response.data;
            fs.set('devgameerror', [data]);
        }
        throw e;
    }

}

export async function uploadGameImages(images, nextImages) {
    var game = fs.get('devgame');
    var preview_images = null;
    for (var i = 0; i < images.length; i++) {
        let image = images[i];

        let response = await uploadGameImage(game.game_slug, image);
        preview_images = response.images;
        console.log(preview_images);
    }

    if (preview_images) {
        for (var i = 0; i < preview_images.length; i++) {
            if (nextImages[i]) {
                let url = config.https.cdn + 'g/' + game.game_slug + '/preview/' + preview_images[i];
                nextImages[i].data_url = url;
            }
        }
    }
}

export async function uploadGameImage(game_slug, image) {
    try {
        let progress = {
            onUploadProgress: progressEvent => {
                console.log(progressEvent.loaded)
            }
        };

        var formData = new FormData();
        formData.append('game_slug', game_slug);

        //images.forEach(image => {
        formData.append("images", image.file);
        //})

        let response = await POST('/api/v1/dev/update/game/images/' + game_slug, formData, progress);
        let game = response.data;
        console.log(game);

        return game;
    }
    catch (e) {
        console.error(e);

        if (e.response) {
            const { response } = e;
            const data = response.data;
            fs.set('devgameerror', [data]);
        }
        throw e;
    }

}

export async function deleteGame() {

    let deleteGame = fs.get('devgame');

    let response = await POST('/api/v1/dev/delete/game', deleteGame);
    let result = response.data;

    //let imageResponse = await uploadImages();
    //let gameWithImages = response.data;

    //console.log(gameWithImages);
    fs.set('devgame', {});
    fs.set('devgameerror', []);
    console.log(result);
    return deleteGame;
}

export async function updateGameAPIKey() {

    try {
        let newGame = fs.get('devgame');
        let response = await POST('/api/v1/dev/update/gameapikey', { gameid: newGame.gameid });
        let game = response.data;

        newGame.apikey = game.apikey;
        fs.set('devgame', newGame);

    }
    catch (e) {
        console.error(e);

        if (e.response) {
            const { response } = e;
            const data = response.data;
            fs.set('devgameerror', [data]);
        }
    }
    return null;
}

export async function updateGame() {
    try {
        let newGame = fs.get('devgame');

        //validated seperately
        let teams = newGame.teams;
        if (newGame.teams) {
            delete newGame.teams;
        }

        let errors = validateSimple('update-game_info', newGame);
        if (errors.length > 0) {
            fs.set('devgameerror', errors);
            return null;
        }


        if (teams) {


            if (teams.length > newGame.maxteams) {
                let filteredTeams = [];
                for (let i = 0; i < newGame.maxteams; i++) {
                    filteredTeams.push(teams[i]);
                }

                teams = filteredTeams;
            }



            for (let team of teams) {
                let errors2 = validateSimple('update-game_team', team);
                if (errors2.length > 0) {
                    fs.set('devgameerror', errors2);
                    return null;
                }
            }

            newGame.teams = teams;

        }


        // var formData = new FormData();
        // for (var key in newGame) {
        //     let value = newGame[key];
        //     if (value == null || key.indexOf("ts") == 0)
        //         continue;
        //     formData.append(key, newGame[key]);
        // }
        // let images = fs.get('devgameimages');
        // images.forEach(image => {
        //     formData.append("images", image.file, image.file.filename);
        // })

        // let response = await uploadImage(image, image.file.index, filename);
        // console.log(response.data);


        let response = await POST('/api/v1/dev/update/game', newGame);
        let game = response.data;



        //let imageResponse = await uploadImages();
        //let gameWithImages = response.data;

        //console.log(gameWithImages);

        fs.set('devgameerror', []);
        console.log(game);
        return game;
    }
    catch (e) {
        console.error(e);

        if (e.response) {
            const { response } = e;
            const data = response.data;
            fs.set('devgameerror', [data]);
        }
    }
    return null;
}

export async function updateGameField(name, value, group, key, errorkey) {
    let prevValue = fs.get(key);
    // if (typeof prevValue === 'undefined')
    //     return null;

    errorkey = errorkey || 'devgameerror'
    // let prev = game[name];
    // game[name] = value;

    let fields = {};

    let parts = key.split('>');
    if (parts.length > 1) {
        let fieldkey = key.replace('>' + parts[parts.length - 1], '');
        fields = fs.get(fieldkey);
    }


    let errors = validateField(group, name, value, fields);
    if (errors.length > 0) {
        fs.set(errorkey, errors);
        // game[name] = prev;
        fs.set(key, value);
        //return value;
    }

    fs.set(key, value);

    // console.log(game);
}
// export async function updateGameField(name, value, group, key, errorkey) {
//     let game = fs.get('devgame');

//     let prev = game[name];
//     game[name] = value;



//     let errors = validateField('update-game_info', game);
//     if (errors.length > 0) {
//         fs.set('devgameerror', errors);
//         game[name] = prev;
//         fs.set('devgame', game);
//         return game;
//     }

//     fs.set('devgame', game);

//     console.log(game);
// }

export async function updateClientField(name, value) {
    let client = fs.get('devclient');

    let errors = validateSimple('game_client', client);
    if (errors.length > 0) {
        fs.set('devclienterror', errors);
        return client;
    }

    client[name] = value;

    fs.set('devclient', client);

    console.log(client);
}

export async function updateServerField(name, value) {
    let server = fs.get('devserver');

    let errors = validateSimple('game_server', server);
    if (errors.length > 0) {
        fs.set('devservererror', errors);
        return server;
    }

    server[name] = value;

    fs.set('devserver', server);

    console.log(server);
}

export async function createClient(progressCB) {

    try {
        let game = fs.get('devgame');
        let newClient = fs.get('devclient');

        let errors = validateSimple('game_client', newClient);
        if (errors.length > 0) {
            fs.set('devclienterror', errors);
            return newClient;
        }

        let response = await POST('/api/v1/dev/create/client/' + game.gameid, newClient);
        let client = response.data;

        fs.set('devclienterror', []);
        console.log(client);
        return client;
    }
    catch (e) {
        console.error(e);

        if (e.response) {
            const { response } = e;
            const data = response.data;

            //const { request, ...errorObject } = response; // take everything but 'request'
            //console.log(errorObject);

            fs.set('devclienterror', [data]);
        }


    }
    return null;
}


export async function createServer(progressCB) {

    try {
        let game = fs.get('devgame');
        let newServer = fs.get('devserver');

        let errors = validateSimple('game_server', newServer);
        if (errors.length > 0) {
            fs.set('devservererror', errors);
            return newServer;
        }

        let response = await POST('/api/v1/dev/create/server/' + game.gameid, newServer);
        let server = response.data;

        fs.set('devservererror', []);
        console.log(server);
        return server;
    }
    catch (e) {
        console.error(e);

        if (e.response) {
            const { response } = e;
            const data = response.data;

            //const { request, ...errorObject } = response; // take everything but 'request'
            //console.log(errorObject);

            fs.set('devservererror', [data]);
        }


    }
    return null;
}

export async function clearGameFields() {
    fs.set('devgame', {});
    fs.set('devgameerror', []);
    fs.set('devgameteams', []);
}

export async function sendGithubInvite() {
    let response = await POST('/api/v1/dev/invite/github', {});
    let json = response.data;
    if (json && json.status && json.status == 'success') {
        return true;
    }
    return false;
}

export async function createGame(progressCB) {

    try {
        let newGame = fs.get('devgame');

        let errors = validateSimple('create-game_info', newGame);
        if (errors.length > 0) {
            fs.set('devgameerror', errors);
            return null;
        }

        let response = await POST('/api/v1/dev/create/game', newGame);
        let game = response.data;

        fs.set('devgameerror', []);
        console.log(game);
        return game;
    }
    catch (e) {
        console.error(e);

        if (e.response) {
            const { response } = e;
            const data = response.data;

            //const { request, ...errorObject } = response; // take everything but 'request'
            //console.log(errorObject);

            fs.set('devgameerror', [data]);
        }


    }
    return null;
}


export async function deployToProduction(game) {

    try {
        let deployGame = {
            gameid: game.gameid,
            version: game.latest_version
        }
        let response = await POST('/api/v1/dev/deploy/game', deployGame);
        let gameResult = response.data;

        if (!gameResult.version) {
            fs.set('devgameerror', [{ ecode: 'E_DEPLOYERROR', payload: 'Unknown' }])
            return;
        }

        let dgame = fs.get('devgame');
        game.version = gameResult.version;
        fs.set('devgame', game);

        let dgames = fs.get('devgames');
        for (var i = 0; i < dgames.length; i++) {
            let g = dgames[i];
            if (g.gameid == game.gameid) {
                g.version = gameResult.version;
                dgames[i] = g;
                fs.set('devgames', dgames);
                break;
            }
        }




        fs.set('devgameerror', []);
        console.log(gameResult);
        return gameResult;
    }
    catch (e) {
        console.error(e);

        if (e.response) {
            const { response } = e;
            const data = response.data;

            //const { request, ...errorObject } = response; // take everything but 'request'
            //console.log(errorObject);

            fs.set('devgameerror', [data]);
        }


    }
    return null;
}



export async function deployVersionToProduction(game, version) {

    try {

        if (!version || !Number.isInteger(version) || version < 0 || version > game.latest_version) {
            version = game.latest_version;
        }


        let deployGame = {
            gameid: game.gameid,
            version
        }
        let response = await POST('/api/v1/dev/deploy/game', deployGame);
        let gameResult = response.data;

        if (!gameResult.version) {
            fs.set('devgameerror', [{ ecode: 'E_DEPLOYERROR', payload: 'Unknown' }])
            return;
        }

        let dgame = fs.get('devgame');
        game.version = gameResult.version;
        fs.set('devgame', game);

        let dgames = fs.get('devgames');
        for (var i = 0; i < dgames.length; i++) {
            let g = dgames[i];
            if (g.gameid == game.gameid) {
                g.version = gameResult.version;
                dgames[i] = g;
                fs.set('devgames', dgames);
                break;
            }
        }




        fs.set('devgameerror', []);
        console.log(gameResult);
        return gameResult;
    }
    catch (e) {
        console.error(e);

        if (e.response) {
            const { response } = e;
            const data = response.data;

            //const { request, ...errorObject } = response; // take everything but 'request'
            //console.log(errorObject);

            fs.set('devgameerror', [data]);
        }


    }
    return null;
}


