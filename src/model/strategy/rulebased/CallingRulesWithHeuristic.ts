import StrategyInterface from "../StrategyInterface";
import {PlainColor} from "../../cards/Color";
import {GameMode, GameModeEnum} from "../../GameMode";
import {Card} from "../../cards/Card";
import {determineGameMode} from "../rules/shouldCall/determineGameMode";
import {GameWorld} from "../../GameWorld";
import {Player} from "../../Player";
import {AdvancedHeuristic} from "./heuristic/AdvancedHeuristics";
import {RuleEvaluation} from "../../reporting/RuleEvaluation";
import log from "../../../logging/log";
import {humanTranslation} from "../../../logging/humanTranslation";

export class CallingRulesWithHeuristic implements StrategyInterface {
    private readonly thisPlayer: Player;
    private ruleEvaluation: RuleEvaluation | null = null;

    //private callingRuleEvaluation: RuleEvaluation | null = null;

    constructor(thisPlayer: Player) {
        this.thisPlayer = thisPlayer;
    }

    injectEvaluation(ruleEvaluation: RuleEvaluation) {
        this.ruleEvaluation = ruleEvaluation;
    }

    chooseCardToPlay(world: GameWorld, cardSet: Card[]): Card {
        let ruleApplied: string[] = [];
        let report = (reasons: string[], secondOrderReasons: string[], conclusion: string, card: Card, cardSet: Card[]) => {
            log.private(reasons.map(humanTranslation).map((s, i) => `${(i + 1)}. ` + s).join('\n') + (secondOrderReasons.length ? '\n-->' : '') + secondOrderReasons.toString() + '\n-> ' + humanTranslation(conclusion) + ': ' + card + ' aus den Karten: ' + cardSet);
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
            this.ruleEvaluation.addRule(this.thisPlayer.getName(), ruleApplied);
        }

        return card;
    }

    chooseGameToCall(cardSet: Card[], previousGameMode: GameMode, playerIndex: number, allowedGameModes: GameModeEnum[]): [GameModeEnum?, PlainColor?] {
        return determineGameMode(previousGameMode, cardSet, allowedGameModes, (reasons: string[]) => {
            // this.callingRuleEvaluation && this.callingRuleEvaluation.addRule(this.thisPlayer.getName(), reasons);
        });
    }

    chooseToRaise(cardSet: readonly Card[]): boolean {
        return false;
    }

    /*injectCallingRulesEvaluation(callingRuleEvaluation: RuleEvaluation) {
       // this.callingRuleEvaluation = callingRuleEvaluation;
    }*/
}