import seedRandom from "seedrandom";
import {TableOptions} from "../model/Table";
import program from "commander";
import {makeDefaultPlayerMap, setLogConfigWithDefaults} from "./cliOptions";

let gameId = program.replay || 1;
let games = require(`../../generated/${program.saveFile || "games.json"}`);

if (!games[gameId]) {
    console.error(`game ${gameId} not found!`);
    process.exit();
}

let cardDeal = games[gameId].cardDeal;
let startPlayer = games[gameId].startPlayer;

Math.random = seedRandom.alea("", {state: games[gameId].prngState});

let playerNames = ["Player 1", "Player 2", "Player 3", "Player 4"];

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