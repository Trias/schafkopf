import {ManualStrategy} from "./manual/ManualStrategy";
import CallingRulesWithUctMonteCarloStrategy from "./montecarlo/CallingRulesWithUctMonteCarloStrategy";
import CallingRulesWithGreedyPlay from "./rulebased/CallingRulesWithGreedyPlay";
import CallingRulesWithRandomPlay from "./rulebased/CallingRulesWithRandomPlay";
import {CallingRulesWithHeuristic} from "./rulebased/CallingRulesWithHeuristic";
import {CallingRulesWithHeuristicWithRuleBlacklist} from "./rulebased/CallingRulesWithHeuristicWithRuleBlacklist";
import {CallingRulesWithUctMonteCarloAndHeuristic} from "./montecarlo/CallingRulesWithUctMonteCarloAndHeuristic";
import CallingRulesWithUctMonteCarloStrategyAndCheating
    from "./montecarlo/CallingRulesWithUctMonteCarloStrategyAndCheating";
import Nemesis from "./montecarlo/Nemesis";
import UctMonteCarloStrategy from "./montecarlo/UctMonteCarloStrategy";
import UctWithGreedyHeuristicsStrategy from "./montecarlo/UctWithGreedyHeuristicsStrategy";
import RandomStrategy from "./random/RandomStrategy";
import FlatMonteCarloStrategy from "./montecarlo/FlatMonteCarloStrategy";
import {Leprechauns} from "./rulebased/Leprechauns";
import CallingRulesWithFlatMonteCarloStrategy from "./montecarlo/CallingRulesWithFlatMonteCarloStrategy";

export default {
    "ManualStrategy": ManualStrategy,
    "CallingRulesWithUctMonteCarloStrategy": CallingRulesWithUctMonteCarloStrategy,
    "CallingRulesWithGreedyPlay": CallingRulesWithGreedyPlay,
    "CallingRulesWithRandomPlay": CallingRulesWithRandomPlay,
    "CallingRulesWithHeuristic": CallingRulesWithHeuristic,
    "CallingRulesWithHeuristicWithRuleBlacklist": CallingRulesWithHeuristicWithRuleBlacklist,
    "CallingRulesWithUctMonteCarloAndHeuristic": CallingRulesWithUctMonteCarloAndHeuristic,
    "CallingRulesWithUctMonteCarloStrategyAndCheating": CallingRulesWithUctMonteCarloStrategyAndCheating,
    "Nemesis": Nemesis,
    "UctMonteCarloStrategy": UctMonteCarloStrategy,
    "UctWithGreedyHeuristicsStrategy": UctWithGreedyHeuristicsStrategy,
    "RandomStrategy": RandomStrategy,
    "FlatMonteCarloStrategy": FlatMonteCarloStrategy,
    "Leprechauns": Leprechauns,
    "CallingRulesWithFlatMonteCarloStrategy": CallingRulesWithFlatMonteCarloStrategy,
} as { [index in string]: any }