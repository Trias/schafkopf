import CardDeck from "./CardDeck";
import {shuffle} from "lodash";
import Ordering from "./orderings/Ordering";


export default function shuffleCards() {
    let cardsShuffled = shuffle(CardDeck);

    let cardSet1 = Ordering.sortByNaturalOrdering(cardsShuffled.slice(0, 8));
    let cardSet2 = Ordering.sortByNaturalOrdering(cardsShuffled.slice(8, 16));
    let cardSet3 = Ordering.sortByNaturalOrdering(cardsShuffled.slice(16, 24));
    let cardSet4 = Ordering.sortByNaturalOrdering(cardsShuffled.slice(24, 32));

    return [cardSet1, cardSet2, cardSet3, cardSet4];
}