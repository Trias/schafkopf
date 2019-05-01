enum CallableColor {
    EICHEL = "E",
    GRAS = "G", // Gras
    SCHELLE = "S", // Schelle
}

enum Herz {
    HERZ = "H", // Herz
}

enum Trump {
    TRUMP = "T", // Trump
}

type PlainColor = CallableColor | Herz;
const PlainColor = {...CallableColor, ...Herz};

type ColorWithTrump = CallableColor | Herz | Trump;
const ColorWithTrump = {...CallableColor, ...Herz, ...Trump};

namespace Colors {
    export function plainColorsAsArray(): [PlainColor, PlainColor, PlainColor, PlainColor] {
        return [PlainColor.EICHEL, PlainColor.GRAS, PlainColor.HERZ, PlainColor.SCHELLE];
    }

    export function callableColorsAsArray(): [CallableColor, CallableColor, CallableColor] {
        return [CallableColor.EICHEL, CallableColor.GRAS, CallableColor.SCHELLE];
    }
}

export {PlainColor, ColorWithTrump, CallableColor, Colors};