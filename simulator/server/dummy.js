let d = require('../shared/delta');
let { encode, decode } = require('../shared/encoder');

const vlq = require('vlq');

const fs = require('fs');

// var convert = require('convert-source-map');

function testSourceMap() {

    let jsonStr = fs.readFileSync('../memorize-up/builds/server/server.dev.bundle.js.map');
    let json = JSON.parse(jsonStr);


    let mappings = json.mappings;
    vlqs = mappings.split(';').map(line => line.split(','));
    decoded = vlqs.map(line => line.map(vlq.decode));

    let sourceFileIndex = 0;   // second field
    let sourceCodeLine = 0;    // third field
    let sourceCodeColumn = 0;  // fourth field
    let nameIndex = 0;         // fifth field

    decoded = decoded.map(line => {
        let generatedCodeColumn = 0; // first field - reset each time

        return line.map(segment => {
            if (segment.length === 0) {
                return [];
            }
            generatedCodeColumn += segment[0];

            const result = [generatedCodeColumn];

            if (segment.length === 1) {
                // only one field!
                return result;
            }

            sourceFileIndex += segment[1];
            sourceCodeLine += segment[2];
            sourceCodeColumn += segment[3];

            result.push(sourceFileIndex, sourceCodeLine, sourceCodeColumn);

            if (segment.length === 5) {
                nameIndex += segment[4];
                result.push(nameIndex);
            }

            return result;
        });
    });

    console.log(decoded);

    let compiledLineNumber = 276;
    let lineMapping = decoded[compiledLineNumber][0];
    console.log(lineMapping);

    let sourcesContents = json.sourcesContent[0];
    sourcesContents = sourcesContents.split('\r\n');

    let sourceFile = json.sources[lineMapping[1]].replace("file:///", "");

    let sourceContent = sourcesContents[lineMapping[2]];

    let lineNumber = Number.parseInt(lineMapping[2]) + 1;
    let columnNumber = Number.parseInt(lineMapping[3]) + 1;
    console.log(sourceFile, lineNumber + ':' + columnNumber);

    //E:\GitHub\acos-games\memorize-up\builds\server\server.dev.bundle.js:277:27
}

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

testSourceMap();
// run();