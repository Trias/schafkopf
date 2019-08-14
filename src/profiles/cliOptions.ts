import log, {LogConfig} from "../logging/log";
import strategyMap from "../model/strategy/StrategyMap";
import {extend, includes} from "lodash";
import {Player} from "../model/Player";
import {ManualStrategy} from "../model/strategy/manual/ManualStrategy";
import {CallingRulesWithHeuristic} from "../model/strategy/rulebased/CallingRulesWithHeuristic";
import program from "commander";
import seededRandomness from "../utils/seededRandomness";

export function makeLogConfig(cli: any) {
    let logConfig: Partial<LogConfig> = {};
    if (cli.logPrivate) {
        logConfig.private = true;
    } else if (cli.logPrivate === false) {
        logConfig.private = false;
    }

    if (cli.logInfo) {
        logConfig.info = true;
    } else if (cli.logInfo === false) {
        logConfig.info = false;
    }

    if (cli.logError) {
        logConfig.error = true;
    } else if (cli.logError === false) {
        logConfig.error = false;
    }

    if (cli.logGameInfo) {
        logConfig.gameInfo = true;
    } else if (cli.logGameInfo === false) {
        logConfig.gameInfo = false;
    }

    if (cli.logReport) {
        logConfig.report = true;
    } else if (cli.logReport === false) {
        logConfig.report = false;
    }

    if (cli.logStats) {
        logConfig.stats = true;
    } else if (cli.logStats === false) {
        logConfig.stats = false;
    }

    if (cli.logTime) {
        logConfig.time = true;
    } else if (cli.logTime === false) {
        logConfig.time = false;
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
    log.setConfig(extend(defaults, makeLogConfig(program)));
}

export function makeSeededPrng() {
    if (program.seed) {
        seededRandomness(program.seed);
    } else if (program.seed == undefined) {
        // legcy fallback...
        seededRandomness('seed');
    } else {
        console.log('no seeding, savegames disabled');
        program.saveFile = null;
    }
}

export function chooseProfile() {
    let profile;
    try {
        profile = require('./profiles/' + program.profile).default;
    } catch (e) {
        if (!program.profile) {
            profile = require('./profiles/default').default;
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
    program.option('--profile <profile>', 'which profile to use');
    program.option('--strategy1 <strategy1>', 'which strategy to use for Player 1 or a strategy for evaluation');
    program.option('--strategy2 <strategy2>', 'which strategy to use for Player 2 or a strategy for evaluation');
    program.option('--strategy3 <strategy3>', 'which strategy to use for Player 3 or a strategy for evaluation');
    program.option('--strategy4 <strategy4>', 'which strategy to use for Player 4 or a strategy for evaluation');

    program.option('--manual <manualPlayerNumber>', 'number of player to be controlled manually. replaces strategy', n => (n > 4 || n < 1) ? false : n);

    program.option('--seed <seed>', 'seed');
    program.option('--no-seed', 'no seeding, savegame disabled');

    program.option('--log-private', 'log private information of players (green)');
    program.option('--no-log-private', 'do not log private information of players (green)');
    program.option('--log-info', 'log general information (grey)');
    program.option('--no-log-info', 'do not log general information (grey)');
    program.option('--log-error', 'log errors (red)');
    program.option('--no-log-error', 'do not log errors (red)');
    program.option('--log-gameInfo', 'log game information (italics)');
    program.option('--no-log-gameInfo', 'do not log game information (italics)');
    program.option('--log-report', 'log reports (cyan)');
    program.option('--no-log-report', 'do not log reports (cyan)');
    program.option('--log-stats', 'log statistics (blue)');
    program.option('--no-log-stats', 'do not log statistics (blue)');
    program.option('--log-time', 'log time (default color)');
    program.option('--no-log-time', 'do not log time (default color)');

    program.option('--runs <runs>', 'number of runs');
    program.option('--replay <gameId>', 'gameId for replay');
    program.option('--saveFile <savegameFile>', 'which file to look for for the game to replay or which file to save a replayable game');
    program.option('--saveRules', 'save used rules to rules.json');
}