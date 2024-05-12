export function send(type, payload) {
    window.parent.postMessage({ type, payload }, "*");
}
export function ready() {
    send("ready", true);
}
export function listen(callback) {
    window.addEventListener("message", onMessage(callback), false);
}
export function getPortrait(portraitid) {
    return "" + portraitid;
}
export function getCountryFlag(countrycode) {
    return "" + countrycode;
}
const onMessage = (callback) => (evt) => {
    var _a, _b;
    // console.log("MESSAGE EVENT CALLED #1");
    let message = evt.data;
    let origin = evt.origin;
    let source = evt.source;
    if (!message || message.length == 0)
        return;
    if (callback) {
        callback(message);
    }
    gamestate = message;
    if (((_a = gamestate === null || gamestate === void 0 ? void 0 : gamestate.room) === null || _a === void 0 ? void 0 : _a.status) != roomStatus) {
        lastRoomStatus = roomStatus;
        roomStatus = (_b = gamestate === null || gamestate === void 0 ? void 0 : gamestate.room) === null || _b === void 0 ? void 0 : _b.status;
        if (isGameover && roomStatus != "gameover") {
            isGameover = false;
            timerLoop(timerLoopCallback);
        }
    }
};
let isGameover = false;
let roomStatus = "none";
let lastRoomStatus = "none";
let gamestate = null;
let timeleft = 0;
let timerHandle = 0;
let timerLoopCallback = null;
export function timerLoop(cb) {
    timerLoopCallback = cb;
    timerHandle = setTimeout(() => {
        timerLoop(cb);
    }, 100);
    let timer = gamestate === null || gamestate === void 0 ? void 0 : gamestate.timer;
    if (!timer)
        return;
    let deadline = timer === null || timer === void 0 ? void 0 : timer.end;
    if (!deadline)
        return;
    let now = new Date().getTime();
    let elapsed = deadline - now;
    if (elapsed <= 0) {
        elapsed = 0;
    }
    timeleft = elapsed;
    if (cb)
        cb(elapsed);
    let room = gamestate === null || gamestate === void 0 ? void 0 : gamestate.room;
    if ((room === null || room === void 0 ? void 0 : room.status) == "gameover") {
        clearTimeout(timerHandle);
        isGameover = true;
        return;
    }
}
export default { send, ready, listen, getPortrait, getCountryFlag, timerLoop };
