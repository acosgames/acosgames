let d = require('../shared/delta');
let { encode, decode } = require('../shared/encoder');



function run() {

    let prev = {
        state: {
            board: [
                [0, 2, 0, 2, 0, 2, 0, 2],
                [2, 0, 2, 0, 2, 0, 2, 0],
                [0, 2, 0, 2, 0, 2, 0, 2],
                [0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0],
                [1, 0, 1, 0, 1, 0, 1, 0],
                [0, 1, 0, 1, 0, 1, 0, 1],
                [1, 0, 1, 0, 1, 0, 1, 0],
            ]
        }
    }

    let next = {
        state: {
            board: [
                [0, 2, 0, 2, 0, 2, 0, 2],
                [2, 0, 2, 0, 2, 0, 2, 0],
                [0, 2, 0, 2, 0, 2, 0, 2],
                [0, 0, 0, 0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0, 0, 0, 0],
                [1, 0, 2, 0, 1, 0, 1, 0],
                [0, 1, 0, 1, 0, 1, 0, 1],
                [1, 0, 1, 0, 1, 0, 1, 0],
            ]
        }
    }

    console.time('delta');
    let delta = d.delta(prev, next, {});
    console.timeEnd('delta');
    console.log("delta", JSON.stringify(delta, null, 2));

    console.time('encode');
    let encoded = encode(delta);
    let encodedFull = encode(next);
    console.timeEnd('encode');
    console.log("encoded delta", encoded);
    console.log("encoded full", encodedFull);

    console.time('decode');
    let decoded = decode(encoded);
    console.timeEnd('decode');
    console.log('decoded', JSON.stringify(decoded, null, 2));

    console.time('merge');
    let merged = d.merge(prev, decoded);
    console.timeEnd('merge');
    console.log("merged", JSON.stringify(merged, null, 2));




}

run();