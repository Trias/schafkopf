import {GameMode, GameModeEnum} from "../GameMode";
import {Card} from "../cards/Card";
import {PlainColor} from "../cards/Color";
import {GameWorld} from "../GameWorld";
import {CardPlayStrategy} from "./CardPlayStrategy";

export default interface StrategyInterface extends CardPlayStrategy {

    chooseCardToPlay(world: GameWorld, cardSet: readonly Card[]): Promise<Card> | Card

    chooseGameToCall(cardSet: readonly Card[], gameMode: GameMode, playerIndex: number, allowedGameModes: GameModeEnum[]): [GameModeEnum?, PlainColor?];

    chooseToRaise(cardSet: readonly Card[]): boolean;
}