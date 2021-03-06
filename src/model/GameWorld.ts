import {PlayerMap} from "./Player";
import {FinishedRound, Round} from "./Round";
import {GameMode} from "./GameMode";
import {cloneDeep} from "lodash";
import {GameHistory} from "./knowledge/GameHistory";
import GameEventsReceiverInterface from "./knowledge/GameEventsReceiverInterface";
import GamePhase from "./GamePhase";

export class GameWorld implements GameEventsReceiverInterface {
    constructor(gameMode: GameMode, playerMap: PlayerMap, rounds: FinishedRound[], round: Round, history: GameHistory) {
        this._playerMap = playerMap;
        this._rounds = rounds;
        this._round = round;
        this._gamePhase = GamePhase.BEFORE_GAME;
        this._gameMode = gameMode;
        this._history = history;
    }

    private readonly _playerMap: PlayerMap;
    private readonly _rounds: FinishedRound[];
    private _gamePhase: GamePhase;

    get gamePhase(): GamePhase {
        return this._gamePhase;
    }

    set gamePhase(value: GamePhase) {
        this._gamePhase = value;
    }

    private readonly _history: GameHistory;

    get history(): GameHistory {
        return this._history;
    }

    get playerMap(): PlayerMap {
        return this._playerMap;
    }

    get playerNames(): string[] {
        return Object.keys(this._playerMap);
    }

    get rounds(): FinishedRound[] {
        return this._rounds;
    }

    private _gameMode: GameMode;

    get gameMode(): GameMode {
        return this._gameMode;
    }

    private _round: Round;

    get round(): Round {
        return this._round;
    }

    set round(value: Round) {
        this._round = value;
    }

    clone() {
        return new GameWorld(cloneDeep(this.gameMode), cloneDeep(this.playerMap), cloneDeep(this.rounds), cloneDeep(this.round), cloneDeep(this.history));
    }

    cloneWithNewPlayerMap(playerMap: PlayerMap) {
        return new GameWorld(this.gameMode, cloneDeep(playerMap), cloneDeep(this.rounds), cloneDeep(this.round), cloneDeep(this.history));
    }

    onCardPlayed(round: Round): void {
        this.history.onCardPlayed(round);
        Object.values(this.playerMap).forEach(player => player.onCardPlayed(round, this.rounds.length));
    }

    onRoundCompleted(round: FinishedRound, roundIndex: number): void {
        this.history.onRoundCompleted(round);
        Object.values(this.playerMap).forEach(player => player.onRoundCompleted(round, this.rounds.length));

    }

    onGameModeDecided(gameMode: GameMode): void {
    }
}