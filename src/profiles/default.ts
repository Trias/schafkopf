import seededRadomness from "../utils/seededRandomness"
import {Table} from "../model/Table";
import {CallingRulesWithHeuristic} from "../model/strategy/rulebased/CallingRulesWithHeuristic";
import {Player} from "../model/Player";
import {Leprechauns} from "../model/strategy/rulebased/Leprechauns";

seededRadomness('seed');
let runs = 1;

let playerNames = ["Player 1", "Player 2", "Player 3", "Player 4"];

let playerMap = {
    [playerNames[0]]: new Player({name: playerNames[0], strategy: Leprechauns}),
    [playerNames[1]]: new Player({name: playerNames[1], strategy: CallingRulesWithHeuristic}),
    [playerNames[2]]: new Player({name: playerNames[2], strategy: CallingRulesWithHeuristic}),
    [playerNames[3]]: new Player({name: playerNames[3], strategy: CallingRulesWithHeuristic}),
};

let table = new Table({
    runs,
    makePlayerMap: () => playerMap,
    playerNames,
    saveGamesTo: "games.json"
});

(async () => {
    await table.run()
})();