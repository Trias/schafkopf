import {CardPlayStrategy} from "../rulebased/heuristic/CardPlayStrategy";
import {GameWorld} from "../../GameWorld";
import {Card} from "../../cards/Card";
import {getPlayableCards} from "../../PlayableMoves";
import {sample} from "lodash";

export class RandomCardPlay implements CardPlayStrategy {
    determineCardToPlay(world: GameWorld, cardSet: Card[]): Card {
        let playableCards = getPlayableCards(cardSet, world.gameMode, world.round);
        return sample(playableCards)!;
    }
}