import seedrandom from "seedrandom";

class DiscreteRandom {
    private sequence: number;
    private randomFunc: (() => number) | null;

    constructor() {
        this.sequence = 0;
        this.randomFunc = null;
    }

    seed(seedString: string): void {
        this.randomFunc = seedrandom(seedString);
    }

    random(): number {
        if (!this.randomFunc) {
            return Math.random();
        }
        return this.randomFunc();
    }
}

export default new DiscreteRandom();
