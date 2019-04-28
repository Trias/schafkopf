import CardDeck from "./CardDeck";
import {shuffle} from "lodash";
import Ordering from "./orderings/Ordering";


export default function shuffleCards() {
    let cardsShuffled = shuffle(CardDeck);

    let cardSet1 = Ordering.sortByNaturalOrdering(cardsShuffled.slice(0, 4));
    let cardSet2 = Ordering.sortByNaturalOrdering(cardsShuffled.slice(4, 8));
    let cardSet3 = Ordering.sortByNaturalOrdering(cardsShuffled.slice(8, 12));
    let cardSet4 = Ordering.sortByNaturalOrdering(cardsShuffled.slice(12, 16));
    let cardSet5 = Ordering.sortByNaturalOrdering(cardsShuffled.slice(16, 20));
    let cardSet6 = Ordering.sortByNaturalOrdering(cardsShuffled.slice(20, 24));
    let cardSet7 = Ordering.sortByNaturalOrdering(cardsShuffled.slice(24, 28));
    let cardSet8 = Ordering.sortByNaturalOrdering(cardsShuffled.slice(28, 32));

    return [cardSet1, cardSet2, cardSet3, cardSet4, cardSet5, cardSet6, cardSet7, cardSet8];
}