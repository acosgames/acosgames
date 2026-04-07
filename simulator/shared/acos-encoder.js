import { 
    createDefaultDict, 
    initProtocols, 
    // protoDecode, 
    // protoEncode 
} from "acos-json-encoder";

import ACOSDictionary from "./acos-dictionary.json" with  { type: "json" };
import PROTOCOL_GAME from "./protocol/protocol-game";

let messageProtocols = {
    // default: { schema: 0, protocol: {} },
    update: { schema: 2, protocol: PROTOCOL_GAME },
    gameover: { schema: 3, protocol: PROTOCOL_GAME },
    gamecancelled: { schema: 4, protocol: PROTOCOL_GAME }
}

createDefaultDict(ACOSDictionary);
initProtocols(messageProtocols);


// export function acosEncode(json) {

//     // if (json?.type in messageProtocols) {
//     //     return protoEncode(json);
//     // }

//     return protoEncode(json);
// }

// export function acosDecode(bytes) {

//     // let decoded = decode(data, dictionary);
//     return protoDecode(bytes);
// }



