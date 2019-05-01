/**
 *
 * all information about a game... root class
 */

import {GameMode, GameModeEnum} from "./GameMode";
import GameResult from "./GameResult";
import Player from "./Player";
import Round from "./Round";
import CardsOrdering from "./cards/CardsOrdering";
import GamePhase from "./GamePhase";
import {Card} from "./cards/Card";

export default class Game {
    private readonly players: [Player, Player, Player, Player];
    // noinspection JSMismatchedCollectionQueryUpdate
    private rounds: Round[];
    private gameMode?: GameMode;
    private gamePhase: GamePhase;

    constructor(players: [Player, Player, Player, Player]) {
        this.rounds = [];
        this.players = players;
        this.gamePhase = GamePhase.BEFORE_GAME;
    }

    play(cardsInSets: Card[][]) {
        if (this.gamePhase != GamePhase.BEFORE_GAME) {
            throw Error('Invalid state transition');
        }

        this.setGamePhase(GamePhase.BEFORE_GAME);

        console.log(`-----deal first batch of cards ------`);
        for (let i = 0; i < this.players.length; i++) {
            this.players[i].receiveFirstBatchOfCards(cardsInSets[i]);
        }
        this.setGamePhase(GamePhase.FOUR_CARDS_DEALT);

        let raises = 0;

        for (let i = 0; i < this.players.length; i++) {
            let raise = this.players[i].doYouWantToRaise();

            if (raise) {
                console.log(`${this.players[i]} raises with cards: ${this.players[i].getCurrentCardSet()}!`);
                raises = raises + 1;
            }
        }

        console.log(`-----deal second batch of cards ------`);
        for (let i = 0; i < this.players.length; i++) {
            this.players[i].receiveSecondBatchOfCards(cardsInSets[i + 4]);
        }
        this.setGamePhase(GamePhase.ALL_CARDS_DEALT);

        this.gameMode = this.askPlayersWhatTheyWantToPlay();

        this.gameMode.setKlopfer(raises);

        if (this.gameMode.getCallingPlayer()) {
            this.notifyPlayersOfGameMode(this.gameMode);
            this.setGamePhase(GamePhase.IN_PLAY);

            console.log(`game mode decided: ${this.gameMode.getMode()}, by ${this.gameMode.getCallingPlayer()}, calling for ${this.gameMode.getColorOfTheGame()}`);

            this.rounds = this.playRounds();
        }

        this.setGamePhase(GamePhase.AFTER_GAME);
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
                console.log(`player ${activePlayer.getName()} played ${card} from set ${CardsOrdering.sortByNaturalOrdering(activePlayer.getCurrentCardSet().concat(card))}`);

                activePlayer = this.nextPlayer(activePlayer);

                // console.log(`------pli ${j+1} finished-----`);
            }
            rounds.push(round);
            activePlayer = round.getWinningPlayer(this.getGameMode(), this.players);

            console.log(`round winner: ${round.getWinningPlayer(this.getGameMode(), this.players).getName()} at position ${round.getWinnerIndex(this.getGameMode()) + 1}; round cards: ${round.getCards()}`);
            console.log(`------round ${i + 1} finished-----`);
        }
        console.log(`=====game finished=======`);

        return rounds;
    }

    askPlayersWhatTheyWantToPlay(): GameMode {
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
        for (let i = 0; i < 4; i++) {
            this.players[i].notifyGameMode(gameMode);
        }
    }

    notifyPlayersOfGamePhase(gamePhase: GamePhase) {
        for (let i = 0; i < 4; i++) {
            this.players[i].notifyGamePhase(gamePhase);
        }
    }

    getGameResult() {
        if (this.gamePhase !== GamePhase.AFTER_GAME) {
            throw Error('gameResult not yet determined!');
        }
        let rounds = this.rounds as Round[];

        return new GameResult(this.getGameMode(), rounds, this.players);
    }

    private getGameMode() {
        if (this.gamePhase < GamePhase.IN_PLAY) {
            throw Error('gameMode not yet determined!');
        }
        return this.gameMode as GameMode;
    }

    private setGamePhase(gamePhase: GamePhase) {
        if (this.gamePhase > gamePhase && gamePhase != GamePhase.BEFORE_GAME) {
            throw Error('invalid state transition');
        }
        this.gamePhase = gamePhase;
        this.notifyPlayersOfGamePhase(gamePhase);
        if (gamePhase === GamePhase.BEFORE_GAME) {
            this.gameMode = undefined;
        }
    }
}