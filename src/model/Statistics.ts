import GameResult from "./GameResult";
import {GameModeEnum} from "./GameMode";
import {Player} from "./Player";
import {includes} from "lodash";

interface Stats {
    wins: number;
    cents: number;
    inPlayingTeam: number;
    retries: number;
    ownWins: number;
    ownSoloWins: number;
    ownSoloPlays: number;
    ownPlays: number;
    tournamentPoints: number;
}

export default class Statistics {
    //private readonly results: GameResult[];
    private readonly players: Player[];
    private stats: { [index in string]: Stats };

    constructor(players: Player[]) {
        this.players = players;
        //this.results = [];
        this.stats = {};
        for (let player of players) {
            this.stats[player.getName()] = {
                wins: 0,
                cents: 0,
                inPlayingTeam: 0,
                retries: 0,
                ownWins: 0,
                ownSoloWins: 0,
                ownSoloPlays: 0,
                ownPlays: 0,
                tournamentPoints: 0,
            };
        }
    }

    getStatsForPlayer(player: Player) {
        return this.stats[player.getName()]!;
    }

    addResult(gameResult: GameResult) {
        // this.results.push(gameResult);
        this.updateStatistics(gameResult);
    }

    private updateStatistics(result: GameResult) {
        for (let player of this.players) {
            let {wins, cents, inPlayingTeam, retries, ownPlays, ownWins, ownSoloWins, ownSoloPlays, tournamentPoints} = this.stats[player.getName()]!;

            if (result.getGameMode().isNoRetry() && player.getName() == result.getGameMode().getCallingPlayer().getName()) {
                ownPlays = ownPlays + 1;

                if (result.hasPlayingTeamWon()) {
                    ownWins = ownWins + 1;
                }

                if (result.getGameMode().getMode() === GameModeEnum.SOLO || result.getGameMode().getMode() === GameModeEnum.WENZ) {
                    if (result.hasPlayingTeamWon()) {
                        ownSoloWins = ownSoloWins + 1;
                    }

                    ownSoloPlays = ownSoloPlays + 1;
                }
            }

            if (result.getGameMode().getMode() === GameModeEnum.CALL_GAME) {
                if (includes(result.getPlayingTeam(), player)) {
                    inPlayingTeam = inPlayingTeam + 1;
                }

                if (result.hasPlayingTeamWon() && includes(result.getPlayingTeam(), player)) {
                    wins = wins + 1;
                    cents = cents + result.getGameMoneyValue();
                    tournamentPoints = tournamentPoints + result.getTournamentPointsValue();
                } else if (!result.hasPlayingTeamWon() && !includes(result.getPlayingTeam(), player)) {
                    wins = wins + 1;
                    cents = cents + result.getGameMoneyValue();
                    tournamentPoints = tournamentPoints + result.getTournamentPointsValue();

                } else {
                    cents = cents - result.getGameMoneyValue();
                    tournamentPoints = tournamentPoints - result.getTournamentPointsValue();
                }
            } else if (result.getGameMode().getMode() === GameModeEnum.SOLO || result.getGameMode().getMode() === GameModeEnum.WENZ) {
                if (includes(result.getPlayingTeam(), player)) {
                    inPlayingTeam = inPlayingTeam + 1;
                }
                if (result.hasPlayingTeamWon() && includes(result.getPlayingTeam(), player)) {
                    wins = wins + 1;
                    cents = cents + result.getGameMoneyValue() * 3;
                    tournamentPoints = tournamentPoints + result.getTournamentPointsValue();
                } else if (result.hasPlayingTeamWon() && !includes(result.getPlayingTeam(), player)) {
                    cents = cents - result.getGameMoneyValue();
                    tournamentPoints = tournamentPoints - result.getTournamentPointsValue();
                } else if (!result.hasPlayingTeamWon() && !includes(result.getPlayingTeam(), player)) {
                    wins = wins + 1;
                    cents = cents + result.getGameMoneyValue();
                    tournamentPoints = tournamentPoints + result.getTournamentPointsValue();
                } else {
                    cents = cents - result.getGameMoneyValue() * 3;
                    tournamentPoints = tournamentPoints - result.getTournamentPointsValue() * 3;
                }
            } else if (result.getGameMode().getMode() === GameModeEnum.RETRY) {
                retries = retries + 1;
            } else {
                throw Error('not implemented');
            }
            this.stats[player.getName()] = {
                wins,
                cents,
                inPlayingTeam,
                retries,
                ownWins,
                ownSoloWins,
                ownSoloPlays,
                ownPlays,
                tournamentPoints
            };
        }
    }
}