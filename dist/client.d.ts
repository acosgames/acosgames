export declare function send(type: string, payload: any): void;
export declare function ready(): void;
export declare function listen(callback: (message: string) => void): void;
export declare function getPortrait(portraitid: string): string;
export declare function getCountryFlag(countrycode: string): string;
export declare function timerLoop(cb: (elapsed: number) => void): void;
declare const _default: {
    send: typeof send;
    ready: typeof ready;
    listen: typeof listen;
    getPortrait: typeof getPortrait;
    getCountryFlag: typeof getCountryFlag;
    timerLoop: typeof timerLoop;
};
export default _default;
