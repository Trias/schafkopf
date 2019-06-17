import {GameMode, GameModeEnum} from "../GameMode";
import {Card} from "../cards/Card";
import {FinishedRound, Round} from "../Round";
import {PlainColor} from "../cards/Color";

export default interface StrategyInterface {

    chooseCardToPlay(round: Round, cardSet: readonly Card[], gameMode: GameMode, playedRounds: FinishedRound[]): Card

    chooseGameToCall(cardSet: readonly Card[], gameMode: GameMode, playerIndex: number): [GameModeEnum?, PlainColor?];

    chooseToRaise(cardSet: readonly Card[]): boolean;

    skipInference(): boolean;
}