import {GameMode} from "./GameMode";
import GameResult from "./reporting/GameResult";
import {PlayerMap} from "./Player";
import {Round} from "./Round";
import GamePhase from "./GamePhase";
import {sortByNaturalOrdering} from "./cards/CardSet";
import {RoundAnalyzer} from "./knowledge/RoundAnalyzer";
import {GameWorld} from "./GameWorld";
import log from "../logging/log";
import colors from "colors";

export class Game {
    private readonly playerMap: PlayerMap;
    private readonly gameMode: GameMode;
    private readonly world: GameWorld;

    constructor(world: GameWorld) {
        let names = Object.keys(world.playerMap);

        if (names.length != 4) {
            throw Error('not exactly 4 players!');
        }

        this.playerMap = world.playerMap;
        this.world = world;
        this.gameMode = world.gameMode
    }

    async play() {
        if (this.gameMode.isNoRetry()) {
            this.setGamePhase(GamePhase.IN_PLAY);

            log.gameInfo(`game mode decided: ${colors.bold(this.gameMode.getMode())}, by ${colors.bold(this.gameMode.getCallingPlayerName())}, calling for ${colors.bold(this.gameMode.getColorOfTheGame() as string)}`);

            await this.playRounds();
        }

        this.setGamePhase(GamePhase.AFTER_GAME);
    }

    getGameResult() {
        if (this.world.gamePhase !== GamePhase.AFTER_GAME) {
            throw Error('gameResult not yet determined!');
        }

        return new GameResult(this.world);
    }

    private async playRounds(): Promise<void> {
        for (let i = 0; i < 8; i++) {
            log.info(`------round ${i + 1} start-----`);
            for (let j = 0; j < 4; j++) {
                if (this.world.round.getPosition() >= 4) {
                    throw Error('round finished');
                }
                let activePlayerName = this.world.round.getCurrentPlayerName();
                await this.playerMap[activePlayerName].playCard(this.world);
                log.gameInfo(`${colors.bold(activePlayerName)} played ${colors.bold(this.world.round.getLastPlayedCard())}`);
                log.private(`from set ${sortByNaturalOrdering(this.playerMap[activePlayerName].getCurrentCardSet().concat(this.world.round.getLastPlayedCard()))}`);
            }
            this.markCalledAce(this.world.round);
            this.world.rounds.push(this.world.round.finish());

            let roundAnalyzer = new RoundAnalyzer(this.world.round, this.gameMode);
            log.gameInfo(`round winner: ${colors.bold(roundAnalyzer.getWinningPlayerName())}; round cards: ${colors.bold(this.world.round.getPlayedCards().toString())}`);
            this.world.onRoundCompleted(this.world.round.finish(), i);
            if (this.world.history.isTeamPartnerKnown()) {
                log.private(`Playing Team (${this.world.history.getPlayingTeamNames()}) has ${this.world.history.getTeamPoints(this.world.history.getPlayingTeamNames())} points; Opposing Team (${this.world.history.getNonPlayingTeam()}) has ${this.world.history.getTeamPoints(this.world.history.getNonPlayingTeam())} points`);
            }
            log.info(`------round ${i + 1} finished-----`);
            this.world.round = new Round(roundAnalyzer.getWinningPlayerName(), Object.keys(this.playerMap));
        }
        log.info(`=====game finished=======`);
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
        Object.values(this.playerMap).forEach(p => p.onNewGamePhase(gamePhase, this.world));
    }
}