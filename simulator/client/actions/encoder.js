// const JSBI = require('jsbi');
const encoderVersion = '1.2';

// const pako = require('pako');
const encoder = new TextEncoder();
const decoder = new TextDecoder();
// const { serialize, deserialize } = require('bson');
// const ServerAPI = require('../../api/src/api/server');

function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint16Array(buf));
}

function str2ab(str) {
    var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
    var bufView = new Uint16Array(buf);
    for (var i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}

function getBigUint64(view, position, littleEndian = false) {
    if ("getBigUint64" in DataView.prototype) {
        return view.getBigUint64(position, littleEndian);
    }

    const lsb = BigInt(view.getUint32(position + (littleEndian ? 0 : 4), littleEndian));
    const gsb = BigInt(view.getUint32(position + (littleEndian ? 4 : 0), littleEndian));
    return lsb + 4294967296n * gsb;

}

function getBigInt64(view, position, littleEndian = false) {
    // if ("getBigInt64" in DataView.prototype) {
    //     return view.getBigInt64(position, littleEndian);
    // }

    let value = 0n;
    let isNegative = (view.getUint8(position + (littleEndian ? 7 : 0)) & 0x80) > 0;
    let carrying = true;
    for (let i = 0; i < 8; i++) {
        let byte = view.getUint8(position + (littleEndian ? i : 7 - i));
        if (isNegative) {
            if (carrying) {
                if (byte != 0x00) {
                    byte = (~(byte - 1)) & 0xFF;
                    carrying = false;
                }
            }
            else {
                byte = (~byte) & 0xFF;
            }
        }
        value += BigInt(byte) * 256n ** BigInt(i);
    }
    if (isNegative) {
        value = -value;
    }
    return value;

}


const fromHexString = hexString =>
    new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));


function setBigInt64(view, byteOffset, value, littleEndian) {

    // if ("setBigInt64" in DataView.prototype) {
    //     return view.setBigInt64(byteOffset, BigInt(value), littleEndian);
    // }

    let hex = bnToHex(value);

    let buffer = fromHexString(hex);
    for (var i = 0; i < buffer.length; i++) {
        view.setUint8(byteOffset + i, buffer[i]);
    }

    return true;
}

function setBigUint64(view, byteOffset, value, littleEndian) {
    if ("setBigUint64" in DataView.prototype) {
        view.setBigUint64(byteOffset, BigInt(value), littleEndian);
        return true;
    }
    // if (typeof value === 'bigint' && typeof view.setBigUint64 !== 'undefined') {
    //     // the original native implementation for bigint
    //     view.setBigUint64(byteOffset, value, littleEndian);
    //   } else if (value.constructor === JSBI && typeof value.sign === 'bigint' && typeof view.setBigUint64 !== 'undefined') {
    //     // JSBI wrapping a native bigint
    //     view.setBigUint64(byteOffset, value.sign, littleEndian);
    //   } else 
    {
        let buff = bnToBuf(value);
        for (var i = 0; i < buff.length; i++) {
            view.setUint8(byteOffset + i, buff[i]);
        }

        // value = JSBI.BigInt(value + "");
        // console.log("BigUint: ", value);

        // // JSBI polyfill implementation
        // const lowWord = value[0];
        // let highWord = 0;
        // if (value.length >= 2) {
        //     highWord = value[1];
        // }
        // view.setUint32(byteOffset + (littleEndian ? 0 : 4), lowWord, littleEndian);
        // view.setUint32(byteOffset + (littleEndian ? 4 : 0), highWord, littleEndian);
    }
    return true;
}

// Convert a hex string to a byte array
function hexToBytes(hex) {
    for (var bytes = [], c = 0; c < hex.length; c += 2)
        bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
}

// Convert a byte array to a hex string
function bytesToHex(bytes) {
    for (var hex = [], i = 0; i < bytes.length; i++) {
        var current = bytes[i] < 0 ? bytes[i] + 256 : bytes[i];
        hex.push((current >>> 4).toString(16));
        hex.push((current & 0xF).toString(16));
    }
    return hex.join("");
}

function hexToBn(hex) {
    if (hex.length % 2) {
        hex = '0' + hex;
    }

    var highbyte = parseInt(hex.slice(0, 2), 16)
    var bn = BigInt('0x' + hex);

    if (0x80 & highbyte) {
        // bn = ~bn; WRONG in JS (would work in other languages)

        // manually perform two's compliment (flip bits, add one)
        // (because JS binary operators are incorrect for negatives)
        bn = BigInt('0b' + bn.toString(2).split('').map(function (i) {
            return '0' === i ? 1 : 0
        }).join('')) + BigInt(1);
        // add the sign character to output string (bytes are unaffected)
        bn = -bn;
    }

    return bn;
}

function bnToHex(bn) {
    var pos = true;
    bn = BigInt(bn);

    // I've noticed that for some operations BigInts can
    // only be compared to other BigInts (even small ones).
    // However, <, >, and == allow mix and match
    if (bn < 0) {
        pos = false;
        bn = bitnot(bn);
    }

    var base = 16;
    var hex = bn.toString(base);
    if (hex.length % 2) {
        hex = '0' + hex;
    }

    // Check the high byte _after_ proper hex padding
    var highbyte = parseInt(hex.slice(0, 2), 16);
    var highbit = (0x80 & highbyte);

    if (pos && highbit) {
        // A 32-byte positive integer _may_ be
        // represented in memory as 33 bytes if needed
        hex = '00' + hex;
    }

    return hex;
}

