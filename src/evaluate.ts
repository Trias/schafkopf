let seedRandom = require('seedrandom');
// replacing global Math.random.....must be first call.
Math.random = seedRandom.alea('seed', {state: true});

import CallingRulesWithUctMonteCarloStrategy from "./model/strategy/montecarlo/CallingRulesWithUctMonteCarloStrategy";
import {StrategyEvaluation} from "./model/reporting/StrategyEvaluation";
import CallingRulesWithHeuristic from "./model/strategy/rulebased/CallingRulesWithHeuristic";
import {CallingRulesWithUctMonteCarloAndHeuristic} from "./model/strategy/montecarlo/CallingRulesWithUctMonteCarloAndHeuristic";
import {Card} from "./model/cards/Card";
import {Game} from "./model/Game";
import {Player, PlayerMap} from "./model/Player";
import Statistics from "./model/reporting/Statistics";
import {shuffleCardsTimes} from "./model/cards/shuffleCards";
import {GameWorld} from "./model/GameWorld";
import {PreGame} from "./model/PreGame";
import {Round} from "./model/Round";
import {GameHistory} from "./model/knowledge/GameHistory";
import {GameModeEnum} from "./model/GameMode";
import {clone} from "lodash";
import colors = require('colors');

let fs = require('fs');

let runs = 51;

let playerNames = ["Player 1", "Player 2", "Player 3", "Player 4"];

let allCardDeals = shuffleCardsTimes(runs);

let stats = new Statistics(playerNames);

let evaluation = new StrategyEvaluation([CallingRulesWithHeuristic, CallingRulesWithUctMonteCarloStrategy, CallingRulesWithUctMonteCarloAndHeuristic]);

let games: {
    [index in number]: {
        playerNames: string[],
        startPlayer: string,
        prngState: object,
        cardDeal: Card[][],
    }
} = {};

//(async () => {
let startPlayer = playerNames[0];
for (let i = 48; i < 51; i++) {
    // @ts-ignore
    let prngState = Math.random.state();
    games[i + 1] = {
        playerNames,
        startPlayer,
        prngState: clone(prngState),
        cardDeal: allCardDeals[i]
    };

    for (let j = 0; j < evaluation.strategies.length ** 4; j++) {
        let playerMap = {
            [playerNames[0]]: new Player(playerNames[0], evaluation.getStrategyToEvaluate(j, 0)),
            [playerNames[1]]: new Player(playerNames[1], evaluation.getStrategyToEvaluate(j, 1)),
            [playerNames[2]]: new Player(playerNames[2], evaluation.getStrategyToEvaluate(j, 2)),
            [playerNames[3]]: new Player(playerNames[3], evaluation.getStrategyToEvaluate(j, 3)),
        };

        console.log(`========game ${i + 1} run ${j + 1} ===========`);
        let preGame = new PreGame(playerMap);
        let gameMode = preGame.determineGameMode(allCardDeals[i], [GameModeEnum.CALL_GAME]);
        let history = new GameHistory(Object.keys(playerMap), gameMode);
        let game = new Game(new GameWorld(gameMode, playerMap, [], new Round(startPlayer, Object.keys(playerMap)), history));

        game.play();
        let gameResult = game.getGameResult();

        stats.addResult(gameResult);
        evaluation.addResult(gameResult, j);

        if (game.getGameResult().getGameMode().isNoRetry()) {
            console.log(`Team (${gameResult.getPlayingTeamNames()}) ${gameResult.hasPlayingTeamWon() ? 'wins' : 'looses'} ` +
                `with ${gameResult.getPlayingTeamPoints()} points ` +
                `and ${gameResult.hasPlayingTeamWon() ? 'win' : 'loose'} ${Math.abs(gameResult.getGameMoneyValue())} cents each!`);
        } else {
            console.log(`retry with cards:${Object.values(playerMap).map(p => '\n' + p.getName() + ': ' + JSON.stringify(p.getStartCardSet()))}`)
        }
        reportCents(playerMap, i);
    }

    reportOnStrategies(i);

    startPlayer = rotateStartPlayer(startPlayer);
}

function reportCents(playerMap: PlayerMap, i: number) {
    console.log(`balance after ${i + 1} games`);
    for (let i = 0; i < 4; i++) {
        let playerStats = stats.getStatsForPlayer(playerNames[i]);
        console.log(colors.blue(`${playerNames[i]} [${playerMap[playerNames[i]].getStartCardSet()}] (${playerMap[playerNames[i]].getStrategyName()}): ${playerStats.cents} (${playerStats.tournamentPoints} points, ${playerStats.wins} wins, ${playerStats.losses} losses, ${playerStats.inPlayingTeam} playing, ${playerStats.points / playerStats.games} points on average`));
    }
}

function reportOnStrategies(i: number) {
    console.log(`strategy evaluation after ${i + 1} games`);
    for (let strategy of evaluation.strategies) {
        let evalu = evaluation.getEvaluationForStrategy(strategy);
        console.log(`evaluation for strategy ${strategy.name} has ${evalu.wins} wins and ${evalu.losses} losses`);
    }
}

function saveGames() {
    if (!fs.existsSync('generated')) {
        fs.mkdirSync('generated');
    }
    fs.writeFileSync('generated/evaluation.games.json', JSON.stringify(games, null, 2));
}

saveGames();

//})();

function rotateStartPlayer(startPlayer: string) {
    let index = playerNames.indexOf(startPlayer);

    return playerNames[(index + 1) % 4];
}