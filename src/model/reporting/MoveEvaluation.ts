import {CardPlayStrategy} from "../strategy/CardPlayStrategy";
import {Card} from "../cards/Card";
import {GameWorld} from "../GameWorld";

type HeuristicsResult = { reasons: string[], secondOrderReasons: string[], conclusion: string, card: Card, cardSet: Card[] };

export class MoveEvaluation {
    private heuristics?: CardPlayStrategy;
    private result?: HeuristicsResult;

    injectHeuristics(heuristics: CardPlayStrategy) {
        this.heuristics = heuristics;
    }

    getBestMove(world: GameWorld, cardSet: Card[]): HeuristicsResult {
        this.heuristics!.chooseCardToPlay(world, cardSet);
        return this.result!;
    }

    // this is really a weird way to receive a value... fix it someday
    captureResult(reasons: string[], secondOrderReasons: string[], conclusion: string, card: Card, cardSet: Card[]) {
        this.result = {
            reasons,
            secondOrderReasons,
            conclusion,
            card,
            cardSet
        };
    }
}