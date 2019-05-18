import {Card} from "../../../cards/Card";
import {CardToWeights} from "../CardToWeights";

export function playRandomCard(playableCards: Card[]): CardToWeights {
    let result: { [index in Card]?: number } = {};

    for (let card of playableCards) {
        result[card] = Math.random();
    }

    return result;
}