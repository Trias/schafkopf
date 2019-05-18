import StrategyInterface from "../StrategyInterface";
import {filter, includes} from "lodash"
import {CallableColor, ColorWithTrump, PlainColor, plainColors} from "../../cards/Color";
import {GameMode, GameModeEnum} from "../../GameMode";
import {Round} from "../../Round";
import {Card} from "../../cards/Card";
import {canPlayCard} from "../../PlayableMoves";
import {playRandomCard} from "../rules/inplay/playRandomCard";
import {chooseBestCard} from "../helper";
import {allOfColor, highTrumps, sortByNaturalOrdering} from "../../cards/CardSet";
import {Player} from "../../Player";
import {
    determineCallColorCard,
    determineGoodTrumps,
    getAceTenColorCount,
    getColorAceCount,
    getFehlfarbenFreiCount,
    getLaufende,
    hasBlankAce,
    hasFehlFarbeFrei,
    hasLongColorWithAce,
    hasMinTwoFehlFarbenFrei,
    hasSneakyTensKingColor,
    hasTwoBlankAces,
    hasTwoSneakyTensKingColor
} from "./CardSetAnalyzer";

export default class SimpleStrategy implements StrategyInterface {
    private readonly player: Player;

    constructor(player: Player) {
        this.player = player;
    }

    chooseCardToPlay(round: Round, cardSet: readonly Card[], gameMode: GameMode): Card {
        let playableCards = filter(cardSet, card => {
            return canPlayCard(gameMode, cardSet, card, round)
        });

        if (!playableCards.length) {
            throw Error(`no playable card found! ${cardSet}`);
        }

        let bestCard = chooseBestCard(playRandomCard(playableCards));

        if (!bestCard) {
            throw Error('no best card found')
        } else {
            return bestCard;
        }
    }

    chooseGameToCall(cardSet: readonly Card[], previousGameMode: GameMode, playerIndex: number): [GameModeEnum?, PlainColor?] {
        if (previousGameMode.isCallGame()) {
            return [];
        }

        cardSet = sortByNaturalOrdering(cardSet);

        let soloPossible = this.determineSolo(cardSet);

        if (soloPossible) {
            return soloPossible;
        }

        let wenzPossible = this.determineWenz(cardSet);

        if (wenzPossible) {
            return wenzPossible;
        }

        let callGamePossible = this.determineCallGame(cardSet);

        if (callGamePossible) {
            return callGamePossible;
        }

        return [];
    }

    chooseToRaise(cardSet: readonly Card[]): boolean {
        return false;
    }

    private determineCallGame(cardSet: readonly Card[]): [GameModeEnum, CallableColor] | null {
        let testGameMode: GameMode = new GameMode(GameModeEnum.CALL_GAME, this.player, CallableColor.EICHEL);

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

    // rather conservative estimates from sauspiel.de
    private determineSolo(cardSet: ReadonlyArray<Card>): [GameModeEnum, PlainColor] | null {
        for (let color of plainColors) {
            let testGameMode: GameMode = new GameMode(GameModeEnum.SOLO, this.player, color);
            let trumpHandCards = allOfColor(cardSet, ColorWithTrump.TRUMP, testGameMode);
            let laufende = getLaufende(trumpHandCards, testGameMode);

            if (trumpHandCards.length > 7) {
                if (trumpHandCards[0][1] == "O") {
                    return [GameModeEnum.SOLO, color];
                }
            }

            if (trumpHandCards.length > 6) {
                if (trumpHandCards[0] == "EO"
                    && trumpHandCards[1][1] == "O"
                    && (trumpHandCards[2][1] == "O"
                        || trumpHandCards[3][1] == "U" && trumpHandCards[3][0] != "S"
                    )) {
                    return [GameModeEnum.SOLO, color];
                }
                if (trumpHandCards[0][1] == "O" && trumpHandCards[0][0] !== "S"
                    && (trumpHandCards[2][1] == "O" || trumpHandCards[3][1] == "U")
                    && includes(trumpHandCards, color + "A")
                    && includes(trumpHandCards, color + "X")
                    && hasBlankAce(cardSet, testGameMode)
                ) {
                    return [GameModeEnum.SOLO, color];
                }
            }

            if (trumpHandCards.length > 5) {
                if (laufende > 1 && trumpHandCards[4][1] == "U"
                    && trumpHandCards[1][1] == "O"
                    && (includes(trumpHandCards, color + "A")
                        || includes(trumpHandCards, color + "X"))
                    && hasBlankAce(cardSet, testGameMode)
                    && hasMinTwoFehlFarbenFrei(cardSet, testGameMode)
                ) {
                    return [GameModeEnum.SOLO, color];
                }
                if (laufende > 1 && trumpHandCards[4][1] == "U"
                    && trumpHandCards[1][1] == "O"
                    && (includes(trumpHandCards, color + "A")
                        || includes(trumpHandCards, color + "X"))
                    && hasBlankAce(cardSet, testGameMode)
                    && hasTwoBlankAces(cardSet, testGameMode)
                ) {
                    return [GameModeEnum.SOLO, color];
                }
            }

            if (trumpHandCards.length > 4) {
                if (laufende > 2
                    && includes(trumpHandCards, "EU" as Card)
                    && hasTwoBlankAces(cardSet, testGameMode)
                    && hasFehlFarbeFrei(cardSet, testGameMode)
                ) {
                    return [GameModeEnum.SOLO, color];
                }
            }
        }

        return null;
    }

    private determineWenz(cardSet: ReadonlyArray<Card>): [GameModeEnum] | null {
        let testGameMode: GameMode = new GameMode(GameModeEnum.WENZ, this.player);
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
}