
class Delta {
    delta(from, to, result) {

        if (Array.isArray(from)) {
            return this.arrDelta(from, to, []);
        }

        if (this.isObject(from)) {
            return this.objDelta(from, to, {});
        }

        if (from != to) {
            result = to;
        }

        return result;
    }

    isObject(x) {
        return x != null && (typeof x === 'object' || typeof x === 'function') && !Array.isArray(x);
    }
    objDelta(from, to, result) {
        result = result || {};

        for (var key in to) {


            if (!(key in from)) {
                result[key] = to[key];
                continue;
            }

            let child = this.delta(from[key], to[key]);
            if (typeof child !== 'undefined' && child != null &&
                ((typeof child === 'string') ||
                    (typeof child === 'number') ||
                    (typeof child === 'boolean') ||
                    Object.keys(child).length > 0))
                result[key] = child;
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
        if (from.length != to.length) {
            return to;
        }

        for (var i = 0; i < to.length; i++) {

            let child = this.delta(from[i], to[i]);
            if (typeof child !== 'undefined' &&
                (typeof child === 'string' ||
                    typeof child === 'number' ||
                    typeof child == 'boolean' ||
                    Object.keys(child).length > 0))
                //to[i] = child;
                return to;
        }
        return result;
    }

    hidden(obj) {

        if (this.isObject(obj)) {
            let result = {}
            for (var key in obj) {
                if (key[0] == '_') {
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

}


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

    console.log(defaultGame);
    let hiddenOnly = d.hidden(defaultGame);

    console.log(hiddenOnly);
    console.log(defaultGame);
}
// test2();

function test() {
    let defaultGame = {
        state: {
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
    changed.state.cells[0] = 'x';
    changed.state.cells[1] = 'x';
    changed.state.cells[2] = 'o';
    changed.players['joe'] = { name: 'Joe', type: 'x' };
    delete changed.state.startPlayer;

    let d = new Delta();
    let diff = d.delta(defaultGame, changed, {});
    console.log("Diffed: ", diff);
    let merged = d.merge(defaultGame, diff);
    console.log("Merged: ", merged);

    changed = JSON.parse(JSON.stringify(merged));
    delete changed.players.joe.type;
    diff = d.delta(merged, changed, {});
    console.log("Diffed2: ", diff);
    merged = d.merge(merged, diff);
    console.log("Merged2: ", merged);
}

// test();

module.exports = new Delta();