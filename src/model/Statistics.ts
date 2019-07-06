import GameResult from "./GameResult";
import {GameModeEnum} from "./GameMode";
import {includes} from "lodash";

interface Stats {
    points: number;
    games: number;
    wins: number;
    cents: number;
    inPlayingTeam: number;
    retries: number;
    ownWins: number;
    ownSoloWins: number;
    ownSoloPlays: number;
    ownPlays: number;
    tournamentPoints: number;
    mitSpielerWins: number;
    opposingTeamWin: number;
    ownGameWins: number;
    ownCallGames: number;
    losses: number;
}

let zeroStats = {
    points: 0,
    games: 0,
    wins: 0,
    cents: 0,
    inPlayingTeam: 0,
    retries: 0,
    ownWins: 0,
    ownSoloWins: 0,
    ownSoloPlays: 0,
    ownPlays: 0,
    tournamentPoints: 0,
    mitSpielerWins: 0,
    opposingTeamWin: 0,
    ownGameWins: 0,
    ownCallGames: 0,
    losses: 0,
};

export default class Statistics {
    private readonly stats: { [index in string]: Stats };
    private readonly playerNames: string[];

    constructor(playerNames: string[]) {
        this.playerNames = playerNames;
        this.stats = {};
        for (let playerName of playerNames) {
            this.stats[playerName] = zeroStats;
        }
    }

    getStatsForPlayer(playerName: string) {
        return this.stats[playerName]!;
    }

    addResult(gameResult: GameResult) {
        this.updateStatistics(gameResult);
    }

    private updateStatistics(result: GameResult) {
        for (let playerName of this.playerNames) {
            let {wins, cents, inPlayingTeam, retries, ownPlays, ownWins, ownSoloWins, ownSoloPlays, tournamentPoints, mitSpielerWins, opposingTeamWin, ownGameWins, ownCallGames, losses, points, games} = this.stats[playerName]!;

            if (result.getGameMode().isNoRetry() && playerName == result.getGameMode().getCallingPlayerName()) {
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
                games = games + 1;
                points = points + result.getTeamPoints(playerName);

                if (includes(result.getPlayingTeamNames(), playerName)) {
                    inPlayingTeam = inPlayingTeam + 1;
                    ownCallGames = ownCallGames + 1;
                }

                if (result.hasPlayingTeamWon() && includes(result.getPlayingTeamNames(), playerName)) {
                    wins = wins + 1;
                    cents = cents + result.getGameMoneyValue();
                    tournamentPoints = tournamentPoints + result.getTournamentPointsValue();

                    if (playerName != result.getGameMode().getCallingPlayerName()) {
                        mitSpielerWins = mitSpielerWins + 1;
                    } else {
                        ownGameWins = ownGameWins + 1;
                    }
                } else if (!result.hasPlayingTeamWon() && !includes(result.getPlayingTeamNames(), playerName)) {
                    wins = wins + 1;
                    cents = cents + result.getGameMoneyValue();
                    tournamentPoints = tournamentPoints + result.getTournamentPointsValue();
                    opposingTeamWin = opposingTeamWin + 1;

                } else {
                    cents = cents - result.getGameMoneyValue();
                    tournamentPoints = tournamentPoints - result.getTournamentPointsValue();
                    losses = losses + 1;
                }
            } else if (result.getGameMode().getMode() === GameModeEnum.SOLO || result.getGameMode().getMode() === GameModeEnum.WENZ) {
                games = games + 1;
                points = points + result.getTeamPoints(playerName);

                if (includes(result.getPlayingTeamNames(), playerName)) {
                    inPlayingTeam = inPlayingTeam + 1;
                }
                if (result.hasPlayingTeamWon() && includes(result.getPlayingTeamNames(), playerName)) {
                    wins = wins + 1;
                    cents = cents + result.getGameMoneyValue() * 3;
                    tournamentPoints = tournamentPoints + result.getTournamentPointsValue() * 3;
                    ownGameWins = ownGameWins + 1;
                } else if (result.hasPlayingTeamWon() && !includes(result.getPlayingTeamNames(), playerName)) {
                    cents = cents - result.getGameMoneyValue();
                    tournamentPoints = tournamentPoints - result.getTournamentPointsValue();
                    losses = losses + 1;
                } else if (!result.hasPlayingTeamWon() && !includes(result.getPlayingTeamNames(), playerName)) {
                    wins = wins + 1;
                    cents = cents + result.getGameMoneyValue();
                    tournamentPoints = tournamentPoints + result.getTournamentPointsValue();
                } else {
                    cents = cents - result.getGameMoneyValue() * 3;
                    tournamentPoints = tournamentPoints - result.getTournamentPointsValue() * 3;
                    losses = losses + 1;
                }
            } else if (result.getGameMode().getMode() === GameModeEnum.RETRY) {
                retries = retries + 1;
            } else {
                throw Error('not implemented');
            }
            this.stats[playerName] = {
                wins,
                cents,
                inPlayingTeam,
                retries,
                ownWins,
                ownSoloWins,
                ownSoloPlays,
                ownPlays,
                tournamentPoints,
                mitSpielerWins,
                opposingTeamWin,
                ownGameWins,
                ownCallGames,
                losses,
                games,
                points,
            };
        }
    }
}