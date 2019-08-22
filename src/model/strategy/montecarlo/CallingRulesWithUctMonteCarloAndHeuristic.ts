import StrategyInterface from "../StrategyInterface";
import {PlainColor} from "../../cards/Color";
import {GameMode, GameModeEnum} from "../../GameMode";
import {Card} from "../../cards/Card";
import {GameWorld} from "../../GameWorld";
import {Player} from "../../Player";
import {determineGameMode} from "../rules/shouldCall/determineGameMode";
import {AdvancedHeuristic} from "../rulebased/heuristic/AdvancedHeuristics";
import {determineCardToPlay} from "./UctMonteCarlo/determineCardToPlay";
import {generateRandomWorldConsistentWithGameKnowledge} from "../../simulation/generateRandomWorldConsistentWithGameKnowledge";

export class CallingRulesWithUctMonteCarloAndHeuristic implements StrategyInterface {
    private readonly thisPlayer: Player;

    constructor(thisPlayer: Player) {
        this.thisPlayer = thisPlayer;
    }

    chooseCardToPlay(world: GameWorld, cardSet: Card[]): Card {
        if (world.round.getPosition() != world.round.getPlayerPositionByName(this.thisPlayer.getName())) {
            throw Error('player not to move');
        }

        return determineCardToPlay(world, this.thisPlayer, cardSet,10,100, AdvancedHeuristic, generateRandomWorldConsistentWithGameKnowledge);
    }

    chooseGameToCall(cardSet: Card[], previousGameMode: GameMode, playerIndex: number, allowedGameModes: GameModeEnum[]): [GameModeEnum?, PlainColor?] {
        return determineGameMode(previousGameMode, cardSet, allowedGameModes);
    }

    chooseToRaise(cardSet: readonly Card[]): boolean {
        return false;
    }
}