function bitnot(bn) {
    // JavaScript's bitwise not doesn't work on negative BigInts (bn = ~bn; // WRONG!)
    // so we manually implement our own two's compliment (flip bits, add one)
    bn = -bn;
    var bin = (bn).toString(2)
    var prefix = '';
    while (bin.length % 8) {
        bin = '0' + bin;
    }
    if ('1' === bin[0] && -1 !== bin.slice(1).indexOf('1')) {
        prefix = '11111111';
    }
    bin = bin.split('').map(function (i) {
        return '0' === i ? '1' : '0';
    }).join('');
    return BigInt('0b' + prefix + bin) + BigInt(1);
}

function bnToBuf(bn) {
    var hex = BigInt(bn).toString(16);
    if (hex.length % 2) { hex = '0' + hex; }

    var len = hex.length / 2;
    var u8 = [];

    for (let x = 0; x < 8 - len; x++) {
        u8.push(0);
    }
    var i = 0;
    var j = 0;
    while (i < len) {

        u8.push(parseInt(hex.slice(j, j + 2), 16));
        i += 1;
        j += 2;
    }

    return u8;
}

function bufToBn(buf) {
    var hex = [];
    u8 = Uint8Array.from(buf);

    u8.forEach(function (i) {
        var h = i.toString(16);
        if (h.length % 2) { h = '0' + h; }
        hex.push(h);
    });

    return BigInt('0x' + hex.join(''));
}



console.log("ENCODER VERSION = " + encoderVersion);

let testJSON = {
    "type": "ping",
    "room_slug": "JHMKGD",
    "state": {
        "cells": ['', '', '', '', '', '', '', '', ''],
        "startPlayer": "manC6"
    },
    "rules": {
        "bestOf": 5,
        "maxPlayers": 2
    },
    "next": {
        "id": "manC6",
        "action": "pick"
    },
    "events": ['hello', 1, 0.2, { mytestkey: 'a value' }, [100, 200, 300]],
    "timer": {
        "seq": 1
    },
    "players": {
        "8CCkf": {
            "name": "joe",
            "rank": false,
            "score": new Date(),
            "type": true,
            "id": "8CCkf"
        },
        "manC6": {
            "name": "5SG",
            "rank": 18446556446050,
            "score": 123423,
            "type": "X"
        }
    },
    "teams": {}
};

const TYPE_OBJ = 1;
const TYPE_ARR = 2;
const TYPE_BOOL = 3;
const TYPE_DATE = 4;
const TYPE_DICT = 5;
const TYPE_STRING = 6;
const TYPE_INT8 = 7;
const TYPE_UINT8 = 8;
const TYPE_INT16 = 9;
const TYPE_UINT16 = 10;
const TYPE_INT32 = 11;
const TYPE_UINT32 = 12;
const TYPE_INT64 = 13;
const TYPE_UINT64 = 14;
const TYPE_FLOAT32 = 15;
const TYPE_FLOAT64 = 16;
const TYPE_ENDOBJ = 17;
const TYPE_ENDARR = 18;
const TYPE_FLOATSTR = 19;
const TYPE_NULL = 20;
const TYPE_ZERO = 21;
const TYPE_EMPTYSTRING = 22;
const TYPE_TRUE = 23;
const TYPE_FALSE = 24;
const TYPE_ONE = 25;
const TYPE_TWO = 26;
const TYPE_THREE = 27;
const TYPE_EMPTY_OBJ = 28;
const TYPE_EMPTY_ARR = 29;
const TYPE_OBJ_DELETE = 30;
const TYPE_STRING_DICT1 = 31;
const TYPE_STRING_DICT2 = 32;
const TYPE_ARR_DELTA = 33;
const TYPE_ARR_RESIZE = 34;
const TYPE_ARR_SETVALUE = 35;
const TYPE_ARR_NESTED = 36;
const TYPE_KEY_STATE = 37;
const TYPE_KEY_PLAYERS = 38
const TYPE_KEY_EVENTS = 39;
const TYPE_KEY_TIMER = 40;
const TYPE_KEY_NEXT = 41;
const TYPE_KEY_TEAMS = 42;
const TYPE_FOUR = 43;
const TYPE_FIVE = 44;
const TYPE_SIX = 45;
const TYPE_SEVEN = 46;
const TYPE_EIGHT = 47;
const TYPE_NINE = 48;
const TYPE_TEN = 49;
const TYPE_ELEVEN = 50;
const TYPE_TWELVE = 51;
const TYPE_THIRTEEN = 52;
const TYPE_KEY_STATE_EMPTY = 53;
const TYPE_KEY_PLAYERS_EMPTY = 54
const TYPE_KEY_EVENTS_EMPTY = 55;
const TYPE_KEY_TIMER_EMPTY = 56;
const TYPE_KEY_NEXT_EMPTY = 57;
const TYPE_KEY_TEAMS_EMPTY = 58;
const TYPE_KEY_RULES = 59;
const TYPE_KEY_RULES_EMPTY = 60;

var dvbuff = new ArrayBuffer(16);
var dv = new DataView(dvbuff);


