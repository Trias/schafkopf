/**
 *
 * information about the chosen game (Rufspiel, Solo, Wenz,...)
 */

import {PlainColor} from "./cards/Color";
import Player from "./Player";
import CardsOrdering from "./cards/CardsOrdering";

enum GameModeEnum {
    CALL_GAME = "CALL_GAME",
    WENZ = "WENZ",
    SOLO = "SOLO",
    RETRY = "RETRY",
}

class GameMode {

    private readonly mode: GameModeEnum;
    private readonly color?: PlainColor;
    private readonly callingPlayer?: Player;
    private klopfer: number = 0;
    private readonly ordering: CardsOrdering;

    constructor(mode: GameModeEnum, callingPlayer?: Player, color?: PlainColor) {
        if (mode == GameModeEnum.SOLO && !color) {
            throw Error('color must be set for solo');
        }
        if (mode == GameModeEnum.CALL_GAME && (!color || color == PlainColor.HERZ)) {
            throw Error('color must be set for call game');
        }
        if (mode == GameModeEnum.WENZ && color) {
            throw Error('color must not be set for wenz');
        }

        this.mode = mode;
        this.color = color;
        this.callingPlayer = callingPlayer;
        this.ordering = new CardsOrdering(mode, color);
    }

    static compareGameModes(gameModeNext: GameMode, gameModePrev: GameMode): number {
        if (gameModePrev.getMode() === GameModeEnum.SOLO || gameModePrev.getMode() === GameModeEnum.WENZ) {
            return -1;
        } else if (gameModeNext.getMode() === gameModePrev.getMode()) {
            return 0;
        } else {
            return 1;
        }
    }

    getMode() {
        return this.mode;
    }

    getColorOfTheGame() {
        return this.color;
    }

    getCallingPlayer() {
        return this.callingPlayer;
    }

    setKlopfer(klopfer: number) {
        this.klopfer = klopfer;
    }

    getKlopfer(): number {
        return this.klopfer;
    }

    getOrdering() {
        return this.ordering;
    }
}

export {GameMode, GameModeEnum};