import {GameMode, GameModeEnum} from "../GameMode";
import {CardEnum} from "../Card";
import Round from "../Round";
import {ColorEnum} from "../ColorEnum";

export default interface StrategyInterface {

    chooseCardToPlay(round: Round, cardSet: CardEnum[], gameMode: GameMode): CardEnum

    chooseGameToCall(cardSet: CardEnum[], gameMode: GameMode): [GameModeEnum?, ColorEnum?];
}