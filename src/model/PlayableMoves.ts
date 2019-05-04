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
        if(round.isEmpty()){
            if (this.isCalledColorButNotAce(gameMode, cardsOnHand, card)) {
                // console.log('ruffarbe gespielt');
                return false;
            }else{
                //  console.log('erste karte');
                return true;
            }
        }else{
            let roundColor = round.getRoundColor();

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
        if(gameMode.getMode() == GameModeEnum.CALL_GAME
            && gameMode.getColorOfTheGame() === gameMode.getOrdering().getColor(card)
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