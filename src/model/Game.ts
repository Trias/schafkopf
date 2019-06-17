/**
 *
 * all information about a game... root class
 */

import {GameMode, GameModeEnum} from "./GameMode";
import GameResult from "./GameResult";
import {Player} from "./Player";
import {FinishedRound, Round} from "./Round";
import GamePhase from "./GamePhase";
import {Card} from "./cards/Card";
import {sortByNaturalOrdering} from "./cards/CardSet";
import {findIndex, intersection} from "lodash";

class Game {
    private readonly players: readonly [Player, Player, Player, Player];
    // noinspection JSMismatchedCollectionQueryUpdate
    private rounds: readonly FinishedRound[];
    private gameMode?: GameMode;
    private gamePhase: GamePhase;

    constructor(players: readonly [Player, Player, Player, Player]) {
        let names = [];

        for (let player of players) {
            names.push(player.getName());

            if (intersection(names).length !== names.length) {
                throw Error('duplicate names!');
            }
        }

        this.rounds = [];
        this.players = players;
        this.gamePhase = GamePhase.BEFORE_GAME;
    }

    play(cardsInSets: readonly Card[][]) {
        if (this.gamePhase != GamePhase.BEFORE_GAME) {
            throw Error('Invalid state transition');
        }

        this.setGamePhase(GamePhase.BEFORE_GAME);
        this.notifyPlayersOfGameStart();

        console.log(`-----deal first batch of cards ------`);
        this.dealFirstBatchOfCards(cardsInSets);
        this.setGamePhase(GamePhase.FOUR_CARDS_DEALT);

        let klopfer = this.askPlayerForKlopfer();

        console.log(`-----deal second batch of cards ------`);
        this.dealSecondBatchOfCard(cardsInSets);
        this.setGamePhase(GamePhase.ALL_CARDS_DEALT);

        this.gameMode = this.askPlayersWhatTheyWantToPlay();
        this.gameMode.setKlopfer(klopfer);

        if (this.gameMode.isNoRetry()) {
            this.notifyPlayersOfGameMode(this.gameMode);
            this.setGamePhase(GamePhase.IN_PLAY);

            console.log(`game mode decided: ${this.gameMode.getMode()}, by ${this.gameMode.getCallingPlayer()}, calling for ${this.gameMode.getColorOfTheGame()}`);

            this.rounds = this.playRounds();
        }

        this.setGamePhase(GamePhase.AFTER_GAME);
    }

    private dealSecondBatchOfCard(cardsInSets: readonly Card[][]) {
        for (let i = 0; i < this.players.length; i++) {
            this.players[i].onReceiveSecondBatchOfCards(cardsInSets[i + 4]);
        }
    }

    private dealFirstBatchOfCards(cardsInSets: readonly Card[][]) {
        for (let i = 0; i < this.players.length; i++) {
            this.players[i].onReceiveFirstBatchOfCards(cardsInSets[i]);
        }
    }

    private askPlayerForKlopfer() {
        let klopfer = 0;
        for (let i = 0; i < this.players.length; i++) {
            let raise = this.players[i].doYouWantToKlopf();

            if (raise) {
                console.log(`${this.players[i]} klopfes with cards: ${this.players[i].getCurrentCardSet()}!`);
                klopfer = klopfer + 1;
            }
        }
        return klopfer;
    }

    getGameResult() {
        if (this.gamePhase !== GamePhase.AFTER_GAME) {
            throw Error('gameResult not yet determined!');
        }

        return new GameResult(this.getGameMode(), this.rounds!, this.players);
    }

    private playRounds(): readonly FinishedRound[] {
        let rounds: FinishedRound[] = [];
        let activePlayer = this.players[0];
        if (!activePlayer) {
            throw Error('no winning player?');
        }

        for (let i = 0; i < 8; i++) {
            console.log(`------round ${i + 1} start-----`);
            let round = new Round(activePlayer, this.players, this.gameMode!);
            for (let j = 0; j < 4; j++) {
                if (round.getPosition() >= 4) {
                    throw Error('round finished');
                }
                let card = activePlayer.playCard(round);
                round.addCard(card);
                this.notifyPlayersOfCardPlayed(card, activePlayer, j);
                console.log(`player ${activePlayer.getName()} played ${card} from set ${sortByNaturalOrdering(activePlayer.getCurrentCardSet().concat(card))}`);

                console.log(activePlayer.getName());
                activePlayer = this.nextPlayer(activePlayer.getName());
                if (!activePlayer) {
                    throw Error('no winning player?');
                }

                // console.log(`------pli ${j+1} finished-----`);
            }
            this.notifyPlayersOfRoundCompleted(round.finish());
            this.markCalledAce(round);
            rounds.push(round);

            activePlayer = round.getWinningPlayer() as Player;
            if (!activePlayer) {
                throw Error('no winning player?');
            }

            console.log(`round winner: ${round.getWinningPlayer().getName()} at position ${round.getWinningCardIndex() + 1}; round cards: ${round.getCards()}`);
            console.log(`------round ${i + 1} finished-----`);
        }
        console.log(`=====game finished=======`);

        return rounds;
    }

    private markCalledAce(round: Round) {
        if (this.gameMode!.isCallGame()
            && !this.gameMode!.getHasAceBeenCalled()
            && round.getRoundColor() == this.gameMode!.getColorOfTheGame()
        ) {
            this.gameMode!.setHasAceBeenCalled();
        }
    }

    private askPlayersWhatTheyWantToPlay(): GameMode {
        let currentGameMode = new GameMode(GameModeEnum.RETRY);
        for (let i = 0; i < 4; i++) {
            let newGameMode = this.players[i].whatDoYouWantToPlay(currentGameMode, i);
            if (newGameMode && (GameMode.compareGameModes(newGameMode, currentGameMode) > 0)) {
                currentGameMode = newGameMode;
            }
        }

        return currentGameMode;
    }

    private nextPlayer(playerName: string) {
        let playerIndex = findIndex(this.players, (p => p.getName() == playerName));
        if (playerIndex < 0) {
            throw Error('player not found');
        }
        return this.players[(playerIndex + 1) % 4];
    }

    private notifyPlayersOfGameMode(gameMode: GameMode) {
        for (let i = 0; i < 4; i++) {
            this.players[i].onGameModeDecided(gameMode);
        }
    }

    private notifyPlayersOfGamePhase(gamePhase: GamePhase) {
        for (let i = 0; i < 4; i++) {
            this.players[i].notifyGamePhase(gamePhase);
        }
    }

    private getGameMode() {
        if (this.gamePhase < GamePhase.IN_PLAY) {
            throw Error('gameMode not yet determined!');
        }
        return this.gameMode!;
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

    private notifyPlayersOfGameStart() {
        for (let i = 0; i < 4; i++) {
            this.players[i].onGameStart(this.players);
        }
    }

    private notifyPlayersOfCardPlayed(card: Card, activePlayer: Player, j: number) {
        for (let i = 0; i < 4; i++) {
            this.players[i].onCardPlayed(card, activePlayer, j);
        }
    }

    private notifyPlayersOfRoundCompleted(finishedRound: FinishedRound) {
        for (let i = 0; i < 4; i++) {
            this.players[i].onRoundCompleted(finishedRound, this.rounds.length);
        }
    }
}

export {Game}