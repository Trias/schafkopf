import {CallingRulesWithHeuristic} from "../model/strategy/rulebased/CallingRulesWithHeuristic";
import {CallingRulesWithHeuristicWithRuleBlacklist} from "../model/strategy/rulebased/CallingRulesWithHeuristicWithRuleBlacklist";
import {Evaluation} from "../model/reporting/Evaluation";
import {includes, zip} from "lodash";
import {TableOptions} from "../model/Table";
import {makeSeededPrng, setLogConfigWithDefaults} from "./cliOptions";
import program from "commander";
import {RuleEvaluation} from "../model/reporting/RuleEvaluation";

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

let rules = require('../../data/rules.json') as string[];

let addRules = [];
for (let rule of rules) {
    let ruleSplitted = rule.split(',');
    ruleSplitted.pop();
    while (ruleSplitted.length && !includes(addRules, ruleSplitted.toString())) {
        addRules.push(ruleSplitted.toString());
        ruleSplitted.pop();
    }
}
rules = rules.concat(addRules);
rules.sort();

let blacklists = zip(rules) as string[][];

let evaluation = new Evaluation(playerNames, {
    strategy: [CallingRulesWithHeuristicWithRuleBlacklist, CallingRulesWithHeuristic],
    blacklists,
    allRules: rules,
    ruleEvaluation: new RuleEvaluation(),
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