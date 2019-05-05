/**
 *
 * information about the chosen game (Rufspiel, Solo, Wenz,...)
 */

import {PlainColor} from "./cards/Color";
import {PlayerWithNameOnly} from "./Player";
import CardsOrdering from "./cards/CardsOrdering";
import CardRank from "./cards/CardRank";
import {Card} from "./cards/Card";

enum GameModeEnum {
    CALL_GAME = "CALL_GAME",
    WENZ = "WENZ",
    SOLO = "SOLO",
    RETRY = "RETRY",
}

class GameMode {

    private readonly mode: GameModeEnum;
    private readonly color?: PlainColor;
    private readonly callingPlayer?: PlayerWithNameOnly;
    private klopfer: number = 0;
    private readonly ordering: CardsOrdering;
    private hasAceBeenCalled = false;

    constructor(mode: GameModeEnum, callingPlayer?: PlayerWithNameOnly, color?: PlainColor) {
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
        if (gameModeNext.getMode() === gameModePrev.getMode()) {
            return 0;
        } else if (gameModePrev.getMode() === GameModeEnum.SOLO) {
            return -1;
        } else if (gameModePrev.getMode() === GameModeEnum.WENZ) {
            if (gameModeNext.getMode() == GameModeEnum.SOLO) {
                return 1;
            } else {
                return -1;
            }
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

        Object.defineProperty(this, "klopfer", {
            "writable": false,
        });
    }

    setHasAceBeenCalled() {
        this.hasAceBeenCalled = true;

        Object.defineProperty(this, "hasAceBeenCalled", {
            "writable": false,
        });
    }

    getKlopfer(): number {
        return this.klopfer;
    }

    getOrdering() {
        return this.ordering;
    }

    getCalledAce() {
        if (this.mode != GameModeEnum.CALL_GAME) {
            throw Error('no call game, no called ace');
        }
        return this.color + CardRank.ACE as Card;
    }

    isSinglePlay() {
        return this.getMode() == GameModeEnum.SOLO || this.getMode() == GameModeEnum.WENZ;
    }

    isCallGame() {
        return this.getMode() == GameModeEnum.CALL_GAME;
    }

    getHasAceBeenCalled() {
        return this.hasAceBeenCalled;
    }
}

export {GameMode, GameModeEnum};