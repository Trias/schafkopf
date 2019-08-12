import CardDeck from "./sets/CardDeck";
import {chunk, clone} from "lodash";
import {Card} from "./Card";
import {shuffle} from "../../utils/shuffle";

export function shuffleCards() {
    let cardsShuffled = shuffle(clone(CardDeck) as Card[]);

    return chunk(cardsShuffled, 4);
}

export function shuffleCardsTimes(times: number) {
    let decks = [];
    for (let i = 0; i < times; i++) {
        decks.push(shuffleCards());
    }

    return decks;
}