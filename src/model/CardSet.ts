/**
 * up to 8 cards hold by one player
 */
import {Card, CardEnum} from "./Card";
import {ColorEnum} from "./ColorEnum";
import {includes, some, without} from "lodash";
import {GameMode} from "./GameMode";
import OberAndUnter from "./orderings/OberAndUnter";

namespace CardSet {
    export function hasCard(cards: CardEnum[], otherCard: CardEnum): boolean {
        return includes(cards, otherCard);
    }

    export function hasColorNoTrump(cards: CardEnum[], otherColor: ColorEnum) {
        return some(cards, card => !includes(OberAndUnter, card) && Card.getColorIgnoringTrump(card) === otherColor);
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

    export function hasColor(cardsOnHand: CardEnum[], otherColor: ColorEnum, gameMode: GameMode) {
        return some(cardsOnHand, card => Card.getColor(card, gameMode) === otherColor);
    }
}

export default CardSet;