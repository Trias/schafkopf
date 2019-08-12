import log from "../logging/log";
import {PreGame} from "./PreGame";
import {GameModeEnum} from "./GameMode";
import {GameHistory} from "./knowledge/GameHistory";
import {Game} from "./Game";
import {GameWorld} from "./GameWorld";
import {Round} from "./Round";
import {shuffleCardsTimes} from "./cards/shuffleCards";
import Statistics from "./reporting/Statistics";
import {Card} from "./cards/Card";
import {PlayerMap} from "./Player";
import * as fs from "fs";
import {clone, fromPairs} from "lodash";
import {Evaluation} from "./reporting/Evaluation";
import {RuleEvaluation} from "./reporting/RuleEvaluation";
import {StrategyEvaluation} from "./reporting/StrategyEvaluation";
import GameResult from "./reporting/GameResult";

export type TableOptions = {
    runs: number;
    startPlayer?: string;
    cardDeal?: Card[][];
    makePlayerMap: (j: number) => PlayerMap;
    playerNames: string[];
    evaluation?: Evaluation;
    saveGamesTo?: string;
    saveRules?: boolean;
}

export type SaveGame = {
    playerNames: string[],
    startPlayer: string,
    prngState: object,
    cardDeal: Card[][],
}

export class Table {
    private readonly runs: number;
    private readonly allCardDeals: Card[][][];
    private readonly games: SaveGame[];
    private readonly stats: Statistics;
    private readonly playerNames: string[];
    private startPlayer: string;
    private readonly evaluation?: Evaluation;
    private readonly makePlayerMap: (j: number) => PlayerMap;
    private readonly saveGamesTo?: string;
    private readonly saveRules: boolean = false;

    constructor(tableOptions: TableOptions) {
        this.runs = tableOptions.runs;

        this.playerNames = tableOptions.playerNames;
        this.stats = new Statistics(this.playerNames);
        this.games = [];
        this.evaluation = tableOptions.evaluation;
        this.makePlayerMap = tableOptions.makePlayerMap;
        if (tableOptions.cardDeal) {
            this.allCardDeals = [tableOptions.cardDeal];
        } else {
            this.allCardDeals = shuffleCardsTimes(this.runs);
        }
        if (tableOptions.startPlayer) {
            this.startPlayer = tableOptions.startPlayer;
        } else {
            this.startPlayer = this.playerNames[0]
        }

        this.saveGamesTo = tableOptions.saveGamesTo;
        this.saveRules = !!tableOptions.saveRules;
    }

    async run() {
        for (let i = 0; i < this.runs; i++) {
            if (this.saveGamesTo) {
                // @ts-ignore
                let prngState = Math.random.state();
                this.games[i + 1] = {
                    playerNames: this.playerNames,
                    startPlayer: this.startPlayer,
                    prngState: clone(prngState),
                    cardDeal: this.allCardDeals[i]
                };
            }
            let playerMap: PlayerMap;
            let game: Game;
            let gameResult: GameResult;
            if (this.evaluation && this.evaluation.blacklists) {
                for (let blacklist of this.evaluation.blacklists) {
                    for (let j = 0; j < this.evaluation.strategyEvaluation.strategies.length ** 4; j++) {
                        log.info(`========game ${i + 1} run ${j + 1} blacklisted rule: ${blacklist.toString()}===========`);
                        playerMap = this.evaluation.makePlayerMap(j, blacklist);
                        game = await this.prepareGame(playerMap, i);
                        await game.play();

                        gameResult = game.getGameResult();
                        this.stats.addResult(gameResult);
                        this.evaluation.ruleEvaluation.gradeRules(gameResult, blacklist);

                        reportGameResult(this.stats, game, gameResult, playerMap, i);

                        if (game.getGameResult().getGameMode().isRetry()) {
                            j = this.evaluation.strategyEvaluation.strategies.length ** 4;
                        }
                    }
                }
                reportOnRules(this.evaluation.ruleEvaluation, i);
            } else if (this.evaluation) {
                for (let j = 0; j < this.evaluation.strategyEvaluation.strategies.length ** 4; j++) {
                    log.info(`========game ${i + 1} run ${j + 1}===========`);
                    playerMap = this.evaluation.makePlayerMap(j);
                    game = await this.prepareGame(playerMap, i);
                    await game.play();

                    gameResult = game.getGameResult();

                    this.stats.addResult(gameResult);
                    this.evaluation.strategyEvaluation.addResult(gameResult, j);
                    this.evaluation.ruleEvaluation.gradeRules(gameResult); // for saving the rules......
                    this.evaluation.callingRuleEvaluation.gradeRules(gameResult);

                    reportGameResult(this.stats, game, gameResult, playerMap, i);

                    if (game.getGameResult().getGameMode().isRetry()) {
                        j = this.evaluation.strategyEvaluation.strategies.length ** 4;
                    }
                }

                reportOnCallingRules(this.evaluation.callingRuleEvaluation, i);
                reportOnStrategies(this.evaluation.strategyEvaluation, i);
            } else {
                log.info(`========game ${i + 1}===========`);
                playerMap = this.makePlayerMap(0);
                game = await this.prepareGame(playerMap, i);
                await game.play();

                gameResult = game.getGameResult();

                this.stats.addResult(gameResult);

                reportGameResult(this.stats, game, gameResult, playerMap, i);
            }

            this.startPlayer = rotateStartPlayer(this.playerNames, this.startPlayer);
        }

        if (this.saveGamesTo) {
            saveGames(this.games, this.saveGamesTo);
        }
        if (this.evaluation && this.saveRules) {
            saveRules(this.evaluation.ruleEvaluation);
        }
    }

