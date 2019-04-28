import {ColorEnum} from "./ColorEnum";
import CardFaceEnum from "./CardFaceEnum";
import TrumpOrderingCallGame from "./orderings/TrumpOrderingCallGame";
import {includes} from "lodash";

enum CardEnum {
    EO = "EO", BO = "BO", HO = "HO", SO = "SO",
    EU = "EU", BU = "BU", HU = "HU", SU = "SU",
    HA = "HA", HX = "HX", HK = "HK", H9 = "H9", H8 = "H8", H7 = "H7",
    EA = "EA", EX = "EX", EK = "EK", E9 = "E9", E8 = "E8", E7 = "E7",
    BA = "BA", BX = "BX", BK = "BK", B9 = "B9", B8 = "B8", B7 = "B7",
    SA = "SA", SX = "SX", SK = "SK", S9 = "S9", S8 = "S8", S7 = "S7"
}

namespace Card {
    export function isOfColor(card: CardEnum, color: ColorEnum){
        return color === Card.getColor(card);
    }

    export function getColor(card: CardEnum): ColorEnum{
        if (includes(TrumpOrderingCallGame, card)) {
            return ColorEnum.TRUMP;
        }
        return card[0] as ColorEnum;
    }

    export function getFace(card: CardEnum): CardFaceEnum{
        return card[1] as CardFaceEnum;
    }
}

export {Card, CardEnum}