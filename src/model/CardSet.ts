/**
 * up to 8 cards hold by one player
 */
import {Card, CardEnum} from "./Card";
import {ColorEnum} from "./ColorEnum";
import {some, without} from "lodash";

namespace CardSet {
    export function hasCard(cards: CardEnum[], otherCard: CardEnum): boolean {
        return cards.indexOf(otherCard) !== -1;
    }

    export function hasColor(cards: CardEnum[], otherColor: ColorEnum) {
        return some(cards, card => Card.getColor(card) === otherColor);
    }

    export function removeCard(cards: CardEnum[], card: CardEnum): CardEnum[] {
        if (cards.indexOf(card) < 0) {
            throw Error(`card (${card}) not in Deck ${cards.toString()}`);
        }
        if (cards.length == 0) {
            throw Error(`cannot remove from empty set. card (${card}) not in Deck ${cards.toString()}`);
        }
        return without(cards, card);
    }
}

export default CardSet;