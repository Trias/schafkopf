import {Card} from "./Card";
import {ColorWithTrump, PlainColor} from "./Color";
import {filter, includes, some, without} from "lodash";
import {GameMode} from "../GameMode";
import OberAndUnter from "./sets/OberAndUnter";
import CardsOrdering from "./CardsOrdering";

namespace CardSet {
    export function hasCard(cards: Card[], otherCard: Card): boolean {
        return includes(cards, otherCard);
    }

    export function hasPlainColorWithoutOberAndUnter(cards: Card[], otherColor: PlainColor) {
        return some(cards, card => !includes(OberAndUnter, card) && CardsOrdering.getPlainColor(card) === otherColor);
    }

    export function removeCard(cards: Card[], card: Card): Card[] {
        if (cards.length == 0) {
            throw Error(`cannot remove card from empty set.`);
        }
        if (cards.indexOf(card) < 0) {
            throw Error(`card (${card}) not in Deck ${cards.toString()}`);
        }
        return without(cards, card);
    }

    export function hasColor(cardsOnHand: Card[], otherColor: ColorWithTrump, gameMode: GameMode) {
        return some(cardsOnHand, card => gameMode.getOrdering().getColor(card) === otherColor);
    }

    export function allOfColor(cards: Card[], color: ColorWithTrump, gameMode: GameMode) {
        return filter(cards, card => gameMode.getOrdering().getColor(card) === color);
    }
}

export default CardSet;