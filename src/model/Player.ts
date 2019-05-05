import CardSet from "./cards/CardSet";
import {FinishedRound, Round} from "./Round";
import {Card} from "./cards/Card";
import {GameMode, GameModeEnum} from "./GameMode";
import StrategyInterface from "./strategy/StrategyInterface";
import CardsOrdering from "./cards/CardsOrdering";
import GamePhase from "./GamePhase";
import GameKnowledge from "./knowledge/GameKnowledge";
import GameEventsReceiverInterface from "./knowledge/GameEventsReceiverInterface";
import {Colors, ColorWithTrump} from "./cards/Color";
import GameAssumptionsInCallGame from "./knowledge/GameAssumptionsInCallGame";

export default class Player implements GameEventsReceiverInterface {
    private startCardSet?: readonly Card[];
    private readonly name: string;
    private readonly strategy: StrategyInterface;
    private gameMode?: GameMode;
    private currentCardSet?: readonly Card[];
    private gamePhase: GamePhase;
    private gameKnowledge?: GameKnowledge;
    // noinspection JSMismatchedCollectionQueryUpdate
    private players?: readonly [Player, Player, Player, Player];
    private gameAssumptions?: GameAssumptionsInCallGame;

    constructor(name: string, strategy: StrategyInterface) {
        this.strategy = strategy;
        this.gamePhase = GamePhase.BEFORE_GAME;
        this.name = name;
    }

    onGameStart(players: readonly [Player, Player, Player, Player]) {
        this.players = players;
        this.notifyGamePhase(GamePhase.GAME_STARTED);
    }

    onReceiveFirstBatchOfCards(cards: readonly Card[]) {
        if (this.gamePhase != GamePhase.GAME_STARTED) {
            throw Error('function not available in this state');
        }
        if (cards.length != 4) {
            throw Error('Wrong number of cards dealt');
        }

        this.currentCardSet = cards;
    }

    onReceiveSecondBatchOfCards(cards: Card[]) {
        if (this.gamePhase != GamePhase.FOUR_CARDS_DEALT) {
            throw Error('function not available in this state');
        }
        if (cards.length != 4) {
            throw Error('Wrong number of cards dealt');
        }

        this.currentCardSet = this.currentCardSet!.concat(cards);
        this.startCardSet = this.currentCardSet;

        this.gameKnowledge = new GameKnowledge(this.startCardSet, this, this.players!);
    }

    getStartCardSet(): readonly Card[] {
        if (this.gamePhase < GamePhase.ALL_CARDS_DEALT) {
            throw Error('function not available in this state');
        }
        return this.startCardSet!;
    }

    playCard(round: Round): Card {
        if (this.gamePhase !== GamePhase.IN_PLAY) {
            throw Error('function not available in this state');
        }

        let card = this.strategy.chooseCardToPlay(round, this.getCurrentCardSet(), this.gameMode!);

        this.currentCardSet = CardSet.removeCard(this.getCurrentCardSet(), card);

        return card;
    }

    onGameModeDecided(gameMode: GameMode) {
        if (this.gamePhase !== GamePhase.ALL_CARDS_DEALT) {
            throw Error('function not available in this state');
        }

        this.gameMode = gameMode;
        this.gameKnowledge!.onGameModeDecided(gameMode);

        if (this.gameMode.getMode() === GameModeEnum.CALL_GAME) {
            this.gameAssumptions = new GameAssumptionsInCallGame(this.gameKnowledge!, this, this.players!);
            this.gameAssumptions.onGameModeDecided(gameMode);
        }
    }

    whatDoYouWantToPlay(currentGameMode: GameMode): GameMode {
        if (this.gamePhase !== GamePhase.ALL_CARDS_DEALT) {
            throw Error('function not available in this state');
        }
        let [gameMode, color] = this.strategy.chooseGameToCall(this.getStartCardSet(), currentGameMode);

        if (gameMode && gameMode !== currentGameMode.getMode()) {
            return new GameMode(gameMode, this, color);
        } else {
            return currentGameMode;
        }
    }

