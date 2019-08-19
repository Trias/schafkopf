import GameResult from "./GameResult";
import {clone, intersection, union} from "lodash";

type RuleStats = { [index in string]: { wins: number; losses: number; } };
type RulesByPlayer = { [index in string]: string[] };

export type RuleStat = {
    withRuleWins: number;
    withRuleLosses: number;
    withoutRuleWins: number;
    withoutRuleLosses: number;
}

export class RuleEvaluation {
    private readonly ruleStats: { [index in string]: { wins: number; losses: number; } } = {};
    private readonly blackListedRuleStats: { [index in string]: { wins: number; losses: number; } } = {};

    // refactor to sets, bad usage...
    private usedRulesByPlayer: RulesByPlayer = {};
    private usedBlacklistedRulesByPlayer: { [index in string]: string[] } = {};
    private usedRules: string[] = [];

    private static updateStats(gameResult: GameResult, ruleStats: RuleStats, usedRules: string[], playerName: string) {
        let usedRulesUniq = intersection(usedRules);

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

    addRule(playerName: string, rule: string[]) {
        this.usedRulesByPlayer[playerName] = this.usedRulesByPlayer[playerName] || [];
        this.usedRulesByPlayer[playerName].push(rule.toString());
        this.usedRules.push(rule.toString());

        let ruleClone = clone(rule);
        ruleClone.pop();
        while (ruleClone.length) {
            this.usedRules.push(ruleClone.toString());
            this.usedRulesByPlayer[playerName].push(ruleClone.toString());
            ruleClone.pop();
        }
    }

    gradeRules(gameResult: GameResult, blacklist: string[] | null = null) {
        // compare blacklisted with normal results...
        if (blacklist) {
            let rulesToCompare = intersection(this.usedRules, blacklist);
            let playerNames = union(Object.keys(this.usedBlacklistedRulesByPlayer), Object.keys(this.usedRulesByPlayer));
            for (let playerName of playerNames) {
                let rulesToCompareForPlayerWhitelist = intersection(rulesToCompare, this.usedRulesByPlayer[playerName] || []);
                let rulesToCompareForPlayerBlacklist = intersection(rulesToCompare, this.usedBlacklistedRulesByPlayer[playerName] || []);

                if (rulesToCompareForPlayerWhitelist.length) {
                    RuleEvaluation.updateStats(gameResult, this.ruleStats, rulesToCompareForPlayerWhitelist, playerName);
                } else if (rulesToCompareForPlayerBlacklist.length) {
                    RuleEvaluation.updateStats(gameResult, this.blackListedRuleStats, rulesToCompareForPlayerBlacklist, playerName);
                }
            }
        } else {
            for (let playerName of Object.keys(this.usedRulesByPlayer)) {
                RuleEvaluation.updateStats(gameResult, this.ruleStats, this.usedRulesByPlayer[playerName], playerName);
            }
        }

        this.usedRulesByPlayer = {};
        this.usedBlacklistedRulesByPlayer = {};
        this.usedRules = [];
    }

    getRuleStatistics() {
        return this.ruleStats;
    }

    getBlackListedRuleStatistics() {
        return this.blackListedRuleStats;
    }

    static getCompleteCombinedRuleStatistics(allRules: string[], ruleStats: { [index in string]: RuleStat }) {
        for (let rule of allRules) {
            if (!(rule in ruleStats)) {
                ruleStats[rule] = {
                    withRuleWins: 0,
                    withRuleLosses: 0,
                    withoutRuleWins: 0,
                    withoutRuleLosses: 0,
                }
            }
        }
        return ruleStats;
    }

    addBlacklistedRule(playerName: string, rule: string[]) {
        this.usedBlacklistedRulesByPlayer[playerName] = this.usedBlacklistedRulesByPlayer[playerName] || [];
        this.usedBlacklistedRulesByPlayer[playerName].push(rule.toString());
        this.usedRules.push(rule.toString());

        let ruleClone = clone(rule);
        ruleClone.pop();
        while (ruleClone.length) {
            this.usedRules.push(ruleClone.toString());
            this.usedBlacklistedRulesByPlayer[playerName].push(ruleClone.toString());
            ruleClone.pop();
        }
    }

    getCombinedRuleStatistics() {
        let ruleStatistics = this.getRuleStatistics();
        let blackListedRuleStatistics = this.getBlackListedRuleStatistics();
        let rules = Object.keys(ruleStatistics).sort();

        let combinedRules: { [index in string]: RuleStat } = {};

        for (let rule of rules) {
            let ruleStat = ruleStatistics[rule];
            let blacklistedRuleStat = blackListedRuleStatistics[rule];
            if (blacklistedRuleStat && ruleStat) {

                combinedRules[rule] = {
                    withRuleWins: ruleStat.wins,
                    withRuleLosses: ruleStat.losses,
                    withoutRuleWins: blacklistedRuleStat.wins,
                    withoutRuleLosses: blacklistedRuleStat.losses
                };
            }
        }
        return combinedRules;
    }
}