import {Card} from "../../../cards/Card";
import {GameMode, GameModeEnum} from "../../../GameMode";
import {CallableColor, ColorWithTrump} from "../../../cards/Color";
import {allOfColor, highTrumps, sortByNaturalOrdering} from "../../../cards/CardSet";
import {
    determineCallColorCard,
    determineGoodTrumps,
    hasBlankAce,
    hasFehlFarbeFrei,
    hasTwoBlankAces
} from "./CardSetAnalyzer";
import {Player} from "../../../Player";
import RandomStrategy from "../../random";

export function shouldPlayCallGame(cardSet: readonly Card[]): [GameModeEnum, CallableColor] | null {

    let testGameMode: GameMode = new GameMode(GameModeEnum.CALL_GAME, new Player("test", RandomStrategy), CallableColor.EICHEL);

    let trumpHandCards = allOfColor(sortByNaturalOrdering(cardSet), ColorWithTrump.TRUMP, testGameMode);
    let highTrumpHandCards = highTrumps(trumpHandCards, testGameMode);
    let bestCallColorCard = determineCallColorCard(cardSet, testGameMode);

    if (!bestCallColorCard) {
        // no callable color
        return null;
    }

    if (trumpHandCards.length > 5 && highTrumpHandCards.length > 1 && highTrumpHandCards[0][1] == "O") {
        return [GameModeEnum.CALL_GAME, bestCallColorCard[0] as CallableColor];
    }
    if (trumpHandCards.length > 4 && highTrumpHandCards.length > 1 && highTrumpHandCards[0][1] == "O") {
        if (hasFehlFarbeFrei(cardSet, testGameMode) || hasBlankAce(cardSet, testGameMode)) {
            return [GameModeEnum.CALL_GAME, bestCallColorCard[0] as CallableColor];
        }
    }

    if (trumpHandCards.length > 3 && highTrumpHandCards.length > 2 && determineGoodTrumps(highTrumpHandCards)) {
        if (hasFehlFarbeFrei(cardSet, testGameMode) && hasBlankAce(cardSet, testGameMode)) {
            return [GameModeEnum.CALL_GAME, bestCallColorCard[0] as CallableColor];
        }

        if (hasTwoBlankAces(cardSet, testGameMode)) {
            return [GameModeEnum.CALL_GAME, bestCallColorCard[0] as CallableColor];
        }
    }

    return null;
}