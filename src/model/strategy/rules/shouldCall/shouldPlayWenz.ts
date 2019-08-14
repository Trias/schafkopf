import {Card} from "../../../cards/Card";
import {GameMode, GameModeEnum} from "../../../GameMode";
import {allOfColor} from "../../../cards/CardSet";
import {ColorWithTrump, PlainColor} from "../../../cards/Color";
import {
    getAceTenColorCount,
    getColorAceCount,
    getFehlfarbenFreiCount,
    getLaufende,
    hasBlankAce,
    hasFehlFarbeFrei,
    hasLongColorWithAce,
    hasSneakyTensKingColor,
    hasTwoSneakyTensKingColor
} from "./CardSetAnalyzer";
import {Player} from "../../../Player";

export function shouldPlayWenz(cardSet: ReadonlyArray<Card>, report: (reasons: string[], gameMode: GameModeEnum, color: PlainColor) => void): [GameModeEnum] | null {
    let testPlayer = new Player();
    let testGameMode: GameMode = new GameMode(GameModeEnum.WENZ, testPlayer.getName());
    let trumpHandCards = allOfColor(cardSet, ColorWithTrump.TRUMP, testGameMode);

    if (trumpHandCards.length > 3) {
        if (getFehlfarbenFreiCount(cardSet, testGameMode) == 3) {
            return [GameModeEnum.WENZ]
        }

        if (getFehlfarbenFreiCount(cardSet, testGameMode) == 2
            && hasLongColorWithAce(cardSet, testGameMode)
        ) {
            return [GameModeEnum.WENZ]
        }

        if (getFehlfarbenFreiCount(cardSet, testGameMode) == 2
            && hasTwoSneakyTensKingColor(cardSet, testGameMode)
        ) {
            return [GameModeEnum.WENZ]
        }

        if (getFehlfarbenFreiCount(cardSet, testGameMode) == 2
            && hasBlankAce(cardSet, testGameMode)
            && hasFehlFarbeFrei(cardSet, testGameMode)
            && hasSneakyTensKingColor(cardSet, testGameMode)
        ) {
            return [GameModeEnum.WENZ]
        }
    }

    if (trumpHandCards.length > 2) {
        if (getFehlfarbenFreiCount(cardSet, testGameMode) == 3) {
            return [GameModeEnum.WENZ];
        }
        if (getFehlfarbenFreiCount(cardSet, testGameMode) == 2
            && hasLongColorWithAce(cardSet, testGameMode)
            && hasSneakyTensKingColor(cardSet, testGameMode)
        ) {
            return [GameModeEnum.WENZ];
        }
        if (getFehlfarbenFreiCount(cardSet, testGameMode) == 1
            && hasBlankAce(cardSet, testGameMode)
            && hasLongColorWithAce(cardSet, testGameMode)
        ) {
            return [GameModeEnum.WENZ];
        }
    }

    if (trumpHandCards.length > 1) {
        if (getFehlfarbenFreiCount(cardSet, testGameMode) == 3) {
            return [GameModeEnum.WENZ];
        }
        if (getFehlfarbenFreiCount(cardSet, testGameMode) == 2
            && getLaufende(trumpHandCards, testGameMode) > 1
            && getAceTenColorCount(cardSet, testGameMode) > 1
        ) {
            return [GameModeEnum.WENZ];
        }
        if (getFehlfarbenFreiCount(cardSet, testGameMode) == 1
            && getLaufende(trumpHandCards, testGameMode) > 0
            && getColorAceCount(cardSet, testGameMode) > 2
            && getColorAceCount(cardSet, testGameMode) > 1
        ) {
            return [GameModeEnum.WENZ];
        }
    }

    if (trumpHandCards.length > 0) {
        if (getLaufende(trumpHandCards, testGameMode) > 0
            && getAceTenColorCount(cardSet, testGameMode) > 1
            && getColorAceCount(cardSet, testGameMode) > 2
        ) {
            return [GameModeEnum.WENZ];
        }

        if (getAceTenColorCount(cardSet, testGameMode) > 1
            && getColorAceCount(cardSet, testGameMode) > 3
        ) {
            return [GameModeEnum.WENZ];
        }
    }

    if (getAceTenColorCount(cardSet, testGameMode) > 2
        && getColorAceCount(cardSet, testGameMode) > 3
    ) {
        return [GameModeEnum.WENZ];
    }

    return null;
}