    doYouWantToKlopf() {
        return this.strategy.chooseToRaise(this.getCurrentCardSet());
    }

    getCurrentCardSet() {
        if (this.gamePhase < GamePhase.FOUR_CARDS_DEALT) {
            throw Error('function not available in this state');
        }
        return CardsOrdering.sortByNaturalOrdering(this.currentCardSet!);
    }

    toString() {
        return this.name;
    }

    getName() {
        return this.name;
    }

    notifyGamePhase(gamePhase: GamePhase) {
        if (gamePhase < this.gamePhase && gamePhase !== GamePhase.BEFORE_GAME) {
            throw Error('invalid state transition!');
        }
        this.gamePhase = gamePhase;

        if (gamePhase === GamePhase.BEFORE_GAME) {
            this.currentCardSet = undefined;
            this.startCardSet = undefined;
            this.gameMode = undefined;
            this.players = undefined;
            this.gameAssumptions = undefined;
            this.gameKnowledge = undefined;
        }
    }

    onCardPlayed(card: Card, player: Player, index: number): void {
        this.gameKnowledge!.onCardPlayed(card, player, index);
        if (this.gameAssumptions) {
            this.gameAssumptions!.onCardPlayed(card, player, index);
        }
    }

    onRoundCompleted(round: FinishedRound, roundIndex: number): void {
        this.gameKnowledge!.onRoundCompleted(round, roundIndex);
        if (this.gameAssumptions) {
            this.gameAssumptions.onRoundCompleted(round, roundIndex);
        }

        if (this.getName() == "Player 1") {
            console.log(`Player: ${this.toString()}`);
            console.log(`teampartner known: ${this.gameKnowledge!.isTeamPartnerKnown()}; `);
            console.log(`highestUnplayed card for Eichel: ${this.gameKnowledge!.highestUnplayedCardForColor(ColorWithTrump.EICHEL)}, Gras: ${this.gameKnowledge!.highestUnplayedCardForColor(ColorWithTrump.GRAS)}, Herz: ${this.gameKnowledge!.highestUnplayedCardForColor(ColorWithTrump.HERZ)},  Schelle: ${this.gameKnowledge!.highestUnplayedCardForColor(ColorWithTrump.SCHELLE)},  Trump: ${this.gameKnowledge!.highestUnplayedCardForColor(ColorWithTrump.TRUMP)}`);
            console.log(`teamPoints: own:${this.gameKnowledge!.getOwnTeamPoints()} other: ${this.gameKnowledge!.getOtherTeamPoints()}`);
            console.log(`farbe Angespielt: Eichel: ${this.gameKnowledge!.hasColorBeenAngespielt(ColorWithTrump.EICHEL)}, Gras: ${this.gameKnowledge!.hasColorBeenAngespielt(ColorWithTrump.GRAS)}, Herz: ${this.gameKnowledge!.hasColorBeenAngespielt(ColorWithTrump.HERZ)}, Schelle: ${this.gameKnowledge!.hasColorBeenAngespielt(ColorWithTrump.SCHELLE)}, Trump: ${this.gameKnowledge!.hasColorBeenAngespielt(ColorWithTrump.TRUMP)}`);

            if (this.gameAssumptions) {
                let {player, confidence, reasons} = this.gameAssumptions.getPossibleTeamPartner();
                console.log(`possible Partner: ${player} with confidence ${Math.round(confidence * 100)}% because ${reasons}`);

                for (let player of this.players!) {
                    for (let color of Colors.colorsWithTrumpAsArray()) {
                        let {assumption, reasons} = this.gameAssumptions.isPlayerPossiblyColorFree(player, color);
                        if (assumption) {
                            console.log(`player ${player} assumed Color free of ${color} because of ${reasons}`);
                        }
                    }
                }
            }

            console.log(`-----`);
        }
    }
}