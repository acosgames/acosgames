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

const onMessage = (callback: (message: string) => void) => (evt) => {
    // console.log("MESSAGE EVENT CALLED #1");
    let message = evt.data;
    let origin = evt.origin;
    let source = evt.source;
    if (!message || message.length == 0) return;

    if (callback) {
        callback(message);
    }

    gamestate = message;
};

let gamestate: any = null;
let timeleft: number = 0;
let timerHandle: any = 0;
export function timerLoop(cb: (elapsed: number) => void): void {
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

    timeleft = elapsed;
    if (cb) cb(elapsed);

    let room = gamestate?.room;
    if (room?.status == "gameover") {
        clearTimeout(timerHandle);
        return;
    }
}

export default { send, ready, listen, getPortrait, getCountryFlag, timerLoop };
