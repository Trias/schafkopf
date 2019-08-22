import {CardToWeights, zeroWeightedCards} from "../../rules/CardToWeights";
import {getPlayableCards} from "../../../PlayableMoves";
import {generateRandomWorldConsistentWithGameKnowledge} from "../../../simulation/generateRandomWorldConsistentWithGameKnowledge";
import {RandomCardPlay} from "../../random/RandomCardPlay";
import {SimulatedGame} from "../../../simulation/SimulatedGame";
import {reduce} from "lodash";
import {GameWorld} from "../../../GameWorld";
import {Card} from "../../../cards/Card";
import {Player} from "../../../Player";
import log from "../../../../logging/log";
import {chooseBestCard} from "../../chooseBestCard";

export function determineCardToPlayByFlatMonteCarlo(world: GameWorld, cardSet: Card[], thisPlayer: Player, simulations: number, runsPerSimulation: number){
    log.time('mc simulation');
    let valuations = runSimulation(world, cardSet, thisPlayer, simulations, runsPerSimulation);
    log.timeEnd('mc simulation');

    log.private('valuations:' + JSON.stringify(valuations));

    return chooseBestCard(valuations)!;
}

function runSimulation(world: GameWorld, cardSet: Card[], thisPlayer: Player, simulations: number, runsPerSimulation: number){
    let valuations: CardToWeights = {};
    let wins: { [index in string]?: number[] } = {};

    let playableCards = getPlayableCards(cardSet, world.gameMode, world.round);

    if (playableCards.length == 1) {
        // shortcut: only 1 possible move
        return zeroWeightedCards(playableCards);
    }

    let points = world.history.getOwnTeamPoints(thisPlayer.getName());
    let otherTeamPoints = world.history.getOtherTeamPoints(thisPlayer.getName());
    if (points && points > 60 || otherTeamPoints && otherTeamPoints > 60) {
        // shortcut: we have already won or lost..
        return zeroWeightedCards(playableCards);
    }

    // parallize?
    for (let i = 0; i < simulations; i++) {
        let fakeWorld = generateRandomWorldConsistentWithGameKnowledge(world.clone(), thisPlayer.getName(), RandomCardPlay);
        //console.log(colors.grey(`${JSON.stringify(fakePlayers.map(p => p.currentCardSet))}`));
        //let index = 0;
        while (fakeWorld.round.getPosition() != fakeWorld.round.getPlayerPositionByName(thisPlayer.getName())) {
            let player = fakeWorld.playerMap[fakeWorld.round.getCurrentPlayerName()];
            player.playCard(fakeWorld);
            //playerMap[fakePlayerName].onCardPlayed(card, round.getCurrentPlayerName(), index);
            //index++;
        }

        for (let card of playableCards) {
            wins[card] = wins[card] || [];
            for (let j = 0; j < Math.ceil(runsPerSimulation/playableCards.length); j++) {
                let winsSoFar = wins[card]![i] || 0;

                let fakeWorldClone = fakeWorld.clone();
                let game = new SimulatedGame(fakeWorldClone);
                let win = (game.simulateWithCard(thisPlayer.getName(), card) ? 1 : 0);
                wins[card]![i] = winsSoFar + win;
            }
        }
    }

    let entries: [string, number[]][] = Object.entries(wins) as [string, number[]][];
    for (let [card, winCounts] of entries) {
        valuations[card] = reduce(winCounts, (a, b) => a + b, 0) / (runsPerSimulation * simulations) as number;
    }

    //if(valuations[chooseBestCard(valuations) as string]! == 1 && world.history.getOwnTeamPoints(this.thisPlayer.getName())! < 61){
    // hmmm.. seems very confident but very often misses a lot....
    //}

    return valuations;
}