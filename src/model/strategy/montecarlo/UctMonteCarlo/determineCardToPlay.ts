import log from "../../../../logging/log";
import {Simulation} from "./Simulation";
import {chooseBestCard} from "../../chooseBestCard";
import {Player} from "../../../Player";
import {GameWorld} from "../../../GameWorld";
import {Card} from "../../../cards/Card";

export function determineCardToPlay(world: GameWorld, thisPlayer:Player, cardSet: Card[], simulations:number, runsPersimulation: number, heuristic: any, generateWorlds: (world: GameWorld, name: string, constructor: any)  => GameWorld){
    log.time('uct simulation');

    // disable logging for simulation
    log.setConfig({disabled: true});
    //let check = JSON.stringify(world.round) + JSON.stringify(world.rounds) + JSON.stringify(this.thisPlayer.assumptions) + JSON.stringify(world.history);
    let simulation = new Simulation(world, thisPlayer, heuristic);
    let valuations = simulation.run(cardSet, simulations, runsPersimulation, generateWorlds);

    /* if(check != JSON.stringify(world.round) + JSON.stringify(world.rounds) + JSON.stringify(this.thisPlayer.assumptions) + JSON.stringify(world.history)){
         throw Error('world changed!')
     }*/
    log.setConfig({disabled: false});
    log.timeEnd('uct simulation');

    log.private('valuations:' + JSON.stringify(valuations));

    return chooseBestCard(valuations)!;
}
