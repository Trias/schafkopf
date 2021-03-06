import StrategyInterface from "../StrategyInterface";
import {PlainColor} from "../../cards/Color";
import {GameMode, GameModeEnum} from "../../GameMode";
import {Card} from "../../cards/Card";
import {GameWorld} from "../../GameWorld";
import {Player} from "../../Player";
import {determineGameMode} from "../rules/shouldCall/determineGameMode";
import {AdvancedHeuristic} from "../rulebased/heuristic/AdvancedHeuristics";
import {determineCardToPlay} from "./UctMonteCarlo/determineCardToPlay";

/**
 * like CallingRulesWithUctMonteCarloStrategyAndCheating but with AdvancedHeuristics as a model playout... perfect enemy of AdvancedHeuristics
 */
export default class Nemesis implements StrategyInterface {
    private readonly thisPlayer: Player;

    constructor(thisPlayer: Player) {
        this.thisPlayer = thisPlayer;
    }

    chooseCardToPlay(world: GameWorld, cardSet: Card[]): Card {
        if (world.round.getPosition() != world.round.getPlayerPositionByName(this.thisPlayer.getName())) {
            throw Error('player not to move');
        }

        let myWorld = this.cloneThisWorld(world);

        return determineCardToPlay(world, this.thisPlayer, cardSet,1, 1000, AdvancedHeuristic, () => myWorld.clone());
    }

    private cloneThisWorld(world: GameWorld) {
        let myWorld = world.clone();
        Object.entries(myWorld.playerMap).forEach(([playerName, player]) => {
            myWorld.playerMap[playerName] = player.getDummyClone(myWorld, AdvancedHeuristic);
        });
        return myWorld;
    }

    chooseGameToCall(cardSet: Card[], previousGameMode: GameMode, playerIndex: number, allowedGameModes: GameModeEnum[]): [GameModeEnum?, PlainColor?] {
        return determineGameMode(previousGameMode, cardSet, allowedGameModes);
    }

    chooseToRaise(cardSet: readonly Card[]): boolean {
        return false;
    }
}