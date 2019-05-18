import {GameMode, GameModeEnum} from "../GameMode";
import {Card} from "../cards/Card";
import {Round} from "../Round";
import {PlainColor} from "../cards/Color";
import {Player} from "../Player";

export default interface StrategyInterface {

    chooseCardToPlay(round: Round, cardSet: readonly Card[], gameMode: GameMode): Card

    chooseGameToCall(cardSet: readonly Card[], gameMode: GameMode, playerIndex: number): [GameModeEnum?, PlainColor?];

    chooseToRaise(cardSet: readonly Card[]): boolean;

    setPlayer(param: Player): void;
}