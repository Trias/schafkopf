/**
 * hold the card set, calculates accrued points...
 */
import CardSet from "./cards/CardSet";
import {FinishedRound, Round} from "./Round";
import {Card} from "./cards/Card";
import {GameMode} from "./GameMode";
import StrategyInterface from "./strategy/StrategyInterface";
import CardsOrdering from "./cards/CardsOrdering";
import GamePhase from "./GamePhase";
import GameKnowledge from "./knowledge/GameKnowledge";
import GameEventsReceiverInterface from "./knowledge/GameEventsReceiverInterface";
import {CallableColor, ColorWithTrump} from "./cards/Color";

export default class Player implements GameEventsReceiverInterface {
    // noinspection JSMismatchedCollectionQueryUpdate
    private startCardSet?: Card[];
    private readonly name: string;
    private readonly strategy: StrategyInterface;
    private gameMode?: GameMode;
    private currentCardSet?: Card[];
    private gamePhase: GamePhase;
    private gameKnowledge?: GameKnowledge;
    private players: Player[] | undefined;

    constructor(name: string, strategy: StrategyInterface) {
        this.strategy = strategy;
        this.gamePhase = GamePhase.BEFORE_GAME;
        this.name = name;
    }

    onGameStart(players: Player[]) {
        this.players = players;
        this.gamePhase = GamePhase.GAME_STARTED;
    }

    onReceiveFirstBatchOfCards(cards: Card[]) {
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

    getStartCardSet(): Card[] {
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

    doYouWantToRaise() {
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
        this.gamePhase = gamePhase;

        if (gamePhase === GamePhase.BEFORE_GAME) {
            this.currentCardSet = undefined;
            this.startCardSet = undefined;
            this.gameMode = undefined;
            this.players = undefined;
        }
    }

    onCardPlayed(card: Card, player: Player, index: number): void {
        this.gameKnowledge!.onCardPlayed(card, player, index);
    }

    onRoundCompleted(round: FinishedRound): void {
        this.gameKnowledge!.onRoundCompleted(round);
        console.log(`Player: ${this.toString()}`);
        console.log(`teampartner known: ${this.gameKnowledge!.isTeamPartnerKnown()}; `);
        try {
            console.log(`highestUnplayed card for Eichel: ${this.gameKnowledge!.highestUnplayedCardForColor(CallableColor.EICHEL)}, Gras: ${this.gameKnowledge!.highestUnplayedCardForColor(CallableColor.GRAS)},  Schelle: ${this.gameKnowledge!.highestUnplayedCardForColor(CallableColor.SCHELLE)},  Trump: ${this.gameKnowledge!.highestUnplayedCardForColor(ColorWithTrump.TRUMP)}`);
        } catch (e) {
        }

        try {
            console.log(`teamPoints: own:${this.gameKnowledge!.getOwnTeamPoints()} other: ${this.gameKnowledge!.getOtherTeamPoints()}`);
        } catch (e) {
        }
        console.log(`farbe Angespielt: Eichel: ${this.gameKnowledge!.hasColorBeenAngespielt(ColorWithTrump.EICHEL)}, Gras: ${this.gameKnowledge!.hasColorBeenAngespielt(ColorWithTrump.GRAS)}, Schelle: ${this.gameKnowledge!.hasColorBeenAngespielt(ColorWithTrump.SCHELLE)}, Trump: ${this.gameKnowledge!.hasColorBeenAngespielt(ColorWithTrump.TRUMP)}`);
        console.log(`-----`);
    }
}