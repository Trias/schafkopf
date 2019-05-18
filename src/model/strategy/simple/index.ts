import StrategyInterface from "../StrategyInterface";
import {filter, includes} from "lodash"
import {CallableColor, callableColors, ColorWithTrump, PlainColor, plainColors} from "../../cards/Color";
import {GameMode, GameModeEnum} from "../../GameMode";
import {Round} from "../../Round";
import {Card} from "../../cards/Card";
import {canPlayCard} from "../../PlayableMoves";
import {playRandomCard} from "../rules/inplay/playRandomCard";
import {chooseBestCard} from "../helper";
import {allOfColor, getCallableColors, getCardsByColor, highTrumps, sortByNaturalOrdering} from "../../cards/CardSet";
import {Player} from "../../Player";
import {CardToWeights} from "../rules/CardToWeights";

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

    private declareGame(bestCallColorCard: Card | null, cardSet: readonly Card[], highTrumps: Card[]): [GameModeEnum?, CallableColor?] {
        if (bestCallColorCard) {
            return [GameModeEnum.CALL_GAME, bestCallColorCard[0] as CallableColor];
        } else {
            return [];
            // throw Error(`improbable decision made! cards: ${cardSet}, highTrumps: cards: ${highTrumps}`)
        }
    }

    private determineCallColorCard(cardSet: ReadonlyArray<Card>, newGameMode: GameMode) {
        let callableColors = getCallableColors(cardSet, newGameMode);
        let cardsByColor = getCardsByColor(cardSet, newGameMode);
        let cardWeights: CardToWeights = {};

        for (let color of callableColors) {
            if (cardsByColor[color].length == 1) {
                let card = cardsByColor[color][0];
                cardWeights[card] = 1;
            } else if (cardsByColor[color].length == 2) {
                let card = cardsByColor[color][0];
                cardWeights[card] = 0.5;
            } else if (cardsByColor[color].length > 2) {
                let card = cardsByColor[color][0];
                cardWeights[card] = 0.25;
            }
        }

        for (let [card, weight] of Object.entries(cardWeights)) {
            if (card[1] == "X" && cardsByColor[card[0] as CallableColor].length === 1) {
                cardWeights[card as Card] = weight! + 0.1;
            }
            if (card[1] == "K" && cardsByColor[card[0] as CallableColor].length === 1) {
                cardWeights[card as Card] = weight! + 0.05;
            }
        }

        return chooseBestCard(cardWeights);
    }

    private hasFehlFarbeFrei(cardSet: ReadonlyArray<Card>, gameMode: GameMode) {
        let cardsByColor = getCardsByColor(cardSet, gameMode);
        for (let color of callableColors) {
            if (cardsByColor[color].length == 0) {
                return true;
            }
        }

        return false;
    }

    private hasMinTwoFehlFarbenFrei(cardSet: ReadonlyArray<Card>, gameMode: GameMode) {
        return this.getFehlfarbenFreiCount(cardSet, gameMode) > 1;
    }

    private getFehlfarbenFreiCount(cardSet: ReadonlyArray<Card>, gameMode: GameMode) {
        let fehlfarbenCount = 0;
        let cardsByColor = getCardsByColor(cardSet, gameMode);
        for (let color of plainColors) {
            if (color == gameMode.getColorOfTheGame()) {
                continue;
            }
            if (cardsByColor[color].length == 0) {
                fehlfarbenCount = fehlfarbenCount + 1;
            }
        }

        return fehlfarbenCount
    }

    private hasBlankAce(cardSet: ReadonlyArray<Card>, gameMode: GameMode) {
        let cardsByColor = getCardsByColor(cardSet, gameMode);
        for (let color of callableColors) {
            if (cardsByColor[color].length == 1 && cardsByColor[color][0][0] == "A") {
                return true;
            }
        }

        return false;
    }

    private hasTwoBlankAces(cardSet: ReadonlyArray<Card>, gameMode: GameMode) {
        let blankAcesCount = 0;
        let cardsByColor = getCardsByColor(cardSet, gameMode);
        for (let color of callableColors) {
            if (cardsByColor[color].length == 1 && cardsByColor[color][0][0] == "A") {
                blankAcesCount = blankAcesCount + 1;
            }
        }

        if (blankAcesCount == 2) {
            return true;
        }
        return false;
    }

    private determineGoodTrumps(highTrumpHandCards: Card[]) {
        if (highTrumpHandCards.length > 2
            // 3 ober: ok
            && (highTrumpHandCards[2][1] == "O"
                // 2 ober, mindestens herz: ok
                || highTrumpHandCards[1][1] == "O" && highTrumpHandCards[1][0] !== "S"
                // 1 oder 2 ober, aber gute unter: ok
                || highTrumpHandCards[0][1] == "O" && highTrumpHandCards[0][0] != "S"
                && highTrumpHandCards[2][1] == "U" && highTrumpHandCards[2][0] !== "S" && highTrumpHandCards[2][0] !== "H"
            )) {
            return true;
        }
        return false;
    }

    private determineCallGame(cardSet: readonly Card[]) {
        let testGameMode: GameMode = new GameMode(GameModeEnum.CALL_GAME, this.player, CallableColor.EICHEL);

        let trumpHandCards = allOfColor(sortByNaturalOrdering(cardSet), ColorWithTrump.TRUMP, testGameMode);
        let highTrumpHandCards = highTrumps(trumpHandCards, testGameMode);

        if (trumpHandCards.length > 5 && highTrumpHandCards.length > 1 && highTrumpHandCards[0][1] == "O") {
            let bestCallColorCard = this.determineCallColorCard(cardSet, testGameMode);

            return this.declareGame(bestCallColorCard, cardSet, trumpHandCards);
        }
        if (trumpHandCards.length > 4 && highTrumpHandCards.length > 1 && highTrumpHandCards[0][1] == "O") {
            let bestCallColorCard = this.determineCallColorCard(cardSet, testGameMode);

            if (this.hasFehlFarbeFrei(cardSet, testGameMode) || this.hasBlankAce(cardSet, testGameMode)) {
                return this.declareGame(bestCallColorCard, cardSet, trumpHandCards);
            }
        }

        if (trumpHandCards.length > 3 && highTrumpHandCards.length > 2 && this.determineGoodTrumps(highTrumpHandCards)) {
            let bestCallColorCard = this.determineCallColorCard(cardSet, testGameMode);

            if (this.hasFehlFarbeFrei(cardSet, testGameMode) && this.hasBlankAce(cardSet, testGameMode)) {
                return this.declareGame(bestCallColorCard, cardSet, trumpHandCards);
            }

            if (this.hasTwoBlankAces(cardSet, testGameMode)) {
                return this.declareGame(bestCallColorCard, cardSet, trumpHandCards);
            }
        }

        return null;
    }

    private getLaufende(trumpHandCards: Card[], gameMode: GameMode): number {
        let laufende = 0;
        let trumpOrdering = gameMode.getOrdering().getTrumpOrdering();
        for (laufende; laufende < trumpOrdering.length; laufende++) {
            if (trumpHandCards[laufende] !== trumpOrdering[laufende]) {
                break;
            }
        }
        return laufende;
    }

    // rather conservative estimates from sauspiel.de
    private determineSolo(cardSet: ReadonlyArray<Card>): [GameModeEnum, PlainColor] | null {
        for (let color of plainColors) {
            let testGameMode: GameMode = new GameMode(GameModeEnum.SOLO, this.player, color);
            let trumpHandCards = allOfColor(cardSet, ColorWithTrump.TRUMP, testGameMode);
            let laufende = this.getLaufende(trumpHandCards, testGameMode);

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
                    && this.hasBlankAce(cardSet, testGameMode)
                ) {
                    return [GameModeEnum.SOLO, color];
                }
            }

            if (trumpHandCards.length > 5) {
                if (laufende > 1 && trumpHandCards[4][1] == "U"
                    && trumpHandCards[1][1] == "O"
                    && (includes(trumpHandCards, color + "A")
                        || includes(trumpHandCards, color + "X"))
                    && this.hasBlankAce(cardSet, testGameMode)
                    && this.hasMinTwoFehlFarbenFrei(cardSet, testGameMode)
                ) {
                    return [GameModeEnum.SOLO, color];
                }
                if (laufende > 1 && trumpHandCards[4][1] == "U"
                    && trumpHandCards[1][1] == "O"
                    && (includes(trumpHandCards, color + "A")
                        || includes(trumpHandCards, color + "X"))
                    && this.hasBlankAce(cardSet, testGameMode)
                    && this.hasTwoBlankAces(cardSet, testGameMode)
                ) {
                    return [GameModeEnum.SOLO, color];
                }
            }

            if (trumpHandCards.length > 4) {
                if (laufende > 2
                    && includes(trumpHandCards, "EU" as Card)
                    && this.hasTwoBlankAces(cardSet, testGameMode)
                    && this.hasFehlFarbeFrei(cardSet, testGameMode)
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
            if (this.getFehlfarbenFreiCount(cardSet, testGameMode) == 3) {
                return [GameModeEnum.WENZ]
            }

            if (this.getFehlfarbenFreiCount(cardSet, testGameMode) == 2
                && this.hasLongColorWithAce(cardSet, testGameMode)
            ) {
                return [GameModeEnum.WENZ]
            }

            if (this.getFehlfarbenFreiCount(cardSet, testGameMode) == 2
                && this.hasTwoSneakyTensKingColor(cardSet, testGameMode)
            ) {
                return [GameModeEnum.WENZ]
            }

            if (this.getFehlfarbenFreiCount(cardSet, testGameMode) == 2
                && this.hasBlankAce(cardSet, testGameMode)
                && this.hasFehlFarbeFrei(cardSet, testGameMode)
                && this.hasSneakyTensKingColor(cardSet, testGameMode)
            ) {
                return [GameModeEnum.WENZ]
            }
        }

        if (trumpHandCards.length > 2) {
            if (this.getFehlfarbenFreiCount(cardSet, testGameMode) == 3) {
                return [GameModeEnum.WENZ];
            }
            if (this.getFehlfarbenFreiCount(cardSet, testGameMode) == 2
                && this.hasLongColorWithAce(cardSet, testGameMode)
                && this.hasSneakyTensKingColor(cardSet, testGameMode)
            ) {
                return [GameModeEnum.WENZ];
            }
            if (this.getFehlfarbenFreiCount(cardSet, testGameMode) == 1
                && this.hasBlankAce(cardSet, testGameMode)
                && this.hasLongColorWithAce(cardSet, testGameMode)
            ) {
                return [GameModeEnum.WENZ];
            }
        }

        if (trumpHandCards.length > 1) {
            if (this.getFehlfarbenFreiCount(cardSet, testGameMode) == 3) {
                return [GameModeEnum.WENZ];
            }
            if (this.getFehlfarbenFreiCount(cardSet, testGameMode) == 2
                && this.getLaufende(trumpHandCards, testGameMode) > 1
                && this.getAceTenColorCount(cardSet, testGameMode) > 1
            ) {
                return [GameModeEnum.WENZ];
            }
            if (this.getFehlfarbenFreiCount(cardSet, testGameMode) == 1
                && this.getLaufende(trumpHandCards, testGameMode) > 0
                && this.getColorAceCount(cardSet, testGameMode) > 2
                && this.getColorAceCount(cardSet, testGameMode) > 1
            ) {
                return [GameModeEnum.WENZ];
            }
        }

        if (trumpHandCards.length > 0) {
            if (this.getLaufende(trumpHandCards, testGameMode) > 0
                && this.getAceTenColorCount(cardSet, testGameMode) > 1
                && this.getColorAceCount(cardSet, testGameMode) > 2
            ) {
                return [GameModeEnum.WENZ];
            }

            if (this.getAceTenColorCount(cardSet, testGameMode) > 1
                && this.getColorAceCount(cardSet, testGameMode) > 3
            ) {
                return [GameModeEnum.WENZ];
            }
        }

        if (this.getAceTenColorCount(cardSet, testGameMode) > 2
            && this.getColorAceCount(cardSet, testGameMode) > 3
        ) {
            return [GameModeEnum.WENZ];
        }

        return null;
    }

    private hasSneakyTensKingColor(cardSet: ReadonlyArray<Card>, testGameMode: GameMode) {
        let cardsByColor = getCardsByColor(cardSet, testGameMode);
        for (let color of plainColors) {
            if (includes(cardsByColor[color], color + "X")
                && includes(cardsByColor[color], color + "K")) {
                return true;
            }
        }

        return false;
    }

    private hasTwoSneakyTensKingColor(cardSet: ReadonlyArray<Card>, testGameMode: GameMode) {
        let cardsByColor = getCardsByColor(cardSet, testGameMode);
        let count = 0;
        for (let color of plainColors) {
            if (includes(cardsByColor[color], color + "X")
                && includes(cardsByColor[color], color + "K")) {
                count = count + 1;
            }
        }

        return count == 1;
    }

    private hasLongColorWithAce(cardSet: ReadonlyArray<Card>, testGameMode: GameMode) {
        return this.getLongColorWithAceCount(cardSet, testGameMode) > 0;
    }

    private getLongColorWithAceCount(cardSet: ReadonlyArray<Card>, testGameMode: GameMode) {
        let count = 0;
        let cardsByColor = getCardsByColor(cardSet, testGameMode);
        for (let color of plainColors) {
            if (includes(cardsByColor[color], color + "A")
                && cardsByColor[color].length > 2) {
                count = count + 1;
            }
        }

        return count;
    }

    private getAceTenColorCount(cardSet: ReadonlyArray<Card>, testGameMode: GameMode) {
        let count = 0;
        let cardsByColor = getCardsByColor(cardSet, testGameMode);
        for (let color of plainColors) {
            if (includes(cardsByColor[color], color + "A")
                && includes(cardsByColor[color], color + "X")) {
                count = count + 1;
            }
        }

        return count;
    }

    private getColorAceCount(cardSet: ReadonlyArray<Card>, testGameMode: GameMode) {
        let count = 0;
        let cardsByColor = getCardsByColor(cardSet, testGameMode);
        for (let color of plainColors) {
            if (color == testGameMode.getColorOfTheGame()) {
                continue;
            }
            if (includes(cardsByColor[color], color + "A")) {
                count = count + 1;
            }
        }

        return count;

    }
}