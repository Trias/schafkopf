import {Card} from "../cards/Card";
import {GameMode} from "../GameMode";
import {GameWorld} from "../GameWorld";
import {Round} from "../Round";
import {PlayerInterface} from "../Player";
import GamePhase from "../GamePhase";
import {DummyPlayer} from "./DummyPlayer";

export class PlayerPlaceholder implements PlayerInterface {

    private readonly name: string;

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
        return false;
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

    getDummyClone(): DummyPlayer {
        throw new Error("Method not implemented.");
    }

    onGameStart(): void {
        throw new Error("Method not implemented.");
    }

    toString(): string {
        throw new Error("Method not implemented.");
    }

    onNewGamePhase(gamePhase: GamePhase): void {
        throw new Error("Method not implemented.");
    }
}