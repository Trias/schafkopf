import {ColorEnum} from "../ColorEnum";
import {CardEnum} from "../Card";

function inColor(color: ColorEnum): CardEnum[]{
    return [
        color + "A" as CardEnum,
        color + "X" as CardEnum,
        color + "K" as CardEnum,
        color + "9" as CardEnum,
        color + "8" as CardEnum,
        color + "7" as CardEnum
    ];
}

type ColorsType = {
    [index in ColorEnum]: CardEnum[];
}

let Colors = {
    [ColorEnum.EICHEL]: inColor(ColorEnum.EICHEL),
    [ColorEnum.BLATT]: inColor(ColorEnum.BLATT),
    [ColorEnum.SCHELLE]: inColor(ColorEnum.SCHELLE),
    [ColorEnum.HERZ]: inColor(ColorEnum.HERZ),
} as ColorsType;

export {Colors};