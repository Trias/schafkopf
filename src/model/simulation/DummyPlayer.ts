import {Card} from "../cards/Card";
import {GameMode, GameModeEnum} from "../GameMode";
import StrategyInterface from "../strategy/StrategyInterface";
import {cloneDeep, includes} from "lodash";
import {GameWorld} from "../GameWorld";
import {FinishedRound, Round} from "../Round";
import {PlayerInterface} from "../Player";
import GamePhase from "../GamePhase";
import {removeCard} from "../cards/CardSet";

export class DummyPlayer implements PlayerInterface {
    private currentCardSet: Card[];
    private readonly name: string;
    private readonly startCardSet: Card[];
    private readonly strategy: StrategyInterface;
    private strategyConstructor: { new(name: string): StrategyInterface };

    constructor(playerName: string, startCardSet: Card[], currentCardSet: Card[], strategy: new (name: string) => StrategyInterface) {
        this.name = playerName;
        this.startCardSet = startCardSet;
        this.currentCardSet = currentCardSet;
        this.strategy = new strategy(this.getName());
        this.strategyConstructor = strategy;
    }

    getStrategyName() {
        return this.strategyConstructor.name;
    }

    onReceiveFirstBatchOfCards(cards: Card[]) {

    }

    onReceiveSecondBatchOfCards(cards: readonly Card[]) {

    }

    doYouWantToKlopf(): boolean {
        return this.strategy.chooseToRaise(this.startCardSet);
    }

    forcePlayCard(world: GameWorld, card: Card): Round {
        if (!includes(this.currentCardSet, card)) {
            throw Error('card not included');
        }

        if (this.currentCardSet!.length + world.rounds.length != 8) {
            throw Error('invariant violated');
        }

        if (world.round.getCurrentPlayerName() != this.name) {
            throw Error('not to move');
        }

        this.currentCardSet = removeCard(this.currentCardSet, card);
        world.round.addCard(card);
        world.onCardPlayed(world.round);

        if (this.currentCardSet.length + world.rounds.length + 1 != 8) {
            throw Error('invariant violated');
        }

        return world.round;
    }

    getCurrentCardSet(): Card[] {
        return this.currentCardSet;
    }

    getName(): string {
        return this.name;
    }

    getStartCardSet(): Card[] {
        return this.startCardSet;
    }

    playCard(world: GameWorld): Round {
        if (world.rounds.length + this.currentCardSet.length != 8) {
            throw Error('invariant violated');
        }
        if (world.round.getCurrentPlayerName() != this.name) {
            throw Error('not to move');
        }
        let card = this.strategy.chooseCardToPlay(world, this.currentCardSet);

        this.currentCardSet = removeCard(this.currentCardSet, card);

        world.round.addCard(card);
        world.onCardPlayed(world.round);

        return world.round;
    }

    whatDoYouWantToPlay(currentGameMode: GameMode, playerIndex: number, allowedGameModes: GameModeEnum[]): GameMode {
        throw Error('not implemented');
    }

    getDummyClone(): DummyPlayer {
        return cloneDeep(this);
    }

    onGameStart(world: GameWorld): void {
        throw new Error("Method not implemented.");
    }

    toString(): string {
        throw new Error("Method not implemented.");
    }

    onNewGamePhase(gamePhase: GamePhase): void {
        throw new Error("Method not implemented.");
    }

    onCardPlayed(round: Round, roundIndex: number): void {
    }

    onGameModeDecided(world: GameWorld): void {
    }

    onRoundCompleted(round: FinishedRound, roundIndex: number): void {
    }
}