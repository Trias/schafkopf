/**
 * hold the card set, calculates accrued points...
 */
import CardSet from "./cards/CardSet";
import Round from "./Round";
import {Card} from "./cards/Card";
import {GameMode} from "./GameMode";
import StrategyInterface from "./strategy/StrategyInterface";
import CardsOrdering from "./cards/CardsOrdering";
import GamePhase from "./GamePhase";

export default class Player {
    // noinspection JSMismatchedCollectionQueryUpdate
    private startCardSet?: Card[];
    private readonly name: string;
    private readonly strategy: StrategyInterface;
    private gameMode?: GameMode;
    private currentCardSet?: Card[];
    private gamePhase: GamePhase;

    constructor(name: string, strategy: StrategyInterface) {

        this.strategy = strategy;
        this.gamePhase = GamePhase.BEFORE_GAME;
        this.name = name;
    }

    receiveFirstBatchOfCards(cards: Card[]) {
        if (this.gamePhase != GamePhase.BEFORE_GAME) {
            throw Error('function not available in this state');
        }
        if (cards.length != 4) {
            throw Error('Wrong number of cards dealt');
        }

        this.currentCardSet = cards;
    }

    receiveSecondBatchOfCards(cards: Card[]) {
        if (this.gamePhase != GamePhase.FOUR_CARDS_DEALT) {
            throw Error('function not available in this state');
        }
        if (cards.length != 4) {
            throw Error('Wrong number of cards dealt');
        }

        let currentCardSet = this.currentCardSet as Card[];

        this.currentCardSet = currentCardSet.concat(cards);
        this.startCardSet = this.currentCardSet;
    }

    getStartCardSet(): Card[] {
        if (this.gamePhase < GamePhase.ALL_CARDS_DEALT) {
            throw Error('function not available in this state');
        }
        return this.startCardSet as Card[];
    }

    playCard(round: Round): Card {
        if (this.gamePhase !== GamePhase.IN_PLAY) {
            throw Error('function not available in this state');
        }

        let gameMode = this.gameMode as GameMode;

        let card = this.strategy.chooseCardToPlay(round, this.getCurrentCardSet(), gameMode);

        this.currentCardSet = CardSet.removeCard(this.getCurrentCardSet(), card);

        return card;
    }

    notifyGameMode(gameMode: GameMode) {
        if (this.gamePhase !== GamePhase.ALL_CARDS_DEALT) {
            throw Error('function not available in this state');
        }
        this.gameMode = gameMode;
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
        let currentCardSet = this.currentCardSet as Card[];
        return CardsOrdering.sortByNaturalOrdering(currentCardSet);
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
        }
    }
}