import {CallingRulesWithHeuristic} from "../model/strategy/rulebased/CallingRulesWithHeuristic";
import {Player} from "../model/Player";
import {ManualStrategy} from "../model/strategy/manual/ManualStrategy";
import log from "../logging/log";
import {TableOptions} from "../model/Table";
import {MoveEvaluation} from "../model/reporting/MoveEvaluation";

let runs = 32;

let playerNames = ["Player 1", "Player 2", "Player 3", "Player 4"];

let playerMap = {
    [playerNames[0]]: new Player({
        name: playerNames[0],
        strategy: ManualStrategy,
        moveEvaluation: new MoveEvaluation()
    }),
    [playerNames[1]]: new Player({name: playerNames[1], strategy: CallingRulesWithHeuristic, moveDelay: 500}),
    [playerNames[2]]: new Player({name: playerNames[2], strategy: CallingRulesWithHeuristic, moveDelay: 500}),
    [playerNames[3]]: new Player({name: playerNames[3], strategy: CallingRulesWithHeuristic, moveDelay: 500}),
};

log.setConfig({
    private: false,
    time: false,
    toFile: `manual-${new Date().toISOString()}.log`
});

export default {
    runs,
    makePlayerMap: () => playerMap,
    playerNames,
    runMode: "default"
} as TableOptions;