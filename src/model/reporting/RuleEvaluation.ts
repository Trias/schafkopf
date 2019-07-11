import GameResult from "./GameResult";
import {clone, intersection} from "lodash";

type RuleStats = { [index in string]: { wins: number; losses: number; } };
type RulesByPlayer = { [index in string]: string[][] };

export class RuleEvaluation {
    private ruleStats: { [index in string]: { wins: number; losses: number; } } = {};
    private blackListedRuleStats: { [index in string]: { wins: number; losses: number; } } = {};
    private usedRulesByPlayer: RulesByPlayer = {};
    private usedBlacklistedRulesByPlayer: { [index in string]: string[][] } = {};

    addRule(playerName: string, rule: string[]) {
        this.usedRulesByPlayer[playerName] = this.usedRulesByPlayer[playerName] || [];
        this.usedRulesByPlayer[playerName].push(clone(rule));
    }

    private static updateStats(gameResult: GameResult, ruleStats: RuleStats, usedRulesByPlayer: RulesByPlayer) {
        for (let playerName of Object.keys(usedRulesByPlayer)) {
            let usedRulesUniq = intersection(usedRulesByPlayer[playerName]);

            for (let rule of usedRulesUniq) {
                let rulePath = rule;//.slice(0, i + 1);
                ruleStats[rulePath.toString()] = ruleStats[rulePath.toString()] || {wins: 0, losses: 0};

                if (gameResult.hasPlayerWon(playerName)) {
                    ruleStats[rulePath.toString()].wins = ruleStats[rulePath.toString()].wins + 1;
                } else {
                    ruleStats[rulePath.toString()].losses = ruleStats[rulePath.toString()].losses + 1;
                }
            }
        }
    }

    gradeRules(gameResult: GameResult) {
        // compare blacklisted with normal results...
        if (!Object.keys(this.usedBlacklistedRulesByPlayer).length) {
            RuleEvaluation.updateStats(gameResult, this.ruleStats, this.usedRulesByPlayer);
        } else {
            RuleEvaluation.updateStats(gameResult, this.blackListedRuleStats, this.usedBlacklistedRulesByPlayer);
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