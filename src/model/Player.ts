import {removeCard, sortByNaturalOrdering} from "./cards/CardSet";
import {Card} from "./cards/Card";
import {GameMode, GameModeEnum} from "./GameMode";
import StrategyInterface from "./strategy/StrategyInterface";
import GamePhase from "./GamePhase";
import {clone, cloneDeep} from "lodash";
import {GameWorld} from "./GameWorld";
import {DummyPlayer} from "./simulation/DummyPlayer";
import {FinishedRound, Round} from "./Round";
import {canPlayCard} from "./PlayableMoves";
import {GameAssumptionsInCallGame} from "./knowledge/GameAssumptionsInCallGame";
import GameAssumptions from "./knowledge/GameAssumptions";
import {CardPlayStrategy} from "./strategy/CardPlayStrategy";
import {RuleEvaluation} from "./reporting/RuleEvaluation";
import {CallingRulesWithHeuristic} from "./strategy/rulebased/CallingRulesWithHeuristic";
import {CallingRulesWithHeuristicWithRuleBlacklist} from "./strategy/rulebased/CallingRulesWithHeuristicWithRuleBlacklist";
import {ManualStrategy} from "./strategy/manual/ManualStrategy";
import {AdvancedHeuristic} from "./strategy/rulebased/heuristic/AdvancedHeuristics";
import {sleep} from "../utils/sleep";
import {MoveEvaluation} from "./reporting/MoveEvaluation";
import RandomStrategy from "./strategy/random/RandomStrategy";

export type PlayerMap = { [index in string]: PlayerInterface };

export interface PlayerOptions {
    name?: string,
    strategy?: new (player: Player) => (StrategyInterface)
    ruleEvaluation?: RuleEvaluation,
    callingRuleEvaluation?: RuleEvaluation,
    ruleBlacklist?: string[],
    moveDelay?: number
    moveEvaluation?: MoveEvaluation
}

// name: string, strategy: new (player: Player) => (StrategyInterface), ruleEvaluation: RuleEvaluation | null = null, callingRuleEvaluation: RuleEvaluation | null = null, ruleBlackList: string[] = []

class Player implements PlayerInterface {
    private _assumptions?: GameAssumptions;
    private startCardSet: Card[];
    readonly name: string;
    private readonly strategy: StrategyInterface;
    private currentCardSet: Card[];
    gamePhase: GamePhase;
    private readonly strategyConstructor: { new(player: Player): StrategyInterface };
    private readonly moveDelay: number;
    private readonly moveEvaluation?: MoveEvaluation;

    get assumptions(): GameAssumptions {
        if (!this._assumptions) {
            throw Error('assumptions not set!');
        }
        return this._assumptions;
    }

    constructor(options: PlayerOptions = {}) {
        this.gamePhase = GamePhase.BEFORE_GAME;
        this.name = options.name || "Testplayer";

        this.strategy = new (options.strategy || RandomStrategy)(this);
        this.strategyConstructor = options.strategy || RandomStrategy;

        if (this.strategy instanceof CallingRulesWithHeuristic && options.ruleEvaluation) {
            this.strategy.injectEvaluation(options.ruleEvaluation);
        }

        if (this.strategy instanceof CallingRulesWithHeuristicWithRuleBlacklist && options.ruleEvaluation && options.ruleBlacklist) {
            this.strategy.injectEvaluation(options.ruleEvaluation);
            this.strategy.injectRuleBlackList(options.ruleBlacklist);
        }

        /*   if (this.strategy instanceof CallingRulesWithHeuristic && options.callingRuleEvaluation) {
               this.strategy.injectCallingRulesEvaluation(options.callingRuleEvaluation);
           }*/

        this.moveEvaluation = options.moveEvaluation;

        this.moveDelay = options.moveDelay || 0;

        this.startCardSet = [];
        this.currentCardSet = [];
    }

    getStrategyName() {
        return this.strategyConstructor.name;
    }

