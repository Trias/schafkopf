import seededRadomness from "../utils/seededRandomness"
import {Player} from "../model/Player";
import {CallingRulesWithUctMonteCarloAndHeuristic} from "../model/strategy/montecarlo/CallingRulesWithUctMonteCarloAndHeuristic";
import {CallingRulesWithHeuristic} from "../model/strategy/rulebased/CallingRulesWithHeuristic";
import log from "../logging/log";
import {TableOptions} from "../model/Table";

seededRadomness('seed');
let gameId = 1;
let games = require('../generated/games.json');
let cardDeal = games[gameId].cardDeal;
let startPlayer = games[gameId].startPlayer;

let playerNames = ["Player 1", "Player 2", "Player 3", "Player 4"];

let playerMap = {
    [playerNames[0]]: new Player({name: playerNames[0], strategy: CallingRulesWithHeuristic}),
    [playerNames[1]]: new Player({name: playerNames[1], strategy: CallingRulesWithHeuristic}),
    [playerNames[2]]: new Player({name: playerNames[2], strategy: CallingRulesWithHeuristic}),
    [playerNames[3]]: new Player({name: playerNames[3], strategy: CallingRulesWithUctMonteCarloAndHeuristic}),
};

log.setConfig({private: true});

export default {
    runs: 1,
    makePlayerMap: () => playerMap,
    cardDeal,
    startPlayer,
    playerNames,
    runMode: "replay"
} as TableOptions;