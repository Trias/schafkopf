import {Card} from "../cards/Card";
import {GameMode, GameModeEnum} from "../GameMode";
import {cloneDeep, includes} from "lodash";
import {GameWorld} from "../GameWorld";
import {FinishedRound, Round} from "../Round";
import {PlayerInterface} from "../Player";
import GamePhase from "../GamePhase";
import {removeCard} from "../cards/CardSet";
import {CardPlayStrategy} from "../strategy/CardPlayStrategy";
import GameAssumptions from "../knowledge/GameAssumptions";
import {GameAssumptionsInCallGame} from "../knowledge/GameAssumptionsInCallGame";
import {GameHistory} from "../knowledge/GameHistory";

export class DummyPlayer implements PlayerInterface {
    private currentCardSet: Card[];
    readonly name: string;
    readonly startCardSet: Card[];
    readonly strategy: CardPlayStrategy;
    readonly strategyConstructor: new (name: string, startCardSet: Card[], assumptions: GameAssumptions) => CardPlayStrategy;
    readonly assumptions: GameAssumptions;
    readonly gamePhase: GamePhase;

    constructor(playerName: string, playerNames: string[], gameMode: GameMode, history: GameHistory, startCardSet: Card[], currentCardSet: Card[], rounds: FinishedRound[], round: Round, strategy: new (name: string, startCardSet: Card[], assumptions: GameAssumptions) => CardPlayStrategy) {
        this.name = playerName;
        this.startCardSet = startCardSet;
        this.currentCardSet = currentCardSet;
        this.strategyConstructor = strategy;

        // dummy prop....
        this.gamePhase = GamePhase.IN_PLAY;

        this.assumptions = new GameAssumptionsInCallGame(history, playerName, playerNames, gameMode, startCardSet, rounds, round);
        this.strategy = new strategy(playerName, startCardSet, this.assumptions);

    }

    getStrategyName() {
        return this.strategyConstructor.name;
    }

    onReceiveFirstBatchOfCards(cards: Card[]) {

    }

    onReceiveSecondBatchOfCards(cards: readonly Card[]) {

    }

    doYouWantToKlopf(): boolean {
        return false;
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
        let card = <Card>this.strategy.chooseCardToPlay(world, this.currentCardSet);

        this.currentCardSet = removeCard(this.currentCardSet, card);

        world.round.addCard(card);
        world.onCardPlayed(world.round);

        return world.round;
    }

    async whatDoYouWantToPlay(currentGameMode: GameMode, playerIndex: number, allowedGameModes: GameModeEnum[]): Promise<GameMode> {
        throw Error('not implemented');
    }

    getDummyClone(world: GameWorld): DummyPlayer {
        return cloneDeep(this);
    }

    onGameStart(world: GameWorld): void {
        throw new Error("Method not implemented.");
    }

    toString(): string {
        throw new Error("Method not implemented.");
    }

    onNewGamePhase(gamePhase: GamePhase, world: GameWorld | null): void {
        throw new Error("Method not implemented.");
    }

    onCardPlayed(round: Round, roundIndex: number): void {
    }

    onGameModeDecided(world: GameWorld): void {
    }

    onRoundCompleted(round: FinishedRound, roundIndex: number): void {
    }
}