import {GameWorld} from "../../../GameWorld";
import {Card} from "../../../cards/Card";

export interface CardPlayStrategy {
    determineCardToPlay(world: GameWorld, cardSet: Card[]): Card;
}