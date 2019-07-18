//require("./utils/seededRandomness");
import {CallingRulesWithHeuristic} from "./model/strategy/rulebased/CallingRulesWithHeuristic";
import {Card} from "./model/cards/Card";
import {Game} from "./model/Game";
import {Player} from "./model/Player";
import Statistics from "./model/reporting/Statistics";
import {shuffleCardsTimes} from "./model/cards/shuffleCards";
import {GameWorld} from "./model/GameWorld";
import {PreGame} from "./model/PreGame";
import {Round} from "./model/Round";
import {GameHistory} from "./model/knowledge/GameHistory";
import {GameModeEnum} from "./model/GameMode";
import {ManualStrategy} from "./model/strategy/manual/ManualStrategy";
import log from "./logging/log";

let fs = require('fs');

let runs = 32;

let playerNames = ["Player 1", "Player 2", "Player 3", "Player 4"];

let playerMap = {
    [playerNames[0]]: new Player(playerNames[0], ManualStrategy),
    [playerNames[1]]: new Player(playerNames[1], CallingRulesWithHeuristic),
    [playerNames[2]]: new Player(playerNames[2], CallingRulesWithHeuristic),
    [playerNames[3]]: new Player(playerNames[3], CallingRulesWithHeuristic),
};

let allCardDeals = shuffleCardsTimes(runs);

let stats = new Statistics(playerNames);

log.setConfig({
    private: false,
    time: false
});

let games: {
    [index in number]: {
        playerNames: string[],
        startPlayer: string,
        prngState: object,
        cardDeal: Card[][],
    }
} = {};

(async () => {
    let startPlayer = playerNames[0];
    for (let i = 0; i < runs; i++) {

        log.info(`========game ${i + 1}===========`);
        let preGame = new PreGame(playerMap);
        let gameMode = await preGame.determineGameMode(allCardDeals[i], [GameModeEnum.CALL_GAME]);
        let history = new GameHistory(Object.keys(playerMap), gameMode);
        let game = new Game(new GameWorld(gameMode, playerMap, [], new Round(startPlayer, Object.keys(playerMap)), history));

        await game.play();
        let gameResult = game.getGameResult();

        stats.addResult(gameResult);

        if (game.getGameResult().getGameMode().isNoRetry()) {
            log.report(`Team (${gameResult.getPlayingTeamNames()}) ${gameResult.hasPlayingTeamWon() ? 'wins' : 'looses'} ` +
                `with ${gameResult.getPlayingTeamPoints()} points ` +
                `and ${gameResult.hasPlayingTeamWon() ? 'win' : 'loose'} ${Math.abs(gameResult.getGameMoneyValue())} cents each!`);
        } else {
            log.report(`retry with cards:${Object.values(playerMap).map(p => '\n' + p.getName() + ': ' + p.getStartCardSet().toString())}`)
        }
        reportCents(i);

        startPlayer = rotateStartPlayer(startPlayer);
    }

    saveGames();
})();

function saveGames() {
    if (!fs.existsSync('generated')) {
        fs.mkdirSync('generated');
    }
    fs.writeFileSync('generated/games.json', JSON.stringify(games, null, 2));
}

function rotateStartPlayer(startPlayer: string) {
    let index = playerNames.indexOf(startPlayer);

    return playerNames[(index + 1) % 4];
}

function reportCents(i: number) {
    log.report(`balance after ${i + 1} games`);
    for (let i = 0; i < 4; i++) {
        let playerStats = stats.getStatsForPlayer(playerNames[i]);
        log.report(`${playerNames[i]} [${playerMap[playerNames[i]].getStartCardSet()}] (${playerMap[playerNames[i]].getStrategyName()}): ${playerStats.cents} (${playerStats.tournamentPoints} points, ${playerStats.wins} wins, ${playerStats.losses} losses, ${playerStats.inPlayingTeam} playing, ${playerStats.points / playerStats.games} points on average`);
    }
}