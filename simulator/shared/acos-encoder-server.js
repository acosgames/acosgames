const { 
    createDefaultDict, 
    initProtocols, 
    // protoEncode, 
    // protoDecode 
} = require("acos-json-encoder");

const ACOSDictionary = require("./acos-dictionary.json");
const PROTOCOL_GAME = require("./protocol/protocol-game.cjs");

const messageProtocols = {
    // default:       { schema: 0, protocol: {} },
    update:        { schema: 2, protocol: PROTOCOL_GAME },
    gameover:      { schema: 3, protocol: PROTOCOL_GAME },
    gamecancelled: { schema: 4, protocol: PROTOCOL_GAME },
};

createDefaultDict(ACOSDictionary);
initProtocols(messageProtocols);

// function acosEncode(json) {
//     return protoEncode(json);
// }

// function acosDecode(bytes) {
//     return protoDecode(bytes);
// }

// module.exports = { acosEncode, acosDecode };
