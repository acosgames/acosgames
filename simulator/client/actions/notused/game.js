import { POST, GET, POSTFORM } from './http';

import { validateSimple, validateField } from 'shared/util/validation';
// import { genShortId } from 'shared/util/idgen';
import config from '../config'

import fs from 'flatstore';

import { getUser } from './person';
import { wsJoinRankedGame, wsJoinBetaGame, wsRejoinRoom } from './connection';
import { addRoom } from './room';
import { decode } from 'shared/util/encoder';

fs.set('rankList', []);
fs.set('experimentalList', []);

fs.set('game', null);
fs.set('games', {});
fs.set('player_stats', {});


export async function sortGames(games) {

    let rankList = [];
    let experimentalList = [];
    let soloList = [];

    for (var game_slug in games) {
        let game = games[game_slug];
        if (game.version > 0) {
            if (game.maxplayers == 1)
                soloList.push(game);
            else
                rankList.push(game);
        }
        if (!game.version) {
            experimentalList.push(game);
        }
    }

    // fs.set('rankList', rankList);
    // fs.set('experimentalList', experimentalList);
    fs.set('gameLists', { rankList, experimentalList, soloList });
}


export async function findGames() {
    try {
        let response = await GET('/api/v1/games');
        let result = response.data;
        if (result.ecode) {
            throw result.ecode;
        }

        let games = fs.get('games');
        for (var game of result) {
            games[game.game_slug] = game;
        }

        sortGames(games);

        fs.set('games', games || {});
    }
    catch (e) {
        console.error(e);
        fs.set('games', {});
    }
}

export async function findGame(game_slug) {
    try {
        fs.set('loadingGameInfo', true);
        let response = await GET('/api/v1/game/' + game_slug);
        let result = response.data;
        fs.set('loadingGameInfo', false);
        if (result.ecode) {
            throw result.ecode;
        }
        // fs.set('games>' + game_slug, game);
        // fs.set('game', game || null);

        if (result.game.lbscore) {
            findGameLeaderboardHighscore(game_slug);
        }

        fs.set('games>' + game_slug, result.game);
        fs.set('game', result.game || {});
        fs.set('leaderboard', result.top10 || []);
        // fs.set('leaderboard', []);
        fs.set('leaderboardCount', result.lbCount || []);
        fs.set('gameFound', true);

        return result;
    }
    catch (e) {
        console.error(e);
        fs.set('game', null);
        throw 'E_GAMENOTFOUND'
    }
    return null;
}

export async function findGameReplays(game_slug) {
    try {
        let response = await GET('/api/v1/game/replays/' + game_slug);
        let replays = response.data;
        if (!replays || replays.length == 0)
            return;

        for (const replay of replays) {
            replay.game_slug = game_slug;
        }

        fs.set('replays/' + game_slug, replays);

        if (replays && replays.length > 0) {
            await downloadGameReplay(replays[0]);
        }


    }
    catch (e) {
        console.error(e);
        throw 'E_NOREPLAYS'
    }
}

function base64ToBytesArr(str) {
    const abc = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"]; // base64 alphabet
    let result = [];

    for (let i = 0; i < str.length / 4; i++) {
        let chunk = [...str.slice(4 * i, 4 * i + 4)]
        let bin = chunk.map(x => abc.indexOf(x).toString(2).padStart(6, 0)).join('');
        let bytes = bin.match(/.{1,8}/g).map(x => +('0b' + x));
        result.push(...bytes.slice(0, 3 - (str[4 * i + 2] == "=") - (str[4 * i + 3] == "=")));
    }
    return result;
}

export function decodeReplay(data) {
    let buffer = base64ToBytesArr(data);

    console.log('[REPLAY] data size = ', data.length);
    console.log('[REPLAY] buffer size = ', buffer.length);
    let msg = decode(buffer);

    console.log("[REPLAY] json size", JSON.stringify(msg).length)
    return msg;
}


export async function downloadGameReplay(replay) {

    if (!replay || !replay.filename || !replay.version || !replay.mode)
        return;


    let url = `${config.https.cdn}g/${replay.game_slug}/replays/${replay.version}/${replay.mode}/${replay.filename}`

    let response = await GET(url);

    let history = response.data;

    if (history) {
        history = decodeReplay(history);
    }


    replay.room_slug = 'REPLAY/' + replay.game_slug;
    replay.isReplay = true;

    replay.version = 21;

    console.log(history);
    fs.set('replay/' + replay.game_slug, replay.room_slug);

    let msg = {
        room: replay,
        payload: history
    }

    let gamepanel = addRoom(msg);
    console.log('[downloadGameReplay] ', gamepanel);
}

