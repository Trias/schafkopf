import {removeCard, sortByNaturalOrdering} from "./cards/CardSet";
import {Card} from "./cards/Card";
import {GameMode, GameModeEnum} from "./GameMode";
import StrategyInterface from "./strategy/StrategyInterface";
import GamePhase from "./GamePhase";
import {clone} from "lodash";
import RandomStrategy from "./strategy/random";
import {GameWorld} from "./GameWorld";
import {DummyPlayer} from "./simulation/DummyPlayer";
import {Round} from "./Round";
import {canPlayCard} from "./PlayableMoves";

export type PlayerMap = { [index in string]: PlayerInterface };

class Player implements PlayerInterface {
    private startCardSet: Card[];
    private readonly name: string;
    private strategy: StrategyInterface;
    private currentCardSet: Card[];
    private gamePhase: GamePhase;
    private strategyConstructor: { new(player: Player): StrategyInterface };

    constructor(name: string, strategy: new (player: Player) => (StrategyInterface)) {
        this.gamePhase = GamePhase.BEFORE_GAME;
        this.name = name;

        this.strategy = new strategy(this);
        this.strategyConstructor = strategy;

        this.startCardSet = [];
        this.currentCardSet = [];
    }

    getStrategyName() {
        return this.strategyConstructor.name;
    }

    getDummyClone() {
        return new DummyPlayer(this.name, clone(this.startCardSet), clone(this.currentCardSet!), RandomStrategy);
    }

    onGameStart() {
        this.onNewGamePhase(GamePhase.GAME_STARTED);
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

    onReceiveSecondBatchOfCards(cards: readonly Card[]) {
        if (this.gamePhase != GamePhase.FOUR_CARDS_DEALT) {
            throw Error('function not available in this state');
        }
        if (cards.length != 4) {
            throw Error('Wrong number of cards dealt');
        }

        this.currentCardSet = this.currentCardSet!.concat(cards);
        this.startCardSet = clone(sortByNaturalOrdering(this.currentCardSet));
    }

    getStartCardSet(): Card[] {
        if (this.gamePhase < GamePhase.ALL_CARDS_DEALT) {
            throw Error('function not available in this state');
        }
        return this.startCardSet;
    }

    playCard(world: GameWorld): Round {
        if (this.gamePhase !== GamePhase.IN_PLAY) {
            throw Error('function not available in this state');
        }

        if (world.round.getCurrentPlayerName() != this.name) {
            throw Error('not to move');
        }

        if (this.currentCardSet!.length + world.rounds.length != 8) {
            throw Error('invariant violated');
        }

        let card = this.strategy.chooseCardToPlay(world, this.getCurrentCardSet());

        if (!card || !canPlayCard(world.gameMode, this.currentCardSet, card, world.round)) {
            throw Error('cannot play card!');
        }

        this.currentCardSet = removeCard(this.currentCardSet, card);
        if (this.currentCardSet.length + world.rounds.length + 1 != 8) {
            throw Error('invariant violated');
        }

        world.round.addCard(card);
        world.onCardPlayed(world.round);

        return world.round;
    }

    forcePlayCard(world: GameWorld, card: Card): Round {
        if (this.gamePhase !== GamePhase.IN_PLAY) {
            throw Error('function not available in this state');
        }
        if (!card || !canPlayCard(world.gameMode, this.currentCardSet, card, world.round)) {
            throw Error('cannot play card!');
        }
        if (world.round.getCurrentPlayerName() != this.name) {
            throw Error('not to move');
        }

        if (this.currentCardSet.length + world.rounds.length != 8) {
            throw Error('invariant violated');
        }
        this.currentCardSet = removeCard(this.currentCardSet, card);
        if (this.currentCardSet.length + world.rounds.length + 1 != 8) {
            throw Error('invariant violated');
        }

        world.round.addCard(card);
        world.onCardPlayed(world.round);

        return world.round;
    }

    whatDoYouWantToPlay(currentGameMode: GameMode, playerIndex: number, allowedGameModes: GameModeEnum[]) {
        if (this.gamePhase !== GamePhase.ALL_CARDS_DEALT) {
            throw Error('function not available in this state');
        }
        let [gameMode, color] = this.strategy.chooseGameToCall(this.getStartCardSet(), currentGameMode, playerIndex, allowedGameModes);

        if (gameMode && gameMode !== currentGameMode.getMode()) {
            return new GameMode(gameMode, this.getName(), color);
        } else {
            return currentGameMode;
        }
    }

    doYouWantToKlopf() {
        return this.strategy.chooseToRaise(this.getCurrentCardSet())
    }

    getCurrentCardSet() {
        if (this.gamePhase < GamePhase.FOUR_CARDS_DEALT) {
            throw Error('function not available in this state');
        }
        return sortByNaturalOrdering(this.currentCardSet!);
    }

    toString() {
        return this.name;
    }

    getName() {
        return this.name;
    }

    onNewGamePhase(gamePhase: GamePhase) {
        if (gamePhase < this.gamePhase && gamePhase !== GamePhase.BEFORE_GAME) {
            throw Error('invalid state transition!');
        }
        this.gamePhase = gamePhase;

        if (gamePhase === GamePhase.BEFORE_GAME) {
            this.currentCardSet = [];
            this.startCardSet = [];
        }
    }
}


interface PlayerInterface {
    getStrategyName(): string;

    onNewGamePhase(gamePhase: GamePhase): void;

    getName(): string;

    toString(): string;

    getCurrentCardSet(): Card[];

    doYouWantToKlopf(): boolean;

    whatDoYouWantToPlay(currentGameMode: GameMode, playerIndex: number, allowedGameModes: GameModeEnum[]): GameMode;

    onGameStart(): void;

    playCard(world: GameWorld): Round;

    onReceiveFirstBatchOfCards(cards: Card[]): void;

    onReceiveSecondBatchOfCards(cards: readonly Card[]): void;

    getStartCardSet(): Card[];

    forcePlayCard(world: GameWorld, card: Card): Round;

    getDummyClone(): PlayerInterface;
}

export {Player, PlayerInterface}