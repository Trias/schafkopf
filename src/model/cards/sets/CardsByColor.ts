import {PlainColor} from "../Color";
import {Card} from "../Card";

function inColor(color: PlainColor): Card[] {
    return [
        color + "A" as Card,
        color + "X" as Card,
        color + "K" as Card,
        color + "9" as Card,
        color + "8" as Card,
        color + "7" as Card
    ];
}

type ColorsType = {
    [index in PlainColor]: Card[];
}

let CardsByColor: ColorsType = {
    [PlainColor.EICHEL]: inColor(PlainColor.EICHEL),
    [PlainColor.GRAS]: inColor(PlainColor.GRAS),
    [PlainColor.SCHELLE]: inColor(PlainColor.SCHELLE),
    [PlainColor.HERZ]: inColor(PlainColor.HERZ),
};

export {CardsByColor};