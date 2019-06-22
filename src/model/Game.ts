import {GameMode} from "./GameMode";
import GameResult from "./GameResult";
import {PlayerMap} from "./Player";
import {FinishedRound, Round} from "./Round";
import GamePhase from "./GamePhase";
import {sortByNaturalOrdering} from "./cards/CardSet";
import {RoundAnalyzer} from "./knowledge/RoundAnalyzer";
import {GameWorld} from "./GameWorld";
import {GameHistory} from "./knowledge/GameHistory";

export class Game {
    private readonly playerMap: PlayerMap;
    private readonly rounds: FinishedRound[];
    private readonly gameMode: GameMode;
    private readonly world: GameWorld;

    constructor(world: GameWorld) {
        let names = Object.keys(world.playerMap);

        if (names.length != 4) {
            throw Error('not exactly 4 players!');
        }

        this.rounds = world.rounds;
        this.playerMap = world.playerMap;
        this.world = world;
        this.gameMode = world.gameMode
    }

    play() {
        if (this.gameMode.isNoRetry()) {
            this.setGamePhase(GamePhase.IN_PLAY);

            console.log(`game mode decided: ${this.gameMode.getMode()}, by ${this.gameMode.getCallingPlayerName()}, calling for ${this.gameMode.getColorOfTheGame()}`);

            this.playRounds(this.world.round.getStartPlayerName());
        }

        this.setGamePhase(GamePhase.AFTER_GAME);
    }

    getGameResult() {
        if (this.world.gamePhase !== GamePhase.AFTER_GAME) {
            throw Error('gameResult not yet determined!');
        }

        return new GameResult(this.world);
    }

    private playRounds(startPlayer: string): void {
        // TODO: should probably work on an injected world

        let myRound = new Round(startPlayer, Object.keys(this.playerMap));
        let history = new GameHistory(Object.keys(this.playerMap), this.gameMode);
        let world = new GameWorld(this.gameMode, this.playerMap, this.rounds, myRound, history);

        for (let i = 0; i < 8; i++) {
            console.log(`------round ${i + 1} start-----`);
            for (let j = 0; j < 4; j++) {
                if (world.round.getPosition() >= 4) {
                    throw Error('round finished');
                }
                let activePlayerName = world.round.getCurrentPlayerName();
                this.playerMap[activePlayerName].playCard(world);
                console.log(`player ${activePlayerName} played ${world.round.getLastPlayedCard()} from set ${sortByNaturalOrdering(this.playerMap[activePlayerName].getCurrentCardSet().concat(world.round.getLastPlayedCard()))}`);
            }
            this.markCalledAce(world.round);
            this.rounds.push(world.round.finish());

            let roundAnalyzer = new RoundAnalyzer(world.round, this.gameMode);
            console.log(`round winner: ${roundAnalyzer.getWinningPlayerName()} at position ${roundAnalyzer.getWinningCardPosition() + 1}; round cards: ${world.round.getPlayedCards()}`);
            console.log(`------round ${i + 1} finished-----`);
            world.round = new Round(roundAnalyzer.getWinningPlayerName(), Object.keys(this.playerMap));
        }
        console.log(`=====game finished=======`);
    }

    private markCalledAce(round: Round) {
        let roundAnalyzer = new RoundAnalyzer(round, this.gameMode);
        if (this.gameMode.isCallGame()
            && !this.gameMode.getHasAceBeenCalled()
            && roundAnalyzer.getRoundColor() == this.gameMode.getColorOfTheGame()) {
            this.gameMode.setHasAceBeenCalled();
        }
    }

    private setGamePhase(gamePhase: GamePhase) {
        if (this.world.gamePhase > gamePhase && gamePhase != GamePhase.BEFORE_GAME) {
            throw Error('invalid state transition');
        }
        this.world.gamePhase = gamePhase;
        this.notifyPlayersOfGamePhase(gamePhase);
    }

    private notifyPlayersOfGamePhase(gamePhase: GamePhase) {
        Object.values(this.playerMap).forEach(p => p.onNewGamePhase(gamePhase));
    }
}