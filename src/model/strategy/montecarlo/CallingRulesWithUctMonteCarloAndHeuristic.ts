import StrategyInterface from "../StrategyInterface";
import {PlainColor} from "../../cards/Color";
import {GameMode, GameModeEnum} from "../../GameMode";
import {Card} from "../../cards/Card";
import {chooseBestCard} from "../chooseBestCard";
import {GameWorld} from "../../GameWorld";
import {Player} from "../../Player";
import {Simulation} from "./UctMonteCarlo/Simulation";
import {determineGameMode} from "../rules/shouldCall/determineGameMode";
import {AdvancedHeuristic} from "../rulebased/heuristic/AdvancedHeuristics";

const consoleColors = require('colors');

export class CallingRulesWithUctMonteCarloAndHeuristic implements StrategyInterface {
    private readonly thisPlayer: Player;

    constructor(thisPlayer: Player) {
        this.thisPlayer = thisPlayer;
    }

    chooseCardToPlay(world: GameWorld, cardSet: Card[]): Card {
        if (world.round.getPosition() != world.round.getPlayerPositionByName(this.thisPlayer.getName())) {
            throw Error('player not to move');
        }

        console.time('uct simulation');

        // disable logging for simulation
        let log = console.log;
        console.log = () => {
        };
        //let check = JSON.stringify(world.round) + JSON.stringify(world.rounds) + JSON.stringify(this.thisPlayer.assumptions) + JSON.stringify(world.history);
        let simulation = new Simulation(world, this.thisPlayer, AdvancedHeuristic);
        let valuations = simulation.run(cardSet, 10, 100);

        /* if(check != JSON.stringify(world.round) + JSON.stringify(world.rounds) + JSON.stringify(this.thisPlayer.assumptions) + JSON.stringify(world.history)){
             throw Error('world changed!')
         }*/
        console.log = log;
        console.timeEnd('uct simulation');

        console.log('valuations:' + consoleColors.green(JSON.stringify(valuations)));

        return chooseBestCard(valuations)!;
    }

    chooseGameToCall(cardSet: Card[], previousGameMode: GameMode, playerIndex: number, allowedGameModes: GameModeEnum[]): [GameModeEnum?, PlainColor?] {
        return determineGameMode(previousGameMode, cardSet, allowedGameModes);
    }

    chooseToRaise(cardSet: readonly Card[]): boolean {
        return false;
    }
}