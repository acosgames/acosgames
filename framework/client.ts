import { EGameStatus } from "./defs";

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
    (callback: (message: string, newStatus: boolean) => void) => (evt) => {
        // console.log("MESSAGE EVENT CALLED #1");
        let message = evt.data;
        let origin = evt.origin;
        let source = evt.source;
        if (!message || message.length == 0) return;

        let newStatus = false;
        gamestate = message;
        if (gamestate?.room?.status != roomStatus) {
            roomStatus = gamestate?.room?.status;
            newStatus = true;
            if (
                isGameover &&
                EGameStatus[roomStatus] < EGameStatus["gameover"]
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
let roomStatus: string = "none";
let gamestate: GameState = null;
let timerHandle: any = 0;
let timerLoopCallback = null;
export function timerLoop(cb: (elapsed: number) => void): void {
    timerLoopCallback = cb;
    timerHandle = setTimeout(() => {
        timerLoop(cb);
    }, 100);

    let timer = gamestate?.timer;
    if (!timer) return;

    let deadline = timer?.end;
    if (!deadline) return;

    let now = new Date().getTime();
    let elapsed = deadline - now;

    if (elapsed <= 0) {
        elapsed = 0;
    }

    if (cb) cb(elapsed);

    let room = gamestate?.room;
    if (EGameStatus[room?.status] >= EGameStatus["gameover"]) {
        clearTimeout(timerHandle);
        isGameover = true;
        return;
    }
}

export default { send, ready, listen, getPortrait, getCountryFlag, timerLoop };