var defaultOrder = [
    'room_slug',
    'game_slug',
    'gameid',
    'version',
    'state',
    'events',
    'players',
    'timer',
    'rules',
    'next',
    'prev',
    'action',
    'seq',
    'rank',
    'rating',
    'ratingTxt',
    'score',
    'highscore',
    '_win',
    '_loss',
    '_tie',
    '_played',
    'win',
    'loss',
    'tie',
    'wins',
    'losses',
    'tied',
    'forfeit',
    'forfeited',
    'strip',
    'type',
    'payload',
    'dict',
    'db',
    'latest_tsupdate',
    'minplayers',
    'maxplayers',
    'maxPlayers',
    'teams',
    'mode',
    'owner',
    'isfull',
    'isprivate',
    'tsupdate',
    'tsinsert',
    'name',
    'id',
    'offset',
    'serverTime',
    'gamestatus',
    'pregame',
    'starting',
    'gamestart',
    'gameover',
    'join',
    'leave',
    'seconds',
    'end',
    'ready',
    'update',
    'finish',
    'winner',
    'private',
    'timeleft',
    'user',
    'pick',
    'picked',
    'move',
    'moved',
    'cells',
    'cellid',
    'cellx',
    'celly',
    'cellz',
    'startPlayer',
    'queue',
    'experimental',
    'local',
    'ping',
    'pong',
    'joingame',
    'joinroom',
    'joinqueue',
    'leavequeue',
    'spectate',
    'newround',
    'round',
    'rounds',
    'inrooms',
    'shortid',
    'private_key',
    'joined',
    'Wood I',
    'Wood II',
    'Wood III',
    'Wood IV',
    'Bronze I',
    'Bronze II',
    'Bronze III',
    'Bronze IV',
    'Silver I',
    'Silver II',
    'Silver III',
    'Silver IV',
    'Gold I',
    'Gold II',
    'Gold III',
    'Gold IV',
    'Platinum I',
    'Platinum II',
    'Platinum III',
    'Platinum IV',
    'Champion I',
    'Champion II',
    'Champion III',
    'Champion IV',
    'Grand Champion I',
    'Grand Champion II',
    'Grand Champion III',
    'Grand Champion IV',
    'board',
    'playerCount',
    'red',
    'blue',
    'item',
    'items',
    'bestOf',
    'achievements',
    'achievement',
    'chat',
    'message',
    'displayname',
    'timestamp',
    'icon',
    'lastUpdate'
]

var defaultDict = null;


function createDefaultDict(storedDict) {

    if (defaultDict != null) {
        return defaultDict;
    }
    defaultDict = {
        count: defaultOrder.length,
        keys: {},
        order: defaultOrder.slice()
    }
    if (storedDict) {
        defaultDict.order = defaultDict.order.concat(storedDict.order);
        defaultDict.count = defaultDict.order.length;
    }
    createDictKeys(defaultDict);

    // if (storedDict && Array.isArray(storedDict)) {
    //     for (var i = 0; i < storedDict.length; i++) {
    //         let key = storedDict[i];
    //         dict.keys[key] = i;
    //         order.push(key);
    //     }
    // }

    return defaultDict;
}


function isObject(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object';
}

function serialize(json, dict) {
    let buffer = [];
    dict = dict || { count: defaultOrder.length, keys: {}, order: [] };

    let cache = {};

    serializeEX(json, buffer, dict, cache);


    let arrBuffer = Uint8Array.from(buffer);
    // for (var i = 0; i < buffer.length; i++) {
    //     arrBuffer[i] = buffer[i];
    // }

    return arrBuffer.buffer;

}

