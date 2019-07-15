import {Card} from "./Card";
import {CallableColor, callableColors, colorsWithTrump, ColorWithTrump, PlainColor} from "./Color";
import {difference, filter, includes, intersection, some, sortBy, without} from "lodash";
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

export function removeCard(cards: Card[], card: Card): Card[] {
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

export function allOfCallableColor(cards: readonly Card[], color: CallableColor) {
    return filter(cards, card => card[1] != "O" && card[1] != "U" && card[0] == color);
}

export function getHighTrumps(cards: readonly Card[], gameMode: GameMode): Card[] {
    if (gameMode.getMode() == GameModeEnum.WENZ) {
        return filter(cards, card => card[1] == "U");
    }
    return filter(cards, card => card[1] == "O" || card[1] == "U") as Card[];
}

export function getLowerTrumps(cards: readonly Card[], gameMode: GameMode): Card[] {
    return difference(getTrumps(cards, gameMode), getHighTrumps(cards, gameMode));
}

export function sortAndFilterBy(allTrumpsSorted: readonly Card[], winnerCardSet: readonly Card[]): readonly Card[] {
    let trumpsInHands: Card[] = intersection(allTrumpsSorted, winnerCardSet);

    return sortBy(trumpsInHands, (trump) => allTrumpsSorted.indexOf(trump));
}

export function sortByNaturalOrdering(cards: Card[]): Card[] {
    return sortBy(cards, (card) => CardDeck.indexOf(card));
}

export function getRank(card: Card): CardRank {
    return card[1] as CardRank;
}

export function getRanks(cardSet: readonly Card[]): readonly CardRank[] {
    let ranks = [];

    for (let card of cardSet) {
        ranks.push(card[1] as CardRank);
    }

    return intersection(ranks);
}

export function getRankIndex(card: Card): number {
    return Object.values(CardRank).indexOf(card[1]);
}

export function getPlainColor(card: Card) {
    return card[0] as PlainColor;
}

export function getBlankColors(cardSet: readonly Card[], gameMode: GameMode) {
    let cardsByColor = getCardsByColor(cardSet, gameMode);
    let blankColors = [];

    for (let color of colorsWithTrump) {
        if (cardsByColor[color].length == 1 && color != ColorWithTrump.TRUMP) {
            blankColors.push(color);
        }
    }

    return blankColors;
}

export function getBlankCards(cardSet: readonly Card[], gameMode: GameMode) {
    let cardsByColor = getCardsByColor(cardSet, gameMode);
    let blankCards = [];

    for (let color of colorsWithTrump) {
        if (cardsByColor[color].length == 1 && color != ColorWithTrump.TRUMP) {
            blankCards.push(cardsByColor[color][0]);
        }
    }

    return blankCards;
}

export function withoutAces(cardSet: readonly Card[]) {
    return filter(cardSet, card => card[1] != "A");
}

export function getAces(cardSet: readonly Card[]) {
    return filter(cardSet, card => card[1] == "A");
}

export function getColorsOfCards(cardSet: Card[], gameMode: GameMode) {
    let colors = [];

    for (let card of cardSet) {
        let color = gameMode.getOrdering().getColor(card);

        if (!includes(colors, color)) {
            colors.push(color);
        }
    }

    return colors;
}

export function hasBlankColors(cardSet: readonly Card[], gameMode: GameMode) {
    let blankColors = getBlankColors(cardSet, gameMode);

    return blankColors.length > 0;
}

export function getCallableColors(cardSet: readonly Card[]) {
    let result = [];
    for (let color of callableColors) {
        let ace = color + "A";
        if (!includes(cardSet, ace) && allOfCallableColor(cardSet, color).length > 0) {
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

export function getCardLengthsByColor(cardSet: readonly Card[], gameMode: GameMode) {
    let result: { [index in ColorWithTrump]: number } = {
        [ColorWithTrump.TRUMP]: 0,
        [ColorWithTrump.EICHEL]: 0,
        [ColorWithTrump.GRAS]: 0,
        [ColorWithTrump.SCHELLE]: 0,
        [ColorWithTrump.HERZ]: 0,
    };

    let cardsByColor = getCardsByColor(cardSet, gameMode);

    for (let [color, cards] of (Object.entries(cardsByColor) as [ColorWithTrump, Card[]][])) {
        result[color] = cards.length;
    }

    return result;
}

export function getShortestColors(cardSet: readonly Card[], gameMode: GameMode) {
    let cardLengthsByColor = getCardLengthsByColor(cardSet, gameMode);
    let shortestColorLength = 8;
    let shortestColors: ColorWithTrump[] = [];

    for (let [color, length] of Object.entries(cardLengthsByColor) as [ColorWithTrump, number][]) {
        if (length < shortestColorLength) {
            shortestColors = [color];
        } else if (length == shortestColorLength) {
            shortestColors.push(color);
        }
    }

    return shortestColors;
}

export function getLongestColors(cardSet: readonly Card[], gameMode: GameMode) {
    let cardLengthsByColor = getCardLengthsByColor(cardSet, gameMode);
    let longestColorLength = 0;
    let longestColors: ColorWithTrump[] = [];

    for (let [color, length] of Object.entries(cardLengthsByColor) as [ColorWithTrump, number][]) {
        if (length > longestColorLength) {
            longestColors = [color];
        } else if (length == longestColorLength) {
            longestColors.push(color);
        }
    }

    return longestColors;
}


function getCardLengthsByPlainColor(cardSet: ReadonlyArray<Card>) {
    let result: { [index in string]: number } = {};
    for (let card of cardSet) {
        let color = card[0] as string;
        result[color] = result[color] || 0;
        result[color]++;
    }

    return result;
}

export function getLongestPlainColors(cardSet: readonly Card[]): PlainColor[] {
    cardSet = difference(cardSet, OberAndUnter);

    let cardLengthsByColor = getCardLengthsByPlainColor(cardSet);
    let longestColorLength = 0;
    let longestColors: PlainColor[] = [];

    for (let [color, length] of Object.entries(cardLengthsByColor) as [PlainColor, number][]) {
        if (length > longestColorLength) {
            longestColorLength = length;
            longestColors = [color];
        } else if (length == longestColorLength) {
            longestColors.push(color);
        }
    }

    return longestColors;
}

export function hasTrumps(cardSet: readonly Card[], gameMode: GameMode) {
    return getTrumps(cardSet, gameMode).length > 0;
}

export function getTrumps(cardSet: readonly Card[], gameMode: GameMode) {
    let cardsByColor = getCardsByColor(cardSet, gameMode);

    return cardsByColor[ColorWithTrump.TRUMP];
}

export function getNonTrumps(cardSet: readonly Card[], gameMode: GameMode) {
    return cardSet.filter(card => !gameMode.getOrdering().isTrump(card));
}

export function hasSchmiers(cardSet: readonly Card[]) {
    return getSchmiers(cardSet).length > 0;
}

export function getSchmiers(cardSet: readonly Card[]) {
    let schmiers = [];
    for (let card of cardSet) {
        if (card[1] == "A" || card[1] == "X") {
            schmiers.push(card);
        }
    }

    return schmiers;
}

export function hasKings(cardSet: readonly Card[]) {
    for (let card of cardSet) {
        if (card[1] == "K") {
            return true;
        }
    }

    return false;
}