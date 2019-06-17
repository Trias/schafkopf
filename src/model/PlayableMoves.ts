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
import {MinimalRound, Round} from "./Round";
import {filter} from "lodash";

export function canCallColor(cardsOnHand: readonly Card[], color: CallableColor) {
    let callAce: Card = color + CardRank.ACE as Card;
    return !hasCard(cardsOnHand, callAce) && hasPlainColorWithoutOberAndUnter(cardsOnHand, color);
}

export function getPlayableCards(cardSet: ReadonlyArray<Card>, gameMode: GameMode, round: Round) {
    return filter(cardSet, card => {
        return canPlayCard(gameMode, cardSet, card, round)
    });
}

export function canPlayCard(gameMode: GameMode, cardsOnHand: readonly Card[], card: Card, round: MinimalRound): boolean {
    if (cardsOnHand.length === 1) {
        return true;
    }
    if (round.isEmpty()) {
        if (gameMode.isCallGame() && isCalledColorButNotAce(gameMode, cardsOnHand, card)) {
            // console.log('ruffarbe gespielt');
            if (allOfColor(cardsOnHand, gameMode.getColorOfTheGame()!, gameMode).length > 3) {
                // davongelaufen
                return true;
            } else {
                return false;
            }
        } else {
            //  console.log('erste karte');
            return true;
        }
    } else {
        let roundColor = round.getRoundColor();

        if (gameMode.isCallGame()
            && card == getCalledAce(gameMode)
            && roundColor !== gameMode.getColorOfTheGame()
            && !gameMode.getHasAceBeenCalled()
        ) {
            // rufsau nicht schmieren.
            return false;
        }
        //  console.log(`round color:${roundColor}`);

        if (gameMode.isCallGame()
            && roundColor === gameMode.getColorOfTheGame()
            && gameMode.getOrdering().isOfColor(card, roundColor)
            && card !== getCalledAce(gameMode)
            && hasCard(cardsOnHand, getCalledAce(gameMode))) {
            return false;
        }

        /*
        if (gameMode.isCallGame() && round.getRoundColor() == ColorWithTrump.TRUMP) {
            //  console.log('trumpf gespielt');
            return gameMode.getOrdering().isOfColor(card, ColorWithTrump.TRUMP) || intersection(gameMode.getTrumps(), cardsOnHand).length == 0
        } */

        //console.log('erste karte');

        if (!hasColor(cardsOnHand, roundColor, gameMode)) {
            //console.log('farbe nicht auf der hand?');
            return true;
        } else {
            //console.log('gleiche farbe?');
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