function serializeEX(json, buffer, dict, cache) {
    buffer = buffer || [];
    dict = dict || { count: defaultOrder.length, keys: {}, order: [] };

    if (typeof json === 'undefined' || json == null) {
        buffer.push(TYPE_NULL);
        return;
    }
    let isString = (typeof json === 'string' || json instanceof String);

    if (json instanceof Date) {
        buffer.push(TYPE_DATE);
        let epoch = json.getTime();
        // console.log('epoch', epoch);

        setBigUint64(dv, 0, BigInt(epoch));
        // dv.setBigUint64(0, BigInt(epoch));
        buffer.push(dv.getUint8(0));
        buffer.push(dv.getUint8(1));
        buffer.push(dv.getUint8(2));
        buffer.push(dv.getUint8(3));
        buffer.push(dv.getUint8(4));
        buffer.push(dv.getUint8(5));
        buffer.push(dv.getUint8(6));
        buffer.push(dv.getUint8(7));
        return;
    }

    if (Array.isArray(json)) {
        if (json.length == 0) {
            buffer.push(TYPE_EMPTY_ARR);
            return;
        }
        buffer.push(TYPE_ARR);
        serializeArr(json, buffer, dict, cache);
        buffer.push(TYPE_ENDARR);
        return;
    }

    if (isObject(json)) {
        if (Object.keys(json).length == 0) {
            buffer.push(TYPE_EMPTY_OBJ);
            return;
        }

        buffer.push(TYPE_OBJ);
        serializeObj(json, buffer, dict, cache);
        buffer.push(TYPE_ENDOBJ);
        return;
    }


    if (isString) {

        if (json.length == 0) {
            buffer.push(TYPE_EMPTYSTRING);
            return;
        }

        let exists = mapKey(json, buffer, dict, cache, true);
        if (exists) {
            return;
        }


        if (json in cache) {
            let pos = cache[json];
            // console.log("Found cache for:", json, "at", pos);
            if (pos <= 255) {
                buffer.push(TYPE_STRING_DICT1);
                dv.setUint8(0, pos);
                buffer.push(dv.getUint8(0));
            }
            else {
                buffer.push(TYPE_STRING_DICT2);
                dv.setUint16(0, pos);
                buffer.push(dv.getUint8(0));
                buffer.push(dv.getUint8(1));
            }

            return;
        }

        buffer.push(TYPE_STRING)
        let pos = buffer.length;
        cache[json] = pos;

        let encoded = encoder.encode(json);
        for (var i = 0; i < encoded.byteLength; i++) {
            // console.log(json + '[' + i + ']', encoded[i]);
            buffer.push(encoded[i]);
        }
        buffer.push(0);
        return;
    }


    if (typeof json === "boolean") {
        if (json == false) {
            buffer.push(TYPE_FALSE);
            return;
        }
        buffer.push(TYPE_TRUE);
        return;
    }

    if (typeof json === 'number') {
        if (Number.isInteger(json)) {
            if (json == 0) {
                buffer.push(TYPE_ZERO);
                return;
            } else if (json == 1) {
                buffer.push(TYPE_ONE);
                return;
            } else if (json == 2) {
                buffer.push(TYPE_TWO);
                return;
            } else if (json == 3) {
                buffer.push(TYPE_THREE);
                return;
            } else if (json == 4) {
                buffer.push(TYPE_FOUR);
                return;
            } else if (json == 5) {
                buffer.push(TYPE_FIVE);
                return;
            }
            else if (json == 6) {
                buffer.push(TYPE_SIX);
                return;
            } else if (json == 7) {
                buffer.push(TYPE_SEVEN);
                return;
            } else if (json == 8) {
                buffer.push(TYPE_EIGHT);
                return;
            } else if (json == 9) {
                buffer.push(TYPE_NINE);
                return;
            } else if (json == 10) {
                buffer.push(TYPE_TEN);
                return;
            } else if (json == 11) {
                buffer.push(TYPE_ELEVEN);
                return;
            } else if (json == 12) {
                buffer.push(TYPE_TWELVE);
                return;
            } else if (json == 13) {
                buffer.push(TYPE_THIRTEEN);
                return;
            }
            else if (json >= -128 && json < 0) {
                buffer.push(TYPE_INT8);
                dv.setInt8(0, json);
                buffer.push(dv.getUint8(0));
            }
            else if (json >= 0 && json <= 255) {
                buffer.push(TYPE_UINT8);
                dv.setUint8(0, json);
                buffer.push(dv.getUint8(0));
            }
            else if (json >= -32768 && json < 0) {
                buffer.push(TYPE_INT16);
                dv.setInt16(0, json);
                buffer.push(dv.getUint8(0));
                buffer.push(dv.getUint8(1));
            }
            else if (json >= 0 && json <= 65535) {
                buffer.push(TYPE_UINT16);
                dv.setUint16(0, json);
                buffer.push(dv.getUint8(0));
                buffer.push(dv.getUint8(1));
            }
            else if (json >= -2147483648 && json < 0) {
                buffer.push(TYPE_INT32);
                dv.setInt32(0, json);
                buffer.push(dv.getUint8(0));
                buffer.push(dv.getUint8(1));
                buffer.push(dv.getUint8(2));
                buffer.push(dv.getUint8(3));
            }
            else if (json >= 0 && json <= 4294967295) {
                buffer.push(TYPE_UINT32);
                dv.setUint32(0, json);
                buffer.push(dv.getUint8(0));
                buffer.push(dv.getUint8(1));
                buffer.push(dv.getUint8(2));
                buffer.push(dv.getUint8(3));
            }
            else if (json < -2147483648) {
                buffer.push(TYPE_INT64);

                json = -json;
                setBigUint64(dv, 0, json);
                // dv.setBigInt64(0, BigInt(json));
                buffer.push(dv.getUint8(0));
                buffer.push(dv.getUint8(1));
                buffer.push(dv.getUint8(2));
                buffer.push(dv.getUint8(3));
                buffer.push(dv.getUint8(4));
                buffer.push(dv.getUint8(5));
                buffer.push(dv.getUint8(6));
                buffer.push(dv.getUint8(7));
            }
            else if (json > 4294967295) {
                buffer.push(TYPE_UINT64);

                setBigUint64(dv, 0, json);
                // dv.setBigUint64(0, BigInt(json));
                buffer.push(dv.getUint8(0));
                buffer.push(dv.getUint8(1));
                buffer.push(dv.getUint8(2));
                buffer.push(dv.getUint8(3));
                buffer.push(dv.getUint8(4));
                buffer.push(dv.getUint8(5));
                buffer.push(dv.getUint8(6));
                buffer.push(dv.getUint8(7));
            }
            return;
        }
        else {
            // if (json >= -3.4e38 && json <= 3.4e38) {
            // buffer.push(TYPE_FLOAT32);
            // dv.setFloat32(0, json);
            // buffer.push(dv.getUint8(0));
            // buffer.push(dv.getUint8(1));
            // buffer.push(dv.getUint8(2));
            // buffer.push(dv.getUint8(3));
            // }
            // else {
            let str = "" + json;
            if (str.length < 6) {
                buffer.push(TYPE_FLOATSTR);
                let encoded = encoder.encode(json);
                for (var i = 0; i < encoded.byteLength; i++) {
                    // console.log(json + '[' + i + ']', encoded[i]);
                    buffer.push(encoded[i]);
                }
                buffer.push(0);
            }
            else {
                buffer.push(TYPE_FLOAT64);
                dv.setFloat64(0, json);
                buffer.push(dv.getUint8(0));
                buffer.push(dv.getUint8(1));
                buffer.push(dv.getUint8(2));
                buffer.push(dv.getUint8(3));
                buffer.push(dv.getUint8(4));
                buffer.push(dv.getUint8(5));
                buffer.push(dv.getUint8(6));
                buffer.push(dv.getUint8(7));
            }

            // }
            return;
        }
    }


}

