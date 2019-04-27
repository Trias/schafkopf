import Game from "./model/Game";
import Player from "./model/Player";
import RandomStrategy from "./model/strategy/random";
import CardDeck from "./model/CardDeck";
import CardSet from "./model/CardSet";
import {shuffle} from "lodash";
import GameResult from "./model/GameResult";
import {GameModeEnum} from "./model/GameMode";

function shuffleCards() {
    let cardsShuffled = shuffle(CardDeck);

    let cardSet1 = new CardSet(cardsShuffled.slice(0,8));
    let cardSet2 = new CardSet(cardsShuffled.slice(8,16));
    let cardSet3 = new CardSet(cardsShuffled.slice(16,24));
    let cardSet4 = new CardSet(cardsShuffled.slice(24,32));

    return [cardSet1, cardSet2, cardSet3, cardSet4];
}

let results = [];
let runs = 10;

for(let i = 0; i < runs; i++){
    let [cardSet1, cardSet2, cardSet3, cardSet4] = shuffleCards();

    console.log("shuffled cards: ", cardSet1, cardSet2, cardSet3, cardSet4);

    let player1 = new Player("1", cardSet1, new RandomStrategy());
    let player2 = new Player("2", cardSet2, new RandomStrategy());
    let player3 = new Player("3", cardSet3, new RandomStrategy());
    let player4 = new Player("4", cardSet4, new RandomStrategy());

    console.log(`game ${i+1}:`);
    let game = new Game(player1, player2, player3, player4);

    results.push(game.getGameResult());
}

function getWinsByPlayer(results: GameResult[], index: number) : number{
    let wins = 0;
    for(let result of results){
        if(result.getGameMode() === GameModeEnum.CALL_GAME){
            if(result.hasPlayingTeamWon() && result.getPlayingTeam().indexOf(result.getPlayerByIndex(index)) !== -1){
                wins = wins + 1;
            }else if(!result.hasPlayingTeamWon() && result.getPlayingTeam().indexOf(result.getPlayerByIndex(index)) === -1){
                wins = wins + 1;
            }
        }else if(result.getGameMode() === GameModeEnum.RETRY){
            wins = wins + 0.5;
        }else{
            throw Error('not implemented');
        }

    }
    return wins;
}

let winsByPlayer1 = getWinsByPlayer(results, 0);

console.log(`of ${runs} games, Player1 wins ${Math.round(winsByPlayer1/runs*100)}% of the games`);
