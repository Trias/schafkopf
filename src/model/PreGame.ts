import GamePhase from "./GamePhase";
import {Card} from "./cards/Card";
import {PlayerMap} from "./Player";
import {GameMode, GameModeEnum} from "./GameMode";

export class PreGame {
    private readonly playerMap: PlayerMap;
    private gamePhase: GamePhase;

    constructor(playerMap: PlayerMap) {
        this.playerMap = playerMap;
        this.gamePhase = GamePhase.BEFORE_GAME;
    }

    determineGameMode(cardsInSets: Card[][], allowedGameModes: GameModeEnum[] = Object.values(GameModeEnum)) {
        if (this.gamePhase != GamePhase.BEFORE_GAME) {
            throw Error('Invalid state transition');
        }

        this.setGamePhase(GamePhase.BEFORE_GAME);
        this.notifyPlayersOfGameStart();

        console.log(`-----deal first batch of cards ------`);
        this.dealFirstBatchOfCards(cardsInSets);
        this.setGamePhase(GamePhase.FOUR_CARDS_DEALT);

        let klopfer = this.askPlayerForKlopfer();

        console.log(`-----deal second batch of cards ------`);
        this.dealSecondBatchOfCard(cardsInSets);
        this.setGamePhase(GamePhase.ALL_CARDS_DEALT);

        let gameMode = this.askPlayersWhatTheyWantToPlay(allowedGameModes);
        gameMode.setKlopfer(klopfer);

        return gameMode;
    }


    private askPlayersWhatTheyWantToPlay(allowedGameModes: GameModeEnum[]): GameMode {
        let currentGameMode = new GameMode(GameModeEnum.RETRY);

        Object.values(this.playerMap).forEach((p, i) => {
            let newGameMode = p.whatDoYouWantToPlay(currentGameMode, i, allowedGameModes);
            if (newGameMode && (GameMode.compareGameModes(newGameMode, currentGameMode) > 0)) {
                currentGameMode = newGameMode;
            }
        });

        return currentGameMode;
    }

    private dealSecondBatchOfCard(cardsInSets: Card[][]) {
        Object.values(this.playerMap).forEach((p, i) => p.onReceiveSecondBatchOfCards(cardsInSets[i + 4]));
    }

    private dealFirstBatchOfCards(cardsInSets: Card[][]) {
        Object.values(this.playerMap).forEach((p, i) => p.onReceiveFirstBatchOfCards(cardsInSets[i]));
    }

    private askPlayerForKlopfer() {
        let klopfer = 0;
        Object.values(this.playerMap).forEach((p) => {
            let raise = p.doYouWantToKlopf();

            if (raise) {
                console.log(`${p} klopfes with cards: ${p.getCurrentCardSet()}!`);
                klopfer = klopfer + 1;
            }
        });
        return klopfer;
    }

    private notifyPlayersOfGameStart() {
        Object.values(this.playerMap).forEach(p => p.onGameStart());
    }

    private notifyPlayersOfGamePhase() {
        Object.values(this.playerMap).forEach(p => p.onNewGamePhase(this.gamePhase));
    }

    private setGamePhase(gamePhase: GamePhase) {
        if (this.gamePhase > gamePhase && gamePhase != GamePhase.BEFORE_GAME) {
            throw Error('invalid state transition');
        }
        this.gamePhase = gamePhase;
        this.notifyPlayersOfGamePhase();
    }
}