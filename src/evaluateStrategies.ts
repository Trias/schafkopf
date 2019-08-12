import seededRadomness from "./utils/seededRandomness"
import {Table} from "./model/Table";
import log from "./logging/log";
import {CallingRulesWithHeuristic} from "./model/strategy/rulebased/CallingRulesWithHeuristic";
import Nemesis from "./model/strategy/montecarlo/Nemesis";
import {Evaluation} from "./model/reporting/Evaluation";

seededRadomness('seed');

let runs = 50;
let playerNames = ["Player 1", "Player 2", "Player 3", "Player 4"];

log.setConfig({
    time: true
});

let evaluation = new Evaluation(playerNames, {
    strategy: [Nemesis, CallingRulesWithHeuristic],
});

let table = new Table({
    runs,
    playerNames,
    makePlayerMap: evaluation.makePlayerMap,
    evaluation: evaluation,
    saveGamesTo: 'evaluateStrategies.games.json',
    saveRules: true
});

(async () => {
    await table.run()
})();