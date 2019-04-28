import Game from "./model/Game";
import Player from "./model/Player";
import RandomStrategy from "./model/strategy/random";
import Statistics from "./model/Statistics";
import shuffleCards from "./model/shuffleCards";

let results = [];
let runs = 100;

for(let i = 0; i < runs; i++){
    let [cardSet1, cardSet2, cardSet3, cardSet4] = shuffleCards();

    let player1 = new Player("Player 1", cardSet1, new RandomStrategy());
    let player2 = new Player("Player 2", cardSet2, new RandomStrategy());
    let player3 = new Player("Player 3", cardSet3, new RandomStrategy());
    let player4 = new Player("Player 4", cardSet4, new RandomStrategy());

    console.log(`========game ${i + 1}===========`);
    let game = new Game(player1, player2, player3, player4);
    let gameResult = game.getGameResult();

    results.push(gameResult);

    console.log(`Team (${gameResult.getPlayingTeam()}) ${gameResult.hasPlayingTeamWon() ? 'win' : 'loose'} \
with ${gameResult.getPlayingTeamPoints()} points \
and ${gameResult.hasPlayingTeamWon() ? 'win' : 'loose'} ${Math.abs(gameResult.getGameMoneyValue())} cents each!`)
}

let stats = new Statistics(results);
let [winsByPlayer1, cents, inPlayingTeam, retries] = stats.getStatisticsForPlayerAtSeat(0);

console.log(`In Total: Out of ${runs} games, Player 1 wins ${Math.round(winsByPlayer1 / runs * 100)}% of the games with a balance of ${cents} cents being in the playing team ${Math.round(inPlayingTeam / runs * 100)}% of the time and ${Math.round(retries / runs * 100)}% retries`);