function mapKey(key, buffer, dict, cache, skip) {
    let id = dict.count || 0;
    if (key in dict.keys) {
        id = dict.keys[key];
    } else {
        if (skip) {
            return false;
        }
        if (dict.frozen || dict.count >= 255) {
            serializeEX(key, buffer, dict, cache);
            return false;
        }

        id = dict.count;
        dict.count += 1;
        dict.keys[key] = id;
        dict.order.push(key);

    }

    buffer.push(TYPE_DICT);
    buffer.push(id);

    return true;
}

function mapDeletionKey(value, buffer, dict, cache) {

    // let skey = key.substr(1, key.length - 1);
    // if (!(skey in dict.keys)) {
    //     mapKey(key, buffer, dict, cache);
    //     return false;
    // }

    // let id = dict.keys[skey];
    // buffer.push(TYPE_DEL_DICTKEY);
    // buffer.push(id);
    if (!Array.isArray(value))
        return

    buffer.push(TYPE_OBJ_DELETE);

    for (var i = 0; i < value.length; i++) {
        serializeEX(value[i], buffer, dict, cache);
    }

    buffer.push(TYPE_ENDARR);

    return true;
}

function mapArrayDelta(arr, buffer, dict, cache) {


    if (!Array.isArray(arr)) {
        serializeEX(arr, buffer, dict, cache);
        console.error(' -- Invalid Array Delta: ' + (typeof arr));
        return;

    }

    for (var i = 0; i < arr.length; i++) {

        let change = arr[i];
        let index = change.index;
        let type = change.type;
        let value = change.value;

        if (type == 'resize') {
            buffer.push(TYPE_ARR_RESIZE);
            buffer.push(value);
            continue;
        }


        if (type == 'setvalue') {
            buffer.push(TYPE_ARR_SETVALUE);
            buffer.push(index);

            serializeEX(value, buffer, dict, cache);
            continue;
        }

        if (type == 'nested') {
            buffer.push(TYPE_ARR_NESTED);
            buffer.push(index);

            mapArrayDelta(value, buffer, dict, cache);
        }

    }

    buffer.push(TYPE_ENDARR);

    return true;
}

function serializeObj(json, buffer, dict, cache) {

    for (var key in json) {
        let value = json[key];
        if (key == '$') {
            mapDeletionKey(value, buffer, dict, cache)
            continue;
        }
        else if (key[0] == '#') {
            let startPos = buffer.length;
            let skey = key.substring(1);
            if (!(skey in dict.keys)) {
                mapKey(skey, buffer, dict, cache);
            }
            else {
                let id = dict.keys[skey];
                buffer.push(TYPE_DICT);
                buffer.push(id);
            }

            if (!Array.isArray(value)) {
                serializeEX(value, buffer, dict, cache);
                let dist = buffer.length - startPos;
                // console.log("Object Size [" + key + "] = ", dist);
                continue;
            }

            buffer.push(TYPE_ARR_DELTA);
            mapArrayDelta(value, buffer, dict, cache)
            let dist = buffer.length - startPos;
            // console.log("Object Size [" + key + "] = ", dist);
            continue;
        }
        else {

            // if (isObject(value)) {
            //     if (key == 'state') {
            //         if (Object.keys(value).length == 0) {
            //             buffer.push(TYPE_KEY_STATE_EMPTY);
            //             continue;
            //         }
            //         buffer.push(TYPE_KEY_STATE);
            //     }
            //     else if (key == 'players') {
            //         if (Object.keys(value).length == 0) {
            //             buffer.push(TYPE_KEY_PLAYERS_EMPTY);
            //             continue;
            //         }
            //         buffer.push(TYPE_KEY_PLAYERS);
            //     }
            //     else if (key == 'rules') {
            //         if (Object.keys(value).length == 0) {
            //             buffer.push(TYPE_KEY_RULES_EMPTY);
            //             continue;
            //         }
            //         buffer.push(TYPE_KEY_RULES);
            //     }
            //     else if (key == 'next') {
            //         if (Object.keys(value).length == 0) {
            //             buffer.push(TYPE_KEY_NEXT_EMPTY);
            //             continue;
            //         }
            //         buffer.push(TYPE_KEY_NEXT);
            //     }
            //     else if (key == 'events') {
            //         if (Object.keys(value).length == 0) {
            //             buffer.push(TYPE_KEY_EVENTS_EMPTY);
            //             continue;
            //         }
            //         buffer.push(TYPE_KEY_EVENTS);
            //     }
            //     else if (key == 'teams') {
            //         if (Object.keys(value).length == 0) {
            //             buffer.push(TYPE_KEY_TEAMS_EMPTY);
            //             continue;
            //         }
            //         buffer.push(TYPE_KEY_TEAMS);
            //     }
            //     else if (key == 'timer') {
            //         if (Object.keys(value).length == 0) {
            //             buffer.push(TYPE_KEY_TIMER_EMPTY);
            //             continue;
            //         }
            //         buffer.push(TYPE_KEY_TIMER);
            //     }
            //     else {
            //         let startPos = buffer.length;
            //         mapKey(key, buffer, dict, cache);
            //         serializeEX(value, buffer, dict, cache);
            //         let dist = buffer.length - startPos;
            //         // console.log("Object Size [" + key + "] = ", dist);
            //         continue;
            //     }

            //     serializeObj(value, buffer, dict, cache);
            //     buffer.push(TYPE_ENDOBJ);
            // }
            // else {
            let startPos = buffer.length;
            mapKey(key, buffer, dict, cache);
            serializeEX(value, buffer, dict, cache);
            let dist = buffer.length - startPos;
            // console.log("Object Size [" + key + "] = ", dist);
            //     continue;
            // }

        }

    }
}



