import StrategyInterface from "../StrategyInterface";
import {PlainColor} from "../../cards/Color";
import {GameMode, GameModeEnum} from "../../GameMode";
import {FinishedRound, Round} from "../../Round";
import {Card} from "../../cards/Card";
import {Player, PlayerWithNameOnly} from "../../Player";
import GameEventsReceiverInterface from "../../knowledge/GameEventsReceiverInterface";
import {getPlayableCards} from "../../PlayableMoves";
import {chooseBestCard} from "../helper";
import {SimulatedGame} from "../../simulation/SimulatedGame";
import {generateRandomWorldConsistentWithGameKnowledge} from "../../simulation/generateRandomWorldConsistentWithGameKnowledge";
import {clone, cloneDeep, find, reduce} from "lodash";
import RandomStrategy from "../random";
import GamePhase from "../../GamePhase";
import {getCallableColors, getLongestPlainColors} from "../../cards/CardSet";

const colors = require('colors');

const CAN_PLAY_THRESHOLD = 0.95;

export default class NaiveMonteCarlo implements StrategyInterface, GameEventsReceiverInterface {
    private readonly thisPlayer: Player;

    constructor(thisPlayer: Player) {
        this.thisPlayer = thisPlayer;

    }

    // TODO Player names hardcoded

    private static generatePlayers(gameMode: GameMode, playedRounds: readonly FinishedRound[]) {
        let otherPlayers = [new Player("Player 2", RandomStrategy), new Player("Player 3", RandomStrategy), new Player("Player 4", RandomStrategy)];

        for (let player of otherPlayers) {
            player.gamePhase = GamePhase.IN_PLAY;
            player.gameMode = gameMode;
            player.rounds = cloneDeep(playedRounds) as FinishedRound[];
        }

        return otherPlayers;
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

    chooseCardToPlay(round: Round, cardSet: readonly Card[], gameMode: GameMode, playedRounds: readonly FinishedRound[]): Card {

        let myRound = cloneDeep(round); // probably unneccessary...
        if (round.getPosition() != round.getPlayerPosition(this.thisPlayer.getName())) {
            throw Error('player not to move');
        }

        let playableCards = getPlayableCards(cardSet, gameMode, myRound);

        if (playableCards.length == 1) {
            return playableCards[0];
        }

        let fakePlayer = this.thisPlayer.getDummyClone();

        let valuations = this.runSimulation(fakePlayer, playableCards, gameMode, playedRounds, myRound);

        console.log('valuations:' + colors.green(JSON.stringify(valuations)));

        return chooseBestCard(valuations)!;
    }

    runSimulation(fakePlayer: Player, playableCards: Card[], gameMode: GameMode, playedRounds: readonly FinishedRound[], myRound: Round) {
        let simulations = 10;
        let runsPerSimulation = 100;
        let otherPlayers = NaiveMonteCarlo.generatePlayers(gameMode, playedRounds);
        let valuations: { [index in string]?: number } = {};

        let wins: { [index in Card]?: number[] } = {};

        // parallize?
        for (let i = 0; i < simulations; i++) {
            let fakePlayers = generateRandomWorldConsistentWithGameKnowledge(gameMode, fakePlayer.gameKnowledge!, otherPlayers, fakePlayer, myRound);
            fakePlayers.splice(0, 0, fakePlayer);
            //console.log(colors.grey(`${JSON.stringify(fakePlayers.map(p => p.currentCardSet))}`));

            for (let card of playableCards) {
                wins[card] = wins[card] || [];
                for (let j = 0; j < runsPerSimulation; j++) {
                    // todo work with symbols :(
                    let players = cloneDeep(fakePlayers);
                    let fakeRound = new Round(players[0], players, gameMode);
                    fakeRound.playedCards = clone(myRound.playedCards);

                    for (let player of players) {
                        player.players = players;
                        player.gamePhase = GamePhase.IN_PLAY;
                    }

                    fakeRound.setPlayers(players);
                    fakePlayer.players = players;
                    let startPlayer = find(players, p => p.getName() == myRound.getStartPlayer().getName());
                    if (!startPlayer) {
                        throw Error('player not found');
                    }
                    fakeRound.setStartPlayer(startPlayer);

                    let winsSoFar = wins[card]![i] || 0;
                    let myPlayedRounds = cloneDeep(playedRounds) as FinishedRound[];
                    let game = new SimulatedGame(players, fakeRound, gameMode, myPlayedRounds);
                    let win = (this.simulateGame(game, card) ? 1 : 0);
                    wins[card]![i] = winsSoFar + win;
                }
            }
        }

        let entries: [string, number[]][] = Object.entries(wins) as [string, number[]][];
        for (let [card, winCounts] of entries) {
            valuations[card] = reduce(winCounts, (a, b) => a + b, 0) / (runsPerSimulation * simulations) as number;
        }

        return valuations;
    }

    simulateGame(game: SimulatedGame, card: Card) {
        let round = game.getRound();
        let playedRounds = game.getPlayedRounds();
        if (this.thisPlayer.getName() != round.getCurrentPlayer().getName()) {
            throw Error('cannot force play other player');
        }
        let nextPlayer = game.forcePlayCard(round.getCurrentPlayer().getName(), card, round);

        game.simulateRounds(nextPlayer.getName(), playedRounds.length, round);
        let result = game.getGameResult();

        // console.log(colors.blue(`${JSON.stringify(rounds.map(r => r.getCards()))}`) + colors.red(`points: ${JSON.stringify(result.getPlayersPoints(this.thisPlayer.getName()))}`));

        return result.hasPlayerWon(this.thisPlayer.getName());
    }

    chooseGameToCall(cardSet: readonly Card[], previousGameMode: GameMode, playerIndex: number): [GameModeEnum?, PlainColor?] {

        let gameMode = this.testSolo(playerIndex, cardSet);

        if (gameMode) {
            console.log("mc-game:" + gameMode);
            return gameMode;
        }

        gameMode = this.testWenz(playerIndex, cardSet);
        if (gameMode) {
            console.log("mc-game:" + gameMode);
            return gameMode;
        }

        gameMode = this.testCallGame(playerIndex, cardSet);

        if (gameMode) {
            console.log("mc-game:" + gameMode);
            return gameMode;
        }

        return [];
    }

    private testSolo(playerIndex: number, cardSet: ReadonlyArray<Card>): [GameModeEnum?, PlainColor?] {
        let longestColors = getLongestPlainColors(cardSet);

        let map = new Map<GameMode, number>();

        // SOLO
        for (let longestColor of longestColors) {
            let testGameMode = new GameMode(GameModeEnum.SOLO, this.thisPlayer, longestColor);

            let players = NaiveMonteCarlo.generatePlayers(testGameMode, []);
            let fakePlayer = this.thisPlayer.getDummyClone();

            let startPlayer;
            if (playerIndex == 0) {
                startPlayer = fakePlayer
            } else {
                startPlayer = players[(playerIndex + 3) % 3];
            }

            let round = new Round(startPlayer, players, testGameMode);
            let fakePlayers = generateRandomWorldConsistentWithGameKnowledge(testGameMode, fakePlayer.gameKnowledge!, players, fakePlayer, round);
            fakePlayer.gamePhase = GamePhase.IN_PLAY;
            fakePlayers.splice(0, 0, fakePlayer);
            round.setPlayers(fakePlayers);

            for (let player of fakePlayers) {
                player.gamePhase = GamePhase.ALL_CARDS_DEALT;
                player.onGameModeDecided(testGameMode);
                player.gamePhase = GamePhase.IN_PLAY;
            }

            let index = 0;
            while (round.getPosition() != round.getPlayerPosition(this.thisPlayer.getName())) {
                let player = fakePlayers[round.getPosition()];
                let card = player.playCard(round);
                round.addCard(card);
                fakePlayer.onCardPlayed(card, player, index);
                index++;
            }

            let playableCards = getPlayableCards(cardSet, testGameMode, round);

            let valuations = this.runSimulation(fakePlayer, playableCards, testGameMode, [], round);
            let bestValuedCard = chooseBestCard(valuations)!;
            let bestValue = valuations[bestValuedCard]!;

            map.set(testGameMode, bestValue);
        }

        let possibleGame = NaiveMonteCarlo.getPossibleGame(map);

        if (possibleGame) {
            return [possibleGame.getMode(), possibleGame.getColorOfTheGame()];
        }
        return [];
    }

    chooseToRaise(cardSet: readonly Card[]): boolean {
        return false;
    }

    onCardPlayed(card: Card, player: PlayerWithNameOnly, index: number): void {

    }

    onGameModeDecided(gameMode: GameMode): void {

    }

    onRoundCompleted(round: FinishedRound, roundIndex: number): void {
    }

    skipInference(): boolean {
        return false;
    }

    private testWenz(playerIndex: number, cardSet: ReadonlyArray<Card>): [GameModeEnum?, PlainColor?] {

        let testGameMode = new GameMode(GameModeEnum.WENZ, this.thisPlayer);

        let players = NaiveMonteCarlo.generatePlayers(testGameMode, []);

        let startPlayer;
        let fakePlayer = this.thisPlayer.getDummyClone();
        if (playerIndex == 0) {
            startPlayer = fakePlayer;
        } else {
            startPlayer = players[(playerIndex + 3) % 3];
        }
        let round = new Round(startPlayer, players, testGameMode);
        let fakePlayers = generateRandomWorldConsistentWithGameKnowledge(testGameMode, fakePlayer.gameKnowledge!, players, fakePlayer, cloneDeep(round));
        fakePlayers.splice(0, 0, fakePlayer);

        let index = 0;
        while (round.getPosition() != round.getPlayerPosition(this.thisPlayer.getName())) {
            let player = players[round.getPosition()];
            player.gamePhase = GamePhase.IN_PLAY;
            player.gameMode = testGameMode;

            let card = player.playCard(round);
            round.addCard(card);
            fakePlayer.onCardPlayed(card, player, index);
            index++;
        }

        let playableCards = getPlayableCards(cardSet, testGameMode, round);

        let valuations = this.runSimulation(fakePlayer, playableCards, testGameMode, [], round);
        let bestValuedCard = chooseBestCard(valuations)!;
        let bestValue = valuations[bestValuedCard]!;

        if (bestValue > CAN_PLAY_THRESHOLD) {
            return [GameModeEnum.WENZ];
        } else {
            return [];
        }
    }

    private testCallGame(playerIndex: number, cardSet: ReadonlyArray<Card>): [GameModeEnum?, PlainColor?] {

        let testGameMode = new GameMode(GameModeEnum.CALL_GAME, this.thisPlayer, PlainColor.EICHEL);
        let callableColors = getCallableColors(cardSet, testGameMode);

        let map = new Map<GameMode, number>();

        for (let callableColor of callableColors) {
            let testGameMode = new GameMode(GameModeEnum.CALL_GAME, this.thisPlayer, callableColor);

            let players = NaiveMonteCarlo.generatePlayers(testGameMode, []);

            let fakePlayer = this.thisPlayer.getDummyClone();
            let startPlayer;
            if (playerIndex == 0) {
                startPlayer = fakePlayer;
            } else {
                startPlayer = players[(playerIndex + 3) % 3];
            }

            let round = new Round(startPlayer, players, testGameMode);
            let fakePlayers = generateRandomWorldConsistentWithGameKnowledge(testGameMode, fakePlayer.gameKnowledge!, players, fakePlayer, cloneDeep(round));
            fakePlayers.splice(0, 0, fakePlayer);

            let index = 0;
            while (round.getPosition() != round.getPlayerPosition(this.thisPlayer.getName())) {
                let player = players[round.getPosition()];
                player.gamePhase = GamePhase.IN_PLAY;
                player.gameMode = testGameMode;

                let card = player.playCard(round);
                round.addCard(card);
                fakePlayer.onCardPlayed(card, player, index);
                index++;
            }

            let playableCards = getPlayableCards(cardSet, testGameMode, round);

            let valuations = this.runSimulation(fakePlayer, playableCards, testGameMode, [], round);
            let bestValuedCard = chooseBestCard(valuations)!;
            let bestValue = valuations[bestValuedCard]!;

            map.set(testGameMode, bestValue);
        }

        let possibleGame = NaiveMonteCarlo.getPossibleGame(map);

        if (possibleGame) {
            return [possibleGame.getMode(), possibleGame.getCalledColor()];
        } else {
            return [];
        }
    }
}