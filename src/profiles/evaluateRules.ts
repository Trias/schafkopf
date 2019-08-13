import seededRadomness from "../utils/seededRandomness"
import log from "../logging/log";
import {CallingRulesWithHeuristic} from "../model/strategy/rulebased/CallingRulesWithHeuristic";
import {CallingRulesWithHeuristicWithRuleBlacklist} from "../model/strategy/rulebased/CallingRulesWithHeuristicWithRuleBlacklist";
import {Evaluation} from "../model/reporting/Evaluation";
import {zip} from "lodash";
import {TableOptions} from "../model/Table";

seededRadomness('seed');

let runs = 5;
let playerNames = ["Player 1", "Player 2", "Player 3", "Player 4"];

log.setConfig({
    time: false,
    gameInfo: false,
    stats: true,
    report: false,
    info: false,
});

let rules = require('../generated/rules.json') as string[];
let blacklists = zip(rules) as string[][];

let evaluation = new Evaluation(playerNames, {
    strategy: [CallingRulesWithHeuristicWithRuleBlacklist, CallingRulesWithHeuristic],
    blacklists
});

export default {
    runs,
    playerNames,
    makePlayerMap: evaluation.makePlayerMap,
    evaluation: evaluation,
    saveGamesTo: 'evaluateRules.games.json',
    saveRules: true,
    runMode: "evaluateRules"
} as TableOptions;