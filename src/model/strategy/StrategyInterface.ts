import {GameMode, GameModeEnum} from "../GameMode";
import {Card} from "../cards/Card";
import Round from "../Round";
import {PlainColor} from "../cards/Color";

export default interface StrategyInterface {

    chooseCardToPlay(round: Round, cardSet: Card[], gameMode: GameMode): Card

    chooseGameToCall(cardSet: Card[], gameMode: GameMode): [GameModeEnum?, PlainColor?];

    chooseToRaise(cardSet: Card[]): boolean;
}