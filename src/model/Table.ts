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
import {clone} from "lodash";
import {Evaluation} from "./reporting/Evaluation";
import GameResult from "./reporting/GameResult";
import {reportGameResult, reportOnStrategies} from "../logging/report";
import {appendCsv, saveGames, saveRules} from "../logging/save";
import {RuleEvaluation} from "./reporting/RuleEvaluation";

export type TableOptions = {
    runs: number;
    startPlayer?: string;
    cardDeal?: Card[][];
    makePlayerMap: (j?: number) => PlayerMap;
    playerNames: string[];
    evaluation?: Evaluation;
    saveGamesTo?: string | null;
    saveRules?: boolean;
    runMode: "default" | "evaluateRules" | "evaluateStrategies" | "replay" | "analyze";
    csvFile?: string | null;
}

export type SaveGame = {
    playerNames: string[],
    startPlayer: string,
    prngState: object,
    cardDeal: Card[][],
    advantage?: number
}

export class Table {
    private readonly allCardDeals: Card[][][];
    private readonly games: SaveGame[];
    private readonly stats: Statistics;
    private startPlayer: string;
    private readonly options: TableOptions;

    constructor(tableOptions: TableOptions) {
        this.options = tableOptions;

        this.stats = new Statistics(this.options.playerNames);
        this.games = [];
        if (tableOptions.cardDeal) {
            this.allCardDeals = [tableOptions.cardDeal];
        } else {
            this.allCardDeals = shuffleCardsTimes(this.options.runs);
        }
        if (tableOptions.startPlayer) {
            this.startPlayer = tableOptions.startPlayer;
        } else {
            this.startPlayer = this.options.playerNames[0]
        }
    }

