let oldRandom = Math.random;

let seedRandom = require('seedrandom');
// replacing global Math.random.....must be first call.

export default function (seed: string) {
    Math.random = seedRandom.alea(seed, {state: true});

    return {
        random: Math.random,
        oldRandom
    }
}