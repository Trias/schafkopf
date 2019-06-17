import CardRankToValue from "./CardRankToValue";
import CardRank from "./CardRank";

enum Card {
    EO = "EO", GO = "GO", HO = "HO", SO = "SO",
    EU = "EU", GU = "GU", HU = "HU", SU = "SU",
    HA = "HA", HX = "HX", HK = "HK", H9 = "H9", H8 = "H8", H7 = "H7",
    EA = "EA", EX = "EX", EK = "EK", E9 = "E9", E8 = "E8", E7 = "E7",
    GA = "GA", GX = "GX", GK = "GK", G9 = "G9", G8 = "G8", G7 = "G7",
    SA = "SA", SX = "SX", SK = "SK", S9 = "S9", S8 = "S8", S7 = "S7"
}

export function cardToValue(card: Card) {
    return CardRankToValue[card[1] as CardRank];
}

export {Card}