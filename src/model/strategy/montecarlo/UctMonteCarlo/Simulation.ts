import {Player} from "../../../Player";
import {GameWorld} from "../../../GameWorld";
import {SimulatedGame} from "../../../simulation/SimulatedGame";
import {Card} from "../../../cards/Card";
import {getPlayableCards} from "../../../PlayableMoves";
import {CardToWeights, zeroWeightedCards} from "../../rules/CardToWeights";
import {generateRandomWorldConsistentWithGameKnowledge} from "../../../simulation/generateRandomWorldConsistentWithGameKnowledge";
import {GameTree} from "./GameTree";
import {clone, difference, isEqual, sample} from "lodash";
import {getUctValue} from "./getUctValue";
import {fromEntries} from "../../../../utils/fromEntries";

export class Simulation {
    private thisPlayer: Player;
    private world: GameWorld;
    private gameTree: GameTree;

    constructor(world: GameWorld, thisPlayer: Player) {
        this.thisPlayer = thisPlayer;
        this.world = world;
        this.gameTree = {
            card: null,
            runs: 0,
            wins: 0,
            children: [],
            playedCards: [],
            parent: null,
        };
    }

    run(cardSet: Card[]) {
        let simulations = 100;
        let runsPerSimulation = 10;

        let playableCards = getPlayableCards(cardSet, this.world.gameMode, this.world.round);

        if (playableCards.length == 1) {
            return zeroWeightedCards(playableCards);
        }

        // parallize?
        for (let i = 0; i < simulations; i++) {
            let fakeWorld = generateRandomWorldConsistentWithGameKnowledge(this.world.clone(), this.thisPlayer.getName());

            for (let j = 0; j < runsPerSimulation; j++) {
                let fakeWorldClone = fakeWorld.clone();
                let game = new SimulatedGame(fakeWorldClone);

                let selectedGameTreeNode = this.select(this.gameTree, game, cardSet);

                if (fakeWorldClone.rounds.length < 8) {
                    game.simulate(this.thisPlayer.getName());
                }
                let win = this.simulate(game);
                this.backPropagation(selectedGameTreeNode, win);
            }
        }

        return fromEntries(this.gameTree.children.map(node => [node.card as string, node.wins / node.runs])) as CardToWeights;
    }

    private expand(gameTreeNode: GameTree, game: SimulatedGame, card: Card) {
        game.simulatePlayerBefore(this.thisPlayer.getName());

        let node = {
            card: card,
            wins: 0,
            runs: 0,
            children: [],
            playedCards: gameTreeNode.playedCards.concat(card),
            parent: gameTreeNode
        };

        gameTreeNode.children.push(node);

        game.simulateOneRoundWithCard(this.thisPlayer.getName(), card);

        return node;
    }

    private select(gameTree: GameTree, game: SimulatedGame, cardSet: Card[]): GameTree {
        if (isEqual(clone(gameTree.playedCards).sort(), clone(cardSet).sort())) {
            // terminal node...
            if (!gameTree.card) {
                throw Error('no card?!');
            }
            return gameTree;
        } else {
            game.simulatePlayerBefore(this.thisPlayer.getName());

            let remainingHandCards = difference(cardSet, gameTree.playedCards);
            let playableCards = getPlayableCards(remainingHandCards, this.world.gameMode, this.world.round);
            let expandedChildrenCards = gameTree.children.map(childTree => childTree.card);

            if (isEqual(playableCards.sort(), expandedChildrenCards.sort())) {
                if (gameTree.children.length == 0) {
                    throw Error('no children?!');
                }

                let bestUctValue = 0;
                let bestChild: GameTree = gameTree.children[0];

                for (let childNode of gameTree.children) {
                    let parentRuns = gameTree.runs;
                    let {wins, runs} = childNode;
                    let uctValue = getUctValue(wins / runs, parentRuns, runs);
                    if (uctValue >= bestUctValue) {
                        bestUctValue = uctValue;
                        bestChild = childNode;
                    }
                    if (bestUctValue == Infinity) {
                        // partially unexpanded node;
                        throw Error('unexpanded node?!');
                    }
                }
                let card = bestChild.card;
                if (card == null) {
                    throw Error('no card?!');
                }
                game.simulateOneRoundWithCard(this.thisPlayer.getName(), card);
                return this.select(bestChild!, game, cardSet);
            } else {
                let unexploredCards = difference(playableCards, expandedChildrenCards);
                let card = sample(unexploredCards)!;
                return this.expand(gameTree, game, card);
            }
        }
    }

    private backPropagation(gameTree: GameTree, win: number) {
        if (gameTree.parent == null) {
            gameTree.wins = gameTree.wins + win;
            gameTree.runs = gameTree.runs + 1;
            return;
        }
        gameTree.wins = gameTree.wins + win;
        gameTree.runs = gameTree.runs + 1;
        this.backPropagation(gameTree.parent, win);
    }

    private simulate(game: SimulatedGame) {
        let win;
        if (this.world.rounds.length < 8) {
            win = game.simulate(this.thisPlayer.getName()) ? 1 : 0;
        } else {
            win = game.getGameResult().hasPlayerWon(this.thisPlayer.getName()) ? 1 : 0;
        }
        return win;
    }
}