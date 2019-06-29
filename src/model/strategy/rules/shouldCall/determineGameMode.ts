import {sortByNaturalOrdering} from "../../../cards/CardSet";
import {shouldPlaySolo} from "./shouldPlaySolo";
import {shouldPlayWenz} from "./shouldPlayWenz";
import {shouldPlayCallGame} from "./shouldPlayCallGame";
import {Card} from "../../../cards/Card";
import {GameMode, GameModeEnum} from "../../../GameMode";
import {PlainColor} from "../../../cards/Color";
import {includes} from "lodash";

export function determineGameMode(previousGameMode: GameMode, cardSet: Card[], allowedGameModes: GameModeEnum[]): [GameModeEnum?, PlainColor?] {
    if (previousGameMode.isSolo()) {
        return [];
    }

    cardSet = sortByNaturalOrdering(cardSet);

    if (includes(allowedGameModes, GameModeEnum.SOLO)) {
        let soloPossible = shouldPlaySolo(cardSet);

        if (soloPossible) {
            return soloPossible;
        }
    }

    if (includes(allowedGameModes, GameModeEnum.WENZ)) {
        if (previousGameMode.isWenz()) {
            return [];
        }

        let wenzPossible = shouldPlayWenz(cardSet);

        if (wenzPossible) {
            return wenzPossible;
        }
    }

    if (includes(allowedGameModes, GameModeEnum.CALL_GAME)) {
        if (previousGameMode.isCallGame()) {
            return [];
        }

        let callGamePossible = shouldPlayCallGame(cardSet);

        if (callGamePossible) {
            return callGamePossible;
        }
    }

    return [];
}