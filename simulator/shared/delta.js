//testsdaf
class Delta {
    delta(from, to, result) {
        try {


            if (Array.isArray(from)) {
                return this.arrDelta(from, to, []);
            }

            if (this.isObject(from)) {
                return this.objDelta(from, to, {});
            }

            if (from != to) {
                result = to;
            }
        }
        catch (e) {
            console.error(e);
        }
        return result;
    }

    isObject(x) {
        return x != null && (typeof x === 'object' || typeof x === 'function') && !Array.isArray(x);
    }
    objDelta(from, to, result) {
        result = result || {};

        for (var key in to) {

            if (key[0] == '#') {
                let fixedKey = key.substring(1);
                if (typeof to[key] !== 'undefined') {
                    to[fixedKey] = to[key];
                    delete to[key];
                }
                if (typeof from[key] !== 'undefined') {
                    from[fixedKey] = from[key];
                    delete from[key];
                }

                key = fixedKey;
            }

            if (!(key in from)) {
                result[key] = to[key];
                continue;
            }

            let child = this.delta(from[key], to[key]);

            if (typeof child !== 'undefined' && child != null) {

                if (Array.isArray(from[key]) && Array.isArray(to[key]) && child.length > 0) {
                    result['#' + key] = child;
                    continue;
                }

                if ((typeof child === 'string') ||
                    (typeof child === 'number') ||
                    (typeof child === 'boolean') ||
                    Object.keys(child).length > 0) {
                    result[key] = child;
                }


            }


            // else
            //     result[key] = to[key];
        }

        for (var key in from) {
            if (!(key in to)) {

                if (!result['$'])
                    result['$'] = [];
                result['$'].push(key);
            }

        }
        return result;
    }

    arrDelta(from, to, result) {
        result = result || [];

        //return to;
        // if (from.length != to.length) {
        //     return to;
        // }

        let changes = [];
        let resize = null;
        let moves = [];

        if (from.length == 0 && to.length > 0) {
            return to;
        }

        to = to || [];
        // let arrMapFrom = {};
        // let arrMapTo = {};
        // let valMap = {};
        let maxSize = Math.max(to?.length || 0, from?.length || 0);

        for (var i = 0; i < maxSize; i++) {

            let valf = from[i];
            let valt = to[i];

            let fstr = JSON.stringify(valf);
            let tstr = JSON.stringify(valt);


            if (fstr == tstr)
                continue;

            if (i >= to.length) {
                changes.push({ value: i, type: 'resize' });
                // changes.push(-i);
                // resize = i;
                break;
            }

            changes.push({ index: i, type: 'nested', value: valt });
            // changes.push(valt);
        }



        for (var i = 0; i < changes.length; i++) {
            //let add = adds[i];
            let change = changes[i];
            let toIndex = change.index;
            let type = change.type;

            if (type == 'resize')
                continue;

            let toVal = change.value;
            let child;

            let isFromArray = Array.isArray(from[toIndex])
            let isToArray = Array.isArray(toVal)
            if (isFromArray && isToArray &&
                from[toIndex].length == 0 && toVal.length > 0) {
                change.type = 'setvalue';
                child = this.delta(from[toIndex], toVal);
            }
            else if (typeof from[toIndex] != typeof toVal || (!isFromArray || !isToArray)) {
                change.type = 'setvalue';
                child = this.delta(from[toIndex], toVal);
            }
            else {
                child = this.delta(from[toIndex], toVal);
            }

            change.value = child;
        }

        result = changes;

        // console.log("result:", result);

        // if(typeof result.adds === 'undefined' && typeof result.resize === 'undefined' ) {
        //     return result
        // }
        // for (var i = 0; i < to.length; i++) {

        //     let child = this.delta(from[i], to[i]);
        //     console.log(child);
        //     // if (typeof child !== 'undefined' &&
        //     //     (typeof child === 'string' ||
        //     //         typeof child === 'number' ||
        //     //         typeof child == 'boolean' ||
        //     //         Object.keys(child).length > 0))
        //     //     //to[i] = child;
        //     //     return to;
        // }
        return result;
    }

    hidden(obj) {

        if (this.isObject(obj)) {
            let result = {}
            for (var key in obj) {
                if (key[0] == '_' || (key[0] == '#' && key[1] == '_')) {
                    result[key] = JSON.parse(JSON.stringify(obj[key]));
                    delete obj[key];
                    continue;
                }
                let test = this.hidden(obj[key]);
                if (typeof test !== 'undefined') {
                    result[key] = test;
                }
                if (this.isObject(obj[key]) && Object.keys(obj[key]).length == 0) {
                    delete obj[key];
                }
            }

            if (Object.keys(result).length == 0)
                return undefined;
            return result;
        }

        return undefined;
    }

