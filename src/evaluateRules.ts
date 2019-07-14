let seedRandom = require('seedrandom');
// replacing global Math.random.....must be first call.
Math.random = seedRandom.alea('seed', {state: true});

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
import {clone, zip} from "lodash";
import {RuleEvaluation} from "./model/reporting/RuleEvaluation";
import {CallingRulesWithHeuristic} from "./model/strategy/rulebased/CallingRulesWithHeuristic";
import {CallingRulesWithHeuristicWithRuleBlacklist} from "./model/strategy/rulebased/CallingRulesWithHeuristicWithRuleBlacklist";

let fs = require('fs');

let runs = 1000;

let playerNames = ["Player 1", "Player 2", "Player 3", "Player 4"];

let allCardDeals = shuffleCardsTimes(runs);

let stats = new Statistics(playerNames);

let evaluation = new StrategyEvaluation([CallingRulesWithHeuristicWithRuleBlacklist, CallingRulesWithHeuristic]);
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

//(async () => {
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
    for (let blacklist of blacklists) {
        for (let j = 0; j < evaluation.strategies.length ** 4; j++) {
            let playerMap = {
                [playerNames[0]]: new Player(playerNames[0], evaluation.getStrategyToEvaluate(j, 0), ruleEvaluation, callingRuleEvaluation, blacklist),
                [playerNames[1]]: new Player(playerNames[1], evaluation.getStrategyToEvaluate(j, 1), ruleEvaluation, callingRuleEvaluation, blacklist),
                [playerNames[2]]: new Player(playerNames[2], evaluation.getStrategyToEvaluate(j, 2), ruleEvaluation, callingRuleEvaluation, blacklist),
                [playerNames[3]]: new Player(playerNames[3], evaluation.getStrategyToEvaluate(j, 3), ruleEvaluation, callingRuleEvaluation, blacklist),
            };

            console.log(`========game ${i + 1} run ${j + 1} blacklisted rule: ${JSON.stringify(blacklist)}===========`);
            let preGame = new PreGame(playerMap);
            let gameMode = preGame.determineGameMode(allCardDeals[i], [GameModeEnum.CALL_GAME]);
            let history = new GameHistory(Object.keys(playerMap), gameMode);
            let game = new Game(new GameWorld(gameMode, playerMap, [], new Round(startPlayer, Object.keys(playerMap)), history));

            game.play();
            let gameResult = game.getGameResult();

            stats.addResult(gameResult);
            evaluation.addResult(gameResult, j);
            ruleEvaluation.gradeRules(gameResult, blacklist);
            callingRuleEvaluation.gradeRules(gameResult);

            if (game.getGameResult().getGameMode().isNoRetry()) {
                console.log(`Team (${gameResult.getPlayingTeamNames()}) ${gameResult.hasPlayingTeamWon() ? 'wins' : 'looses'} ` +
                    `with ${gameResult.getPlayingTeamPoints()} points ` +
                    `and ${gameResult.hasPlayingTeamWon() ? 'win' : 'loose'} ${Math.abs(gameResult.getGameMoneyValue())} cents each!`);
            } else {
                console.log(`retry with cards:${Object.values(playerMap).map(p => '\n' + p.getName() + ': ' + JSON.stringify(p.getStartCardSet()))}`);
                //skip ahead in evaluation b/c we dont evaluate calling rules...
                j = evaluation.strategies.length ** 4;
            }
        }
    }
    reportOnRules(i);

    startPlayer = rotateStartPlayer(startPlayer);
}

function reportOnRules(i: number) {
    console.log(`rule evaluation after ${i + 1} games`);
    let ruleStatistics = ruleEvaluation.getRuleStatistics();
    let blackListedRuleStatistics = ruleEvaluation.getBlackListedRuleStatistics();
    let rules = Object.keys(ruleStatistics).sort();
    for (let rule of rules) {
        let evalu = ruleStatistics[rule];
        let blacklistedRuleStat = blackListedRuleStatistics[rule];
        if (blacklistedRuleStat && evalu) {
            let winRatio = evalu.wins / (evalu.losses + evalu.wins);
            let randomPlayWinRatio = blacklistedRuleStat.wins / (blacklistedRuleStat.losses + blacklistedRuleStat.wins);
            let edge = winRatio / randomPlayWinRatio * 100 - 100;
            console.log(`evaluation for rule "${rule}" has ${evalu.wins} wins and ${evalu.losses} losses which gives a win ratio of ${winRatio}` + (blacklistedRuleStat ? ` compared to ${randomPlayWinRatio} in random play which makes an edge of ${edge}%` : ''));
        }
    }
}

function saveGames() {
    if (!fs.existsSync('generated')) {
        fs.mkdirSync('generated');
    }
    fs.writeFileSync('generated/evaluation.games.json', JSON.stringify(games, null, 2));
}

saveGames();

function saveRules() {
    let ruleStatistics = ruleEvaluation.getRuleStatistics();
    let rules = Object.keys(ruleStatistics);
    if (!fs.existsSync('generated')) {
        fs.mkdirSync('generated');
    }
    fs.writeFileSync('generated/rules.json', JSON.stringify(rules.sort(), null, 2));
}

saveRules();

//})();

function rotateStartPlayer(startPlayer: string) {
    let index = playerNames.indexOf(startPlayer);

    return playerNames[(index + 1) % 4];
}