import StrategyInterface from "../StrategyInterface";
import PlayableMoves from "../../PlayableMoves";
import {shuffle} from "lodash"
import {Colors, PlainColor} from "../../cards/Color";
import {GameMode, GameModeEnum} from "../../GameMode";
import {Round} from "../../Round";
import {Card} from "../../cards/Card";

export default class RandomStrategy implements StrategyInterface {
    chooseCardToPlay(round: Round, cardSet: Card[], gameMode: GameMode): Card {
        let cards = shuffle(cardSet);

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
            throw Error(`no playable card found! ${cardSet}`);
        }
    }

    chooseGameToCall(cardSet: Card[], previousGameMode: GameMode): [GameModeEnum?, PlainColor?] {
        if (Math.random() < 0.25) {
            return [];
        }

        if (Math.random() < 0.05) {
            let callColor = shuffle(Colors.plainColorsAsArray()).shift();
            return [GameModeEnum.SOLO, callColor];
        }

        if (Math.random() < 0.05) {
            return [GameModeEnum.WENZ];
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

    chooseToRaise(cardSet: Card[]): boolean {
        return Math.random() < 0.1;
    }
}