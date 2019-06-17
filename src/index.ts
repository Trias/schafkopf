import {Game} from "./model/Game";
import {Player} from "./model/Player";
import Statistics from "./model/Statistics";
import shuffleCards from "./model/cards/shuffleCards";
import SimpleStrategy from "./model/strategy/simple/CallingRulesWithRandomPlay";
import {GameModeEnum} from "./model/GameMode";
import NaiveMonteCarlo from "./model/strategy/montecarlo/NaiveMonteCarlo";

let runs = 120;

let player1 = new Player("Player 1", NaiveMonteCarlo);
let player2 = new Player("Player 2", SimpleStrategy);
let player3 = new Player("Player 3", SimpleStrategy);
let player4 = new Player("Player 4", SimpleStrategy);

let players: [Player, Player, Player, Player] = [player1, player2, player3, player4];

let stats = new Statistics(players);

//(async () => {
    for (let i = 0; i < runs; i++) {
        console.log(`========game ${i + 1}===========`);
        let game = new Game(players);

        let cards = shuffleCards();
        game.play(cards);
        let gameResult = game.getGameResult();

        stats.addResult(gameResult);

        if (game.getGameResult().getGameMode().getMode() != GameModeEnum.RETRY) {
            console.log(`Team (${gameResult.getPlayingTeam()}) ${gameResult.hasPlayingTeamWon() ? 'wins' : 'looses'} ` +
                `with ${gameResult.getPlayingTeamPoints()} points ` +
                `and ${gameResult.hasPlayingTeamWon() ? 'win' : 'loose'} ${Math.abs(gameResult.getGameMoneyValue())} cents each!`);
            reportCents(i);
        } else {
            console.log(`retry with cards:${players.map(p => '\n' + p.getName() + ': ' + JSON.stringify(p.getStartCardSet()))}`)
        }

        rotateStartPlayer();
    }

let {wins, cents, inPlayingTeam, retries, ownPlays, ownWins, ownSoloWins, ownSoloPlays, tournamentPoints} = stats.getStatsForPlayer(player1);
    console.log(`In Total: Out of ${runs} games, Player 1 wins ${Math.round(wins / runs * 100)}% of the games `
        + `with a balance of ${cents} cents `
        + `corresponding to  ${tournamentPoints} tournament points `
        + `being in the playing team ${Math.round(inPlayingTeam / runs * 100)}% of the time `
        + (ownPlays ? `calling ${Math.round(ownPlays / runs * 100)}% of the time; winning own games ${Math.round(ownWins / ownPlays * 100)}% of the time; ` : '')
        + (ownSoloPlays ? `winning solos ${Math.round(ownSoloWins / ownSoloPlays * 100)}% of the time ` : '')
        + `and ${Math.round(retries / runs * 100)}% retries for all players`);

//})();

function rotateStartPlayer() {
    let nextSeats = [];
    for (let i = 1; i < 4; i++) {
        nextSeats.push(players[i]);
    }

    nextSeats.push(players[0]);

    players = nextSeats as [Player, Player, Player, Player];
}

function reportCents(i: number) {
    let stats1 = stats.getStatsForPlayer(player1);
    let stats2 = stats.getStatsForPlayer(player2);
    let stats3 = stats.getStatsForPlayer(player3);
    let stats4 = stats.getStatsForPlayer(player4);

    console.log(`balance after ${i + 1} games`);
    console.log(`${player1.getName()} :${stats1.cents}`);
    console.log(`${player2.getName()} :${stats2.cents}`);
    console.log(`${player3.getName()} :${stats3.cents}`);
    console.log(`${player4.getName()} :${stats4.cents}`);
}