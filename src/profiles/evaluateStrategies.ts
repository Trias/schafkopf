import seededRadomness from "../utils/seededRandomness"
import {CallingRulesWithHeuristic} from "../model/strategy/rulebased/CallingRulesWithHeuristic";
import Nemesis from "../model/strategy/montecarlo/Nemesis";
import {Evaluation} from "../model/reporting/Evaluation";
import {TableOptions} from "../model/Table";
import {makeStrategiesForEvaluation, setLogConfigWithDefaults} from "./cliOptions";
import program from "commander";

seededRadomness('seed');

let runs = program.runs || 50;
let playerNames = ["Player 1", "Player 2", "Player 3", "Player 4"];

setLogConfigWithDefaults({time: true});
let evaluation = new Evaluation(playerNames, {
    strategy: makeStrategiesForEvaluation() || [Nemesis, CallingRulesWithHeuristic],
});

export default {
    runs,
    playerNames,
    makePlayerMap: evaluation.makePlayerMap,
    evaluation: evaluation,
    saveGamesTo: program.saveFile,
    saveRules: program.saveRules,
    runMode: "evaluateStrategies"
} as TableOptions;