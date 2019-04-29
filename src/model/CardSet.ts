/**
 * up to 8 cards hold by one player
 */
import {Card, Cards} from "./Cards";
import {Suit} from "./Suit";
import {includes, some, without} from "lodash";
import {GameMode} from "./GameMode";
import OberAndUnter from "./orderings/OberAndUnter";

namespace CardSet {
    export function hasCard(cards: Card[], otherCard: Card): boolean {
        return includes(cards, otherCard);
    }

    export function hasSuitNoTrump(cards: Card[], otherSuit: Suit) {
        return some(cards, card => !includes(OberAndUnter, card) && Cards.getSuitIgnoringTrump(card) === otherSuit);
    }

    export function removeCard(cards: Card[], card: Card): Card[] {
        if (cards.indexOf(card) < 0) {
            throw Error(`card (${card}) not in Deck ${cards.toString()}`);
        }
        if (cards.length == 0) {
            throw Error(`cannot remove from empty set. card (${card}) not in Deck ${cards.toString()}`);
        }
        return without(cards, card);
    }

    export function hasSuit(cardsOnHand: Card[], otherSuit: Suit, gameMode: GameMode) {
        return some(cardsOnHand, card => Cards.getSuit(card, gameMode) === otherSuit);
    }
}

export default CardSet;