/**
 * hold the card set, calculates accrued points...
 */
import CardSet from "./CardSet";
import Round from "./Round";
import {CardEnum} from "./Card";
import {GameMode} from "./GameMode";
import StrategyInterface from "./strategy/StrategyInterface";
import Ordering from "./orderings/Ordering";
import GamePhase from "./GamePhase";

export default class Player {
    // noinspection JSMismatchedCollectionQueryUpdate
    private startCardSet?: CardEnum[];
    private readonly name: string;
    private readonly strategy: StrategyInterface;
    private gameMode?: GameMode;
    private currentCardSet?: CardEnum[];
    private gamePhase: GamePhase;

    constructor(name: string, strategy: StrategyInterface) {

        this.strategy = strategy;
        this.gamePhase = GamePhase.BEFORE_GAME;
        this.name = name;
    }

    receiveFirstBatchOfCards(cards: CardEnum[]) {
        if (this.gamePhase != GamePhase.BEFORE_GAME) {
            throw Error('function not available in this state');
        }
        if (cards.length != 4) {
            throw Error('Wrong number of cards dealt');
        }

        this.currentCardSet = cards;
    }

    receiveSecondBatchOfCards(cards: CardEnum[]) {
        if (this.gamePhase != GamePhase.FOUR_CARDS_DEALT) {
            throw Error('function not available in this state');
        }
        if (cards.length != 4) {
            throw Error('Wrong number of cards dealt');
        }

        let currentCardSet = this.currentCardSet as CardEnum[];

        this.currentCardSet = currentCardSet.concat(cards);
        this.startCardSet = this.currentCardSet;
    }

    getStartCardSet(): CardEnum[] {
        if (this.gamePhase < GamePhase.ALL_CARDS_DEALT) {
            throw Error('function not available in this state');
        }
        return this.startCardSet as CardEnum[];
    }

    playCard(round: Round): CardEnum {
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

    getCurrentCardSet() {
        if (this.gamePhase < GamePhase.ALL_CARDS_DEALT) {
            throw Error('function not available in this state');
        }
        let currentCardSet = this.currentCardSet as CardEnum[];
        return Ordering.sortByNaturalOrdering(currentCardSet);
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