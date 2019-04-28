import {GameMode, GameModeEnum} from "./GameMode";
import CardFaceEnum from "./CardFaceEnum";
import Player from "./Player";
import Round from "./Round";
import {CardEnum} from "./Card";
import TrumpOrderingCallGame from "./orderings/TrumpOrderingCallGame";
import Ordering from "./orderings/Ordering";
import CardSet from "./CardSet";
import {includes} from "lodash";

/**
 * who wins with how many points
 */

export default class GameResult{
    private readonly playingTeamPoints: number;
    private readonly playingTeam: [Player?, Player?];
    private readonly pointsByPlayer: Map<Player, number>;
    private readonly players: Player[];
    private readonly gameMode: GameMode;
    private readonly rounds: Round[];

    constructor(gameMode: GameMode, rounds: Round[], players: Player[]){
        this.gameMode = gameMode;
        this.rounds = rounds;
        this.players = players;

        this.pointsByPlayer = this.determinePointsByPlayer();
        this.playingTeam = this.determinePlayingTeam();
        this.playingTeamPoints = this.determinePlayingTeamPoints();
    }

    getPlayingTeam(){
        return this.playingTeam;
    }

    getGameMode() {
        return this.gameMode.getMode();
    }

    getPlayingTeamPoints(){
        return this.playingTeamPoints;
    }

    hasPlayingTeamWon(){
        return this.playingTeamPoints > 60;
    }

    determinePlayingTeamPoints(): number {
        if(this.gameMode.getMode() === GameModeEnum.CALL_GAME){
            let playingTeam = this.playingTeam as[Player, Player];
            return this.getPoints(playingTeam[0]) + this.getPoints(playingTeam[1]);
        }else if(this.gameMode.getMode() === GameModeEnum.RETRY) {
            return 0;
        }else {
            throw Error('not implemented');
        }
    }

    determinePointsByPlayer(): Map<Player, number> {
        let pointsByPlayer = new Map<Player, number>();
        for(let i = 0; i < 4; i++){
            pointsByPlayer.set(this.players[i], 0);
        }
        for (let i = 0; i < this.rounds.length; i++) {
            let round = this.rounds[i];
            let roundWinner = round.getWinningPlayer(this.gameMode, this.players);
            let pointsAdded = round.getPoints();
            let oldPoints = pointsByPlayer.get(roundWinner) as number;
            let newPoints = pointsAdded + oldPoints;
            pointsByPlayer.set(roundWinner, newPoints);
        }

        return pointsByPlayer;
    }

    getPoints(player: Player): number{
        return this.pointsByPlayer.get(player) as number;
    }

    determinePlayingTeam() :[Player?, Player?] {
        if (this.gameMode.getMode() === GameModeEnum.CALL_GAME) {
            let callingPlayer = this.gameMode.getCallingPlayer() as Player;
            let calledAce = this.gameMode.getColor() + CardFaceEnum.ACE as CardEnum;

            for(let i = 0; i< 4;i++){
                if (CardSet.hasCard(this.players[i].getStartCardSet(), calledAce)) {
                    return [callingPlayer, this.players[i]];
                }
            }

            throw Error('invalid call');
        } else {
            if(this.gameMode.getCallingPlayer()){
                return [this.gameMode.getCallingPlayer()];
            }else{
                return [];
            }
        }
    }

    getPlayerByIndex(index: number): Player {
        return this.players[index];
    }

    getGameMoneyValue() {
        if (this.gameMode.getMode() == GameModeEnum.CALL_GAME) {
            let laufende = this.getLaufende();
            let schneider = this.getPlayingTeamPoints() > 90 || this.getPlayingTeamPoints() <= 30;
            let schwarz = this.getPlayingTeamRounds().length == 0 || this.getPlayingTeamRounds().length == 8;
            return 10 + (laufende > 2 ? laufende : 0) * 10 + (schneider ? 10 : 0) + (schwarz ? 10 : 0);
        } else if (this.gameMode.getMode() == GameModeEnum.SOLO || this.gameMode.getMode() == GameModeEnum.WENZ) {
            return 50;
        } else if (this.gameMode.getMode() == GameModeEnum.RETRY) {
            return 0;
        } else {
            throw Error('not implemented');
        }
    }

    private getLaufende(): number {
        let playingTeam = this.getPlayingTeam();
        if (this.gameMode.getMode() == GameModeEnum.CALL_GAME) {
            let playingTeamCallGame = playingTeam as [Player, Player];
            let winnerCardSet = playingTeamCallGame[0].getStartCardSet().concat(playingTeamCallGame[1].getStartCardSet());
            let sortedWinnerCardSet = Ordering.sortAndFilterBy(TrumpOrderingCallGame, winnerCardSet);

            let laufende = 0;

            if (sortedWinnerCardSet.length === 0) {
                return TrumpOrderingCallGame.length;
            }

            let positive = sortedWinnerCardSet[0] === TrumpOrderingCallGame[0];

            if (positive) {
                for (laufende; laufende < sortedWinnerCardSet.length; laufende++) {

                    if (sortedWinnerCardSet[laufende] !== TrumpOrderingCallGame[laufende]) {
                        break;
                    }
                }
            } else {
                laufende = TrumpOrderingCallGame.indexOf(sortedWinnerCardSet[0]);
                if (laufende < 1) {
                    throw Error('laufende error in calculation');
                }
            }

            return laufende;
        } else if (this.gameMode.getMode() == GameModeEnum.RETRY) {
            return 0;
        }

        throw Error('not implemented');
    }

    private getPlayingTeamRounds(): Round[] {
        let playingTeam = this.getPlayingTeam();
        let playingTeamRounds = [];

        for (let round of this.rounds) {
            if (includes(playingTeam, round.getWinningPlayer(this.gameMode, this.players))) {
                playingTeamRounds.push(round);
            }
        }
        return playingTeamRounds;
    }
}