export async function findGameLeaderboardHighscore(game_slug) {
    try {
        fs.set('loadingHighscores', true);
        let response = await GET('/api/v1/game/lbhs/' + game_slug);
        let result = response.data;
        fs.set('loadingHighscores', false);
        if (result.ecode) {
            if (result.ecode == 'E_NOTAUTHORIZED') {
                return;
            }
            throw result.ecode;
        }


        //combine top10 + player leaderboard
        let top10 = result.top10hs || [];
        let leaderboard = result.lbhs || [];
        let combined = top10.concat(leaderboard);
        let rankmap = {};
        for (var i = 0; i < combined.length; i++) {
            let ranking = combined[i];
            rankmap[ranking.rank] = ranking;
        }

        let fixed = [];
        for (var key in rankmap) {
            fixed.push(rankmap[key]);
        }

        fixed.sort((a, b) => a.rank - b.rank);

        let local = fs.get('user');
        let localPlayer = null;
        if (local) {
            for (var i = 0; i < fixed.length; i++) {
                if (fixed[i].value == local.displayname) {
                    localPlayer = fixed[i];
                    break;
                }
            }
        }


        if (localPlayer)
            fs.set('localPlayerHighscore', localPlayer)

        let oldLeaderboard = fs.get('leaderboardHighscore');
        if (oldLeaderboard && local) {

            let prevLocalLb = null;
            let nextLocalLb = null;

            for (var i = 0; i < oldLeaderboard.length; i++) {
                let oldPlayerLb = oldLeaderboard[i];
                if (oldPlayerLb.value == local.displayname) {
                    prevLocalLb = oldPlayerLb;
                    break;
                }
            }

            for (var i = 0; i < fixed.length; i++) {
                let playerLb = fixed[i];
                if (playerLb.value == local.displayname) {
                    nextLocalLb = playerLb;
                    break;
                }
            }

            let diffLocalLb = null;
            if (prevLocalLb && nextLocalLb) {
                diffLocalLb = {};
                diffLocalLb.score = nextLocalLb.score - prevLocalLb.score;
                diffLocalLb.rank = nextLocalLb.rank - prevLocalLb.rank;
                fs.set('leaderboardHighscoreChange', diffLocalLb);
            }
            else {
                fs.set('leaderboardHighscoreChange', null);
            }

        }

        fs.set('leaderboardHighscore', fixed || []);
        fs.set('leaderboardHighscoreCount', result.lbhsCount || []);
        // fs.set('gameFound', true);
    }
    catch (e) {
        console.error(e);
        fs.set(game_slug, {});
    }
}

export async function findGameLeaderboard(game_slug) {
    try {
        fs.set('loadingGameInfo', true);
        let response = await GET('/api/v1/game/lb/' + game_slug);
        let result = response.data;
        fs.set('loadingGameInfo', false);
        if (result.ecode) {
            if (result.ecode == 'E_NOTAUTHORIZED') {
                return await findGame(game_slug);
            }
            throw result.ecode;
        }


        //combine top10 + player leaderboard
        let top10 = result.top10 || [];
        let leaderboard = result.lb || [];
        let combined = top10.concat(leaderboard);
        let rankmap = {};
        for (var i = 0; i < combined.length; i++) {
            let ranking = combined[i];
            rankmap[ranking.rank] = ranking;
        }

        let fixed = [];
        for (var key in rankmap) {
            fixed.push(rankmap[key]);
        }

        fixed.sort((a, b) => a.rank - b.rank);
        let local = fs.get('user');
        let oldLeaderboard = fs.get('leaderboard');
        if (oldLeaderboard && local) {

            let prevLocalLb = null;
            let nextLocalLb = null;

            for (var i = 0; i < oldLeaderboard.length; i++) {
                let oldPlayerLb = oldLeaderboard[i];
                if (oldPlayerLb.value == local.displayname) {
                    prevLocalLb = oldPlayerLb;
                    break;
                }
            }

            for (var i = 0; i < fixed.length; i++) {
                let playerLb = fixed[i];
                if (playerLb.value == local.displayname) {
                    nextLocalLb = playerLb;
                    break;
                }
            }

            let diffLocalLb = null;
            if (prevLocalLb && nextLocalLb) {
                diffLocalLb = {};
                diffLocalLb.score = nextLocalLb.score - prevLocalLb.score;
                diffLocalLb.rank = nextLocalLb.rank - prevLocalLb.rank;
                fs.set('leaderboardChange', diffLocalLb);
            }
            else {
                fs.set('leaderboardChange', null);
            }

        }

        fs.set('leaderboard', fixed || []);
        fs.set('leaderboardCount', result.lbCount || []);
        fs.set('gameFound', true);
    }
    catch (e) {
        console.error(e);
        fs.set(game_slug, {});
    }
}