function serializeArr(json, buffer, dict, cache) {

    for (var i = 0; i < json.length; i++) {
        let value = json[i];
        serializeEX(value, buffer, dict, cache);
    }
}

function deserialize(buffer, pos, dict) {
    var ref = {
        buffer,
        pos,
        dict
    }
    return deserializeEX(ref);
}

function deserializeEX(ref) {

    // buffer = new DataView(ref.buffer);
    let json;
    let arr, i;
    let data;
    let type = ref.buffer.getUint8(ref.pos++);

    switch (type) {
        case TYPE_EMPTY_OBJ:
            json = {};
            break;
        case TYPE_EMPTY_ARR:
            json = [];
            break;
        case TYPE_DICT:
            let id = ref.buffer.getUint8(ref.pos++);
            json = ref.dict.order[id];
            break;
        case TYPE_NULL:
            json = null;
            break;
        case TYPE_ZERO:
            json = 0;
            break;
        case TYPE_ONE:
            json = 1;
            break;
        case TYPE_TWO:
            json = 2;
            break;
        case TYPE_THREE:
            json = 3;
            break;
        case TYPE_FOUR:
            json = 4;
            break;
        case TYPE_FIVE:
            json = 5;
            break;
        case TYPE_SIX:
            json = 6;
            break;
        case TYPE_SEVEN:
            json = 7;
            break;
        case TYPE_EIGHT:
            json = 8;
            break;
        case TYPE_NINE:
            json = 9;
            break;
        case TYPE_TEN:
            json = 10;
            break;
        case TYPE_ELEVEN:
            json = 11;
            break;
        case TYPE_TWELVE:
            json = 12;
            break;
        case TYPE_THIRTEEN:
            json = 13;
            break;

        case TYPE_OBJ:
            json = deserializeObj({}, ref);
            break;
        case TYPE_ARR_DELTA:
            let startPos = ref.pos;
            json = deserializeArrDelta([], ref);
            let dist = ref.pos - startPos;
            // console.log("ArrDelta Length: ", dist);
            break;
        case TYPE_ARR_NESTED:
            json = deserializeArrDelta([], ref);
            break;
        case TYPE_ARR:
            json = deserializeArr([], ref);
            break;
        case TYPE_EMPTYSTRING:
            json = '';
            break;
        //the string exists in the buffer already less than 255 indices away
        case TYPE_STRING_DICT1:
            arr = [];
            let position = ref.buffer.getUint8(ref.pos);
            for (; position < ref.buffer.byteLength; position++) {
                let val = ref.buffer.getUint8(position);
                if (val == 0) {
                    break;
                }
                arr.push(val);
            }
            ref.pos++; //skip null terminated
            data = new Uint8Array(arr);
            json = decoder.decode(data);
            break;
        //the string exists in the buffer already less than 65,536 indices away
        case TYPE_STRING_DICT2:
            arr = [];
            let position2 = ref.buffer.getUint16(ref.pos);
            for (; position2 < ref.buffer.byteLength; position2++) {
                let val = ref.buffer.getUint8(position2);
                if (val == 0) {
                    break;
                }
                arr.push(val);
            }
            ref.pos += 2; //skip null terminated
            data = new Uint8Array(arr);
            json = decoder.decode(data);
            break;
        case TYPE_STRING:
            arr = [];
            for (; ref.pos < ref.buffer.byteLength; ref.pos++) {
                let val = ref.buffer.getUint8(ref.pos);
                if (val == 0) {
                    break;
                }
                arr.push(val);
            }
            ref.pos++; //skip null terminated
            data = new Uint8Array(arr);
            json = decoder.decode(data);
            // console.log('string: ', json);
            break;
        case TYPE_TRUE:
            json = true;
            break;
        case TYPE_FALSE:
            json = false;
            break;
        case TYPE_DATE:
            json = getBigUint64(ref.buffer, ref.pos);
            // json = ref.buffer.getBigUint64(ref.pos);
            json = new Date(Number(json));
            ref.pos += 8;
            break;
        case TYPE_INT8:
            json = ref.buffer.getInt8(ref.pos);
            ref.pos++;
            break;
        case TYPE_UINT8:
            json = ref.buffer.getUint8(ref.pos);
            ref.pos++;
            break;
        case TYPE_INT16:
            json = ref.buffer.getInt16(ref.pos);
            ref.pos += 2;
            break;
        case TYPE_UINT16:
            json = ref.buffer.getUint16(ref.pos);
            ref.pos += 2;
            break;
        case TYPE_INT32:
            json = ref.buffer.getInt32(ref.pos);
            ref.pos += 4;
            break;
        case TYPE_UINT32:
            json = ref.buffer.getUint32(ref.pos);
            ref.pos += 4;
            break;
        case TYPE_INT64:
            json = getBigUint64(ref.buffer, ref.pos);
            json = -json;
            // json = getBigInt64(ref.buffer, ref.pos);
            // json = ref.buffer.getBigInt64(ref.pos);
            json = Number(json);
            ref.pos += 8;
            break;
        case TYPE_UINT64:
            json = getBigUint64(ref.buffer, ref.pos);
            // json = ref.buffer.getBigUint64(ref.pos);
            json = Number(json);
            ref.pos += 8;
            break;
        // case TYPE_FLOAT32:
        //     json = ref.buffer.getFloat32(ref.pos);
        //     ref.pos += 4;
        //     break;
        case TYPE_FLOATSTR:
            arr = [];
            for (; ref.pos < ref.buffer.byteLength; ref.pos++) {
                let val = ref.buffer.getUint8(ref.pos);
                if (val == 0) {
                    break;
                }
                arr.push(val);
            }
            ref.pos++; //skip null terminated
            data = new Uint8Array(arr);
            json = decoder.decode(data);
            json = parseFloat(json);
            break;
        case TYPE_FLOAT64:
            json = ref.buffer.getFloat64(ref.pos);
            ref.pos += 8;
            break;
    }

    return json;
}

