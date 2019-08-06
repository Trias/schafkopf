require("./utils/seededRandomness");

import {StrategyEvaluation} from "./model/reporting/StrategyEvaluation";
import {Card} from "./model/cards/Card";
import {Game} from "./model/Game";
import {Player} from "./model/Player";
import Statistics from "./model/reporting/Statistics";
import {shuffleCardsTimes} from "./model/cards/shuffleCards";
import {GameWorld} from "./model/GameWorld";
import {PreGame} from "./model/PreGame";
import {Round} from "./model/Round";
import {GameHistory} from "./model/knowledge/GameHistory";
import {GameModeEnum} from "./model/GameMode";
import {clone, fromPairs, zip} from "lodash";
import {RuleEvaluation} from "./model/reporting/RuleEvaluation";
import {CallingRulesWithHeuristic} from "./model/strategy/rulebased/CallingRulesWithHeuristic";
import {CallingRulesWithHeuristicWithRuleBlacklist} from "./model/strategy/rulebased/CallingRulesWithHeuristicWithRuleBlacklist";
import log from "./logging/log";

let fs = require('fs');

let runs = 100;

let playerNames = ["Player 1", "Player 2", "Player 3", "Player 4"];

let allCardDeals = shuffleCardsTimes(runs);

let stats = new Statistics(playerNames);

let strategyEvaluation = new StrategyEvaluation([CallingRulesWithHeuristicWithRuleBlacklist, CallingRulesWithHeuristic]);
let callingRuleEvaluation = new RuleEvaluation();
let ruleEvaluation = new RuleEvaluation();

let games: {
    [index in number]: {
        playerNames: string[],
        startPlayer: string,
        prngState: object,
        cardDeal: Card[][],
    }
} = {};
let rules = require('../generated/rules.json') as string[];
let blacklists = zip(rules) as string[][];

(async () => {
    let startPlayer = playerNames[0];
    for (let i = 0; i < runs; i++) {
        // @ts-ignore
        let prngState = Math.random.state();
        games[i + 1] = {
            playerNames,
            startPlayer,
            prngState: clone(prngState),
            cardDeal: allCardDeals[i]
        };
        for (let ruleBlacklist of blacklists) {
            for (let j = 0; j < strategyEvaluation.strategies.length ** 4; j++) {
                let playerMap = {
                    [playerNames[0]]: new Player({
                        name: playerNames[0],
                        strategy: strategyEvaluation.getStrategyToEvaluate(j, 0),
                        ruleEvaluation,
                        callingRuleEvaluation,
                        ruleBlacklist
                    }),
                    [playerNames[1]]: new Player({
                        name: playerNames[1],
                        strategy: strategyEvaluation.getStrategyToEvaluate(j, 1),
                        ruleEvaluation,
                        callingRuleEvaluation,
                        ruleBlacklist
                    }),
                    [playerNames[2]]: new Player({
                        name: playerNames[2],
                        strategy: strategyEvaluation.getStrategyToEvaluate(j, 2),
                        ruleEvaluation,
                        callingRuleEvaluation,
                        ruleBlacklist
                    }),
                    [playerNames[3]]: new Player({
                        name: playerNames[3],
                        strategy: strategyEvaluation.getStrategyToEvaluate(j, 3),
                        ruleEvaluation,
                        callingRuleEvaluation,
                        ruleBlacklist
                    }),
                };

                log.info(`========game ${i + 1} run ${j + 1} blacklisted rule: ${ruleBlacklist.toString()}===========`);
                let preGame = new PreGame(playerMap, startPlayer);
                let gameMode = await preGame.determineGameMode(allCardDeals[i], [GameModeEnum.CALL_GAME]);
                let history = new GameHistory(Object.keys(playerMap), gameMode);
                let game = new Game(new GameWorld(gameMode, playerMap, [], new Round(startPlayer, Object.keys(playerMap)), history));

                await game.play();
                let gameResult = game.getGameResult();

                stats.addResult(gameResult);
                //strategyEvaluation.addResult(gameResult, j);
                ruleEvaluation.gradeRules(gameResult, ruleBlacklist);
                callingRuleEvaluation.gradeRules(gameResult);

                if (game.getGameResult().getGameMode().isNoRetry()) {
                    log.report(`Team (${gameResult.getPlayingTeamNames()}) ${gameResult.hasPlayingTeamWon() ? 'wins' : 'looses'} ` +
                        `with ${gameResult.getPlayingTeamPoints()} points ` +
                        `and ${gameResult.hasPlayingTeamWon() ? 'win' : 'loose'} ${Math.abs(gameResult.getGameMoneyValue())} cents each!`);
                } else {
                    log.gameInfo(`retry with cards:${Object.values(playerMap).map(p => '\n' + p.getName() + ': ' + p.getStartCardSet().toString())}`);
                    //skip ahead in evaluation b/c we dont evaluate calling rules...
                    j = strategyEvaluation.strategies.length ** 4;
                }
            }
        }
        reportOnRules(i);

        startPlayer = rotateStartPlayer(startPlayer);
    }

    saveGames();
})();


function reportOnRules(i: number) {
    log.info(`rule evaluation after ${i + 1} games`);
    let ruleStatistics = ruleEvaluation.getRuleStatistics();
    let blackListedRuleStatistics = ruleEvaluation.getBlackListedRuleStatistics();
    let rules = Object.keys(ruleStatistics).sort();

    let badRules = [];
    for (let rule of rules) {
        let evalu = ruleStatistics[rule];
        let blacklistedRuleStat = blackListedRuleStatistics[rule];
        if (blacklistedRuleStat && evalu) {
            let winRatio = evalu.wins / (evalu.losses + evalu.wins);
            let randomPlayWinRatio = blacklistedRuleStat.wins / (blacklistedRuleStat.losses + blacklistedRuleStat.wins);
            let edge = winRatio / randomPlayWinRatio * 100 - 100;
            log.stats(`${edge}%: ${evalu.wins} wins and ${evalu.losses} losses; win ratio of ${winRatio}` +
                (blacklistedRuleStat ?
                    ` compared to ${blacklistedRuleStat.wins} wins and ${blacklistedRuleStat.losses} losses; win ratio of ${randomPlayWinRatio} in random play ` : '')
                + `for rule "${rule}"`);
            if (edge < 0) {
                badRules.push([rule, edge]);
            }
        }
    }
    if (!fs.existsSync('generated')) {
        fs.mkdirSync('generated');
    }
    fs.writeFileSync('generated/badRules.json', JSON.stringify(fromPairs(badRules), null, 2));
}

function saveGames() {
    if (!fs.existsSync('generated')) {
        fs.mkdirSync('generated');
    }
    fs.writeFileSync('generated/evaluation.games.json', JSON.stringify(games, null, 2));
}

function rotateStartPlayer(startPlayer: string) {
    let index = playerNames.indexOf(startPlayer);

    return playerNames[(index + 1) % 4];
}