export async function findGamePerson(game_slug) {
    try {
        fs.set('loadingGameInfo', true);
        let response = await GET('/api/v1/game/person/' + game_slug);
        let result = response.data;
        fs.set('loadingGameInfo', false);
        if (result.ecode) {

            if (result.ecode == 'E_NOTAUTHORIZED') {
                return await findGame(game_slug);
            }
            throw result.ecode;
        }

        if (!result.game) {
            throw 'E_GAMENOTFOUND';
        }

        let player_stats = fs.get('player_stats') || {};
        if (result.player) {
            player_stats[game_slug] = result.player;
            fs.set('player_stats', player_stats);
        }

        //combine top10 + player leaderboard
        let top10 = result.top10 || [];
        let leaderboard = result.lb || [];
        let combined = top10.concat(leaderboard);
        let rankmap = {};
        for (var i = 0; i < combined.length; i++) {
            let ranking = combined[i];
            rankmap[ranking.rank] = ranking;
        }

        let fixed = [];
        for (var key in rankmap) {
            fixed.push(rankmap[key]);
        }

        fixed.sort((a, b) => a.rank - b.rank);

        if (result.game.lbscore) {
            findGameLeaderboardHighscore(game_slug);
        }

        // fs.set(game_slug, result.game || null);
        fs.set('games>' + game_slug, result.game);
        fs.set('game', result.game || {});
        // fs.set('top10', result.top10 || []);
        fs.set('leaderboard', fixed || []);
        fs.set('leaderboardCount', result.lbCount || []);
        fs.set('gameFound', true);
    }
    catch (e) {
        console.error(e);
        fs.set(game_slug, {});
    }
}

export async function findAndRejoin(game_slug, room_slug) {

    let player_stats = fs.get('player_stats');
    let player_stat = player_stats[game_slug];
    let user = await getUser();
    if (user && user.shortid && !player_stat) {

        await findGamePerson(game_slug);

    }
    else {
        await findGame(game_slug);
    }


    wsRejoinRoom(game_slug, room_slug);
}

let hJoining = 0;


export async function joinGame(game, istest) {

    let game_slug = game.game_slug;
    // let version = game.version;
    // if (istest) {
    //     version = game.latest_version;
    // }
    // await downloadGame(game.gameid, version);

    // clearTimeout(hJoining);

    try {
        if (istest) {
            wsJoinBetaGame(game);
        }
        else {
            wsJoinRankedGame(game);
        }

    }
    catch (e) {
        console.error(e);
    }

    // hJoining = setTimeout(() => { joinGame(game_slug) }, 3000);
}


export async function downloadGame(gameid, version) {
    // let url = `${config.https.cdn}${gameid}/client/client.bundle.${version}.js`

    return new Promise(async (rs, rj) => {
        try {
            // let res = await fetch(url, { headers: { 'Content-Type': 'application/javascript' } })
            // let blob = await res.text();
            //let file = window.URL.createObjectURL(blob);
            fs.set('jsgame', true);
            rs(true);
        }
        catch (e) {
            console.error(e);
            rj(e);
        }
    })

}



export async function reportGame(game_slug, reportType) {

    let request = await POST('/api/v1/game/report', {
        game_slug,
        reportType
    });
    let response = request.data;


    return response;
}

export async function rateGame(game_slug, vote, previousVote) {

    let request = await POST('/api/v1/game/rate', {
        game_slug,
        vote,
        previousVote,
    });
    let response = request.data;

    return response;
}