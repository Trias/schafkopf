import {CallingRulesWithHeuristic} from "../model/strategy/rulebased/CallingRulesWithHeuristic";
import {CallingRulesWithHeuristicWithRuleBlacklist} from "../model/strategy/rulebased/CallingRulesWithHeuristicWithRuleBlacklist";
import {Evaluation} from "../model/reporting/Evaluation";
import {zip} from "lodash";
import {TableOptions} from "../model/Table";
import {makeSeededPrng, setLogConfigWithDefaults} from "./cliOptions";
import program from "commander";

let runs = program.runs || 1000;
let playerNames = ["Player 1", "Player 2", "Player 3", "Player 4"];

let seed = makeSeededPrng();

setLogConfigWithDefaults({
    time: false,
    gameInfo: false,
    stats: true,
    report: false,
    info: false,
});

let rules = require('../../generated/rules.json') as string[];
let blacklists = zip(rules) as string[][];

let evaluation = new Evaluation(playerNames, {
    strategy: [CallingRulesWithHeuristicWithRuleBlacklist, CallingRulesWithHeuristic],
    blacklists,
    allRules: rules
});

export default {
    runs,
    playerNames,
    makePlayerMap: evaluation.makePlayerMap,
    evaluation: evaluation,
    saveGamesTo: program.saveFile,
    runMode: "evaluateRules",
    csvFile: `evaluateRules-${new Date().toISOString().replace(/:/g, '-')}-${seed}.csv`,
} as TableOptions;