import {CardToWeights} from "./rules/CardToWeights";
import {Card} from "../cards/Card";

export function chooseBestCard(cardToWeights: CardToWeights) {
    let entries = Object.entries(cardToWeights);

    if (entries.length == 0) {
        return null;
    }

    return entries.sort((a, b) => {
        return a[1]! > b[1]! ? -1 : 1;
    }).shift()![0] as Card;
}