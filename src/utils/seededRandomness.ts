let oldRandom = Math.random;

let seedRandom = require('seedrandom');
// replacing global Math.random.....must be first call.
Math.random = seedRandom.alea('seed', {state: true});

export = {
    random: Math.random,
    oldRandom
}