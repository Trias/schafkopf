import {GameMode} from "../GameMode";
import {Player} from "../Player";
import {FinishedRound, Round} from "../Round";
import {Card} from "../cards/Card";
import GameResult from "../GameResult";
import {find, findIndex} from "lodash";

export class SimulatedGame {
    private players: readonly Player[];
    private rounds: FinishedRound[];
    private gameMode: GameMode;

    constructor(players: readonly Player[], gameMode: GameMode, playedRounds: FinishedRound[]) {
        this.gameMode = gameMode;
        this.rounds = playedRounds;
        this.players = players;
    }

    simulateRounds(playerName: string, roundIndex: number, round: Round): readonly FinishedRound[] {
        let activePlayer = find(this.players, p => p.getName() == playerName)!;

        for (let i = roundIndex; i < 8; i++) {
            for (let player of this.players) {
                if (round.isLeftPlayerBeforeRightPlayer(activePlayer.getName(), player.getName()) && player.currentCardSet!.length != 8 - i) {
                    //  throw Error('invariant violated');
                } else if (!round.isLeftPlayerBeforeRightPlayer(activePlayer.getName(), player.getName()) && player.currentCardSet!.length != 8 - i - 1) {
                    // throw Error('invariant violated');
                }
            }
            for (let j = round.getPosition(); j < 4; j++) {
                let card = activePlayer.playCard(round);
                round.addCard(card);
                this.notifyPlayersOfCardPlayed(card, activePlayer, j);
                activePlayer = this.nextPlayer(activePlayer.getName());
            }
            for (let player of this.players) {
                if (player.currentCardSet!.length != 8 - i - 1) {
                    // throw Error('invariant violated');
                }
            }

            this.notifyPlayersOfRoundCompleted(round.finish());
            this.markCalledAce(round);

            this.rounds.push(round);

            activePlayer = round.getWinningPlayer() as Player;
            round = round.nextRound(activePlayer);
        }

        return this.rounds;
    }

    notifyPlayersOfCardPlayed(card: Card, activePlayer: Player, j: number) {
        for (let i = 0; i < 4; i++) {
            this.players[i].onCardPlayed(card, activePlayer, j);
        }
    }

    nextPlayer(playerName: string) {
        let playerIndex = findIndex(this.players, (p => p.getName() == playerName));
        if (playerIndex < 0) {
            throw Error('player not found');
        }
        return this.players[(playerIndex + 1) % 4];
    }

    getGameResult() {
        if (this.rounds.length != 8) {
            throw Error('not finished yet!');
        }
        return new GameResult(this.gameMode, this.rounds!, this.players);
    }

    forcePlayCard(playerName: string, card: Card, round: Round) {
        let activePlayer = find(this.players, p => p.getName() == playerName)!;
        activePlayer.forcePlayCard(card);
        round.addCard(card);
        this.notifyPlayersOfCardPlayed(card, activePlayer, round.getPosition());
        activePlayer = this.nextPlayer(activePlayer.getName());
        return activePlayer;
    }

    private markCalledAce(round: Round) {
        if (this.gameMode!.isCallGame()
            && !this.gameMode!.getHasAceBeenCalled()
            && round.getRoundColor() == this.gameMode!.getColorOfTheGame()
        ) {
            this.gameMode!.setHasAceBeenCalled();
        }
    }

    private notifyPlayersOfRoundCompleted(finishedRound: FinishedRound) {
        for (let i = 0; i < 4; i++) {
            this.players[i].onRoundCompleted(finishedRound, this.rounds.length);
        }
    }
}