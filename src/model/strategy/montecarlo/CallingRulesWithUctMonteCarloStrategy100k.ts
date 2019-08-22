import StrategyInterface from "../StrategyInterface";
import {PlainColor} from "../../cards/Color";
import {GameMode, GameModeEnum} from "../../GameMode";
import {Card} from "../../cards/Card";
import {chooseBestCard} from "../chooseBestCard";
import {GameWorld} from "../../GameWorld";
import {Player} from "../../Player";
import {Simulation} from "./UctMonteCarlo/Simulation";
import {determineGameMode} from "../rules/shouldCall/determineGameMode";
import log from "../../../logging/log";

export default class CallingRulesWithUctMonteCarloStrategy100k implements StrategyInterface {
    private readonly thisPlayer: Player;

    constructor(thisPlayer: Player) {
        this.thisPlayer = thisPlayer;
    }

    chooseCardToPlay(world: GameWorld, cardSet: Card[]): Card {
        if (world.round.getPosition() != world.round.getPlayerPositionByName(this.thisPlayer.getName())) {
            throw Error('player not to move');
        }

        log.time('uct simulation');
        let simulation = new Simulation(world, this.thisPlayer);
        let valuations = simulation.run(cardSet, 100, 1000);
        log.timeEnd('uct simulation');

        log.private('valuations:' + JSON.stringify(valuations));

        return chooseBestCard(valuations)!;
    }

    chooseGameToCall(cardSet: Card[], previousGameMode: GameMode, playerIndex: number, allowedGameModes: GameModeEnum[]): [GameModeEnum?, PlainColor?] {
        return determineGameMode(previousGameMode, cardSet, allowedGameModes);
    }

    chooseToRaise(cardSet: readonly Card[]): boolean {
        return false;
    }
}