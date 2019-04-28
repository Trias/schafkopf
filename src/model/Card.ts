import {ColorEnum} from "./ColorEnum";
import CardFaceEnum from "./CardFaceEnum";
import {includes} from "lodash";
import {GameMode} from "./GameMode";

enum CardEnum {
    EO = "EO", BO = "BO", HO = "HO", SO = "SO",
    EU = "EU", BU = "BU", HU = "HU", SU = "SU",
    HA = "HA", HX = "HX", HK = "HK", H9 = "H9", H8 = "H8", H7 = "H7",
    EA = "EA", EX = "EX", EK = "EK", E9 = "E9", E8 = "E8", E7 = "E7",
    BA = "BA", BX = "BX", BK = "BK", B9 = "B9", B8 = "B8", B7 = "B7",
    SA = "SA", SX = "SX", SK = "SK", S9 = "S9", S8 = "S8", S7 = "S7"
}

namespace Card {
    export function isOfColor(card: CardEnum, color: ColorEnum, gameMode: GameMode) {
        return color === Card.getColor(card, gameMode);
    }

    export function getColor(card: CardEnum, gameMode: GameMode): ColorEnum {
        if (includes(gameMode.getTrumpOrdering(), card)) {
            return ColorEnum.TRUMP;
        }
        return card[0] as ColorEnum;
    }

    export function getFace(card: CardEnum): CardFaceEnum{
        return card[1] as CardFaceEnum;
    }

    export function getColorIgnoringTrump(card: CardEnum) {
        return card[0] as ColorEnum;
    }
}

export {Card, CardEnum}