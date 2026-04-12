interface ProfileRecord {
    [name: string]: bigint;
}

const profiles: ProfileRecord = {};

const Profiler = {
    debug: true,

    log(...args: unknown[]): void {
        if (!this.debug) return;
        console.log(...args);
    },

    info(...args: unknown[]): void {
        console.log(...args);
    },

    Start(name: string): void {
        if (!this.debug) return;
        profiles[name] = process.hrtime.bigint();
    },

    End(name: string, msWarn?: number): void {
        if (!this.debug) return;
        if (!profiles[name]) return;

        const start = Number(profiles[name]);
        const end = process.hrtime.bigint();
        const number = Number(end) - start;
        const milliseconds = number / 1_000_000;
        const fixedMs = milliseconds.toFixed(4);

        if (typeof msWarn === "undefined" || milliseconds < msWarn) {
            this.log("[ACOS] " + name + ` Time: ${fixedMs} ms`);
        } else {
            let msElapsed: string;
            if (milliseconds >= 100) {
                msElapsed = milliseconds.toFixed(0);
            } else if (milliseconds >= 10) {
                msElapsed = milliseconds.toFixed(2);
            } else {
                msElapsed = milliseconds.toFixed(4);
            }
            const elapsed =
                "!WARNING! " + name + " Time: " + msElapsed + " ms";
            this.log("[ACOS] \x1b[33m%s\x1b[0m", elapsed);
        }
    },

    Memory(name: string): void {
        const used = process.memoryUsage();
        for (const key of Object.keys(used) as Array<keyof NodeJS.MemoryUsage>) {
            this.log(
                `${name} Memory ${key}: ${Math.round((used[key] / 1024 / 1024) * 100) / 100} MB`
            );
        }
    },
};

export default Profiler;
