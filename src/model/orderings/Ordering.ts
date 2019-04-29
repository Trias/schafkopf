import {Card} from "../Cards";
import {intersection, sortBy} from "lodash";
import CardDeck from "./CardDeck";

export default class Ordering {
    static sortAndFilterBy(allTrumpsSorted: Card[], winnerCardSet: Card[]): Card[] {
        let trumpsInHands: Card[] = intersection(allTrumpsSorted, winnerCardSet);

        return sortBy(trumpsInHands, (trump) => allTrumpsSorted.indexOf(trump));
    }

    static sortByNaturalOrdering(cards: Card[]): Card[] {
        return sortBy(cards, (card) => CardDeck.indexOf(card));
    }
}