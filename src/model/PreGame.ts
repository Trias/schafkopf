import GamePhase from "./GamePhase";
import {Card} from "./cards/Card";
import {PlayerMap} from "./Player";
import {GameMode, GameModeEnum} from "./GameMode";
import {GameWorld} from "./GameWorld";
import log from "../logging/log";
import colors from "colors";

export class PreGame {
    private readonly playerMap: PlayerMap;
    private gamePhase: GamePhase;

    constructor(playerMap: PlayerMap) {
        this.playerMap = playerMap;
        this.gamePhase = GamePhase.BEFORE_GAME;
    }

    async determineGameMode(cardsInSets: Card[][], allowedGameModes: GameModeEnum[] = Object.values(GameModeEnum)) {
        if (this.gamePhase != GamePhase.BEFORE_GAME) {
            throw Error('Invalid state transition');
        }

        this.setGamePhase(GamePhase.BEFORE_GAME);
        this.notifyPlayersOfGameStart();

        log.info(`-----deal first batch of cards ------`);
        this.dealFirstBatchOfCards(cardsInSets);
        this.setGamePhase(GamePhase.FOUR_CARDS_DEALT);

        let klopfer = await this.askPlayerForKlopfer();

        log.info(`-----deal second batch of cards ------`);
        this.dealSecondBatchOfCard(cardsInSets);
        this.setGamePhase(GamePhase.ALL_CARDS_DEALT);

        let gameMode = await this.askPlayersWhatTheyWantToPlay(allowedGameModes);
        gameMode.setKlopfer(klopfer);

        return gameMode;
    }

    private async askPlayersWhatTheyWantToPlay(allowedGameModes: GameModeEnum[]): Promise<GameMode> {
        let currentGameMode = new GameMode(GameModeEnum.RETRY);

        let i = 0;
        for (let player of Object.values(this.playerMap)) {
            let newGameMode = await player.whatDoYouWantToPlay(currentGameMode, i, allowedGameModes);
            if (newGameMode && (GameMode.compareGameModes(newGameMode, currentGameMode) > 0)) {
                currentGameMode = newGameMode;
            }
            i++;
        }

        return currentGameMode;
    }

    private dealSecondBatchOfCard(cardsInSets: Card[][]) {
        Object.values(this.playerMap).forEach((p, i) => p.onReceiveSecondBatchOfCards(cardsInSets[i + 4]));
    }

    private dealFirstBatchOfCards(cardsInSets: Card[][]) {
        Object.values(this.playerMap).forEach((p, i) => p.onReceiveFirstBatchOfCards(cardsInSets[i]));
    }

    private async askPlayerForKlopfer() {
        let klopfer = 0;
        for (let player of Object.values(this.playerMap)) {
            let raise = await player.doYouWantToKlopf();

            if (raise) {
                log.gameInfo(`${colors.bold(player.toString())} klopfes`);
                log.private(` with cards: ${player.getCurrentCardSet()}!`);
                klopfer = klopfer + 1;
            }
        }
        return klopfer;
    }

    private notifyPlayersOfGameStart(world: GameWorld | null = null) {
        Object.values(this.playerMap).forEach(p => p.onGameStart(world));
    }

    private notifyPlayersOfGamePhase(world: GameWorld | null = null) {
        Object.values(this.playerMap).forEach(p => p.onNewGamePhase(this.gamePhase, world));
    }

    private setGamePhase(gamePhase: GamePhase, world: GameWorld | null = null) {
        if (this.gamePhase > gamePhase && gamePhase != GamePhase.BEFORE_GAME) {
            throw Error('invalid state transition');
        }
        this.gamePhase = gamePhase;
        this.notifyPlayersOfGamePhase(world);
    }
}