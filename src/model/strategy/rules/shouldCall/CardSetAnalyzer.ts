import {Card} from "../../../cards/Card";
import {GameMode} from "../../../GameMode";
import {CallableColor, callableColors, plainColors} from "../../../cards/Color";
import {getCallableColors, getCardsByColor} from "../../../cards/CardSet";
import {CardToWeights} from "../CardToWeights";
import {chooseBestCard} from "../../chooseBestCard";
import {includes} from "lodash";

export function determineCallColorCard(cardSet: ReadonlyArray<Card>, newGameMode: GameMode) {
    let callableColors = getCallableColors(cardSet);
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


export function hasFehlFarbeFrei(cardSet: ReadonlyArray<Card>, gameMode: GameMode) {
    let cardsByColor = getCardsByColor(cardSet, gameMode);
    for (let color of callableColors) {
        if (cardsByColor[color].length == 0) {
            return true;
        }
    }

    return false;
}


export function hasMinTwoFehlFarbenFrei(cardSet: ReadonlyArray<Card>, gameMode: GameMode) {
    return getFehlfarbenFreiCount(cardSet, gameMode) > 1;
}


export function getFehlfarbenFreiCount(cardSet: ReadonlyArray<Card>, gameMode: GameMode) {
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

export function hasBlankAce(cardSet: ReadonlyArray<Card>, gameMode: GameMode) {
    let cardsByColor = getCardsByColor(cardSet, gameMode);
    for (let color of callableColors) {
        if (cardsByColor[color].length == 1 && cardsByColor[color][0][1] == "A") {
            return true;
        }
    }

    return false;
}

export function hasTwoBlankAces(cardSet: ReadonlyArray<Card>, gameMode: GameMode) {
    let blankAcesCount = 0;
    let cardsByColor = getCardsByColor(cardSet, gameMode);
    for (let color of callableColors) {
        if (cardsByColor[color].length == 1 && cardsByColor[color][0][1] == "A") {
            blankAcesCount = blankAcesCount + 1;
        }
    }

    if (blankAcesCount == 2) {
        return true;
    }
    return false;
}

export function determineGoodTrumps(highTrumpHandCards: Card[]) {
    if (highTrumpHandCards.length > 2
        // 3 ober: ok
        && (highTrumpHandCards[2][1] == "O"
            // 2 ober, mindestens gras: ok
            || highTrumpHandCards[1][1] == "O" && highTrumpHandCards[1][0] !== "S"
            // 1 oder 2 ober, aber gute unter: ok
            || highTrumpHandCards[0][1] == "O" && highTrumpHandCards[0][0] != "S"
            && highTrumpHandCards[2][1] == "U" && highTrumpHandCards[2][0] !== "S" && highTrumpHandCards[2][0] !== "H"
        )) {
        return true;
    }
    return false;
}


export function hasSneakyTensKingColor(cardSet: ReadonlyArray<Card>, testGameMode: GameMode) {
    let cardsByColor = getCardsByColor(cardSet, testGameMode);
    for (let color of plainColors) {
        if (includes(cardsByColor[color], color + "X")
            && includes(cardsByColor[color], color + "K")) {
            return true;
        }
    }

    return false;
}

export function hasTwoSneakyTensKingColor(cardSet: ReadonlyArray<Card>, testGameMode: GameMode) {
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

export function hasLongColorWithAce(cardSet: ReadonlyArray<Card>, testGameMode: GameMode) {
    return getLongColorWithAceCount(cardSet, testGameMode) > 0;
}

export function getLongColorWithAceCount(cardSet: ReadonlyArray<Card>, testGameMode: GameMode) {
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

export function getAceTenColorCount(cardSet: ReadonlyArray<Card>, testGameMode: GameMode) {
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

export function getColorAceCount(cardSet: ReadonlyArray<Card>, testGameMode: GameMode) {
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

export function getLaufende(trumpHandCards: Card[], gameMode: GameMode): number {
    let laufende = 0;
    let trumpOrdering = gameMode.getOrdering().getTrumpOrdering();
    for (laufende; laufende < trumpOrdering.length; laufende++) {
        if (trumpHandCards[laufende] !== trumpOrdering[laufende]) {
            break;
        }
    }
    return laufende;
}