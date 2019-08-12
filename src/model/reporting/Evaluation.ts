import {Player, PlayerOptions} from "../Player";
import {RuleEvaluation} from "./RuleEvaluation";
import {StrategyEvaluation} from "./StrategyEvaluation";

export type EvaluationOptions = {
    strategy: any[],
    blacklists?: string[][],
}

export class Evaluation {
    readonly ruleEvaluation: RuleEvaluation;
    readonly callingRuleEvaluation: RuleEvaluation;
    readonly strategyEvaluation: StrategyEvaluation;
    readonly blacklists?: string[][];
    private readonly playerNames: string[];

    constructor(playerNames: string[], options: EvaluationOptions) {
        this.playerNames = playerNames;
        this.ruleEvaluation = new RuleEvaluation();
        this.callingRuleEvaluation = new RuleEvaluation();
        this.strategyEvaluation = new StrategyEvaluation(options.strategy);
        this.blacklists = options.blacklists;
    }

    makePlayerMap(j: number, blacklist?: string[]) {
        let playerMap: { [index in string]: Player } = {};
        for (let i = 0; i < 4; i++) {
            let options: PlayerOptions = {name: this.playerNames[i]};

            options.strategy = this.strategyEvaluation.getStrategyToEvaluate(j, i);
            options.ruleEvaluation = this.ruleEvaluation;
            options.callingRuleEvaluation = this.callingRuleEvaluation;

            if (blacklist) {
                options.ruleBlacklist = blacklist;
            }

            playerMap[this.playerNames[i]] = new Player(options)
        }
        return playerMap;
    };
}