import CardDeck from "./sets/CardDeck";
import {chunk, clone} from "lodash";
import {Card} from "./Card";

export function shuffleCards() {
    let cardsShuffled = fisherYatesShuffle(clone(CardDeck) as Card[]);

    return chunk(cardsShuffled, 4);
}

export function shuffleCardsTimes(times: number) {
    let decks = [];
    for (let i = 0; i < times; i++) {
        decks.push(shuffleCards());
    }

    return decks;
}

function fisherYatesShuffle<T>(array: T[]) {
    let m = array.length, t, i;

    // While there remain elements to shuffle…
    while (m) {

        // Pick a remaining element…
        i = Math.floor(Math.random() * m--);

        // And swap it with the current element.
        t = array[m];
        array[m] = array[i];
        array[i] = t;
    }

    return array;
}