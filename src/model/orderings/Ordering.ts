import {CardEnum} from "../Card";
import {intersection, sortBy} from "lodash";
import CardDeck from "../CardDeck";

export default class Ordering {
    static sortAndFilterBy(allTrumpsSorted: CardEnum[], winnerCardSet: CardEnum[]): CardEnum[] {
        let trumpsInHands: CardEnum[] = intersection(allTrumpsSorted, winnerCardSet);

        return sortBy(trumpsInHands, (trump) => allTrumpsSorted.indexOf(trump));
    }

    static sortByNaturalOrdering(cards: CardEnum[]): CardEnum[] {
        return sortBy(cards, (card) => CardDeck.indexOf(card));
    }
}