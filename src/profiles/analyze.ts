import {TableOptions} from "../model/Table";
import {determineReplayGame, makeDefaultPlayerMap, setLogConfigWithDefaults} from "./cliOptions";
import program from "commander";

let playerNames = ["Player 1", "Player 2", "Player 3", "Player 4"];
let {cardDeal, startPlayer} = determineReplayGame(playerNames);

let playerMap = makeDefaultPlayerMap(playerNames);

setLogConfigWithDefaults();

export default {
    runs: 1,
    allCardDeals: [cardDeal],
    startPlayer,
    gameId: program.replay,
    makePlayerMap: () => playerMap,
    playerNames,
    runMode: "analyze"
} as TableOptions;