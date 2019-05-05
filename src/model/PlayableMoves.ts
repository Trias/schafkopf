/**
 *
 * rules of schafkopf.. determine what moves you are allowed to play
 *
 */

import {CallableColor} from "./cards/Color";
import {GameMode, GameModeEnum} from "./GameMode";
import {Card} from "./cards/Card";
import CardRank from "./cards/CardRank";
import CardSet from "./cards/CardSet";
import {Round} from "./Round";
import {includes, intersection} from "lodash";

export default class PlayableMoves {
    static canCallColor(cardsOnHand: readonly Card[], color: CallableColor) {
        let callAce: Card = color + CardRank.ACE as Card;
        return !CardSet.hasCard(cardsOnHand, callAce) && CardSet.hasPlainColorWithoutOberAndUnter(cardsOnHand, color);
    }

    static canPlayCard(gameMode: GameMode, cardsOnHand: readonly Card[], card: Card, round: Round): boolean {
        if (cardsOnHand.length === 1) {
            // hole in the schafkopfregeln: rufsau may not be played until 8. round... also a convenient shortcut..
            return true;
        }
        if(round.isEmpty()){
            if (gameMode.getMode() == GameModeEnum.CALL_GAME
                && this.isCalledColorButNotAce(gameMode, cardsOnHand, card)) {
                // console.log('ruffarbe gespielt');
                if (CardSet.allOfColor(cardsOnHand, gameMode.getColorOfTheGame()!, gameMode).length > 3) {
                    // davongelaufen
                    return true;
                } else {
                    return false;
                }
            }else{
                //  console.log('erste karte');
                return true;
            }
        }else{
            let roundColor = round.getRoundColor();


            if (gameMode.getMode() === GameModeEnum.CALL_GAME
                && card == this.getCalledAce(gameMode)
                && roundColor !== gameMode.getColorOfTheGame()
                && !gameMode.getHasAceBeenCalled()
            ) {
                // rufsau nicht schmieren.
                return false;
            }
            //  console.log(`round color:${roundColor}`);

            if (gameMode.getMode() === GameModeEnum.CALL_GAME && roundColor === gameMode.getColorOfTheGame() && gameMode.getOrdering().isOfColor(card, roundColor)) {
                //  console.log('ruffarbe gespielt');
                if (this.isCalledColorButNotAce(gameMode, cardsOnHand, card)) {
                    return false;
                }
            }

            if (gameMode.getMode() === GameModeEnum.CALL_GAME && includes(gameMode.getOrdering().getTrumpOrdering(), round.getCards()[0])) {
                //  console.log('trumpf gespielt');
                return includes(gameMode.getOrdering().getTrumpOrdering(), card) || intersection(gameMode.getOrdering().getTrumpOrdering(), cardsOnHand).length == 0
            }

            //console.log('erste karte');

            if (!CardSet.hasColor(cardsOnHand, roundColor, gameMode)) {
                //console.log('farbe nicht auf der hand?');
                return true;
            }else {
                //console.log('gleiche farbe?');
                return gameMode.getOrdering().isOfColor(card, roundColor);
            }
        }
    }

    static isCalledColorButNotAce(gameMode: GameMode, cardsOnHand: readonly Card[], card: Card) {
        if (gameMode.getColorOfTheGame() === gameMode.getOrdering().getColor(card)
            && CardSet.hasColor(cardsOnHand, gameMode.getOrdering().getColor(card), gameMode)
            && card !== this.getCalledAce(gameMode)
            && CardSet.hasCard(cardsOnHand, this.getCalledAce(gameMode))) {
            return true
        }else{
            return false;
        }
    }

    static getCalledAce(gameMode: GameMode): Card {
        return gameMode.getColorOfTheGame() + CardRank.ACE as Card;
    }
}