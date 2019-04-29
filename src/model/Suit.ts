enum Suit {
    TRUMP = "T",
    EICHEL = "E",
    GRAS = "G", // Gras
    HERZ = "H", // Herz
    SCHELLE = "S", // Schelle
    INDETERMINATE = "_", // unbestimmt
}

namespace Suits {
    export function asArray(): [Suit, Suit, Suit, Suit] {
        return [Suit.EICHEL, Suit.GRAS, Suit.HERZ, Suit.SCHELLE];
    }

    export function callableSuitsAsArray(): [Suit, Suit, Suit] {
        return [Suit.EICHEL, Suit.GRAS, Suit.SCHELLE];
    }
}

export {Suit, Suits};