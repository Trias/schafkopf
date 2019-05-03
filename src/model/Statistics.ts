import GameResult from "./GameResult";
import {GameModeEnum} from "./GameMode";
import Player from "./Player";
import {includes} from "lodash";

type Stats = {
    wins: number;
    cents: number;
    inPlayingTeam: number;
    retries: number;
    ownWins: number;
    ownSoloWins: number;
    ownSoloPlays: number;
    ownPlays: number;
}

export default class Statistics {
    //private readonly results: GameResult[];
    private readonly players: Player[];
    private stats: Map<Player, Stats>;

    constructor(players: Player[]) {
        this.players = players;
        //this.results = [];
        this.stats = new Map<Player, Stats>();
        for (let player of players) {
            this.stats.set(player, {
                wins: 0,
                cents: 0,
                inPlayingTeam: 0,
                retries: 0,
                ownWins: 0,
                ownSoloWins: 0,
                ownSoloPlays: 0,
                ownPlays: 0
            });
        }
    }

    getStatsForPlayer(player: Player) {
        return this.stats.get(player)!;
    }

    addResult(gameResult: GameResult) {
        // this.results.push(gameResult);
        this.updateStatistics(gameResult);
    }

    private updateStatistics(result: GameResult) {
        for (let player of this.players) {
            let {wins, cents, inPlayingTeam, retries, ownPlays, ownWins, ownSoloWins, ownSoloPlays} = this.stats.get(player)!;

            if (player == result.getGameMode().getCallingPlayer()) {
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
                } else if (!result.hasPlayingTeamWon() && !includes(result.getPlayingTeam(), player)) {
                    wins = wins + 1;
                    cents = cents + result.getGameMoneyValue();
                } else {
                    cents = cents - result.getGameMoneyValue();
                }
            } else if (result.getGameMode().getMode() === GameModeEnum.SOLO || result.getGameMode().getMode() === GameModeEnum.WENZ) {
                if (includes(result.getPlayingTeam(), player)) {
                    inPlayingTeam = inPlayingTeam + 1;
                }
                if (result.hasPlayingTeamWon() && includes(result.getPlayingTeam(), player)) {
                    wins = wins + 1;
                    cents = cents + result.getGameMoneyValue() * 3;
                } else if (result.hasPlayingTeamWon() && !includes(result.getPlayingTeam(), player)) {
                    cents = cents - result.getGameMoneyValue();
                } else if (!result.hasPlayingTeamWon() && !includes(result.getPlayingTeam(), player)) {
                    wins = wins + 1;
                    cents = cents + result.getGameMoneyValue();
                } else {
                    cents = cents - result.getGameMoneyValue() * 3;
                }
            } else if (result.getGameMode().getMode() === GameModeEnum.RETRY) {
                retries = retries + 1;
            } else {
                throw Error('not implemented');
            }
            this.stats.set(player, {wins, cents, inPlayingTeam, retries, ownWins, ownSoloWins, ownSoloPlays, ownPlays});
        }
    }
}