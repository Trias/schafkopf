import StrategyInterface from "../StrategyInterface";
import PlayableMoves from "../../PlayableMoves";
import {shuffle} from "lodash"
import {ColorEnum, Colors} from "../../ColorEnum";
import {GameMode, GameModeEnum} from "../../GameMode";
import CardSet from "../../CardSet";
import Round from "../../Round";
import {CardEnum} from "../../Card";

export default class RandomStrategy implements StrategyInterface {
    chooseCardToPlay(round:Round, cardSet:CardSet, gameMode:GameMode): CardEnum{
        let cards = shuffle(cardSet.asArray());

        let chosenCard = null;
        for(let card of cards){
            if(PlayableMoves.canPlayCard(gameMode, cardSet, card, round)){
                chosenCard = card;
                break;
            }
        }

        if(chosenCard){
            return chosenCard;
        }else{
            throw Error(`no playable card found! ${cardSet.asArray()}`);
        }
    }
    chooseGameToCall(cardSet:CardSet, previousGameMode:GameMode): [GameModeEnum?, ColorEnum?] {
        if (Math.random() < 0.25) {
            return [];
        }

        let shuffledColors = shuffle(Colors.callableColorsAsArray());
        let callColor = null;
        for (let color of shuffledColors) {
            if (Math.random() < 0.8 && PlayableMoves.canCallColor(cardSet, color)) {
                callColor = color;
            }
        }

        if (callColor) {
            return [GameModeEnum.CALL_GAME, callColor];
        } else {
            return [];
        }
    }
}