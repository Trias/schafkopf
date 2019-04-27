import {GameMode, GameModeEnum} from "../GameMode";
import {CardEnum} from "../Card";
import CardSet from "../CardSet";
import Round from "../Round";
import {ColorEnum} from "../ColorEnum";

export default interface StrategyInterface {

    chooseCardToPlay(round : Round, cardSet: CardSet, gameMode:GameMode) :CardEnum

    chooseGameToCall(cardSet:CardSet, gameMode: GameMode): [GameModeEnum?, ColorEnum?];
}