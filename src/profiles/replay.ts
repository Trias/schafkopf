import seedRandom from "seedrandom";
import {TableOptions} from "../model/Table";
import program from "commander";
import {makeDefaultPlayerMap, makeSeededPrng, setLogConfigWithDefaults} from "./cliOptions";
import {shuffleCardsTimes} from "../model/cards/shuffleCards";

let cardDeal;
let startPlayer;
let playerNames = ["Player 1", "Player 2", "Player 3", "Player 4"];

if (program.saveFile) {
    let gameId = program.replay || 1;
    let games = require(`../../generated/${program.saveFile}`);

    if (!games[gameId]) {
        console.error(`game ${gameId} not found!`);
        process.exit();
    }

    cardDeal = games[gameId].cardDeal;
    startPlayer = games[gameId].startPlayer;

    Math.random = seedRandom.alea("", {state: games[gameId].prngState});
} else if (program.seed) {
    makeSeededPrng();

    let gameId = program.replay || 1;
    let cardDeals = shuffleCardsTimes(gameId);
    cardDeal = cardDeals[gameId - 1];
    startPlayer = playerNames[(gameId - 1) % 4];
} else {
    console.error(`provide either seed or saveFile to replay games`);
    process.exit();
}

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