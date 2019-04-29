import {Suit} from "./Suit";
import CardRank from "./CardRank";
import {includes} from "lodash";
import {GameMode} from "./GameMode";

enum Card {
    EO = "EO", GO = "GO", HO = "HO", SO = "SO",
    EU = "EU", GU = "GU", HU = "HU", SU = "SU",
    HA = "HA", HX = "HX", HK = "HK", H9 = "H9", H8 = "H8", H7 = "H7",
    EA = "EA", EX = "EX", EK = "EK", E9 = "E9", E8 = "E8", E7 = "E7",
    GA = "GA", GX = "GX", GK = "GK", G9 = "G9", G8 = "G8", G7 = "G7",
    SA = "SA", SX = "SX", SK = "SK", S9 = "S9", S8 = "S8", S7 = "S7"
}

namespace Cards {
    export function isOfSuit(card: Card, suit: Suit, gameMode: GameMode) {
        return suit === Cards.getSuit(card, gameMode);
    }

    export function getSuit(card: Card, gameMode: GameMode): Suit {
        if (includes(gameMode.getTrumpOrdering(), card)) {
            return Suit.TRUMP;
        }
        return card[0] as Suit;
    }

    export function getRank(card: Card): CardRank {
        return card[1] as CardRank;
    }

    export function getSuitIgnoringTrump(card: Card) {
        return card[0] as Suit;
    }
}

export {Cards, Card}