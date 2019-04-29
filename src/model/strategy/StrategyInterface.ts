import {GameMode, GameModeEnum} from "../GameMode";
import {Card} from "../Cards";
import Trick from "../Trick";
import {Suit} from "../Suit";

export default interface StrategyInterface {

    chooseCardToPlay(round: Trick, cardSet: Card[], gameMode: GameMode): Card

    chooseGameToCall(cardSet: Card[], gameMode: GameMode): [GameModeEnum?, Suit?];

    chooseToRaise(cardSet: Card[]): boolean;
}