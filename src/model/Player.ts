import {removeCard, sortByNaturalOrdering} from "./cards/CardSet";
import {FinishedRound, Round} from "./Round";
import {Card} from "./cards/Card";
import {GameMode, GameModeEnum} from "./GameMode";
import StrategyInterface from "./strategy/StrategyInterface";
import GamePhase from "./GamePhase";
import GameKnowledge from "./knowledge/GameKnowledge";
import GameEventsReceiverInterface from "./knowledge/GameEventsReceiverInterface";
import {colorsWithTrump, ColorWithTrump} from "./cards/Color";
import GameAssumptionsInCallGame from "./knowledge/GameAssumptionsInCallGame";
import {clone, cloneDeep} from "lodash";
import RandomStrategy from "./strategy/random";

interface PlayerWithNameOnly {
    getName(): string;

    toString(): string;
}

class Player implements GameEventsReceiverInterface {
    startCardSet?: readonly Card[];
    readonly name: string;
    strategy: StrategyInterface;
    gameMode?: GameMode;
    currentCardSet?: readonly Card[];
    gamePhase: GamePhase;
    gameKnowledge?: GameKnowledge;
    // noinspection JSMismatchedCollectionQueryUpdate
    players?: readonly [PlayerWithNameOnly, PlayerWithNameOnly, PlayerWithNameOnly, PlayerWithNameOnly];
    gameAssumptions?: GameAssumptionsInCallGame;
    skipGameKnowledge: boolean = false;
    rounds: FinishedRound[] = [];

    constructor(name: string, strategy: new (player: Player) => (StrategyInterface)) {
        this.gamePhase = GamePhase.BEFORE_GAME;
        this.name = name;

        this.strategy = new strategy(this);
    }

    getDummyClone() {
        let fakePlayer = new Player(this.name, RandomStrategy);
        fakePlayer.skipGameKnowledge = true;
        fakePlayer.currentCardSet = cloneDeep(this.currentCardSet);
        fakePlayer.startCardSet = cloneDeep(this.startCardSet);
        // dont do mc recursivly, gameknowledge is not upto date...
        fakePlayer.gamePhase = this.gamePhase;
        fakePlayer.rounds = cloneDeep(this.rounds);
        fakePlayer.gameMode = this.gameMode;

        return fakePlayer;
    }

    onGameStart(players: readonly [PlayerWithNameOnly, PlayerWithNameOnly, PlayerWithNameOnly, PlayerWithNameOnly]) {
        this.players = players;
        this.notifyGamePhase(GamePhase.GAME_STARTED);
    }

    onReceiveFirstBatchOfCards(cards: readonly Card[]) {
        if (this.gamePhase != GamePhase.GAME_STARTED) {
            throw Error('function not available in this state');
        }
        if (cards.length != 4) {
            throw Error('Wrong number of cards dealt');
        }

        this.currentCardSet = cards;
    }

    onReceiveSecondBatchOfCards(cards: Card[]) {
        if (this.gamePhase != GamePhase.FOUR_CARDS_DEALT) {
            throw Error('function not available in this state');
        }
        if (cards.length != 4) {
            throw Error('Wrong number of cards dealt');
        }

        this.currentCardSet = this.currentCardSet!.concat(cards);
        this.startCardSet = clone(sortByNaturalOrdering(this.currentCardSet));

        if (!this.strategy.skipInference()) {
            this.gameKnowledge = new GameKnowledge(this.startCardSet, this, this.players!);
        }
    }

    getStartCardSet(): readonly Card[] {
        if (this.gamePhase < GamePhase.ALL_CARDS_DEALT) {
            throw Error('function not available in this state');
        }
        return this.startCardSet!;
    }

    playCard(round: Round) {
        if (this.gamePhase !== GamePhase.IN_PLAY) {
            throw Error('function not available in this state');
        }

        if (this.currentCardSet!.length + this.rounds.length != 8) {
            throw Error('invariant violated');
        }

        let card = this.strategy.chooseCardToPlay(round, this.getCurrentCardSet(), this.gameMode!, this.rounds);

        this.currentCardSet = removeCard(this.currentCardSet as Card[], card);
        if (this.currentCardSet.length + this.rounds.length + 1 != 8) {
            throw Error('invariant violated');
        }

        return card;
    }

    onGameModeDecided(gameMode: GameMode) {
        if (this.gamePhase !== GamePhase.ALL_CARDS_DEALT) {
            throw Error('function not available in this state');
        }

        this.gameMode = gameMode;

        if (!this.strategy.skipInference()) {
            this.gameKnowledge!.onGameModeDecided(gameMode);

            if (this.gameMode.getMode() === GameModeEnum.CALL_GAME) {
                this.gameAssumptions = new GameAssumptionsInCallGame(this.gameKnowledge!, this, this.players!);
                this.gameAssumptions.onGameModeDecided(gameMode);
            }
        }
    }

