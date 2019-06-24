import {Game} from "./model/Game";
import {Player} from "./model/Player";
import Statistics from "./model/Statistics";
import shuffleCards from "./model/cards/shuffleCards";
import SimpleStrategy from "./model/strategy/simple/CallingRulesWithRandomPlay";
import {GameWorld} from "./model/GameWorld";
import {PreGame} from "./model/PreGame";
import {Round} from "./model/Round";
import {GameHistory} from "./model/knowledge/GameHistory";
import UctMonteCarloStrategy from "./model/strategy/montecarlo/UctMonteCarloStrategy";
import NaiveMonteCarloStrategy from "./model/strategy/montecarlo/NaiveMonteCarloStrategy";

let runs = 120;

let playerNames = ["Player 1", "Player 2", "Player 3", "Player 4"];

let playerMap = {
    [playerNames[0]]: new Player(playerNames[0], NaiveMonteCarloStrategy),
    [playerNames[1]]: new Player(playerNames[1], UctMonteCarloStrategy),
    [playerNames[2]]: new Player(playerNames[2], SimpleStrategy),
    [playerNames[3]]: new Player(playerNames[3], SimpleStrategy),
};

let stats = new Statistics(playerNames);

//(async () => {
let startPlayer = playerNames[0];
for (let i = 0; i < runs; i++) {
    console.log(`========game ${i + 1}===========`);
    let preGame = new PreGame(playerMap);
    let gameMode = preGame.determineGameMode(shuffleCards());
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

for (let playerName of playerNames) {
    console.log(`========${playerName}=========`);
    let {wins, cents, inPlayingTeam, retries, ownPlays, ownWins, ownSoloWins, ownSoloPlays, tournamentPoints} = stats.getStatsForPlayer(playerName);
    let ownCallGamePlays = (ownPlays - ownSoloPlays);
    let ownCallGamWins = (ownWins - ownSoloWins);

    console.log(`In Total: Out of ${runs} games, this Player wins ${Math.round(wins / runs * 100)}% of the games `
        + `with a balance of ${cents} cents `
        + `corresponding to  ${tournamentPoints} tournament points `
        + `being in the playing team ${Math.round(inPlayingTeam / runs * 100)}% of the time `
        + (ownPlays ? `declaring ${Math.round(ownPlays / runs * 100)}% of the time; winning own games ${Math.round(ownWins / ownPlays * 100)}% of the time; ` : '')
        + (ownCallGamePlays ? `playing ${ownCallGamePlays} callgames ${Math.round(ownCallGamePlays / runs * 100)}% of the time; winning own call games ${Math.round(ownCallGamWins / ownCallGamePlays * 100)}% of the time; ` : '')
        + (ownSoloPlays ? `playing ${ownSoloPlays} Solos ${Math.round(ownSoloPlays / runs * 100)}% of the time;  winning solos ${Math.round(ownSoloWins / ownSoloPlays * 100)}% of the time ` : '')
        + `and ${Math.round(retries / runs * 100)}% retries for all players`);
    ownPlays ? console.log(`calling choices: ${Math.round(ownCallGamePlays / ownPlays * 100)}% call games; ${Math.round(ownSoloPlays / ownPlays * 100)}% solo`) : '';
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
        console.log(`${playerNames[i]} :${playerStats.cents} (${playerStats.tournamentPoints} points)`);
    }
}