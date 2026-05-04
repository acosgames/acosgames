import { GameStatus } from "./enums.js";

let isGameover: boolean = false;
let roomStatus: GameStatus = GameStatus.none;
let gamestate: GameState | null = null;

let timerHandle: any = 0;
let timerPaused: boolean = false;
let timerLoopCallback: ((elapsed: number) => void) = (elapsed: number) => {};

var volumeChangeCallback: ((volume: number) => void) | null = null;
var ACOS_VOLUME: number = 1.0;
    
export function send(type: string, payload: any): void {
    window.parent.postMessage({ type, payload }, "*");
}

export function ready(): void {
    send("ready", true);
}

export function listen(gameStateCallback: (message: string) => void, utilityCallback?: (message: string) => void): void {
    window.addEventListener("message", onMessage(gameStateCallback, utilityCallback), false);
}

export function getPortrait(portraitid: string): string {
    return "" + portraitid;
}

export function getCountryFlag(countrycode: string): string {
    return "" + countrycode;
}

const onMessage =
    (gameStateCallback: (message: string, newStatus: boolean) => void, utilityCallback?: (message: string) => void) => (evt: MessageEvent<any>) => {
        // console.log("MESSAGE EVENT CALLED #1");
        let message = evt.data;
        let origin = evt.origin;
        let source = evt.source;
        if (!message || message.length == 0) return;

        if( message?.type == 'pause' ) {
            pauseTimer();
            utilityCallback?.(message);
            return;
        }
        else if( message?.type == 'resume' ) {
            resumeTimer();
            utilityCallback?.(message);
            return;
        }
        else if( message?.type == 'volume' ) {
            let volume = message?.payload;
            if( typeof volume === "number" ) {
                setVolume(volume);
            }
            utilityCallback?.(message);
            return;
        }

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

        if (gameStateCallback) {
            gameStateCallback(message, newStatus);
        }
    };


export function timerLoop(cb: (elapsed: number) => void): void {
    timerLoopCallback = cb;
    if (timerPaused) return;
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

export function pauseTimer(): void {
    timerPaused = true;
    clearTimeout(timerHandle);
}

export function resumeTimer(): void {
    if (!timerPaused) return;
    timerPaused = false;
    timerLoop(timerLoopCallback);
}



export function setVolume(volume: number): void {
    ACOS_VOLUME = Math.max(0, Math.min(1, volume));

    if( volumeChangeCallback )
        volumeChangeCallback(ACOS_VOLUME);
    // Implement actual audio volume control as needed, e.g.:
    // if using HTMLAudioElement(s), set their .volume = ACOS_VOLUME
}

export function onVolumeChange(callback: (volume: number) => void): void {
    volumeChangeCallback = callback;
}

export default { send, ready, listen, getPortrait, getCountryFlag, timerLoop, pauseTimer, resumeTimer, setVolume, onVolumeChange };
