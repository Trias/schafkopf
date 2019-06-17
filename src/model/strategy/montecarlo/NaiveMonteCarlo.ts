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
import {cloneDeep, find, reduce} from "lodash";
import RandomStrategy from "../random";
import {determineGameMode} from "../rules/shouldCall/determineGameMode";
import GamePhase from "../../GamePhase";

const colors = require('colors');

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

    chooseCardToPlay(round: Round, cardSet: readonly Card[], gameMode: GameMode, playedRounds: readonly FinishedRound[]): Card {

        let myRound = cloneDeep(round); // probably unneccessary...
        if (round.getPosition() != round.getPlayerPosition(this.thisPlayer.getName())) {
            throw Error('player not to move');
        }

        let playableCards = getPlayableCards(cardSet, gameMode, myRound);

        if (playableCards.length == 1) {
            return playableCards[0];
        }

        let valuations = this.runSimulation(playableCards, gameMode, playedRounds, myRound);

        console.log('valuations:' + colors.green(JSON.stringify(valuations)));

        return chooseBestCard(valuations)!;
    }

    runSimulation(playableCards: Card[], gameMode: GameMode, playedRounds: readonly FinishedRound[], myRound: Round) {
        let simulations = 10;
        let runsPerSimulation = 100;
        let otherPlayers = NaiveMonteCarlo.generatePlayers(gameMode, playedRounds);
        let valuations: { [index in string]?: number } = {};

        let fakePlayer = this.thisPlayer.getDummyClone();

        let wins: { [index in Card]?: number[] } = {};

        // parallize?
        for (let i = 0; i < simulations; i++) {
            let fakePlayers = generateRandomWorldConsistentWithGameKnowledge(gameMode, this.thisPlayer.gameKnowledge!, otherPlayers, this.thisPlayer, myRound);
            fakePlayers.splice(0, 0, fakePlayer);
            //console.log(colors.grey(`${JSON.stringify(fakePlayers.map(p => p.currentCardSet))}`));

            for (let card of playableCards) {
                wins[card] = wins[card] || [];
                for (let j = 0; j < runsPerSimulation; j++) {
                    // todo work with symbols :(
                    let players = cloneDeep(fakePlayers);
                    let fakeRound = cloneDeep(myRound);
                    fakeRound.setPlayers(players);
                    let startPlayer = find(players, p => p.getName() == myRound.getStartPlayer().getName());
                    if (!startPlayer) {
                        throw Error('player not found');
                    }
                    fakeRound.setStartPlayer(startPlayer);

                    let winsSoFar = wins[card]![i] || 0;
                    let win = (this.simulateGame(card, fakeRound, players, gameMode, playedRounds) ? 1 : 0);
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

    simulateGame(card: Card, round: Round, players: Player[], gameMode: GameMode, playedRounds: readonly FinishedRound[]) {
        let myPlayedRounds = cloneDeep(playedRounds) as FinishedRound[];
        let game = new SimulatedGame(players, gameMode, myPlayedRounds);

        let nextPlayer = game.forcePlayCard(round.getCurrentPlayer().getName(), card, round);

        game.simulateRounds(nextPlayer.getName(), playedRounds.length, round);
        let result = game.getGameResult();

        // console.log(colors.blue(`${JSON.stringify(rounds.map(r => r.getCards()))}`) + colors.red(`points: ${JSON.stringify(result.getPlayersPoints(this.thisPlayer.getName()))}`));

        return result.hasPlayerWon(this.thisPlayer.getName());
    }

    chooseGameToCall(cardSet: readonly Card[], previousGameMode: GameMode, playerIndex: number): [GameModeEnum?, PlainColor?] {
        // todo: base on MC
        return determineGameMode(previousGameMode, cardSet);
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
}