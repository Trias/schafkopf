import {GameWorld} from "../GameWorld";
import {Card} from "../cards/Card";

export interface CardPlayStrategy {
    chooseCardToPlay(world: GameWorld, cardSet: Card[]): Promise<Card> | Card;
}