    getDummyClone(world: GameWorld, strategy: new (options: any) => CardPlayStrategy) {
        return new DummyPlayer(this.name, clone(world.playerNames), cloneDeep(world.gameMode), cloneDeep(world.history), cloneDeep(this.startCardSet), cloneDeep(this.currentCardSet), cloneDeep(world.rounds), cloneDeep(world.round), strategy);
    }

    onGameStart(world: GameWorld | null) {
        this.onNewGamePhase(GamePhase.GAME_STARTED, world);
    }

    onReceiveFirstBatchOfCards(cards: Card[]) {
        if (this.gamePhase != GamePhase.GAME_STARTED) {
            throw Error('function not available in this state');
        }
        if (cards.length != 4) {
            throw Error('Wrong number of cards dealt');
        }

        this.currentCardSet = cards;
    }

    onReceiveSecondBatchOfCards(cards: readonly Card[]) {
        if (this.gamePhase != GamePhase.FOUR_CARDS_DEALT) {
            throw Error('function not available in this state');
        }
        if (cards.length != 4) {
            throw Error('Wrong number of cards dealt');
        }

        this.currentCardSet = this.currentCardSet!.concat(cards);
        this.startCardSet = clone(sortByNaturalOrdering(this.currentCardSet));
    }

    getStartCardSet(): Card[] {
        if (this.gamePhase < GamePhase.ALL_CARDS_DEALT) {
            throw Error('function not available in this state');
        }
        return this.startCardSet;
    }

    async playCard(world: GameWorld): Promise<Round> {
        if (this.gamePhase !== GamePhase.IN_PLAY) {
            throw Error('function not available in this state');
        }

        if (world.round.getCurrentPlayerName() != this.name) {
            throw Error('not to move');
        }

        if (this.currentCardSet!.length + world.rounds.length != 8) {
            throw Error('invariant violated');
        }

        let timeStart = +new Date();
        let card = <Card>await this.strategy.chooseCardToPlay(world, this.getCurrentCardSet());

        let delay = Math.max(this.moveDelay - (+new Date() - timeStart), 0);
        if (delay) {
            await sleep(delay);
        }

        if (!card || !canPlayCard(world.gameMode, this.currentCardSet, card, world.round)) {
            throw Error('cannot play card!');
        }

        this.currentCardSet = removeCard(this.currentCardSet, card);
        if (this.currentCardSet.length + world.rounds.length + 1 != 8) {
            throw Error('invariant violated');
        }

        world.round.addCard(card);
        world.onCardPlayed(world.round);

        return world.round;
    }

    playCardSync(world: GameWorld): Round {
        if (this.gamePhase !== GamePhase.IN_PLAY) {
            throw Error('function not available in this state');
        }

        if (world.round.getCurrentPlayerName() != this.name) {
            throw Error('not to move');
        }

        if (this.currentCardSet!.length + world.rounds.length != 8) {
            throw Error('invariant violated');
        }

        let card = <Card>this.strategy.chooseCardToPlay(world, this.getCurrentCardSet());

        if (!card || !canPlayCard(world.gameMode, this.currentCardSet, card, world.round)) {
            throw Error('cannot play card!');
        }

        this.currentCardSet = removeCard(this.currentCardSet, card);
        if (this.currentCardSet.length + world.rounds.length + 1 != 8) {
            throw Error('invariant violated');
        }

        world.round.addCard(card);
        world.onCardPlayed(world.round);

        return world.round;
    }

    forcePlayCard(world: GameWorld, card: Card): Round {
        if (this.gamePhase !== GamePhase.IN_PLAY) {
            throw Error('function not available in this state');
        }
        if (!card || !canPlayCard(world.gameMode, this.currentCardSet, card, world.round)) {
            throw Error('cannot play card!');
        }
        if (world.round.getCurrentPlayerName() != this.name) {
            throw Error('not to move');
        }

        if (this.currentCardSet.length + world.rounds.length != 8) {
            throw Error('invariant violated');
        }
        this.currentCardSet = removeCard(this.currentCardSet, card);
        if (this.currentCardSet.length + world.rounds.length + 1 != 8) {
            throw Error('invariant violated');
        }

        world.round.addCard(card);
        world.onCardPlayed(world.round);

        return world.round;
    }

