import {Card} from "../../../cards/Card";
import {GameMode, GameModeEnum} from "../../../GameMode";
import {CallableColor, ColorWithTrump, PlainColor} from "../../../cards/Color";
import {allOfColor, getCallableColors, getHighTrumps, sortByNaturalOrdering} from "../../../cards/CardSet";
import {
    determineCallColorCard,
    determineGoodTrumps,
    hasBlankAce,
    hasFehlFarbeFrei,
    hasTwoBlankAces
} from "./CardSetAnalyzer";

export function shouldPlayCallGame(cardSet: Card[], report: (reasons: string[], gameMode: GameModeEnum, color: PlainColor) => void): [GameModeEnum, CallableColor] | null {
    let callableColors = getCallableColors(cardSet);
    if (callableColors.length == 0) {
        return null;
    }

    let testGameMode: GameMode = new GameMode(GameModeEnum.CALL_GAME, "test", CallableColor.EICHEL);

    let trumpHandCards = allOfColor(sortByNaturalOrdering(cardSet), ColorWithTrump.TRUMP, testGameMode);
    let highTrumpHandCards = getHighTrumps(trumpHandCards, testGameMode);
    let bestCallColorCard = determineCallColorCard(cardSet, testGameMode);

    if (!bestCallColorCard) {
        // no callable color
        return null;
    }

    if (trumpHandCards.length > 5 && highTrumpHandCards.length > 1 && highTrumpHandCards[0][1] == "O") {
        report && report(['more than 5 trump cards', 'more than 1 high trump', 'at least one ober'], GameModeEnum.CALL_GAME, bestCallColorCard[0] as PlainColor);
        return [GameModeEnum.CALL_GAME, bestCallColorCard[0] as CallableColor];
    }
    if (trumpHandCards.length > 4 && highTrumpHandCards.length > 1 && highTrumpHandCards[0][1] == "O" && (hasFehlFarbeFrei(cardSet, testGameMode) || hasBlankAce(cardSet, testGameMode))) {
        if (report) {
            if (hasFehlFarbeFrei(cardSet, testGameMode)) {
                report(['more than 4 trump cards', 'more than 1 high trump', 'at least one ober', 'fehlfarbe frei'], GameModeEnum.CALL_GAME, bestCallColorCard[0] as PlainColor);
            } else if (hasBlankAce(cardSet, testGameMode)) {
                report(['more than 4 trump cards', 'more than 1 high trump', 'at least one ober', 'blank ace'], GameModeEnum.CALL_GAME, bestCallColorCard[0] as PlainColor);
            }
        }
        return [GameModeEnum.CALL_GAME, bestCallColorCard[0] as CallableColor];
    }

    if (trumpHandCards.length > 3 && highTrumpHandCards.length > 2 && determineGoodTrumps(highTrumpHandCards)) {
        if (hasFehlFarbeFrei(cardSet, testGameMode) && hasBlankAce(cardSet, testGameMode)) {
            report(['more than 3 trump cards', 'more than 2 high trump', 'good trumps', 'fehlfarbe frei and blank ace'], GameModeEnum.CALL_GAME, bestCallColorCard[0] as PlainColor);

            return [GameModeEnum.CALL_GAME, bestCallColorCard[0] as CallableColor];
        }

        if (hasTwoBlankAces(cardSet, testGameMode)) {
            report(['more than 3 trump cards', 'more than 2 high trump', 'good trumps', 'two blank aces'], GameModeEnum.CALL_GAME, bestCallColorCard[0] as PlainColor);

            return [GameModeEnum.CALL_GAME, bestCallColorCard[0] as CallableColor];
        }
    }

    return null;
}