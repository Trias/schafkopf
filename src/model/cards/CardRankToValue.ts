import CardRank from "./CardRank";

type CardRankToValueType = {
    [index in CardRank]: number
}

export default {
    [CardRank.ACE]: 11,
    [CardRank.TEN]: 10,
    [CardRank.KING]: 4,
    [CardRank.OBER]: 3,
    [CardRank.UNTER]: 2,
    [CardRank.NINE]: 0,
    [CardRank.EIGHT]: 0,
    [CardRank.SEVEN]: 0,
} as CardRankToValueType;