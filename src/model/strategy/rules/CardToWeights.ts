import {Card} from "../../cards/Card";

export type CardToWeights = { [index in string]?: number };

export function zeroWeightedCards(cardSet: Card[]) {
    let weights: CardToWeights = {};
    for (let card of cardSet) {
        weights[card] = 0;
    }

    return weights;
}