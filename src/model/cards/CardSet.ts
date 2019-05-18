import {Card} from "./Card";
import {callableColors, ColorWithTrump, PlainColor} from "./Color";
import {filter, includes, intersection, some, sortBy, without} from "lodash";
import {GameMode, GameModeEnum} from "../GameMode";
import OberAndUnter from "./sets/OberAndUnter";
import CardDeck from "./sets/CardDeck";
import CardRank from "./CardRank";

export function hasCard(cards: readonly Card[], otherCard: Card): boolean {
    return includes(cards, otherCard);
}

export function hasPlainColorWithoutOberAndUnter(cards: readonly Card[], otherColor: PlainColor) {
    return some(cards, card => !includes(OberAndUnter, card) && getPlainColor(card) === otherColor);
}

export function removeCard(cards: readonly Card[], card: Card): readonly Card[] {
    if (cards.length == 0) {
        throw Error(`cannot remove card from empty set.`);
    }
    if (cards.indexOf(card) < 0) {
        throw Error(`card (${card}) not in Deck ${cards.toString()}`);
    }
    return without(cards, card);
}

export function hasColor(cardsOnHand: readonly Card[], otherColor: ColorWithTrump, gameMode: GameMode) {
    return some(cardsOnHand, card => gameMode.getOrdering().getColor(card) === otherColor);
}

export function allOfColor(cards: readonly Card[], color: ColorWithTrump, gameMode: GameMode) {
    return filter(cards, card => gameMode.getOrdering().getColor(card) === color);
}

export function highTrumps(cards: readonly Card[], gameMode: GameMode): Card[] {
    if (gameMode.getMode() == GameModeEnum.WENZ) {
        return filter(cards, card => card[1] == "U");
    }
    return filter(cards, card => card[1] == "O" || card[1] == "U") as Card[];
}

export function sortAndFilterBy(allTrumpsSorted: readonly Card[], winnerCardSet: readonly Card[]): readonly Card[] {
    let trumpsInHands: Card[] = intersection(allTrumpsSorted, winnerCardSet);

    return sortBy(trumpsInHands, (trump) => allTrumpsSorted.indexOf(trump));
}

export function sortByNaturalOrdering(cards: readonly Card[]): readonly Card[] {
    return sortBy(cards, (card) => CardDeck.indexOf(card));
}

export function getRank(card: Card): CardRank {
    return card[1] as CardRank;
}

export function getPlainColor(card: Card) {
    return card[0] as PlainColor;
}

export function getCallableColors(cardSet: readonly Card[], gameMode: GameMode) {
    let result = [];
    for (let color of callableColors) {
        let ace = color + "A";
        if (!includes(cardSet, ace) && allOfColor(cardSet, color, gameMode).length > 0) {
            result.push(color);
        }
    }
    return result;
}

export function getCardsByColor(cardSet: readonly Card[], gameMode: GameMode) {
    let result: { [index in ColorWithTrump]: Card[] } = {
        [ColorWithTrump.TRUMP]: [],
        [ColorWithTrump.EICHEL]: [],
        [ColorWithTrump.GRAS]: [],
        [ColorWithTrump.SCHELLE]: [],
        [ColorWithTrump.HERZ]: [],
    };

    for (let card of cardSet) {
        let color = gameMode.getOrdering().getColor(card);
        result[color].push(card);
    }

    return result;
}