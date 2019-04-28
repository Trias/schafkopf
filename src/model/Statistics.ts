import GameResult from "./GameResult";
import {GameModeEnum} from "./GameMode";

export default class Statistics {
    private readonly results: GameResult[];

    constructor(results: GameResult[]) {
        this.results = results;
    }

    getStatisticsForPlayerAtSeat(index: number): [number, number, number, number] {
        let wins = 0;
        let cents = 0;
        let inPlayingTeam = 0;
        let retries = 0;
        for (let result of this.results) {
            if (result.getGameMode() === GameModeEnum.CALL_GAME) {
                if (result.hasPlayingTeamWon() && result.getPlayingTeam().indexOf(result.getPlayerByIndex(index)) !== -1) {
                    wins = wins + 1;
                    inPlayingTeam = inPlayingTeam + 1;
                    cents = cents + result.getGameMoneyValue();
                } else if (!result.hasPlayingTeamWon() && result.getPlayingTeam().indexOf(result.getPlayerByIndex(index)) === -1) {
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