const seedrandom = require("seedrandom");

class DiscreteRandom {
    constructor() {
        this.sequence = 0;
        this.randomFunc = null;
    }

    seed(seedString) {
        // this.sequence = sequence;
        //if (!this.randomFunc) {

        // let seedStr = this.nextGame.room.room_slug + this.nextGame.room.starttime + this.sequence;
        // let seed = this.generateRandomSeed(seedString);
        // this.log("seedStr:", seedStr, ", seed", seed);

        this.randomFunc = seedrandom(seedString);

        // this.randomFunc = this.mulberry32(seed[0]);
        //}
    }

    random() {
        if (!this.randomFunc) {
            return Math.random();
        }

        let num = this.randomFunc();
        // console.log("Random number:", num);
        return num;
    }

    //cyrb128 algorithm
    // generateRandomSeed(str) {
    //     let h1 = 1779033703, h2 = 3144134277,
    //         h3 = 1013904242, h4 = 2773480762;
    //     for (let i = 0, k; i < str.length; i++) {
    //         k = str.charCodeAt(i);
    //         h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    //         h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    //         h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    //         h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    //     }
    //     h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    //     h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    //     h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    //     h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    //     return [(h1 ^ h2 ^ h3 ^ h4) >>> 0, (h2 ^ h1) >>> 0, (h3 ^ h1) >>> 0, (h4 ^ h1) >>> 0];
    // }

    // mulberry32(a) {
    //     return function (seq) {
    //         var t = a += 0x6D2B79F5 * seq;
    //         t = Math.imul(t ^ t >>> 15, t | 1);
    //         t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    //         return ((t ^ t >>> 14) >>> 0) / 4294967296;
    //     }
    // }

    // sfc32(a, b, c, d) {
    //     return function () {
    //         a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    //         var t = (a + b) | 0;
    //         a = b ^ b >>> 9;
    //         b = c + (c << 3) | 0;
    //         c = (c << 21 | c >>> 11);
    //         d = d + 1 | 0;
    //         t = t + d | 0;
    //         c = c + t | 0;
    //         return (t >>> 0) / 4294967296;
    //     }
    // }
}

module.exports = new DiscreteRandom();
