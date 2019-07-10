import StrategyInterface from "../StrategyInterface";
import {PlainColor} from "../../cards/Color";
import {GameMode, GameModeEnum} from "../../GameMode";
import {Round} from "../../Round";
import {Card} from "../../cards/Card";
import {chooseBestCard} from "../chooseBestCard";
import {getCallableColors, getLongestPlainColors} from "../../cards/CardSet";
import {GameWorld} from "../../GameWorld";
import {Player, PlayerMap} from "../../Player";
import {PlayerPlaceholder} from "../../simulation/PlayerPlaceholder";
import {GameHistory} from "../../knowledge/GameHistory";
import {Simulation} from "./UctMonteCarlo/Simulation";
import {includes} from "lodash";

const consoleColors = require('colors');

const CAN_PLAY_THRESHOLD = 0.75;

export default class UctMonteCarloStrategy implements StrategyInterface {
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

        console.time(consoleColors.grey('uct simulation'));
        let simulation = new Simulation(world, this.thisPlayer);
        let valuations = simulation.run(cardSet);
        console.timeEnd(consoleColors.grey('uct simulation'));

        console.log('valuations:' + consoleColors.green(JSON.stringify(valuations)));

        return chooseBestCard(valuations)!;
    }

    chooseGameToCall(cardSet: Card[], previousGameMode: GameMode, playerIndex: number, allowedGameModes: GameModeEnum[]): [GameModeEnum?, PlainColor?] {
        let longestColors = getLongestPlainColors(cardSet);

        let gameMode;
        if (includes(allowedGameModes, GameModeEnum.SOLO)) {
            gameMode = this.testGameMode(GameModeEnum.SOLO, longestColors, playerIndex, cardSet);

            if (gameMode.length) {
                console.log("uct-game:" + gameMode);
                return gameMode;
            }
        }

        if (includes(allowedGameModes, GameModeEnum.WENZ)) {
            gameMode = this.testGameMode(GameModeEnum.WENZ, [undefined], playerIndex, cardSet);
            if (gameMode.length) {
                console.log("uct-game:" + gameMode);
                return gameMode;
            }
        }

        if (includes(allowedGameModes, GameModeEnum.CALL_GAME)) {
            let callableColors = getCallableColors(cardSet);
            gameMode = this.testGameMode(GameModeEnum.CALL_GAME, callableColors, playerIndex, cardSet);

            if (gameMode.length) {
                console.log("uct-game:" + gameMode);
                return gameMode;
            }
        }

        return [];
    }

    chooseToRaise(cardSet: readonly Card[]): boolean {
        return false;
    }

    private testGameMode(testGameModeEnum: GameModeEnum, colors: (undefined | PlainColor)[], playerIndex: number, cardSet: Card[]): [GameModeEnum?, PlainColor?] {
        let map = new Map<GameMode, number>();

        let playerMap: PlayerMap = {};
        let playerName = this.thisPlayer.getName();

        for (let i = 0; i < 4; i++) {
            if (i == playerIndex) {
                playerMap[playerName] = new PlayerPlaceholder(playerName);
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

            console.time(consoleColors.grey('uct simulation' + [testGameModeEnum, color]));
            let simulation = new Simulation(world, this.thisPlayer);
            let valuations = simulation.run(cardSet);
            console.log('valuations:' + consoleColors.green(JSON.stringify(valuations)));
            console.timeEnd(consoleColors.grey('uct simulation' + [testGameModeEnum, color]));

            let bestValuedCard = chooseBestCard(valuations)!;
            let bestValue = valuations[bestValuedCard]!;

            map.set(testGameMode, bestValue);
        }

        let possibleGame = UctMonteCarloStrategy.getPossibleGame(map);

        if (possibleGame) {
            return [possibleGame.getMode(), possibleGame.getColorOfTheGame()];
        }
        return [];
    }
}