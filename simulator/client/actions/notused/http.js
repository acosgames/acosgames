import axios from 'axios';
import fs from 'flatstore';


import versions from 'shared/model/versions.json';


const instance = axios.create({
    withCredentials: true
})


export async function GET(url, extras) {
    let response = await instance.get(url, HEADERS(extras));

    //Check for new client version from server
    if (response?.headers?.v) {
        let savedVersion = fs.get('version');
        let clientVersion = Number(versions.client.version);
        let serverVersion = Number(response.headers.v);
        if (clientVersion < serverVersion) {
            if (serverVersion != savedVersion)
                fs.set('version', serverVersion);
        }
    }

    //check for unauthorized error
    if (response.data && response.data.ecode) {
        let ecode = response.data.ecode;
        if (ecode == 'E_NOTAUTHORIZED' && url != '/api/v1/person' && url.indexOf('/api/v1/game/lbhs/') == -1) {
            let history = fs.get('history');
            history.push('/login');
        }
    }
    return response;
}

export async function POSTFORM(url, data, extras) {
    let config = HEADERS(extras);
    config.headers['Content-Type'] = 'multipart/form-data';
    let response = await instance.post(url, data, config);
    if (response.data && response.data.ecode) {
        let ecode = response.data.ecode;
        if (ecode == 'E_NOTAUTHORIZED') {
            let history = fs.get('history');
            history.push('/login');
        }
    }
    return response;
}

export async function POST(url, data, extras) {
    let response = await instance.post(url, data, HEADERS(extras));

    //Check for new client version from server
    if (response?.headers?.v) {
        let savedVersion = fs.get('version');
        let clientVersion = Number(versions.client.version);
        let serverVersion = Number(response.headers.v);
        if (clientVersion < serverVersion) {
            if (serverVersion != savedVersion)
                fs.set('version', serverVersion);
        }
    }

    //check for unauthorized error
    if (response.data && response.data.ecode) {
        let ecode = response.data.ecode;
        if (ecode == 'E_NOTAUTHORIZED') {
            let history = fs.get('history');
            history.push('/login');
        }
    }
    return response;
}

export function HEADERS(extras) {
    if (extras) {
        return {
            ...extras
        }
    }

    return {
    }
}