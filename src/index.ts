let seedRandom = require('seedrandom');
// replcing global Math.random.....must be first call.
Math.random = seedRandom.alea('seed', {global: true});

import {Game} from "./model/Game";
import {Player} from "./model/Player";
import Statistics from "./model/Statistics";
import {shuffleCardsTimes} from "./model/cards/shuffleCards";
import {GameWorld} from "./model/GameWorld";
import {PreGame} from "./model/PreGame";
import {Round} from "./model/Round";
import {GameHistory} from "./model/knowledge/GameHistory";
import CallingRulesWithSimpleStrategy from "./model/strategy/simple/CallingRulesWithSimpleStrategy";
import {GameModeEnum} from "./model/GameMode";
import CallingRulesWithUctMonteCarloStrategy from "./model/strategy/montecarlo/CallingRulesWithUctMonteCarloStrategy";
import colors = require('colors');

let runs = 120;

let playerNames = ["Player 1", "Player 2", "Player 3", "Player 4"];

let playerMap = {
    [playerNames[0]]: new Player(playerNames[0], CallingRulesWithSimpleStrategy),
    [playerNames[1]]: new Player(playerNames[1], CallingRulesWithUctMonteCarloStrategy),
    [playerNames[2]]: new Player(playerNames[2], CallingRulesWithSimpleStrategy),
    [playerNames[3]]: new Player(playerNames[3], CallingRulesWithUctMonteCarloStrategy),
};

let allCardDeals = shuffleCardsTimes(runs);

let stats = new Statistics(playerNames);

//(async () => {
let startPlayer = playerNames[0];
for (let i = 0; i < runs; i++) {
    console.log(`========game ${i + 1}===========`);
    let preGame = new PreGame(playerMap);
    let gameMode = preGame.determineGameMode(allCardDeals[i], [GameModeEnum.CALL_GAME]);
    let history = new GameHistory(Object.keys(playerMap), gameMode);
    let game = new Game(new GameWorld(gameMode, playerMap, [], new Round(startPlayer, Object.keys(playerMap)), history));

    game.play();
    let gameResult = game.getGameResult();

    stats.addResult(gameResult);

    if (game.getGameResult().getGameMode().isNoRetry()) {
        console.log(`Team (${gameResult.getPlayingTeamNames()}) ${gameResult.hasPlayingTeamWon() ? 'wins' : 'looses'} ` +
            `with ${gameResult.getPlayingTeamPoints()} points ` +
            `and ${gameResult.hasPlayingTeamWon() ? 'win' : 'loose'} ${Math.abs(gameResult.getGameMoneyValue())} cents each!`);
    } else {
        console.log(`retry with cards:${Object.values(playerMap).map(p => '\n' + p.getName() + ': ' + JSON.stringify(p.getStartCardSet()))}`)
    }
    reportCents(i);

    startPlayer = rotateStartPlayer(startPlayer);
}

//})();

function rotateStartPlayer(startPlayer: string) {
    let index = playerNames.indexOf(startPlayer);

    return playerNames[(index + 1) % 4];
}

function reportCents(i: number) {
    console.log(`balance after ${i + 1} games`);
    for (let i = 0; i < 4; i++) {
        let playerStats = stats.getStatsForPlayer(playerNames[i]);
        console.log(colors.blue(`${playerNames[i]} (${playerMap[playerNames[i]].getStrategyName()}): ${playerStats.cents} (${playerStats.tournamentPoints} points, ${playerStats.wins} wins, ${playerStats.inPlayingTeam} playing)`));
    }
}