    async run() {
        if (this.options.csvFile) {
            if (this.options.runMode == "evaluateRules") {
                appendCsv(this.options.csvFile, ["gameId", "withRuleTotal", "withRuleWins", "withRuleLosses", "withoutRuleTotal", "withoutRuleWins", "withoutRuleLosses", "rule"]);
            } else if (this.options.runMode == "evaluateStrategies") {
                appendCsv(this.options.csvFile, ["gameId", "strategy", "wins", "losses"]);
            }
        }
        for (let i = 0; i < this.options.runs; i++) {
            if (this.options.saveGamesTo) {
                // @ts-ignore
                let prngState = Math.random.state();
                this.games[i + 1] = {
                    playerNames: this.options.playerNames,
                    startPlayer: this.startPlayer,
                    prngState: clone(prngState),
                    cardDeal: this.allCardDeals[i]
                };
            }
            let playerMap: PlayerMap;
            let game: Game;
            let gameResult: GameResult;
            if (this.options.runMode == "evaluateRules") {
                if (!this.options.evaluation || !this.options.evaluation.blacklists || !this.options.evaluation.ruleEvaluation) {
                    throw Error('missing evaluation!');
                }
                for (let blacklist of this.options.evaluation.blacklists) {
                    for (let j = 0; j < this.options.evaluation.strategyEvaluation.strategies.length ** 4; j++) {
                        log.info(`========game ${i + 1} run ${j + 1} blacklisted rule: ${blacklist.toString()}===========`);
                        playerMap = this.options.evaluation.makePlayerMap(j, blacklist);
                        game = await this.prepareGame(playerMap, i);
                        await game.play();

                        gameResult = game.getGameResult();
                        // this.stats.addResult(gameResult);
                        this.options.evaluation.ruleEvaluation.gradeRules(gameResult, blacklist);

                        //reportGameResult(this.stats, game, gameResult, playerMap, i);

                        if (game.getGameResult().getGameMode().isRetry()) {
                            j = this.options.evaluation.strategyEvaluation.strategies.length ** 4;
                        }
                    }
                }
                let ruleStats = this.options.evaluation.ruleEvaluation.getCombinedRuleStatistics();

                //reportOnRules(ruleStats, i);

                ruleStats = RuleEvaluation.getCompleteCombinedRuleStatistics(this.options.evaluation.allRules!, ruleStats);
                if (this.options.csvFile) {
                    for (let rule of Object.keys(ruleStats)) {
                        let ruleStat = ruleStats[rule];
                        appendCsv(this.options.csvFile, [i + 1, ruleStat.withRuleWins + ruleStat.withRuleLosses, ruleStat.withRuleWins, ruleStat.withRuleLosses, ruleStat.withoutRuleWins + ruleStat.withoutRuleLosses, ruleStat.withoutRuleWins, ruleStat.withoutRuleLosses, rule]);
                    }
                }
            } else if (this.options.runMode == "evaluateStrategies") {
                if (!this.options.evaluation) {
                    throw Error('missing evaluation!');
                }

                let lastAdvantage = 0;
                for (let j = 0; j < this.options.evaluation.strategyEvaluation.strategies.length ** 4; j++) {
                    log.info(`========game ${i + 1} run ${j + 1}===========`);
                    playerMap = this.options.evaluation.makePlayerMap(j);
                    game = await this.prepareGame(playerMap, i);
                    await game.play();

                    gameResult = game.getGameResult();

                    this.options.evaluation.strategyEvaluation.addResult(gameResult, j);
                    //this.stats.addResult(gameResult);

                    //this.options.evaluation.ruleEvaluation.gradeRules(gameResult); // for saving the rules......
                    //this.options.evaluation.callingRuleEvaluation.gradeRules(gameResult);

                    //reportGameResult(this.stats, game, gameResult, playerMap, i);

                    if (game.getGameResult().getGameMode().isRetry()) {
                        j = this.options.evaluation.strategyEvaluation.strategies.length ** 4;
                    }
                }

                let stratEval = this.options.evaluation.strategyEvaluation.getEvaluationForStrategy(this.options.evaluation.strategyEvaluation.strategies[0]);
                let advantage = stratEval.wins - stratEval.losses;

                if (this.options.saveGamesTo) {
                    this.games[i + 1].advantage = advantage - lastAdvantage;
                }

                lastAdvantage = advantage;

                //   reportOnCallingRules(this.options.evaluation.callingRuleEvaluation, i);
                reportOnStrategies(this.options.evaluation.strategyEvaluation, i);


                if (this.options.csvFile) {
                    for (let strategy of this.options.evaluation.strategyEvaluation.strategies) {
                        let evaluation = this.options.evaluation.strategyEvaluation.getEvaluationForStrategy(strategy);
                        appendCsv(this.options.csvFile, [i + 1, strategy.name, evaluation.wins, evaluation.losses]);
                    }
                }
            } else if (this.options.runMode == "analyze") {
                playerMap = this.options.makePlayerMap();
                game = await this.prepareGame(playerMap, i);
                await game.play();

                gameResult = game.getGameResult();

                this.stats.addResult(gameResult);

                reportGameResult(this.stats, game, gameResult, playerMap, i);

            } else {
                if (this.options.evaluation) {
                    throw Error('evaluation on default profile?')
                }
                log.info(`========game ${i + 1}===========`);
                playerMap = this.options.makePlayerMap();
                game = await this.prepareGame(playerMap, i);
                await game.play();

                gameResult = game.getGameResult();

                this.stats.addResult(gameResult);

                reportGameResult(this.stats, game, gameResult, playerMap, i);
            }

            this.startPlayer = rotateStartPlayer(this.options.playerNames, this.startPlayer);
        }

        log.report('finished runs. Number of retries:' + this.stats.getStatsForPlayer(this.options.playerNames[0]).retries);

        if (this.options.saveGamesTo) {
            saveGames(this.games, this.options.saveGamesTo);
        }
        if (this.options.evaluation && this.options.evaluation.ruleEvaluation && this.options.saveRules) {
            saveRules(this.options.evaluation.ruleEvaluation);
        }
    }

    private async prepareGame(playerMap: PlayerMap, i: number) {
        let preGame = new PreGame(playerMap, this.startPlayer);
        let gameMode = await preGame.determineGameMode(this.allCardDeals[i], [GameModeEnum.CALL_GAME]);
        let history = new GameHistory(Object.keys(playerMap), gameMode);
        return new Game(new GameWorld(gameMode, playerMap, [], new Round(this.startPlayer, Object.keys(playerMap)), history));
    }
}

function rotateStartPlayer(playerNames: string[], startPlayer: string) {
    let index = playerNames.indexOf(startPlayer);

    return playerNames[(index + 1) % 4];
}