    merge(from, delta) {

        // if (!this.isObject(delta)) {
        //     return from;
        // }
        if (!Array.isArray(delta) && !this.isObject(delta)) {
            if (delta != from)
                return delta;
        }

        if (typeof from != typeof delta) {
            return delta;
        }

        for (var key in delta) {

            if (key == '$') {
                let arr = delta[key];
                if (arr && arr.length > 0)
                    for (var i = 0; i < arr.length; i++) {
                        let val = arr[i];
                        if (from[val])
                            delete from[val];
                    }

                continue;
            }

            if (key[0] == '#') {
                let realkey = key.substring(1);
                from[realkey] = this.mergeArrayChanges(from[realkey], delta[key]);
                continue;
            }


            if (!(key in from)) {
                from[key] = delta[key];
                continue;
            }

            if (Array.isArray(delta[key])) {
                from[key] = delta[key];
                continue;
            }
            if (this.isObject(delta[key])) {
                from[key] = this.merge(from[key], delta[key])
                continue;
            }

            from[key] = delta[key];
        }

        return from;
    }

    mergeArrayChanges(from, changes) {

        if (!from) {
            return changes;
        }
        for (var i = 0; i < changes.length; i++) {


            let change = changes[i];
            let index = change.index;
            let type = change.type;
            let value = change.value;

            //type of resize
            if (type == 'resize') {
                from.length = value;// = from.slice(0, value);
                continue;
            }

            //type of full update
            if (type == 'setvalue') {
                from[index] = this.merge(from[index], value);
                continue;
            }

            if (type == 'nested') {
                from[index] = this.mergeArrayChanges(from[index], value);
                continue;
            }

            return from;
            // let final = null;
            // if (typeof from[index] === 'undefined' || Array.isArray(from[index])) {
            //     final = this.mergeArrayChanges(from[index], value);
            // } else {
            //     final = this.merge(from[index], value);
            // }
            from[index] = final;
        }

        return from;
    }

    //Credit to bryc
    //https://stackoverflow.com/a/52171480
    cyrb53(str, seed = 0) {
        let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
        for (let i = 0, ch; i < str.length; i++) {
            ch = str.charCodeAt(i);
            h1 = Math.imul(h1 ^ ch, 2654435761);
            h2 = Math.imul(h2 ^ ch, 1597334677);
        }
        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
        h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
        return 4294967296 * (2097151 & h2) + (h1 >>> 0);
    }

}


const DELTA = new Delta();
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DELTA;
}


function test3() {


    // let hash = cyrb53("test");
    // console.log("Hash:", hash);
}



// test3();

function test2() {
    let d = new Delta();
    let defaultGame = {
        state: {

            cells: ['', '', '', '', '', '', '', '', ''],
            startPlayer: '',
            _secret: '123'
        },
        players: {
            joe: { name: "Joe", type: "x", test: { _stats: "tank" } },
            tim: { name: "Tim", type: "o", test: { _stats: "assassin" } }
        },
        rules: {
            bestOf: 5,
            maxPlayers: 2
        },
        next: {},
        events: []
    }

    console.log('[ACOS] ' + defaultGame);
    let hiddenOnly = d.hidden(defaultGame);

    console.log('[ACOS] ' + hiddenOnly);
    console.log('[ACOS] ' + defaultGame);
}
// test2();

function test() {
    let defaultGame = {
        state: {
            board: [
                [0, 2, 0, 2, 0, 2, 0, 2], //white
                [2, 0, 2, 0, 2, 0, 2, 0],
                [0, 2, 0, 2, 0, 2, 0, 2],
                [0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0],
                [1, 0, 1, 0, 1, 0, 1, 0],
                [0, 1, 0, 1, 0, 1, 0, 1],
                [1, 0, 1, 0, 1, 0, 1, 0], //black
            ],
            cells: ['', '', '', '', '', '', '', '', ''],
            startPlayer: ''
        },
        players: {},
        rules: {
            bestOf: 5,
            maxPlayers: 2
        },
        next: {},
        events: []
    }
    let changed = JSON.parse(JSON.stringify(defaultGame));
    changed.state.board[0][0] = 1;
    changed.state.cells[0] = 'x';
    changed.state.cells[1] = 'x';
    changed.state.cells[2] = 'o';
    changed.players['joe'] = { name: 'Joe', type: 'x' };
    delete changed.state.startPlayer;


    let d = new Delta();
    console.time('delta');
    let diff = null;
    for (var i = 0; i < 1; i++)
        diff = d.delta(defaultGame, changed, {});
    console.timeEnd('delta');
    console.log('[ACOS] ' + "Diffed: ", diff);
    let merged = d.merge(defaultGame, diff);
    console.log('[ACOS] ' + "Merged: ", merged);

    changed = JSON.parse(JSON.stringify(merged));
    delete changed.players.joe.type;
    diff = d.delta(merged, changed, {});
    console.log('[ACOS] ' + "Diffed2: ", diff);
    merged = d.merge(merged, diff);
    console.log('[ACOS] ' + "Merged2: ", merged);
}

// test();
