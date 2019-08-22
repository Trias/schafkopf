import StrategyInterface from "../StrategyInterface";
import {PlainColor} from "../../cards/Color";
import {GameMode, GameModeEnum} from "../../GameMode";
import {Card} from "../../cards/Card";
import {GameWorld} from "../../GameWorld";
import {Player} from "../../Player";
import {determineGameMode} from "../rules/shouldCall/determineGameMode";
import {RandomCardPlay} from "../random/RandomCardPlay";
import {determineCardToPlay} from "./UctMonteCarlo/determineCardToPlay";

export default class CallingRulesWithUctMonteCarloStrategyAndCheating implements StrategyInterface {
    private readonly thisPlayer: Player;

    constructor(thisPlayer: Player) {
        this.thisPlayer = thisPlayer;
    }

    chooseCardToPlay(world: GameWorld, cardSet: Card[]): Card {
        if (world.round.getPosition() != world.round.getPlayerPositionByName(this.thisPlayer.getName())) {
            throw Error('player not to move');
        }

        let myWorld = this.cloneThisWorld(world);

        return determineCardToPlay(world, this.thisPlayer, cardSet, 1, 1000, RandomCardPlay, () => myWorld.clone());
    }

    private cloneThisWorld(world: GameWorld) {
        let myWorld = world.clone();
        Object.entries(myWorld.playerMap).forEach(([playerName, player]) => {
            myWorld.playerMap[playerName] = player.getDummyClone(myWorld, RandomCardPlay);
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