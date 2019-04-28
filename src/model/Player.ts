/**
 * hold the card set, calculates accrued points...
 */
import CardSet from "./CardSet";
import Round from "./Round";
import {CardEnum} from "./Card";
import {GameMode} from "./GameMode";
import StrategyInterface from "./strategy/StrategyInterface";
import Ordering from "./orderings/Ordering";

export default class Player {
    private readonly startCardSet: CardEnum[];
    private readonly name: string;
    private readonly strategy: StrategyInterface;
    private gameMode?: GameMode;
    private currentCardSet: CardEnum[];

    constructor(name: string, startCardSet: CardEnum[], strategy: StrategyInterface) {
        this.name = name;
        this.startCardSet = startCardSet;
        this.currentCardSet = startCardSet;
        this.strategy = strategy;
    }

    getStartCardSet(): CardEnum[] {
        return this.startCardSet;
    }

    playCard(round: Round): CardEnum {
        if(!this.gameMode){
            throw Error('not in Play');
        }

        let gameMode = this.gameMode as GameMode;

        let card = this.strategy.chooseCardToPlay(round, this.currentCardSet, gameMode);

        this.currentCardSet = CardSet.removeCard(this.currentCardSet, card);

        return card;
    }

    notifyGameMode(gameMode: GameMode) {
        this.gameMode = gameMode;
    }

    whatDoYouWantToPlay(currentGameMode: GameMode): GameMode {
        let [gameMode, color] = this.strategy.chooseGameToCall(this.startCardSet, currentGameMode);

        if (gameMode && gameMode !== currentGameMode.getMode()) {
            return new GameMode(gameMode, this, color);
        }else {
            return currentGameMode;
        }
    }

    getCurrentCardSet() {
        return Ordering.sortByNaturalOrdering(this.currentCardSet);
    }

    toString() {
        return this.name;
    }

    getName() {
        return this.name;
    }
}