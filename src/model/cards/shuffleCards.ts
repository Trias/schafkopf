import CardDeck from "./sets/CardDeck";
import {chunk, shuffle} from "lodash";

export default function shuffleCards() {
    let cardsShuffled = shuffle(CardDeck);

    return chunk(cardsShuffled, 4);
}