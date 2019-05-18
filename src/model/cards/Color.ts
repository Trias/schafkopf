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

const colorsWithTrump = [PlainColor.EICHEL, PlainColor.GRAS, PlainColor.HERZ, PlainColor.SCHELLE, ColorWithTrump.TRUMP];
const plainColors = [PlainColor.EICHEL, PlainColor.GRAS, PlainColor.HERZ, PlainColor.SCHELLE];
const callableColors = [CallableColor.EICHEL, CallableColor.GRAS, CallableColor.SCHELLE];

export {PlainColor, ColorWithTrump, CallableColor, callableColors, colorsWithTrump, plainColors};