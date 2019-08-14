import {CallingRulesWithHeuristic} from "../model/strategy/rulebased/CallingRulesWithHeuristic";
import {Player} from "../model/Player";
import {ManualStrategy} from "../model/strategy/manual/ManualStrategy";
import {TableOptions} from "../model/Table";
import {MoveEvaluation} from "../model/reporting/MoveEvaluation";
import program from "commander";
import {makeSeededPrng, setLogConfigWithDefaults} from "./cliOptions";

if (program.seed == undefined) {
    program.seed = false;
    console.log('using unseeded random number generator in manual play');
}
makeSeededPrng();

let runs = program.runs || 32;

let playerNames = ["Player 1", "Player 2", "Player 3", "Player 4"];

if (!program.manual) {
    program.manual = 1;
    console.log('no manual user selected, defaulting to user 1');
}

function makePlayer(i: number) {
    if (program.manual == i + 1) {
        return new Player({
            name: playerNames[i],
            strategy: ManualStrategy,
            moveEvaluation: new MoveEvaluation()
        });
    } else {
        return new Player({name: playerNames[i], strategy: CallingRulesWithHeuristic, moveDelay: 500});
    }
}

let playerMap = {
    [playerNames[0]]: makePlayer(0),
    [playerNames[1]]: makePlayer(1),
    [playerNames[2]]: makePlayer(2),
    [playerNames[3]]: makePlayer(3)
};

let date = new Date();
setLogConfigWithDefaults({
    private: false,
    time: false,
    toFile: `manual-${date.toISOString().replace(/:/g, '-')}.log`
});

export default {
    runs,
    makePlayerMap: () => playerMap,
    playerNames,
    runMode: "default"
} as TableOptions;