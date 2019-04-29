import {Suit} from "../Suit";
import {Card} from "../Cards";

function inSuit(suit: Suit): Card[] {
    return [
        suit + "A" as Card,
        suit + "X" as Card,
        suit + "K" as Card,
        suit + "9" as Card,
        suit + "8" as Card,
        suit + "7" as Card
    ];
}

type SuitsType = {
    [index in Suit]: Card[];
}

let Suits = {
    [Suit.EICHEL]: inSuit(Suit.EICHEL),
    [Suit.GRAS]: inSuit(Suit.GRAS),
    [Suit.SCHELLE]: inSuit(Suit.SCHELLE),
    [Suit.HERZ]: inSuit(Suit.HERZ),
} as SuitsType;

export {Suits};