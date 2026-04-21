import { GameStatus } from "./enums.js";


    
export function send(type: string, payload: any): void {
    window.parent.postMessage({ type, payload }, "*");
}

export function ready(): void {
    send("ready", true);
}

export function listen(callback: (message: string) => void) {
    window.addEventListener("message", onMessage(callback), false);
}

export function getPortrait(portraitid: string): string {
    return "" + portraitid;
}

export function getCountryFlag(countrycode: string): string {
    return "" + countrycode;
}

const onMessage =
    (callback: (message: string, newStatus: boolean) => void) => (evt: MessageEvent<any>) => {
        // console.log("MESSAGE EVENT CALLED #1");
        let message = evt.data;
        let origin = evt.origin;
        let source = evt.source;
        if (!message || message.length == 0) return;

        let newStatus = false;
        gamestate = message;
        if (gamestate && gamestate?.room?.status != roomStatus) {
            roomStatus = gamestate?.room?.status;
            newStatus = true;
            if (
                isGameover &&
                roomStatus < GameStatus.gameover
            ) {
                isGameover = false;
                timerLoop(timerLoopCallback);
            }
        }

        if (callback) {
            callback(message, newStatus);
        }
    };

let isGameover: boolean = false;
let roomStatus: GameStatus = GameStatus.none;
let gamestate: GameState | null = null;
let timerHandle: any = 0;
let timerLoopCallback: ((elapsed: number) => void) = (elapsed: number) => {};
export function timerLoop(cb: (elapsed: number) => void): void {
    timerLoopCallback = cb;
    timerHandle = setTimeout(() => {
        timerLoop(cb);
    }, 100);

    let timer = gamestate?.room;
    if (!timer) return;

    let deadline = (timer?.starttime || 0) + (timer?.timeend || 0);
    if (!deadline) return;

    let now = Date.now();
    let elapsed = deadline - now;

    if (elapsed <= 0) {
        elapsed = 0;
    }

    if (cb) cb(elapsed);

    let room = gamestate?.room;
    if (room && room.status >= GameStatus.gameover) {
        clearTimeout(timerHandle);
        isGameover = true;
        return;
    }
}

export default { send, ready, listen, getPortrait, getCountryFlag, timerLoop };
