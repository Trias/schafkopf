import {CardPlayStrategy} from "../CardPlayStrategy";
import {GameWorld} from "../../GameWorld";
import {Card} from "../../cards/Card";
import {getPlayableCards} from "../../PlayableMoves";
import {sample} from "../../../utils/sample";

export class RandomCardPlay implements CardPlayStrategy {
    chooseCardToPlay(world: GameWorld, cardSet: Card[]): Card {
        let playableCards = getPlayableCards(cardSet, world.gameMode, world.round);
        return sample(playableCards)!;
    }
}