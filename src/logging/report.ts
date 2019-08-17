import {PlayerMap} from "../model/Player";
import Statistics from "../model/reporting/Statistics";
import log from "./log";
import {RuleEvaluation} from "../model/reporting/RuleEvaluation";
import {StrategyEvaluation} from "../model/reporting/StrategyEvaluation";
import {Game} from "../model/Game";
import GameResult from "../model/reporting/GameResult";

export function reportCents(playerMap: PlayerMap, stats: Statistics, i: number) {
    let playerNames = Object.keys(playerMap);
    log.report(`balance after ${i + 1} games`);
    for (let i = 0; i < 4; i++) {
        let playerStats = stats.getStatsForPlayer(playerNames[i]);
        log.report(`${playerNames[i]} [${playerMap[playerNames[i]].getStartCardSet()}] (${playerMap[playerNames[i]].getStrategyName()}): ${playerStats.cents} (${playerStats.tournamentPoints} points, ${playerStats.wins} wins, ${playerStats.losses} losses, ${playerStats.inPlayingTeam} playing, ${playerStats.points / playerStats.games} points on average`);
    }
}

export function reportOnCallingRules(callingRuleEvaluation: RuleEvaluation, i: number) {
    log.info(`calling rule evaluation after ${i + 1} games`);
    let ruleStatistics = callingRuleEvaluation.getRuleStatistics();
    let rules = Object.keys(ruleStatistics).sort();
    for (let rule of rules) {
        let evalu = ruleStatistics[rule];
        log.stats(`evaluation for calling rule "${rule}" has ${evalu.wins} wins and ${evalu.losses} losses which gives a win ratio of ${evalu.wins / (evalu.losses + evalu.wins)}`);
    }
}

export function reportOnStrategies(evaluation: StrategyEvaluation, i: number) {
    log.info(`strategy evaluation after ${i + 1} games`);
    for (let strategy of evaluation.strategies) {
        let evalu = evaluation.getEvaluationForStrategy(strategy);
        log.stats(`evaluation for strategy ${strategy.name} has ${evalu.wins} wins and ${evalu.losses} losses`);
    }
}

/*
export function reportOnRules(ruleStats: { [index in string]: RuleStat }, i: number) {
    log.info(`rule evaluation after ${i + 1} games`);
    let rules = Object.keys(ruleStats).sort();

    for (let rule of rules) {
        let ruleStat = ruleStats[rule];
        if (ruleStats[rule]) {
            log.stats(`${ruleStat.edge}%: ${ruleStat.withRuleWins} wins and ${ruleStat.withRuleLosses} losses; win ratio of ${ruleStat.withRuleWinRatio}` +
                (!Number.isNaN(ruleStat.withoutRuleWinRatio) ?
                    ` compared to ${ruleStat.withoutRuleWins} wins and ${ruleStat.withRuleLosses} losses; win ratio of ${ruleStat.withoutRuleWinRatio} in random play ` : '')
                + `for rule "${rule}"`);
        }
    }
}
*/

export function reportGameResult(stats: Statistics, game: Game, gameResult: GameResult, playerMap: PlayerMap, i: number) {
    if (game.getGameResult().getGameMode().isNoRetry()) {
        log.report(`Team (${gameResult.getPlayingTeamNames()}) ${gameResult.hasPlayingTeamWon() ? 'wins' : 'looses'} ` +
            `with ${gameResult.getPlayingTeamPoints()} points ` +
            `and ${gameResult.hasPlayingTeamWon() ? 'win' : 'loose'} ${Math.abs(gameResult.getGameMoneyValue())} cents each!`);
        reportCents(playerMap, stats, i);
    } else {
        log.gameInfo(`retry with cards:${Object.values(playerMap).map(p => '\n' + p.getName() + ': ' + p.getStartCardSet().toString())}`)
    }
}