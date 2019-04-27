import {ColorEnum} from "../ColorEnum";
import {CardEnum} from "../Card";
import CardFaceEnum from "../CardFaceEnum";

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

interface ColorsType {
    [ColorEnum.EICHEL]: CardEnum[],
    [ColorEnum.BLATT]: CardEnum[],
    [ColorEnum.SCHELLE]: CardEnum[],
}

let Faces = [
    "A", "X", "K", "9", "8", "7"
] as CardFaceEnum[];

let Colors = {
    [ColorEnum.EICHEL]: inColor(ColorEnum.EICHEL),
    [ColorEnum.BLATT]: inColor(ColorEnum.BLATT),
    [ColorEnum.SCHELLE]: inColor(ColorEnum.SCHELLE),
} as ColorsType;

export {Colors, Faces};