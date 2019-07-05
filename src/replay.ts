let gameId = 100;
let games = require('../generated/games.json');

let seedRandom = require('seedrandom');
Math.random = seedRandom.alea("", {state: games[gameId].prngState});

let cardDeal = games[gameId].cardDeal;
let startPlayer = games[gameId].startPlayer;

import {Player} from "./model/Player";
import CallingRulesWithSimpleStrategy from "./model/strategy/simple/CallingRulesWithSimpleStrategy";
import Statistics from "./model/Statistics";
import {PreGame} from "./model/PreGame";
import {GameModeEnum} from "./model/GameMode";
import {GameHistory} from "./model/knowledge/GameHistory";
import {Game} from "./model/Game";
import {GameWorld} from "./model/GameWorld";
import {Round} from "./model/Round";

let colors = require('colors');

let playerNames = ["Player 1", "Player 2", "Player 3", "Player 4"];

let playerMap = {
    [playerNames[0]]: new Player(playerNames[0], CallingRulesWithSimpleStrategy),
    [playerNames[1]]: new Player(playerNames[1], CallingRulesWithSimpleStrategy),
    [playerNames[2]]: new Player(playerNames[2], CallingRulesWithSimpleStrategy),
    [playerNames[3]]: new Player(playerNames[3], CallingRulesWithSimpleStrategy),
};


let stats = new Statistics(playerNames);
let preGame = new PreGame(playerMap);
let gameMode = preGame.determineGameMode(cardDeal, [GameModeEnum.CALL_GAME]);
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
reportCents();

function reportCents() {
    console.log(`balance`);
    for (let i = 0; i < 4; i++) {
        let playerStats = stats.getStatsForPlayer(playerNames[i]);
        console.log(colors.blue(`${playerNames[i]} [${playerMap[playerNames[i]].getStartCardSet()}] (${playerMap[playerNames[i]].getStrategyName()}): ${playerStats.cents} (${playerStats.tournamentPoints} points, ${playerStats.wins} wins, ${playerStats.inPlayingTeam} playing)`));
    }
}