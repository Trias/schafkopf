import {CallingRulesWithHeuristic} from "../model/strategy/rulebased/CallingRulesWithHeuristic";
import Nemesis from "../model/strategy/montecarlo/Nemesis";
import {Evaluation} from "../model/reporting/Evaluation";
import {TableOptions} from "../model/Table";
import {makeSeededPrng, makeStrategiesForEvaluation, setLogConfigWithDefaults} from "./cliOptions";
import program from "commander";

let seed = makeSeededPrng();

let runs = program.runs || 50;
let playerNames = ["Player 1", "Player 2", "Player 3", "Player 4"];

setLogConfigWithDefaults({time: true});
let strategies = makeStrategiesForEvaluation() || [Nemesis, CallingRulesWithHeuristic];
let evaluation = new Evaluation(playerNames, {
    strategy: strategies,
});

export default {
    runs,
    playerNames,
    makePlayerMap: evaluation.makePlayerMap,
    evaluation: evaluation,
    saveGamesTo: program.saveFile,
    saveRules: program.saveRules,
    runMode: "evaluateStrategies",
    csvFile: `evaluateStrategies-${strategies.map(c => c.name)}-${seed}-${new Date().toISOString().replace(/:/g, '-')}.csv`,
} as TableOptions;