import {GameMode, GameModeEnum} from "../GameMode";
import {PlayerMap} from "../Player";
import {FinishedRound} from "../Round";
import {Card} from "../cards/Card";
import {includes} from "lodash";
import {sortAndFilterBy} from "../cards/CardSet";
import {GameWorld} from "../GameWorld";

export default class GameResult {
    private readonly playingTeamPoints: number;
    private readonly playingTeamNames: string[];
    private readonly pointsByPlayer: { [index in string]: number };
    private readonly playerNames: readonly string[];
    private readonly gameMode: GameMode;
    private readonly rounds: readonly FinishedRound[];
    private readonly playerMap: PlayerMap;

    constructor(world: GameWorld) {
        this.gameMode = world.gameMode;
        this.rounds = world.rounds;
        this.playerNames = Object.keys(world.playerMap);
        this.playerMap = world.playerMap;

        this.pointsByPlayer = this.determinePointsByPlayer();
        this.playingTeamNames = world.history.getPlayingTeamNames();
        this.playingTeamPoints = this.determinePlayingTeamPoints();
    }

    getPlayingTeamNames() {
        return this.playingTeamNames;
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
            let playingTeam = this.playingTeamNames;
            return this.getPoints(playingTeam[0]!) + this.getPoints(playingTeam[1]!);
        } else if (this.gameMode.getMode() === GameModeEnum.SOLO || this.gameMode.getMode() === GameModeEnum.WENZ) {
            let playingTeam = this.playingTeamNames;
            return this.getPoints(playingTeam[0]!);
        }else if(this.gameMode.getMode() === GameModeEnum.RETRY) {
            return 0;
        }else {
            throw Error('not implemented');
        }
    }

    determinePointsByPlayer(): { [index in string]: number } {
        let pointsByPlayer: { [index in string]: number } = {};
        for (let playerName of this.playerNames) {
            pointsByPlayer[playerName] = 0;
        }
        for (let i = 0; i < this.rounds.length; i++) {
            let roundAnalyzer = this.rounds[i].getRoundAnalyzer(this.gameMode);

            let roundWinnerName = roundAnalyzer.getWinningPlayerName();
            let pointsAdded = roundAnalyzer.getPoints();
            let oldPoints = pointsByPlayer[roundWinnerName]!;
            pointsByPlayer[roundWinnerName] = pointsAdded + oldPoints;
        }

        return pointsByPlayer;
    }

    getPoints(playerName: string): number {
        return this.pointsByPlayer[playerName]!;
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

    hasPlayerWon(playerName: string) {
        let isPlayer = includes(this.playingTeamNames, playerName);
        if (isPlayer && this.hasPlayingTeamWon() || !isPlayer && !this.hasPlayingTeamWon()) {
            return true;
        } else {
            return false;
        }
    }

    hasPlayerPositionWon(position: number) {
        return this.hasPlayerWon(this.playerNames[position]);
    }

    private getSortedWinnerTrumpSet(trumpSet: readonly Card[]) {
        let playingTeam = this.getPlayingTeamNames();
        let winnerTrumpSet;
        if (this.gameMode.getMode() == GameModeEnum.CALL_GAME) {
            let playingTeamCallGame = playingTeam;

            winnerTrumpSet = this.playerMap[playingTeamCallGame[0]!].getStartCardSet().concat(this.playerMap[playingTeamCallGame[1]!].getStartCardSet());
        } else if (this.gameMode.getMode() == GameModeEnum.SOLO || this.gameMode.getMode() == GameModeEnum.WENZ) {
            winnerTrumpSet = this.playerMap[playingTeam[0]!].getStartCardSet();
        } else {
            throw Error('not Implemented');
        }

        return sortAndFilterBy(trumpSet, winnerTrumpSet);
    }

    private getPlayingTeamRounds(): FinishedRound[] {
        let playingTeamNames = this.getPlayingTeamNames();
        let playingTeamRounds = [];

        for (let round of this.rounds) {

            if (includes(playingTeamNames, round.getRoundAnalyzer(this.gameMode).getWinningPlayerName())) {
                playingTeamRounds.push(round);
            }
        }
        return playingTeamRounds;
    }

    getTournamentPointsValue() {
        let schneider = (this.getPlayingTeamPoints() > 90 || this.getPlayingTeamPoints() <= 30);
        let schwarz = (this.getPlayingTeamRounds().length == 0 || this.getPlayingTeamRounds().length == 8);
        let add = (schneider ? 1 : 0) + (schwarz ? 1 : 0);

        if (this.getGameMode().isCallGame()) {
            return 1 + add;
        } else {
            return 2 + add;
        }
    }

    getTeamPoints(playerName: string) {
        if (includes(this.playingTeamNames, playerName)) {
            return this.playingTeamPoints;
        } else {
            return 120 - this.playingTeamPoints;
        }
    }
}