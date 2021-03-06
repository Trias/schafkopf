import {TableOptions} from "../model/Table";
import {determineReplayGame, makeDefaultPlayerMap, setLogConfigWithDefaults} from "./cliOptions";

let playerNames = ["Player 1", "Player 2", "Player 3", "Player 4"];

let {cardDeal, startPlayer} = determineReplayGame(playerNames);

let playerMap = makeDefaultPlayerMap(playerNames);
setLogConfigWithDefaults({private: true});

export default {
    runs: 1,
    makePlayerMap: () => playerMap,
    cardDeal,
    startPlayer,
    playerNames,
    runMode: "replay"
} as TableOptions;