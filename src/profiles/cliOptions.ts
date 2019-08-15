import log, {LogConfig, LogLevel} from "../logging/log";
import strategyMap from "../model/strategy/StrategyMap";
import {extend, includes} from "lodash";
import {Player} from "../model/Player";
import {ManualStrategy} from "../model/strategy/manual/ManualStrategy";
import {CallingRulesWithHeuristic} from "../model/strategy/rulebased/CallingRulesWithHeuristic";
import program from "commander";
import seededRandomness from "../utils/seededRandomness";
import {baseRandom} from "../utils/baseRandom";

export function makeLogConfig() {
    let logConfig: Partial<{ [index in LogLevel]: boolean }> = {};

    if (!program.log) {
        return {};
    }

    // some lies were needed...
    for (let logLevel of program.log as LogLevel[]) {
        let logLevelModifier = logLevel.substring(0, 1);
        let loglevelCleaned: LogLevel = logLevel.substring(1) as LogLevel;

        if (includes(log.logLevels, loglevelCleaned)) {
            if (logLevelModifier == "-") {
                logConfig[loglevelCleaned] = false;
            } else if (logLevelModifier == "+") {
                logConfig[loglevelCleaned] = true;
            }
        } else if (includes(log.logLevels, logLevel)) {
            logConfig[logLevel] = true;
        }
    }

    return logConfig;
}

export function makeStrategiesForEvaluation() {
    let strategiesForEvaluation: any[] = [];
    if (program.strategy1) {
        strategiesForEvaluation.push(strategyMap[program.strategy1]);
    }
    if (program.strategy2) {
        strategiesForEvaluation.push(strategyMap[program.strategy2]);
    }
    if (program.strategy3) {
        strategiesForEvaluation.push(strategyMap[program.strategy3]);
    }
    if (program.strategy4) {
        strategiesForEvaluation.push(strategyMap[program.strategy4]);
    }

    if (strategiesForEvaluation.length <= 1) {
        console.log('using fallback for strategy evaluation!');
        return null;
    } else {
        return strategiesForEvaluation;
    }
}

export function validateCliOptions() {
    if (program.strategy1 && !includes(Object.keys(strategyMap), program.strategy1)) {
        console.error('invalid Strategy for Player 1, using Falllback');
    }
    if (program.strategy2 && !includes(Object.keys(strategyMap), program.strategy2)) {
        console.error('invalid Strategy for Player 2, using Falllback');
    }
    if (program.strategy3 && !includes(Object.keys(strategyMap), program.strategy3)) {
        console.error('invalid Strategy for Player 3, using Falllback');
    }
    if (program.strategy4 && !includes(Object.keys(strategyMap), program.strategy4)) {
        console.error('invalid Strategy for Player 4, using Falllback');
    }

    return program;
}

export function makeDefaultPlayerMap(playerNames: string[]) {
    return {
        [playerNames[0]]: new Player({
            name: playerNames[0],
            strategy: program.manual == 1 ? ManualStrategy : (strategyMap[program.strategy1] || CallingRulesWithHeuristic)
        }),
        [playerNames[1]]: new Player({
            name: playerNames[1],
            strategy: program.manual == 2 ? ManualStrategy : (strategyMap[program.strategy2] || CallingRulesWithHeuristic)
        }),
        [playerNames[2]]: new Player({
            name: playerNames[2],
            strategy: program.manual == 3 ? ManualStrategy : (strategyMap[program.strategy3] || CallingRulesWithHeuristic)
        }),
        [playerNames[3]]: new Player({
            name: playerNames[3],
            strategy: program.manual == 4 ? ManualStrategy : (strategyMap[program.strategy4] || CallingRulesWithHeuristic)
        }),
    };
}

export function setLogConfigWithDefaults(defaults: Partial<LogConfig> = {}) {
    log.setConfig(extend(defaults, makeLogConfig()));
}

export function makeSeededPrng() {
    let seed;
    if (program.seed) {
        seed = program.seed
    } else {
        seed = baseRandom(0, 2 ** 64).toString(16);
        console.log('to replay, use seed: ' + seed);
    }
    seededRandomness(seed);
    return seed;
}

export function chooseProfile() {
    let profile;
    try {
        profile = require('./' + program.profile).default;
    } catch (e) {
        if (!program.profile) {
            profile = require('./default').default;
        } else {
            console.error(`no profile called "${program.profile}" found!`);
            console.error(e);
            process.exit();
        }
    }

    return profile;
}

export function defineCliOptions() {
    program.version('1.0.0');
    program.option('--profile <profile>', 'which profile to use. Available: default, evaluateRules, evaluateStrategies, manual, replay');

    program.option('--strategy1 <strategy1>', 'which strategy to use for Player 1 or a strategy for evaluation');
    program.option('--strategy2 <strategy2>', 'which strategy to use for Player 2 or a strategy for evaluation');
    program.option('--strategy3 <strategy3>', 'which strategy to use for Player 3 or a strategy for evaluation');
    program.option('--strategy4 <strategy4>', 'which strategy to use for Player 4 or a strategy for evaluation');

    program.option('--manual <manualPlayerNumber>', 'number of player to be controlled manually. if set overwrites strategy', n => (n > 4 || n < 1) ? false : n);

    program.option('--seed <seed>', 'seed used for random numbers');

    program.option('--log <logLevels>', 'comma separated list of log levels. To disable prepend with -. Available: private, info, error, gameInfo, report, stats, time', log => log.split(',').map((s: string) => s.trim()));

    program.option('--runs <runs>', 'number of runs');
    program.option('--replay <gameId>', 'gameId for replay');
    program.option('--saveFile <savegameFile>', 'which file to look for for the game to replay or which file to save a replayable game');
    program.option('--saveRules', 'save used rules to rules.json');
}