function deserializeObj(json, ref) {
    json = json || {};

    // let prevType = ref.buffer.getUint8(ref.pos - 1);



    let type = ref.buffer.getUint8(ref.pos++);
    if (type == TYPE_ENDOBJ) {
        // ref.pos++;
        return json
    }
    // if (type == TYPE_OBJ) {
    //     type = ref.buffer.getUint8(ref.pos++);
    // }
    // switch (type) {
    //     case TYPE_KEY_STATE_EMPTY:
    //         json['state'] = {};
    //         return deserializeObj(json, ref);
    //     case TYPE_KEY_PLAYERS_EMPTY:
    //         json['players'] = {};
    //         return deserializeObj(json, ref);
    //     case TYPE_KEY_TEAMS_EMPTY:
    //         json['teams'] = {};
    //         return deserializeObj(json, ref);
    //     case TYPE_KEY_EVENTS_EMPTY:
    //         json['events'] = {};
    //         return deserializeObj(json, ref);
    //     case TYPE_KEY_RULES_EMPTY:
    //         json['rules'] = {};
    //         return deserializeObj(json, ref);
    //     case TYPE_KEY_NEXT_EMPTY:
    //         json['next'] = {};
    //         return deserializeObj(json, ref);
    //     case TYPE_KEY_TIMER_EMPTY:
    //         json['timer'] = {};
    //         return deserializeObj(json, ref);
    //     case TYPE_KEY_STATE:
    //         json['state'] = deserializeObj({}, ref);
    //         return deserializeObj(json, ref);
    //     case TYPE_KEY_PLAYERS:
    //         json['players'] = deserializeObj({}, ref);
    //         return deserializeObj(json, ref);
    //     case TYPE_KEY_TEAMS:
    //         json['teams'] = deserializeObj({}, ref);
    //         return deserializeObj(json, ref);
    //     case TYPE_KEY_EVENTS:
    //         json['events'] = deserializeObj({}, ref);
    //         return deserializeObj(json, ref);
    //     case TYPE_KEY_RULES:
    //         json['rules'] = deserializeObj({}, ref);
    //         return deserializeObj(json, ref);
    //     case TYPE_KEY_NEXT:
    //         json['next'] = deserializeObj({}, ref);
    //         return deserializeObj(json, ref);
    //     case TYPE_KEY_TIMER:
    //         json['timer'] = deserializeObj({}, ref);
    //         return deserializeObj(json, ref);
    // }


    if (type != TYPE_DICT && type != TYPE_STRING && type != TYPE_OBJ_DELETE && type != TYPE_STRING_DICT1 && type != TYPE_STRING_DICT2) {
        throw 'E_INVALIDOBJ';
    }

    // ref.pos++;

    if (type == TYPE_OBJ_DELETE) {
        // let id = ref.buffer.getUint8(ref.pos++);
        // let key = '$' + ref.dict.order[id];
        // json[key] = 0;

        json['$'] = deserializeArr([], ref);
        return deserializeObj(json, ref);
    }

    if (type == TYPE_DICT) {
        let id = ref.buffer.getUint8(ref.pos++);
        let key = ref.dict.order[id];


        let isArrDelta = ref.buffer.getUint8(ref.pos) == TYPE_ARR_DELTA;
        let value = deserializeEX(ref);

        if (isArrDelta) {
            key = '#' + key;
            // value = deserializeEX(ref);
        }

        json[key] = value;
        // console.log(key, value);

        return deserializeObj(json, ref);
    }

    if (type == TYPE_STRING || type == TYPE_STRING_DICT1 || type == TYPE_STRING_DICT2) {
        ref.pos--;
        // let id = ref.buffer.getUint8(ref.pos++);
        let key = deserializeEX(ref);
        let isArrDelta = ref.buffer.getUint8(ref.pos) == TYPE_ARR_DELTA;
        let value = deserializeEX(ref);

        if (isArrDelta) {
            key = '#' + key;
            // value = deserializeEX(ref);
        }

        // let value = deserializeEX(ref);



        json[key] = value;
        // console.log(key, value);
        return deserializeObj(json, ref);
    }

    throw 'E_INVALIDOBJ';
}

