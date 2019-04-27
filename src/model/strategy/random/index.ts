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
        for(let card of cardSet.asArray()){
            console.log(`card: ${card}: ${PlayableMoves.canPlayCard(gameMode, cardSet, card, round)}`);
        }

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
        return Math.random() < 0.5
            ? []
            : [GameModeEnum.CALL_GAME, shuffle(Colors.normalColorsAsArray()).reduce((prev, color) => {
            return prev || Math.random() < 0.8 && PlayableMoves.canCallColor(cardSet, color) && color;
        })];
    }
}