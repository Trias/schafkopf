/**
 *
 * information about the chosen game (Rufspiel, Solo, Wenz,...)
 */

import {Colors} from "./orderings/DefaultColorOrdering";
import {ColorEnum} from "./ColorEnum";
import {Card, CardEnum} from "./Card";
import Player from "./Player";
import {includes} from "lodash";
import OberAndUnter from "./orderings/OberAndUnter";
import Unter from "./orderings/Unter";
import DefaultTrumpOrdering from "./orderings/DefaultTrumpOrdering";

enum GameModeEnum {
    CALL_GAME = "CALL_GAME",
    WENZ = "WENZ",
    SOLO = "SOLO",
    RETRY = "RETRY",
}

class GameMode {

    private readonly mode: GameModeEnum;
    private readonly color?: ColorEnum;
    private readonly callingPlayer?: Player;
    private raises: number = 0;

    constructor(mode: GameModeEnum, callingPlayer?: Player, color?: ColorEnum) {
        this.mode = mode;
        this.color = color;
        this.callingPlayer = callingPlayer;
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

    isTrump(card: CardEnum) {
        return includes(this.getTrumpOrdering(), card);
    }

    highestCard(card1: CardEnum, card2: CardEnum) {
        if (this.isTrump(card1) && this.isTrump(card2)) {
            //console.log(`trump over trump: ${card1}, ${card2}  => ${this.highestCardTrumpOrdering(card1, card2)}`);
            return this.highestCardTrumpOrdering(card1, card2);
        } else if (this.isTrump(card1) && !this.isTrump(card2)) {
            // console.log(`trump over color: ${card1}, ${card2} => ${card1}`);
            return card1
        } else if (!this.isTrump(card1) && this.isTrump(card2)) {
            // console.log(`not trump by trump: ${card1}, ${card2} => ${card2}`);
            return card2;
        } else if (Card.getColor(card1, this) !== Card.getColor(card2, this)) {
            // console.log(`stays at card1: ${card1}, ${card2} => ${card1}`);
            return card1;
        } else if (Card.getColor(card1, this) === Card.getColor(card2, this)) {
            //  console.log(`color over color: ${card1}, ${card2} => ${this.highestCardColorOrdering(card1, card2)}`);
            return this.highestCardColorOrdering(card1, card2);
        } else {
            //  console.log(`stays at card1: ${card1}, ${card2} => ${card1}`);
            return card1;
        }
    }

    getTrumpOrdering(): CardEnum[] {
        if (this.mode == GameModeEnum.CALL_GAME) {
            return DefaultTrumpOrdering;
        } else if (this.mode == GameModeEnum.SOLO) {
            let color = this.color as ColorEnum;
            return OberAndUnter.concat(Colors[color])
        } else if (this.mode == GameModeEnum.WENZ) {
            return Unter;
        } else {
            throw Error('not implemented');
        }
    }

    getColorOrdering(color: ColorEnum): CardEnum[] {
        if (this.mode == GameModeEnum.CALL_GAME || this.mode == GameModeEnum.SOLO) {
            return Colors[color];
        } else if (this.mode == GameModeEnum.WENZ) {
            let ober = color + "O" as CardEnum;
            return Colors[color].splice(3, 0, ober);
        } else {
            throw Error('not implemented');
        }
    }

    getMode() {
        return this.mode;
    }

    getColor() {
        return this.color;
    }

    getCallingPlayer() {
        return this.callingPlayer;
    }

    setRaises(raises: number) {
        this.raises = raises;
    }

    getRaises(): number {
        return this.raises;
    }

    private highestCardTrumpOrdering(card1: CardEnum, card2: CardEnum) {
        if (!this.isTrump(card1) || !this.isTrump(card2)) {
            throw Error('two trump cards required');
        }

        if (this.getTrumpOrdering().indexOf(card1) < this.getTrumpOrdering().indexOf(card2)) {
            return card1;
        } else {
            return card2;
        }
    }

    private highestCardColorOrdering(card1: CardEnum, card2: CardEnum) {
        if (this.isTrump(card1) || this.isTrump(card2)) {
            throw Error('two color cards required');
        }

        if (this.getColorOrdering(Card.getColor(card1, this)).indexOf(card1) > this.getColorOrdering(Card.getColor(card1, this)).indexOf(card2)) {
            return card2;
        } else {
            // also if different color
            return card1;
        }
    }
}

export {GameMode, GameModeEnum};