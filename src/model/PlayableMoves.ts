/**
 *
 * rules of schafkopf.. determine what moves you are allowed to play
 *
 */

import {CallableColor} from "./cards/Color";
import {GameMode} from "./GameMode";
import {Card} from "./cards/Card";
import CardRank from "./cards/CardRank";
import {allOfColor, hasCard, hasColor, hasPlainColorWithoutOberAndUnter} from "./cards/CardSet";
import {Round} from "./Round";
import {filter} from "lodash";
import {RoundAnalyzer} from "./knowledge/RoundAnalyzer";

export function canCallColor(cardsOnHand: readonly Card[], color: CallableColor) {
    let callAce: Card = color + CardRank.ACE as Card;
    return !hasCard(cardsOnHand, callAce) && hasPlainColorWithoutOberAndUnter(cardsOnHand, color);
}

export function getPlayableCards(cardSet: ReadonlyArray<Card>, gameMode: GameMode, round: Round) {
    return filter(cardSet, card => {
        return canPlayCard(gameMode, cardSet, card, round)
    });
}

export function canPlayCard(gameMode: GameMode, cardsOnHand: readonly Card[], card: Card, round: Round): boolean {
    if (cardsOnHand.length === 1) {
        return true;
    }
    if (round.isEmpty()) {
        if (gameMode.isCallGame() && isCalledColorButNotAce(gameMode, cardsOnHand, card) && !gameMode.getHasAceBeenCalled()) {
            // man darf davon laufen wenn man 4 von der ruffarbe hat...
            if (allOfColor(cardsOnHand, gameMode.getColorOfTheGame()!, gameMode).length > 3) {
                return true;
            } else {
                return false;
            }
        } else {
            return true;
        }
    } else {
        let roundAnalyzer = new RoundAnalyzer(round, gameMode);
        let roundColor = roundAnalyzer.getRoundColor();

        // man darf die rufsau nicht schmieren..
        if (gameMode.isCallGame()
            && card == getCalledAce(gameMode)
            && roundColor !== gameMode.getColorOfTheGame()
            && !gameMode.getHasAceBeenCalled()) {
            return false;
        }

        // man muss die rufsau spielen wenn ruffarbe angespielt
        if (gameMode.isCallGame()
            && roundColor === gameMode.getColorOfTheGame()
            && gameMode.getOrdering().isOfColor(card, roundColor)
            && card !== getCalledAce(gameMode)
            && hasCard(cardsOnHand, getCalledAce(gameMode))) {
            return false;
        }

        if (!hasColor(cardsOnHand, roundColor, gameMode)) {
            // keine bedienpflicht: freie Wahl
            return true;
        } else {
            // bedienpflicht: nur in Farbe
            return gameMode.getOrdering().isOfColor(card, roundColor);
        }
    }
}

function isCalledColorButNotAce(gameMode: GameMode, cardsOnHand: readonly Card[], card: Card) {
    if (gameMode.getColorOfTheGame() === gameMode.getOrdering().getColor(card)
        && hasColor(cardsOnHand, gameMode.getOrdering().getColor(card), gameMode)
        && card !== getCalledAce(gameMode)
        && hasCard(cardsOnHand, getCalledAce(gameMode))) {
        return true
    } else {
        return false;
    }
}

function getCalledAce(gameMode: GameMode): Card {
    return gameMode.getColorOfTheGame() + CardRank.ACE as Card;
}

