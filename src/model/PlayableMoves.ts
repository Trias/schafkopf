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
import {intersection} from "lodash";

export default class PlayableMoves {
    static canCallColor(cardsOnHand: CardSet, color: ColorEnum){
        let callAce: CardEnum = color + CardFaceEnum.ACE as CardEnum;
        return color !== ColorEnum.HERZ && !cardsOnHand.hasCard(callAce) && cardsOnHand.hasColor(color);
    }

    static canPlayCard(gameMode: GameMode, cardsOnHand: CardSet, card: CardEnum, round: Round): boolean{
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

            if(gameMode.getMode() === GameModeEnum.CALL_GAME && TrumpOrderingCallGame.indexOf(round.getCards()[0]) !== -1){
                //  console.log('trumpf gespielt');
                return TrumpOrderingCallGame.indexOf(card)!==-1 || intersection(TrumpOrderingCallGame, cardsOnHand.asArray()).length==0
            }

            //console.log('erste karte');

            if(!cardsOnHand.hasColor(roundColor)){
                //console.log('farbe nicht auf der hand?');
                return true;
            }else {
                //console.log('gleiche farbe?');
                return Card.isOfColor(card, roundColor);
            }
        }
    }

    static isCalledColorButNotAce(gameMode: GameMode, cardsOnHand:CardSet, card: CardEnum) {
        if(gameMode.getMode() == GameModeEnum.CALL_GAME
            && gameMode.getColor() === Card.getColor(card)
            && cardsOnHand.hasColor(Card.getColor(card))
            && card !== this.getCalledAce(gameMode)
            && cardsOnHand.hasCard(this.getCalledAce(gameMode))){
            return true
        }else{
            return false;
        }
    }

    static getCalledAce(gameMode: GameMode): CardEnum {
        return gameMode.getColor() + CardFaceEnum.ACE as CardEnum;
    }
}