    whatDoYouWantToPlay(currentGameMode: GameMode, playerIndex: number) {
        if (this.gamePhase !== GamePhase.ALL_CARDS_DEALT) {
            throw Error('function not available in this state');
        }
        let [gameMode, color] = this.strategy.chooseGameToCall(this.getStartCardSet(), currentGameMode, playerIndex);

        if (gameMode && gameMode !== currentGameMode.getMode()) {
            return new GameMode(gameMode, this, color);
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

    notifyGamePhase(gamePhase: GamePhase) {
        if (gamePhase < this.gamePhase && gamePhase !== GamePhase.BEFORE_GAME) {
            throw Error('invalid state transition!');
        }
        this.gamePhase = gamePhase;

        if (gamePhase === GamePhase.BEFORE_GAME) {
            this.currentCardSet = undefined;
            this.startCardSet = undefined;
            this.gameMode = undefined;
            this.players = undefined;
            this.gameAssumptions = undefined;
            this.gameKnowledge = undefined;
            this.rounds = [];
        }
    }

    onCardPlayed(card: Card, player: PlayerWithNameOnly, index: number): void {
        if (!this.strategy.skipInference()) {
            this.gameKnowledge!.onCardPlayed(card, player, index);
            if (this.gameAssumptions) {
                this.gameAssumptions!.onCardPlayed(card, player, index);
            }
        }
    }

    onRoundCompleted(round: FinishedRound, roundIndex: number): void {
        if (!this.strategy.skipInference()) {
            this.gameKnowledge!.onRoundCompleted(round, roundIndex);
            if (this.gameAssumptions) {
                this.gameAssumptions.onRoundCompleted(round, roundIndex);
            }
        }

        this.rounds.push(round);

        if (this.getName() == "Player 1" && !this.strategy.skipInference()) {
            console.log(`Player: ${this.toString()}`);
            console.log(`teampartner known: ${this.gameKnowledge!.isTeamPartnerKnown()}; `);
            console.log(`highestUnplayed card for Eichel: ${this.gameKnowledge!.highestUnplayedCardForColor(ColorWithTrump.EICHEL)}, Gras: ${this.gameKnowledge!.highestUnplayedCardForColor(ColorWithTrump.GRAS)}, Herz: ${this.gameKnowledge!.highestUnplayedCardForColor(ColorWithTrump.HERZ)},  Schelle: ${this.gameKnowledge!.highestUnplayedCardForColor(ColorWithTrump.SCHELLE)},  Trump: ${this.gameKnowledge!.highestUnplayedCardForColor(ColorWithTrump.TRUMP)}`);
            console.log(`teamPoints: own:${this.gameKnowledge!.getOwnTeamPoints()} other: ${this.gameKnowledge!.getOtherTeamPoints()}`);
            console.log(`farbe Angespielt: Eichel: ${this.gameKnowledge!.hasColorBeenAngespielt(ColorWithTrump.EICHEL)}, Gras: ${this.gameKnowledge!.hasColorBeenAngespielt(ColorWithTrump.GRAS)}, Herz: ${this.gameKnowledge!.hasColorBeenAngespielt(ColorWithTrump.HERZ)}, Schelle: ${this.gameKnowledge!.hasColorBeenAngespielt(ColorWithTrump.SCHELLE)}, Trump: ${this.gameKnowledge!.hasColorBeenAngespielt(ColorWithTrump.TRUMP)}`);

            if (this.gameAssumptions) {
                let {player, confidence, reasons} = this.gameAssumptions.getPossibleTeamPartnerForPlayer(this);
                console.log(`possible Partner: ${player} with confidence ${Math.round(confidence * 100)}% because ${reasons}`);

                for (let player of this.players!) {
                    for (let color of colorsWithTrump) {
                        let {assumption, reasons} = this.gameAssumptions.isPlayerPossiblyColorFree(player, color);
                        if (assumption) {
                            console.log(`player ${player} assumed Color free of ${color} because of ${reasons}`);
                        }
                    }
                }

                for (let color of colorsWithTrump) {
                    let cardRanks = this.gameKnowledge!.getCurrentRankWithEqualRanksOfCardInColor(this.currentCardSet!, color);
                    console.log(`current hand card ranks for ${color}: ${JSON.stringify(cardRanks)}:`)
                }
            }

            console.log(`-----`);
        }
    }

    setCurrentCardSet(currentCardSet: Card[]) {
        // TODO: protect with types...

        if (this.currentCardSet && currentCardSet.length != this.currentCardSet!.length) {
            throw Error('sorry cant doo');
        }

        if (currentCardSet.length + this.rounds.length != 8) {
            // throw Error('invariant violated');
        }

        this.currentCardSet = currentCardSet;
    }
}

export {Player, PlayerWithNameOnly}