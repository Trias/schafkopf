import {Game} from "./model/Game";
import {Player} from "./model/Player";
import Statistics from "./model/Statistics";
import shuffleCards from "./model/cards/shuffleCards";
import SimpleStrategy from "./model/strategy/simple/CallingRulesWithRandomPlay";
import NaiveMonteCarlo from "./model/strategy/montecarlo/NaiveMonteCarlo";
import {GameWorld} from "./model/GameWorld";
import {PreGame} from "./model/PreGame";
import {Round} from "./model/Round";
import {GameHistory} from "./model/knowledge/GameHistory";

let runs = 1200;

let playerNames = ["Player 1", "Player 2", "Player 3", "Player 4"];

let playerMap = {
    [playerNames[0]]: new Player("Player 1", NaiveMonteCarlo),
    [playerNames[1]]: new Player("Player 2", SimpleStrategy),
    [playerNames[2]]: new Player("Player 3", SimpleStrategy),
    [playerNames[3]]: new Player("Player 4", SimpleStrategy),
};

let stats = new Statistics(playerNames);

//(async () => {
    for (let i = 0; i < runs; i++) {
        console.log(`========game ${i + 1}===========`);
        // TODO: pregameworld
        let preGame = new PreGame(playerMap);
        let gameMode = preGame.play(shuffleCards());
        let history = new GameHistory(Object.keys(playerMap), gameMode);
        let game = new Game(new GameWorld(gameMode, playerMap, [], new Round(playerNames[0], Object.keys(playerMap)), history));

        game.play();
        let gameResult = game.getGameResult();

        if (game.getGameResult().getGameMode().isNoRetry()) {
            stats.addResult(gameResult);
        }

        if (game.getGameResult().getGameMode().isNoRetry()) {
            console.log(`Team (${gameResult.getPlayingTeamNames()}) ${gameResult.hasPlayingTeamWon() ? 'wins' : 'looses'} ` +
                `with ${gameResult.getPlayingTeamPoints()} points ` +
                `and ${gameResult.hasPlayingTeamWon() ? 'win' : 'loose'} ${Math.abs(gameResult.getGameMoneyValue())} cents each!`);
            reportCents(i);
        } else {
            console.log(`retry with cards:${Object.values(playerMap).map(p => '\n' + p.getName() + ': ' + JSON.stringify(p.getStartCardSet()))}`)
        }

        rotateStartPlayer();
    }

let {wins, cents, inPlayingTeam, retries, ownPlays, ownWins, ownSoloWins, ownSoloPlays, tournamentPoints} = stats.getStatsForPlayer(playerNames[0]);
    console.log(`In Total: Out of ${runs} games, Player 1 wins ${Math.round(wins / runs * 100)}% of the games `
        + `with a balance of ${cents} cents `
        + `corresponding to  ${tournamentPoints} tournament points `
        + `being in the playing team ${Math.round(inPlayingTeam / runs * 100)}% of the time `
        + (ownPlays ? `calling ${Math.round(ownPlays / runs * 100)}% of the time; winning own games ${Math.round(ownWins / ownPlays * 100)}% of the time; ` : '')
        + (ownSoloPlays ? `winning solos ${Math.round(ownSoloWins / ownSoloPlays * 100)}% of the time ` : '')
        + `and ${Math.round(retries / runs * 100)}% retries for all players`);
reportCents(120);

//})();

function rotateStartPlayer() {
    let nextSeats = [];
    for (let i = 1; i < 4; i++) {
        nextSeats.push(playerNames[i]);
    }

    nextSeats.push(playerNames[0]);

    playerNames = nextSeats;
}

function reportCents(i: number) {
    let stats1 = stats.getStatsForPlayer(playerNames[0]);
    let stats2 = stats.getStatsForPlayer(playerNames[1]);
    let stats3 = stats.getStatsForPlayer(playerNames[2]);
    let stats4 = stats.getStatsForPlayer(playerNames[3]);

    console.log(`balance after ${i + 1} games`);
    console.log(`${playerNames[0]} :${stats1.cents} (${stats1.tournamentPoints} points)`);
    console.log(`${playerNames[1]} :${stats2.cents} (${stats2.tournamentPoints} points)`);
    console.log(`${playerNames[2]} :${stats3.cents} (${stats3.tournamentPoints} points)`);
    console.log(`${playerNames[3]} :${stats4.cents} (${stats4.tournamentPoints} points)`);
}