import StrategyInterface from "../StrategyInterface";
import {PlainColor} from "../../cards/Color";
import {GameMode, GameModeEnum} from "../../GameMode";
import {Card} from "../../cards/Card";
import {determineGameMode} from "../rules/shouldCall/determineGameMode";
import {GameWorld} from "../../GameWorld";
import {Player} from "../../Player";
import {AdvancedHeuristic} from "./heuristic/AdvancedHeuristics";

export default class CallingRulesWithHeuristic implements StrategyInterface {
    private readonly thisPlayer: Player;

    constructor(thisPlayer: Player) {
        this.thisPlayer = thisPlayer;
    }

    chooseCardToPlay(world: GameWorld, cardSet: Card[]): Card {
        let heuristic = new AdvancedHeuristic(this.thisPlayer.getName(), this.thisPlayer.getStartCardSet(), this.thisPlayer.assumptions);
        return heuristic.determineCardToPlay(world, cardSet);
    }

    chooseGameToCall(cardSet: Card[], previousGameMode: GameMode, playerIndex: number, allowedGameModes: GameModeEnum[]): [GameModeEnum?, PlainColor?] {
        return determineGameMode(previousGameMode, cardSet, allowedGameModes);
    }

    chooseToRaise(cardSet: readonly Card[]): boolean {
        return false;
    }
}