import {includes} from "lodash";

enum ColorEnum {
    TRUMP = "T",
    EICHEL = "E",
    BLATT = "B", // Blatt
    HERZ = "H", // Herz
    SCHELLE = "S", // Schelle
    INDETERMINATE = "_", // unbestimmt
}

namespace Colors {
    export function asArray(): [ColorEnum, ColorEnum, ColorEnum, ColorEnum] {
        return [ColorEnum.EICHEL, ColorEnum.BLATT, ColorEnum.HERZ, ColorEnum.SCHELLE];
    }

    export function callableColorsAsArray(): [ColorEnum, ColorEnum, ColorEnum] {
        return [ColorEnum.EICHEL, ColorEnum.BLATT, ColorEnum.SCHELLE];
    }

    export function isAKnownColor(color: ColorEnum): boolean {
        return includes(Colors.asArray(), color)
    }
}

export {ColorEnum, Colors};