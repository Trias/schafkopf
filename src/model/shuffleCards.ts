import CardDeck from "./CardDeck";
import CardSet from "./CardSet";
import {shuffle} from "lodash";
import Ordering from "./orderings/Ordering";


export default function shuffleCards() {
    let cardsShuffled = shuffle(CardDeck);

    let cardSet1 = new CardSet(Ordering.sortByNaturalOrdering(cardsShuffled.slice(0, 8)));
    let cardSet2 = new CardSet(Ordering.sortByNaturalOrdering(cardsShuffled.slice(8, 16)));
    let cardSet3 = new CardSet(Ordering.sortByNaturalOrdering(cardsShuffled.slice(16, 24)));
    let cardSet4 = new CardSet(Ordering.sortByNaturalOrdering(cardsShuffled.slice(24, 32)));

    return [cardSet1, cardSet2, cardSet3, cardSet4];
}