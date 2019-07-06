import StrategyInterface from "../StrategyInterface";
import {PlainColor} from "../../cards/Color";
import {GameMode, GameModeEnum} from "../../GameMode";
import {Round} from "../../Round";
import {Card} from "../../cards/Card";
import {getPlayableCards} from "../../PlayableMoves";
import {chooseBestCard} from "../chooseBestCard";
import {SimulatedGame} from "../../simulation/SimulatedGame";
import {generateRandomWorldConsistentWithGameKnowledge} from "../../simulation/generateRandomWorldConsistentWithGameKnowledge";
import {includes, reduce} from "lodash";
import {getCallableColors, getLongestPlainColors} from "../../cards/CardSet";
import {GameWorld} from "../../GameWorld";
import {CardToWeights, zeroWeightedCards} from "../rules/CardToWeights";
import {Player, PlayerMap} from "../../Player";
import {PlayerPlaceholder} from "../../simulation/PlayerPlaceholder";
import {GameHistory} from "../../knowledge/GameHistory";
import {RandomCardPlay} from "../rulebased/heuristic/RandomCardPlay";

const consoleColors = require('colors');

const CAN_PLAY_THRESHOLD = 0.75;

export default class NaiveMonteCarloStrategy implements StrategyInterface {
    private readonly thisPlayer: Player;

    constructor(thisPlayer: Player) {
        this.thisPlayer = thisPlayer;
    }

    private static getPossibleGame(map: Map<GameMode, number>) {
        let bestGameValuation = 0;
        let bestGameMode = null;
        for (let [gameMode, valuation] of map.entries()) {
            if (valuation > bestGameValuation) {
                bestGameMode = gameMode;
                bestGameValuation = valuation;
            }
        }

        if (bestGameValuation > CAN_PLAY_THRESHOLD) {
            return bestGameMode;
        } else {
            return null;
        }
    }

    chooseCardToPlay(world: GameWorld, cardSet: Card[]): Card {
        if (world.round.getPosition() != world.round.getPlayerPositionByName(this.thisPlayer.getName())) {
            throw Error('player not to move');
        }

        console.time('mc simulation');
        let valuations = this.runSimulation(world, cardSet);
        console.timeEnd('mc simulation');

        console.log('valuations:' + consoleColors.green(JSON.stringify(valuations)));

        return chooseBestCard(valuations)!;
    }

    runSimulation(world: GameWorld, cardSet: Card[]) {
        let simulations = 10;
        let runsPerSimulation = 10;
        let valuations: CardToWeights = {};
        let wins: { [index in string]?: number[] } = {};

        let playableCards = getPlayableCards(cardSet, world.gameMode, world.round);

        if (playableCards.length == 1) {
            // shortcut: only 1 possible move
            return zeroWeightedCards(playableCards);
        }

        let points = world.history.getOwnTeamPoints(this.thisPlayer.getName());
        let otherTeamPoints = world.history.getOtherTeamPoints(this.thisPlayer.getName());
        if (points && points > 60 || otherTeamPoints && otherTeamPoints > 60) {
            // shortcut: we have already won or lost..
            return zeroWeightedCards(playableCards);
        }

        // parallize?
        for (let i = 0; i < simulations; i++) {
            let fakeWorld = generateRandomWorldConsistentWithGameKnowledge(world.clone(), this.thisPlayer.getName(), RandomCardPlay);
            //console.log(colors.grey(`${JSON.stringify(fakePlayers.map(p => p.currentCardSet))}`));
            //let index = 0;
            while (fakeWorld.round.getPosition() != fakeWorld.round.getPlayerPositionByName(this.thisPlayer.getName())) {
                let player = fakeWorld.playerMap[fakeWorld.round.getCurrentPlayerName()];
                player.playCard(fakeWorld);
                //playerMap[fakePlayerName].onCardPlayed(card, round.getCurrentPlayerName(), index);
                //index++;
            }

            for (let card of playableCards) {
                wins[card] = wins[card] || [];
                for (let j = 0; j < runsPerSimulation; j++) {
                    let winsSoFar = wins[card]![i] || 0;

                    let fakeWorldClone = fakeWorld.clone();
                    let game = new SimulatedGame(fakeWorldClone);
                    let win = (game.simulateWithCard(this.thisPlayer.getName(), card) ? 1 : 0);
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

    chooseGameToCall(cardSet: Card[], previousGameMode: GameMode, playerIndex: number, allowedGameModes: GameModeEnum[]): [GameModeEnum?, PlainColor?] {
        let longestColors = getLongestPlainColors(cardSet);

        let gameMode;


        if (includes(allowedGameModes, GameModeEnum.SOLO)) {
            gameMode = this.testGameMode(GameModeEnum.SOLO, longestColors, playerIndex, cardSet);

            if (gameMode.length) {
                console.log("mc-game solo:" + gameMode);
                return gameMode;
            }
        }

        if (includes(allowedGameModes, GameModeEnum.WENZ)) {
            gameMode = this.testGameMode(GameModeEnum.WENZ, [undefined], playerIndex, cardSet);
            if (gameMode.length) {
                console.log("mc-game wenz:" + gameMode);
                return gameMode;
            }
        }

        if (includes(allowedGameModes, GameModeEnum.CALL_GAME)) {
            let callableColors = getCallableColors(cardSet);
            gameMode = this.testGameMode(GameModeEnum.CALL_GAME, callableColors, playerIndex, cardSet);

            if (gameMode.length) {
                console.log("mc-game call game:" + gameMode);
                return gameMode;
            }
        }

        return [];
    }

    // TODO generalize / abstract
    private testGameMode(testGameModeEnum: GameModeEnum, colors: (undefined | PlainColor)[], playerIndex: number, cardSet: Card[]): [GameModeEnum?, PlainColor?] {
        let map = new Map<GameMode, number>();

        let playerMap: PlayerMap = {};
        let playerName = this.thisPlayer.getName();

        for (let i = 0; i < 4; i++) {
            if (i == playerIndex) {
                playerMap[playerName] = this.thisPlayer.getDummyClone();
            } else {
                playerMap["FakePlayer " + i] = new PlayerPlaceholder("FakePlayer " + i);
            }
        }

        for (let color of colors) {
            let testGameMode = new GameMode(testGameModeEnum, playerName, color);
            let startPlayerName = Object.keys(playerMap)[(4 + playerIndex - 1) % 4];

            let round = new Round(startPlayerName, Object.keys(playerMap));
            let history = new GameHistory(Object.keys(playerMap), testGameMode);
            let world = new GameWorld(testGameMode, playerMap, [], round, history);

            console.time('mc-simulation' + [testGameModeEnum, color]);
            let valuations = this.runSimulation(world, cardSet);
            console.timeEnd('mc-simulation' + [testGameModeEnum, color]);
            console.log(consoleColors.green(JSON.stringify(valuations)));

            let bestValuedCard = chooseBestCard(valuations)!;
            let bestValue = valuations[bestValuedCard]!;

            map.set(testGameMode, bestValue);
        }

        let possibleGame = NaiveMonteCarloStrategy.getPossibleGame(map);

        if (possibleGame) {
            return [possibleGame.getMode(), possibleGame.getColorOfTheGame()];
        }
        return [];
    }

    chooseToRaise(cardSet: readonly Card[]): boolean {
        return false;
    }
}