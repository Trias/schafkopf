/**
 *
 * rules of schafkopf.. determine what moves you are allowed to play
 *
 */

import {ColorEnum} from "./ColorEnum";
import {GameMode, GameModeEnum} from "./GameMode";
import {Card, CardEnum} from "./Card";
import CardFaceEnum from "./CardFaceEnum";
import CardSet from "./CardSet";
import Round from "./Round";
import TrumpOrderingCallGame from "./orderings/TrumpOrderingCallGame";
import {includes, intersection} from "lodash";

export default class PlayableMoves {
    static canCallColor(cardsOnHand: CardEnum[], color: ColorEnum) {
        let callAce: CardEnum = color + CardFaceEnum.ACE as CardEnum;
        return color !== ColorEnum.HERZ && !CardSet.hasCard(cardsOnHand, callAce) && CardSet.hasColor(cardsOnHand, color);
    }

    static canPlayCard(gameMode: GameMode, cardsOnHand: CardEnum[], card: CardEnum, round: Round): boolean {
        if(round.isEmpty()){
            if(this.isCalledColorButNotAce(gameMode, cardsOnHand, card)){
                // console.log('ruffarbe gespielt');
                return false;
            }else{
                //  console.log('erste karte');
                return true;
            }
        }else{
            let roundColor = round.getRoundColor();

            //  console.log(`round color:${roundColor}`);

            if(gameMode.getMode() === GameModeEnum.CALL_GAME && roundColor === gameMode.getColor() && Card.isOfColor(card, roundColor)){
                //  console.log('ruffarbe gespielt');
                if(this.isCalledColorButNotAce(gameMode, cardsOnHand, card)){
                    return false;
                }
            }

            if (gameMode.getMode() === GameModeEnum.CALL_GAME && includes(TrumpOrderingCallGame, round.getCards()[0])) {
                //  console.log('trumpf gespielt');
                return includes(TrumpOrderingCallGame, card) || intersection(TrumpOrderingCallGame, cardsOnHand).length == 0
            }

            //console.log('erste karte');

            if (!CardSet.hasColor(cardsOnHand, roundColor)) {
                //console.log('farbe nicht auf der hand?');
                return true;
            }else {
                //console.log('gleiche farbe?');
                return Card.isOfColor(card, roundColor);
            }
        }
    }

    static isCalledColorButNotAce(gameMode: GameMode, cardsOnHand: CardEnum[], card: CardEnum) {
        if(gameMode.getMode() == GameModeEnum.CALL_GAME
            && gameMode.getColor() === Card.getColor(card)
            && CardSet.hasColor(cardsOnHand, Card.getColor(card))
            && card !== this.getCalledAce(gameMode)
            && CardSet.hasCard(cardsOnHand, this.getCalledAce(gameMode))) {
            return true
        }else{
            return false;
        }
    }

    static getCalledAce(gameMode: GameMode): CardEnum {
        return gameMode.getColor() + CardFaceEnum.ACE as CardEnum;
    }
}