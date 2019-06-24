import {sortByNaturalOrdering} from "../../../cards/CardSet";
import {shouldPlaySolo} from "./shouldPlaySolo";
import {shouldPlayWenz} from "./shouldPlayWenz";
import {shouldPlayCallGame} from "./shouldPlayCallGame";
import {Card} from "../../../cards/Card";
import {GameMode, GameModeEnum} from "../../../GameMode";
import {PlainColor} from "../../../cards/Color";

export function determineGameMode(previousGameMode: GameMode, cardSet: Card[]): [GameModeEnum?, PlainColor?] {
    if (previousGameMode.isSolo()) {
        return [];
    }

    cardSet = sortByNaturalOrdering(cardSet);

    let soloPossible = shouldPlaySolo(cardSet);

    if (soloPossible) {
        return soloPossible;
    }

    if (previousGameMode.isWenz()) {
        return [];
    }

    let wenzPossible = shouldPlayWenz(cardSet);

    if (wenzPossible) {
        return wenzPossible;
    }

    if (previousGameMode.isCallGame()) {
        return [];
    }

    let callGamePossible = shouldPlayCallGame(cardSet);

    if (callGamePossible) {
        return callGamePossible;
    }

    return [];
}