    private async prepareGame(playerMap: PlayerMap, i: number) {
        let preGame = new PreGame(playerMap, this.startPlayer);
        let gameMode = await preGame.determineGameMode(this.allCardDeals[i], [GameModeEnum.CALL_GAME]);
        let history = new GameHistory(Object.keys(playerMap), gameMode);
        return new Game(new GameWorld(gameMode, playerMap, [], new Round(this.startPlayer, Object.keys(playerMap)), history));
    }
}

function saveGames(games: SaveGame[], to: string) {
    if (!fs.existsSync('generated')) {
        fs.mkdirSync('generated');
    }
    fs.writeFileSync(`generated/${to}`, JSON.stringify(games, null, 2));
}

function saveRules(ruleEvaluation: RuleEvaluation) {
    let ruleStatistics = ruleEvaluation.getRuleStatistics();
    let rules = Object.keys(ruleStatistics);
    if (!fs.existsSync('generated')) {
        fs.mkdirSync('generated');
    }
    fs.writeFileSync('generated/rules.json', JSON.stringify(rules.sort(), null, 2));
}

function rotateStartPlayer(playerNames: string[], startPlayer: string) {
    let index = playerNames.indexOf(startPlayer);

    return playerNames[(index + 1) % 4];
}

function reportCents(playerMap: PlayerMap, stats: Statistics, i: number) {
    let playerNames = Object.keys(playerMap);
    log.report(`balance after ${i + 1} games`);
    for (let i = 0; i < 4; i++) {
        let playerStats = stats.getStatsForPlayer(playerNames[i]);
        log.report(`${playerNames[i]} [${playerMap[playerNames[i]].getStartCardSet()}] (${playerMap[playerNames[i]].getStrategyName()}): ${playerStats.cents} (${playerStats.tournamentPoints} points, ${playerStats.wins} wins, ${playerStats.losses} losses, ${playerStats.inPlayingTeam} playing, ${playerStats.points / playerStats.games} points on average`);
    }
}

function reportOnCallingRules(callingRuleEvaluation: RuleEvaluation, i: number) {
    log.info(`calling rule evaluation after ${i + 1} games`);
    let ruleStatistics = callingRuleEvaluation.getRuleStatistics();
    let rules = Object.keys(ruleStatistics).sort();
    for (let rule of rules) {
        let evalu = ruleStatistics[rule];
        log.stats(`evaluation for calling rule "${rule}" has ${evalu.wins} wins and ${evalu.losses} losses which gives a win ratio of ${evalu.wins / (evalu.losses + evalu.wins)}`);
    }
}

function reportOnStrategies(evaluation: StrategyEvaluation, i: number) {
    log.info(`strategy evaluation after ${i + 1} games`);
    for (let strategy of evaluation.strategies) {
        let evalu = evaluation.getEvaluationForStrategy(strategy);
        log.stats(`evaluation for strategy ${strategy.name} has ${evalu.wins} wins and ${evalu.losses} losses`);
    }
}


function reportOnRules(ruleEvaluation: RuleEvaluation, i: number) {
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

function reportGameResult(stats: Statistics, game: Game, gameResult: GameResult, playerMap: PlayerMap, i: number) {
    if (game.getGameResult().getGameMode().isNoRetry()) {
        log.report(`Team (${gameResult.getPlayingTeamNames()}) ${gameResult.hasPlayingTeamWon() ? 'wins' : 'looses'} ` +
            `with ${gameResult.getPlayingTeamPoints()} points ` +
            `and ${gameResult.hasPlayingTeamWon() ? 'win' : 'loose'} ${Math.abs(gameResult.getGameMoneyValue())} cents each!`);
        reportCents(playerMap, stats, i);
    } else {
        log.gameInfo(`retry with cards:${Object.values(playerMap).map(p => '\n' + p.getName() + ': ' + p.getStartCardSet().toString())}`)
    }
}