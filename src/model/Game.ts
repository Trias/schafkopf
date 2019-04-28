/**
 *
 * all information about a game... root class
 */

import {GameMode, GameModeEnum} from "./GameMode";
import GameResult from "./GameResult";
import Player from "./Player";
import Round from "./Round";
import Ordering from "./orderings/Ordering";

export default class Game {
    private readonly players: [Player, Player, Player, Player];
    private readonly rounds: Round[];
    private readonly gameMode: GameMode;
    private readonly gameResult: GameResult;

    constructor(player1:Player, player2:Player, player3:Player, player4:Player){
        this.rounds = [];
        this.players = [player1, player2, player3, player4];

        this.gameMode = this.determineGameMode();

        if(this.gameMode.getCallingPlayer()){
            this.notifyPlayersOfGameMode(this.gameMode);

            console.log(`game mode decided: ${this.gameMode.getMode()}, by ${this.gameMode.getCallingPlayer()}, calling for ${this.gameMode.getColor()}`);

            this.rounds = this.playRounds();
        }

        this.gameResult = new GameResult(this.gameMode, this.rounds, this.players);
    }

    playRounds(): Round[] {
        let rounds: Round[] = [];
        let activePlayer = this.players[0];

        for (let i = 0; i < 8; i++) {
            console.log(`------round ${i + 1} start-----`);
            let round = new Round(activePlayer);
            for (let j = 0; j < 4; j++) {
                let card = activePlayer.playCard(round);
                round.addCard(card);
                console.log(`player ${this.getPlayerIndex(activePlayer) + 1} played ${card} from set ${Ordering.sortByNaturalOrdering(activePlayer.getCurrentCardSet().asArray().concat(card))}`);

                activePlayer = this.nextPlayer(activePlayer);

                // console.log(`------pli ${j+1} finished-----`);
            }
            rounds.push(round);
            activePlayer = round.getWinningPlayer(this.gameMode, this.players);

            console.log(`round winner: ${round.getWinningPlayer(this.gameMode, this.players).getName()} at position ${round.getWinnerIndex(this.gameMode) + 1}; round cards: ${round.getCards()}`);
            console.log(`------round ${i+1} finished-----`);
        }
        console.log(`=====game finished=======`);

        return rounds;
    }

    determineGameMode(): GameMode{
        let currentGameMode = new GameMode(GameModeEnum.RETRY);
        for (let i = 0; i < 4; i++) {
            let newGameMode = this.players[i].whatDoYouWantToPlay(currentGameMode);
            if (newGameMode && (GameMode.compareGameModes(newGameMode, currentGameMode) > 0)) {
                currentGameMode = newGameMode;
            }
        }

        return currentGameMode;
    }

    private nextPlayer(player: Player) {
        return this.players[(this.players.indexOf(player) + 1) % 4];
    }

    notifyPlayersOfGameMode(gameMode: GameMode) {
        for(let i = 0; i < 4; i++){
            this.players[i].notifyGameMode(gameMode);
        }
    }

    getGameResult(){
        return this.gameResult;
    }

    private getPlayerIndex(activePlayer: Player) {
        return this.players.indexOf(activePlayer);
    }
}