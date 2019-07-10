import GameResult from "./GameResult";
import {clone} from "lodash";

export class RuleEvaluation {
    private ruleStats: { [index in string]: { wins: number; losses: number; } } = {};
    private blackListedRuleStats: { [index in string]: { wins: number; losses: number; } } = {};
    private usedRulesByPlayer: { [index in string]: string[][] } = {};
    private usedBlacklistedRulesByPlayer: { [index in string]: string[][] } = {};

    addRule(playerName: string, rule: string[]) {
        this.usedRulesByPlayer[playerName] = this.usedRulesByPlayer[playerName] || [];
        this.usedRulesByPlayer[playerName].push(clone(rule));
    }

    gradeRules(gameResult: GameResult) {
        for (let playerName of Object.keys(this.usedRulesByPlayer)) {
            for (let rule of this.usedRulesByPlayer[playerName]) {
                let rulePath = rule;//.slice(0, i + 1);
                this.ruleStats[rulePath.toString()] = this.ruleStats[rulePath.toString()] || {wins: 0, losses: 0};

                if (gameResult.hasPlayerWon(playerName)) {
                    this.ruleStats[rulePath.toString()].wins = this.ruleStats[rulePath.toString()].wins + 1;
                } else {
                    this.ruleStats[rulePath.toString()].losses = this.ruleStats[rulePath.toString()].losses + 1;
                }
            }
        }

        for (let playerName of Object.keys(this.usedBlacklistedRulesByPlayer)) {
            for (let rule of this.usedBlacklistedRulesByPlayer[playerName]) {
                let rulePath = rule;//.slice(0, i + 1);
                this.blackListedRuleStats[rulePath.toString()] = this.blackListedRuleStats[rulePath.toString()] || {
                    wins: 0,
                    losses: 0
                };

                if (gameResult.hasPlayerWon(playerName)) {
                    this.blackListedRuleStats[rulePath.toString()].wins = this.blackListedRuleStats[rulePath.toString()].wins + 1;
                } else {
                    this.blackListedRuleStats[rulePath.toString()].losses = this.blackListedRuleStats[rulePath.toString()].losses + 1;
                }
            }
        }
        this.usedRulesByPlayer = {};
        this.usedBlacklistedRulesByPlayer = {};
    }

    getRuleStatistics() {
        return this.ruleStats;
    }

    getBlackListedRuleStatistics() {
        return this.blackListedRuleStats;
    }

    addBlacklistedRule(playerName: string, ruleApplied: string[]) {
        this.usedBlacklistedRulesByPlayer[playerName] = this.usedBlacklistedRulesByPlayer[playerName] || [];
        this.usedBlacklistedRulesByPlayer[playerName].push(clone(ruleApplied));
    }
}