require('./utils/seededRandomness');

import GameResult from "./model/reporting/GameResult";
import {Player} from "./model/Player";
import Statistics from "./model/reporting/Statistics";
import {PreGame} from "./model/PreGame";
import {GameModeEnum} from "./model/GameMode";
import {GameHistory} from "./model/knowledge/GameHistory";
import {Game} from "./model/Game";
import {GameWorld} from "./model/GameWorld";
import {Round} from "./model/Round";
import {CallingRulesWithUctMonteCarloAndHeuristic} from "./model/strategy/montecarlo/CallingRulesWithUctMonteCarloAndHeuristic";
import {CallingRulesWithHeuristic} from "./model/strategy/rulebased/CallingRulesWithHeuristic";
import log from "./logging/log";

let gameId = 200;
let games = require('../generated/games.json');
let cardDeal = games[gameId].cardDeal;
let startPlayer = games[gameId].startPlayer;

let playerNames = ["Player 1", "Player 2", "Player 3", "Player 4"];

let playerMap = {
    [playerNames[0]]: new Player(playerNames[0], CallingRulesWithHeuristic),
    [playerNames[1]]: new Player(playerNames[1], CallingRulesWithHeuristic),
    [playerNames[2]]: new Player(playerNames[2], CallingRulesWithHeuristic),
    [playerNames[3]]: new Player(playerNames[3], CallingRulesWithUctMonteCarloAndHeuristic),
};

log.setConfig({private: true});

let stats = new Statistics(playerNames);
let preGame = new PreGame(playerMap);

(async () => {
    let gameMode = await preGame.determineGameMode(cardDeal, [GameModeEnum.CALL_GAME]);
    let history = new GameHistory(Object.keys(playerMap), gameMode);
    let game = new Game(new GameWorld(gameMode, playerMap, [], new Round(startPlayer, Object.keys(playerMap)), history));
    await game.play();
    let gameResult = game.getGameResult();

    stats.addResult(gameResult);

    reportGameResult(gameResult);
    reportCents();
})();

function reportCents() {
    log.info(`balance`);
    for (let i = 0; i < 4; i++) {
        let playerStats = stats.getStatsForPlayer(playerNames[i]);
        log.report(`${playerNames[i]} [${playerMap[playerNames[i]].getStartCardSet()}] (${playerMap[playerNames[i]].getStrategyName()}): ${playerStats.cents} (${playerStats.tournamentPoints} points, ${playerStats.wins} wins, ${playerStats.inPlayingTeam} playing)`);
    }
}

function reportGameResult(gameResult: GameResult) {
    if (gameResult.getGameMode().isNoRetry()) {
        log.report(`Team (${gameResult.getPlayingTeamNames()}) ${gameResult.hasPlayingTeamWon() ? 'wins' : 'looses'} ` +
            `with ${gameResult.getPlayingTeamPoints()} points ` +
            `and ${gameResult.hasPlayingTeamWon() ? 'win' : 'loose'} ${Math.abs(gameResult.getGameMoneyValue())} cents each!`);
    } else {
        log.report(`retry with cards:${Object.values(playerMap).map(p => '\n' + p.getName() + ': ' + p.getStartCardSet().toString())}`)
    }
}