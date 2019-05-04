import {GameMode, GameModeEnum} from "../GameMode";
import {Card} from "../cards/Card";
import {Round} from "../Round";
import {PlainColor} from "../cards/Color";

export default interface StrategyInterface {

    chooseCardToPlay(round: Round, cardSet: readonly Card[], gameMode: GameMode): Card

    chooseGameToCall(cardSet: readonly Card[], gameMode: GameMode): [GameModeEnum?, PlainColor?];

    chooseToRaise(cardSet: readonly Card[]): boolean;
}