    async whatDoYouWantToPlay(currentGameMode: GameMode, playerIndex: number, allowedGameModes: GameModeEnum[]) {
        if (this.gamePhase !== GamePhase.ALL_CARDS_DEALT) {
            throw Error('function not available in this state');
        }
        let [gameMode, color] = await this.strategy.chooseGameToCall(this.getStartCardSet(), currentGameMode, playerIndex, allowedGameModes);

        if (gameMode && gameMode !== currentGameMode.getMode()) {
            return new GameMode(gameMode, this.getName(), color);
        } else {
            return currentGameMode;
        }
    }

    doYouWantToKlopf() {
        return this.strategy.chooseToRaise(this.getCurrentCardSet())
    }

    getCurrentCardSet() {
        if (this.gamePhase < GamePhase.FOUR_CARDS_DEALT) {
            throw Error('function not available in this state');
        }
        return sortByNaturalOrdering(this.currentCardSet!);
    }

    toString() {
        return this.name;
    }

    getName() {
        return this.name;
    }

    onNewGamePhase(gamePhase: GamePhase, world: GameWorld | null) {
        if (gamePhase < this.gamePhase && gamePhase !== GamePhase.BEFORE_GAME) {
            throw Error('invalid state transition!');
        }
        this.gamePhase = gamePhase;

        if (gamePhase === GamePhase.BEFORE_GAME) {
            this.currentCardSet = [];
            this.startCardSet = [];
            this._assumptions = undefined;
        }

        if (gamePhase === GamePhase.IN_PLAY) {
            if (!world) {
                throw Error('no world...');
            }
            this._assumptions = new GameAssumptionsInCallGame(world.history, this.getName(), world.playerNames, world.gameMode, this.getStartCardSet());
            if (this.strategy instanceof ManualStrategy && this.moveEvaluation) {
                let heuristics = new AdvancedHeuristic({
                    name: this.name,
                    startCardSet: this.startCardSet,
                    assumptions: this._assumptions,
                    report: this.moveEvaluation.captureResult.bind(this.moveEvaluation),
                });
                this.moveEvaluation.injectHeuristics(heuristics);
                this.strategy.injectMoveEvaluation(this.moveEvaluation);
            }
        }
    }

    onRoundCompleted(round: FinishedRound, roundIndex: number) {
        this.assumptions.onRoundCompleted(round, roundIndex);
    }

    onCardPlayed(round: Round, roundIndex: number) {
        this.assumptions.onCardPlayed(round, roundIndex);
    }
}


interface PlayerInterface {
    getStrategyName(): string;

    onNewGamePhase(gamePhase: GamePhase, world: GameWorld | null): void;

    getName(): string;

    toString(): string;

    getCurrentCardSet(): Card[];

    doYouWantToKlopf(): boolean;

    whatDoYouWantToPlay(currentGameMode: GameMode, playerIndex: number, allowedGameModes: GameModeEnum[]): Promise<GameMode> | GameMode;

    onGameStart(world: GameWorld | null): void;

    playCard(world: GameWorld): Promise<Round> | Round;

    onReceiveFirstBatchOfCards(cards: Card[]): void;

    onReceiveSecondBatchOfCards(cards: readonly Card[]): void;

    getStartCardSet(): Card[];

    forcePlayCard(world: GameWorld, card: Card): Round;

    getDummyClone(world: GameWorld, strategy: new (options: any) => CardPlayStrategy): PlayerInterface;

    onCardPlayed(round: Round, roundIndex: number): void;

    onRoundCompleted(round: FinishedRound, roundIndex: number): void;
}

export {Player, PlayerInterface}