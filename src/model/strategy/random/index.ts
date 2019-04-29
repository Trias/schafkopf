import StrategyInterface from "../StrategyInterface";
import PlayableMoves from "../../PlayableMoves";
import {shuffle} from "lodash"
import {Suit, Suits} from "../../Suit";
import {GameMode, GameModeEnum} from "../../GameMode";
import Trick from "../../Trick";
import {Card} from "../../Cards";

export default class RandomStrategy implements StrategyInterface {
    chooseCardToPlay(round: Trick, cardSet: Card[], gameMode: GameMode): Card {
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

    chooseGameToCall(cardSet: Card[], previousGameMode: GameMode): [GameModeEnum?, Suit?] {
        if (Math.random() < 0.25) {
            return [];
        }

        if (Math.random() < 0.05) {
            let callSuit = shuffle(Suits.asArray()).shift();
            return [GameModeEnum.SOLO, callSuit];
        }

        if (Math.random() < 0.05) {
            return [GameModeEnum.WENZ];
        }

        let shuffledSuits = shuffle(Suits.callableSuitsAsArray());
        let callSuit = null;
        for (let suit of shuffledSuits) {
            if (Math.random() < 0.8 && PlayableMoves.canCallSuit(cardSet, suit)) {
                callSuit = suit;
            }
        }

        if (callSuit) {
            return [GameModeEnum.CALL_GAME, callSuit];
        } else {
            return [];
        }
    }

    chooseToRaise(cardSet: Card[]): boolean {
        return Math.random() < 0.1;
    }
}