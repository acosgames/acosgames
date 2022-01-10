var profiles = {};

var Profiler;
module.exports = Profiler = {
    debug: true,

    constructor: function () {
    },

    log: function () {
        if (!this.debug) return;
        console.log.apply(console, arguments);
    },

    info: function () {
        console.log.apply(console, arguments);
    },

    Start: function (name) {
        if (!this.debug) return;
        profiles[name] = process.hrtime.bigint();
    },

    End: function (name, msWarn) {
        if (!this.debug) return;
        if (!profiles[name]) return;

        //this.Memory(name);

        let start = Number(profiles[name]);
        let end = process.hrtime.bigint();
        const number = Number(end) - start;
        const milliseconds = number / 1000000;
        const seconds = number / 1000000000;
        const fixedMs = Number(milliseconds).toFixed(4);
        if (typeof msWarn == 'undefined' || milliseconds < msWarn)
            this.log(name + ` Time: ${fixedMs} ms`,);
        else {
            let msElapsed = milliseconds;
            if (msElapsed >= 100) {
                msElapsed = milliseconds.toFixed(0);
            } else if (msElapsed >= 10) {
                msElapsed = milliseconds.toFixed(2);
            } else {
                msElapsed = milliseconds.toFixed(4);
            }
            let elapsed = '!WARNING! ' + name + ' Time: ' + msElapsed + ' ms is over limit of ' + msWarn + ' ms.'
            this.log('\x1b[33m%s\x1b[0m', elapsed);
        }

    },

    StartLog: function (name) {

        profiles[name] = process.hrtime();
    },

    EndLog: function (name) {
        if (!profiles[name]) return;
        this.Memory(name);

        let hrend = process.hrtime(profiles[name]);
        let seconds = hrend[0];
        let ms = hrend[1] / 1000000;
        this.info(name + ` Time: ${seconds}s ${ms.toFixed(2)} ms`);
    },

    Memory: function (name) {
        if (!this.debug) return;
        //Calculate memory usage
        const used = process.memoryUsage().heapUsed / 1024 / 1024;
        this.log(
            `Memory Usage: ${Math.round(used * 100) / 100} MB`
        );
    }
};

Profiler.constructor();
