import StrategyInterface from "../StrategyInterface";
import {PlainColor} from "../../cards/Color";
import {GameMode, GameModeEnum} from "../../GameMode";
import {Card} from "../../cards/Card";
import {determineGameMode} from "../rules/shouldCall/determineGameMode";
import {GameWorld} from "../../GameWorld";
import {Player} from "../../Player";
import {AdvancedHeuristic} from "./heuristic/AdvancedHeuristics";
import {RuleEvaluation} from "../../reporting/RuleEvaluation";
import {includes, sample} from "lodash";
import {getPlayableCards} from "../../PlayableMoves";
import log from "../../../logging/log";

export class CallingRulesWithHeuristicWithRuleBlacklist implements StrategyInterface {
    private readonly thisPlayer: Player;
    private ruleEvaluation: RuleEvaluation | null = null;
    private callingRuleEvaluation: RuleEvaluation | null = null;
    private ruleBlacklist: string[] = [];

    constructor(thisPlayer: Player) {
        this.thisPlayer = thisPlayer;
    }

    injectEvaluation(ruleEvaluation: RuleEvaluation) {
        this.ruleEvaluation = ruleEvaluation;
    }

    injectRuleBlackList(ruleBlacklist: string[]) {
        this.ruleBlacklist = ruleBlacklist;
    }

    chooseCardToPlay(world: GameWorld, cardSet: Card[]): Card {
        let ruleApplied: string[] = [];
        let report = (reasons: string[], secondOrderReasons: string[], conclusion: string, card: Card) => {
            log.private(reasons.toString() + (secondOrderReasons.length ? '\n-->' : '') + secondOrderReasons.toString() + ' => ' + conclusion + ': ' + card);
            ruleApplied = reasons;
        };

        let heuristic = new AdvancedHeuristic({
            name: this.thisPlayer.getName(),
            startCardSet: this.thisPlayer.getStartCardSet(),
            assumptions: this.thisPlayer.assumptions,
            report: report
        });
        let card = heuristic.chooseCardToPlay(world, cardSet);

        if (this.ruleEvaluation) {
            if (includes(this.ruleBlacklist, ruleApplied.toString())) {
                let playableCards = getPlayableCards(cardSet, world.gameMode, world.round);
                card = sample(playableCards)!;
                log.private('overwriting choice with random play');
                this.ruleEvaluation.addBlacklistedRule(this.thisPlayer.getName(), ruleApplied);
            } else {
                this.ruleEvaluation.addRule(this.thisPlayer.getName(), ruleApplied);
            }
        }

        return card;
    }

    chooseGameToCall(cardSet: Card[], previousGameMode: GameMode, playerIndex: number, allowedGameModes: GameModeEnum[]): [GameModeEnum?, PlainColor?] {
        return determineGameMode(previousGameMode, cardSet, allowedGameModes, (reasons: string[]) => {
            this.callingRuleEvaluation && this.callingRuleEvaluation.addRule(this.thisPlayer.getName(), reasons);
        });
    }

    chooseToRaise(cardSet: readonly Card[]): boolean {
        return false;
    }
}