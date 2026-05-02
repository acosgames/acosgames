// import * as defs from "./defs";

import ACOSClient from "./client.js";
import ACOSServer from "./server.js";
import { GameStatus } from "./enums.js";
import { gs, PlayerReader, TeamReader, RoomReader, GameStateReader } from "./gamestate.js";

export { ACOSClient, ACOSServer, GameStatus, gs, PlayerReader, TeamReader, RoomReader, GameStateReader };
export type { Teams, Players, ACOSEvents, GameState, State, StatString, Stats, Player, Team, Next, NextID, NextAction, PlayerRef, TeamRef, Room, Timer, ACOSEvent, User, Action } from "./types.js";
// export type { GameStatus } from "./defs";

