import {TableOptions} from "../model/Table";
import program from "commander";
import {makeDefaultPlayerMap, makeSeededPrng, setLogConfigWithDefaults} from "./cliOptions";

makeSeededPrng();

let runs = program.runs || 1;

let playerNames = ["Player 1", "Player 2", "Player 3", "Player 4"];

let playerMap = makeDefaultPlayerMap(playerNames);

setLogConfigWithDefaults();

export default {
    runs,
    makePlayerMap: () => playerMap,
    playerNames,
    saveGamesTo: program.saveFile,
    runMode: "default"
} as TableOptions;