import {Card} from "../cards/Card";
import {GameMode} from "../GameMode";
import {GameWorld} from "../GameWorld";
import {FinishedRound, Round} from "../Round";
import {PlayerInterface} from "../Player";
import GamePhase from "../GamePhase";
import {CardPlayStrategy} from "../strategy/rulebased/heuristic/CardPlayStrategy";
import GameAssumptions from "../knowledge/GameAssumptions";

export class PlayerPlaceholder implements PlayerInterface {

    readonly name: string;

    get assumptions() {
        throw Error("Method not implemented.");
    };

    constructor(playerName: string) {
        this.name = playerName;
    }

    onReceiveFirstBatchOfCards(cards: Card[]) {
        throw new Error("Method not implemented.");
    }

    onReceiveSecondBatchOfCards(cards: readonly Card[]) {
        throw new Error("Method not implemented.");
    }

    doYouWantToKlopf(): boolean {
        throw new Error("Method not implemented.");
    }

    forcePlayCard(world: GameWorld, card: Card): Round {
        throw new Error("Method not implemented.");
    }

    getCurrentCardSet(): Card[] {
        throw new Error("Method not implemented.");
    }

    getName(): string {
        return this.name;
    }

    getStartCardSet(): Card[] {
        throw new Error("Method not implemented.");
    }

    playCard(world: GameWorld): Round {
        throw new Error("Method not implemented.");
    }

    whatDoYouWantToPlay(currentGameMode: GameMode, playerIndex: number): GameMode {
        throw new Error("Method not implemented.");
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

    getStrategyName(): string {
        return "placeholder";
    }

    onCardPlayed(round: Round, roundIndex: number): void {
        throw new Error("Method not implemented.");
    }

    onGameModeDecided(world: GameWorld): void {
        throw new Error("Method not implemented.");
    }

    onRoundCompleted(round: FinishedRound, roundIndex: number): void {
    }

    getDummyClone(world: GameWorld, strategy: { new(name: string, startCardSet: Card[], assumptions: GameAssumptions): CardPlayStrategy }): PlayerInterface {
        throw new Error("Method not implemented.");
    }
}