function deserializeArrDelta(json, ref) {
    json = json || [];

    if (ref.pos >= ref.buffer.byteLength) {
        throw 'E_INDEXOUTOFBOUNDS';
    }

    let type = ref.buffer.getUint8(ref.pos++);
    let index;
    let value;
    switch (type) {
        case TYPE_ENDARR:
            return json;
            break;
        case TYPE_ARR_RESIZE:
            value = ref.buffer.getUint8(ref.pos++);
            json.push({ value, type: 'resize' });
            break;
        case TYPE_ARR_SETVALUE:
            index = ref.buffer.getUint8(ref.pos++);
            value = deserializeEX(ref)
            json.push({ index, type: 'setvalue', value });
            break;
        case TYPE_ARR_NESTED:
            index = ref.buffer.getUint8(ref.pos++);
            value = deserializeArrDelta([], ref);
            json.push({ index, type: 'nested', value });
            break;
        default:

            break;
    }


    let result = deserializeArrDelta(json, ref);

    return result;

    // return json;
}

function deserializeArr(json, ref) {
    json = json || [];

    if (ref.pos >= ref.buffer.byteLength) {
        throw 'E_INDEXOUTOFBOUNDS';
    }

    let type = ref.buffer.getUint8(ref.pos++);
    if (type == TYPE_ENDARR) {
        return json
    }
    ref.pos--; //move cursor back to get next value

    let value = deserializeEX(ref);
    json.push(value);

    return deserializeArr(json, ref);
}

export function encode(json, storedDict) {
    try {

        // console.log("ENCODING: ", JSON.stringify(json, null, 2));
        let dict = createDefaultDict(storedDict);
        dict.frozen = true;
        // console.time('serialize');
        let encoded = serialize(json, dict);
        // console.timeEnd('serialize');
        console.log('Encoded Size: ', encoded.byteLength, json)
        // let jsonStr = JSON.stringify(json);
        // let buffer = encoder.encode(jsonStr);
        // let deflated = pako.deflate(encoded);
        //console.log("encode json len: " + buffer.length);
        //console.log("encode byte len: ", deflated.length);
        return encoded;
    }
    catch (e) {
        console.error(e);
    }
    return null;
}

export function decode(raw, storedDict) {
    try {

        let dict = createDefaultDict(storedDict);
        dict.frozen = true;
        let abuff = ArrayBuffer.isView(raw) ? raw : raw.buffer;
        var dataview;

        try {

            dataview = new DataView(raw);
        }
        catch (e) {
            var buf = new Uint8Array(raw).buffer;
            dataview = new DataView(buf);
        }
        // console.time('deserialize');
        let decoded = deserialize(dataview, 0, dict);
        // console.timeEnd('deserialize');
        // let inflated = pako.inflate(raw);
        // let jsonStr = decoder.decode(inflated);
        // let json = JSON.parse(jsonStr);
        //console.log("decode byte len: ", raw.byteLength);
        //console.log("decode json len: " + inflated.length);
        return decoded;
    }
    catch (e) {
        console.error(e);
        try {
            let jsonStr = raw.toString();
            let json = JSON.parse(jsonStr);
            return json;
        }
        catch (e) {
            console.error(e);
        }

    }
    return null;
}

function createDictKeys(dict) {
    for (var i = 0; i < dict.order.length; i++) {
        let key = dict.order[i];
        dict.keys[key] = i;
    }
}

function test() {

    let buffer = [];
    let dict = createDefaultDict();

    let testJSON2 = {
        state: { startPlayer: 1 },
        events: {},
        timer: {},
        players: {},
        teams: {},
        next: {},
        rules: {}
    }
    // console.time('serialize');
    // let encoded = serialize(testJSON, dict);
    // let deflated = pako.deflate(encoded);
    // console.timeEnd('serialize');

    // console.log("Dict: ", dict);
    let bufferLen = buffer.length;
    let dictLen = JSON.stringify(dict.order).length;

    // console.time('encode')
    // let jsonStr = JSON.stringify(testJSON);
    let jsonEncoded = encode(testJSON2);
    // let jsonDeflated = pako.deflate(jsonEncoded);
    // console.timeEnd('encode')

    // console.time('decode');
    let decoded = decode(jsonEncoded);

    // console.timeEnd("decode");
    console.log(decoded);
    // console.log("Dict: ", dict);
    // console.log("Buffer:", encoded.byteLength);
    // console.log("Dict length: ", dictLen);
    // console.log("Buffer+Dict length: ", dictLen + encoded.byteLength);
    console.log("JSON length: ", JSON.stringify(testJSON2).length);
    // console.log("compressed byte len: ", deflated.length);
    // console.log("compressed JSON str byte len: ", jsonDeflated.length);
    // var dataview = new DataView(encoded);
    // console.time('deserialize');
    // let decoded = deserialize(dataview, 0, dict);
    // console.timeEnd('deserialize');
    // console.log(JSON.parse(JSON.stringify(testJSON)))
    // console.log(decoded);
    // console.log(decoded.players['8CCkf'].score.getTime())
}

// test();

// if (typeof module !== 'undefined' && module.exports) {
//     module.exports = { encode, decode, serialize, deserialize, defaultDict };
// }
