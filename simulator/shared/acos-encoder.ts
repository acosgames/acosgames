import {
    createDefaultDict,
    registerProtocol,
    setDefaultDictionary,
} from "acos-json-encoder";

import ACOSDictionary from "./acos-dictionary.json" ;
import PROTOCOL_GAME from "./protocol/protocol-game.json";
import { assert } from "console";


export default function initACOSProtocol() {

    createDefaultDict(ACOSDictionary);
    setDefaultDictionary(ACOSDictionary);
    registerProtocol(PROTOCOL_GAME);

}