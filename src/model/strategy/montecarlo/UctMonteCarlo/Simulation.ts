import {Player} from "../../../Player";
import {GameWorld} from "../../../GameWorld";
import {SimulatedGame} from "../../../simulation/SimulatedGame";
import {Card} from "../../../cards/Card";
import {getPlayableCards} from "../../../PlayableMoves";
import {CardToWeights, zeroWeightedCards} from "../../rules/CardToWeights";
import {generateRandomWorldConsistentWithGameKnowledge} from "../../../simulation/generateRandomWorldConsistentWithGameKnowledge";
import {GameTree} from "./GameTree";
import {clone, cloneDeep, difference, isEqual} from "lodash";
import {getUctValue} from "./getUctValue";
import {fromEntries} from "../../../../utils/fromEntries";
import {CardPlayStrategy} from "../../rulebased/heuristic/CardPlayStrategy";
import {RandomCardPlay} from "../../rulebased/heuristic/RandomCardPlay";
import GameAssumptions from "../../../knowledge/GameAssumptions";

export class Simulation {
    private readonly thisPlayer: Player;
    private readonly world: GameWorld;
    private readonly gameTree: GameTree;
    private readonly heuristicConstructor: new (name: string, startCardSet: Card[], assumptions: GameAssumptions) => CardPlayStrategy;
    private heuristicForPlayer: CardPlayStrategy;

    constructor(world: GameWorld, thisPlayer: Player, heuristicConstructor: (new (name: string, startCardSet: Card[], assumptions: GameAssumptions) => CardPlayStrategy) | null = null) {
        this.thisPlayer = thisPlayer;
        this.world = world.clone();
        this.gameTree = {
            card: null,
            runs: 0,
            wins: 0,
            children: [],
            playedCards: [],
            parent: null,
        };
        this.heuristicConstructor = heuristicConstructor || RandomCardPlay;
        this.heuristicForPlayer = new this.heuristicConstructor(this.thisPlayer.getName(), this.thisPlayer.getStartCardSet(), cloneDeep(thisPlayer.assumptions));
    }

    run(cardSet: Card[], simulations: number = 100, runsPerSimulation: number = 10) {
        let playableCards = getPlayableCards(cardSet, this.world.gameMode, this.world.round);

        if (playableCards.length == 1) {
            return zeroWeightedCards(playableCards);
        }

        let points = this.world.history.getOwnTeamPoints(this.thisPlayer.getName());
        let otherTeamPoints = this.world.history.getOtherTeamPoints(this.thisPlayer.getName());
        if (points && points > 60 || otherTeamPoints && otherTeamPoints > 60) {
            // shortcut: we have already won or lost....
            return zeroWeightedCards(playableCards);
        }

        for (let i = 0; i < simulations; i++) {
            let fakeWorld = generateRandomWorldConsistentWithGameKnowledge(this.world.clone(), this.thisPlayer.getName(), this.heuristicConstructor);

            for (let j = 0; j < runsPerSimulation; j++) {
                let fakeWorldClone = fakeWorld.clone();
                let game = new SimulatedGame(fakeWorldClone);

                let selectedGameTreeNode = this.select(this.gameTree, game, cardSet);

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
            // simulate all players before this one by random play...
            game.simulatePlayerBefore(this.thisPlayer.getName());

            let remainingHandCards = difference(cardSet, gameTree.playedCards);
            let playableCards = getPlayableCards(remainingHandCards, this.world.gameMode, this.world.round);
            let expandedChildrenCards = gameTree.children.map(childTree => childTree.card!);

            if (isEqual(playableCards.sort(), expandedChildrenCards.sort())) {
                // we need to descend deeper, all cards at this node have been explored
                if (gameTree.children.length == 0) {
                    throw Error('no children?!');
                }

                let bestChild = this.getBestChild(gameTree);
                let card = bestChild.card;
                if (card == null) {
                    throw Error('no card?!');
                }
                // we simulate one round with this card, so game tree state and simulation are in corresponding states ... results may be different on every playout.
                game.simulateOneRoundWithCard(this.thisPlayer.getName(), card);
                return this.select(bestChild!, game, cardSet);
            } else {
                // expand thr tree with a random card...
                let unexploredCards = difference(playableCards, expandedChildrenCards)!;
                let card = this.heuristicForPlayer.determineCardToPlay(this.world, unexploredCards);
                return this.expand(gameTree, game, card);
            }
        }
    }

    private getBestChild(gameTree: GameTree) {
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
        return bestChild;
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