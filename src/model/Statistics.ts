import GameResult from "./GameResult";
import {GameModeEnum} from "./GameMode";
import Player from "./Player";
import {includes} from "lodash";

export default class Statistics {
    private readonly results: GameResult[];

    constructor(results: GameResult[]) {
        this.results = results;
    }

    getStatisticsForPlayer(player: Player): [number, number, number, number] {
        let wins = 0;
        let cents = 0;
        let inPlayingTeam = 0;
        let retries = 0;
        for (let result of this.results) {
            if (result.getGameMode() === GameModeEnum.CALL_GAME) {
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
            } else if (result.getGameMode() === GameModeEnum.RETRY) {
                retries = retries + 1;
            } else {
                throw Error('not implemented');
            }

        }
        return [wins, cents, inPlayingTeam, retries];
    }
}