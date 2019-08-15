import GameResult from "./GameResult";
import {shiftRightWithBase} from "../../utils/shiftRightWithBase";

export class StrategyEvaluation {
    // constructor types are too damn complicated!
    readonly strategies: any[];
    private readonly stats: { [index in string]: { wins: number; losses: number } };

    constructor(strategies: any[]) {
        if (strategies.length < 2) {
            throw Error('need at least 2 strategies to compare');
        }
        this.strategies = strategies;
        this.stats = {};
        for (let strategy of strategies) {
            this.stats[strategy.name] = {wins: 0, losses: 0};
        }
    }

    addResult(gameResult: GameResult, run: number) {
        for (let i = 0; i < 4; i++) {
            if (gameResult.getGameMode().isNoRetry()) {
                let strategy = this.getStrategyToEvaluate(run, i);

                if (gameResult.hasPlayerPositionWon(i)) {
                    this.stats[strategy.name].wins++;
                } else {
                    this.stats[strategy.name].losses++
                }
            }
        }
    }

    getStrategyToEvaluate(run: number, position: number) {
        // let's use bit math with any base!
        return this.strategies[shiftRightWithBase(run, position, this.strategies.length) % this.strategies.length];
    }

    getEvaluationForStrategy(strategy: any) {
        return this.stats[strategy.name];
    }
}