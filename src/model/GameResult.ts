import {GameMode, GameModeEnum} from "./GameMode";
import CardRank from "./cards/CardRank";
import Player from "./Player";
import {Round} from "./Round";
import {Card} from "./cards/Card";
import CardsOrdering from "./cards/CardsOrdering";
import CardSet from "./cards/CardSet";
import {includes} from "lodash";

/**
 * who wins with how many points
 */

export default class GameResult{
    private readonly playingTeamPoints: number;
    private readonly playingTeam: [Player?, Player?];
    private readonly pointsByPlayer: Map<Player, number>;
    private readonly players: readonly Player[];
    private readonly gameMode: GameMode;
    private readonly rounds: readonly Round[];

    constructor(gameMode: GameMode, rounds: readonly Round[], players: readonly Player[]) {
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
        return this.gameMode;
    }

    getPlayingTeamPoints(){
        return this.playingTeamPoints;
    }

    hasPlayingTeamWon(){
        return this.playingTeamPoints > 60;
    }

    determinePlayingTeamPoints(): number {
        if(this.gameMode.getMode() === GameModeEnum.CALL_GAME){
            let playingTeam = this.playingTeam as [Player, Player];
            return this.getPoints(playingTeam[0]) + this.getPoints(playingTeam[1]);
        } else if (this.gameMode.getMode() === GameModeEnum.SOLO || this.gameMode.getMode() === GameModeEnum.WENZ) {
            let playingTeam = this.playingTeam as [Player];
            return this.getPoints(playingTeam[0]);
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
            let roundWinner = round.getWinningPlayer(this.gameMode);
            let pointsAdded = round.getPoints();
            let oldPoints = pointsByPlayer.get(roundWinner)!;
            let newPoints = pointsAdded + oldPoints;
            pointsByPlayer.set(roundWinner, newPoints);
        }

        return pointsByPlayer;
    }

    getPoints(player: Player): number{
        return this.pointsByPlayer.get(player)!;
    }

    determinePlayingTeam() :[Player?, Player?] {
        if (this.gameMode.getMode() === GameModeEnum.CALL_GAME) {
            let callingPlayer = this.gameMode.getCallingPlayer()!;
            let calledAce = this.gameMode.getColorOfTheGame() + CardRank.ACE as Card;

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

    getGameMoneyValue() {
        if (this.gameMode.getMode() == GameModeEnum.CALL_GAME) {
            let baseValue = 10 + this.getAddedValue();
            return baseValue * 2 ** this.gameMode.getKlopfer();
        } else if (this.gameMode.getMode() == GameModeEnum.SOLO || this.gameMode.getMode() == GameModeEnum.WENZ) {
            let baseValue = 50 + this.getAddedValue();
            return baseValue * 2 ** this.gameMode.getKlopfer();
        } else if (this.gameMode.getMode() == GameModeEnum.RETRY) {
            return 0;
        } else {
            throw Error('not implemented');
        }
    }

    private getAddedValue() {
        let laufende = this.getLaufende();
        let schneider = this.getPlayingTeamPoints() > 90 || this.getPlayingTeamPoints() <= 30;
        let schwarz = this.getPlayingTeamRounds().length == 0 || this.getPlayingTeamRounds().length == 8;
        return laufende * 10 + (schneider ? 10 : 0) + (schwarz ? 10 : 0);
    }

    private getLaufende(): number {
        if (this.gameMode.getMode() == GameModeEnum.RETRY) {
            return 0;
        } else {
            let trumpOrdering = this.gameMode.getOrdering().getTrumpOrdering();

            if (this.gameMode.getMode() == GameModeEnum.SOLO) {
                // as per official rules, solo can only have 8 laufende...
                trumpOrdering = trumpOrdering.slice(0, 8);
            }
            let sortedWinnerTrumpSet = this.getSortedWinnerTrumpSet(trumpOrdering);

            if (sortedWinnerTrumpSet.length === 0) {
                return trumpOrdering.length;
            }

            let laufende = 0;
            let mitLaufenden = sortedWinnerTrumpSet[0] === trumpOrdering[0];

            if (mitLaufenden) {
                for (laufende; laufende < sortedWinnerTrumpSet.length; laufende++) {
                    if (sortedWinnerTrumpSet[laufende] !== trumpOrdering[laufende]) {
                        break;
                    }
                }
            } else {
                laufende = trumpOrdering.indexOf(sortedWinnerTrumpSet[0]);
                if (laufende < 1) {
                    throw Error('laufende error in calculation');
                }
            }

            if ((this.gameMode.getMode() == GameModeEnum.SOLO || this.gameMode.getMode() == GameModeEnum.CALL_GAME) && laufende > 2) {
                return laufende;
            } else if (this.gameMode.getMode() == GameModeEnum.WENZ && laufende > 1) {
                return laufende;
            } else {
                return 0;
            }
        }
    }

    private getSortedWinnerTrumpSet(trumpSet: readonly Card[]) {
        let playingTeam = this.getPlayingTeam();
        let winnerTrumpSet;
        if (this.gameMode.getMode() == GameModeEnum.CALL_GAME) {
            let playingTeamCallGame = playingTeam as [Player, Player];

            winnerTrumpSet = playingTeamCallGame[0].getStartCardSet().concat(playingTeamCallGame[1].getStartCardSet());
        } else if (this.gameMode.getMode() == GameModeEnum.SOLO || this.gameMode.getMode() == GameModeEnum.WENZ) {
            let playingTeamSolo = playingTeam as [Player];

            winnerTrumpSet = playingTeamSolo[0].getStartCardSet();
        } else {
            throw Error('not Implemented');
        }

        return CardsOrdering.sortAndFilterBy(trumpSet, winnerTrumpSet);
    }

    private getPlayingTeamRounds(): Round[] {
        let playingTeam = this.getPlayingTeam();
        let playingTeamRounds = [];

        for (let round of this.rounds) {
            if (includes(playingTeam, round.getWinningPlayer(this.gameMode))) {
                playingTeamRounds.push(round);
            }
        }
        return playingTeamRounds;
    }
}