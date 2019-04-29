/**
 *
 * information about the chosen game (Rufspiel, Solo, Wenz,...)
 */

import {Suits} from "./orderings/DefaultSuitOrdering";
import {Suit} from "./Suit";
import {Card, Cards} from "./Cards";
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
    private readonly suit?: Suit;
    private readonly callingPlayer?: Player;
    private klopfer: number = 0;

    constructor(mode: GameModeEnum, callingPlayer?: Player, suit?: Suit) {
        this.mode = mode;
        this.suit = suit;
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

    isTrump(card: Card) {
        return includes(this.getTrumpOrdering(), card);
    }

    highestCard(card1: Card, card2: Card) {
        if (this.isTrump(card1) && this.isTrump(card2)) {
            //console.log(`trump over trump: ${card1}, ${card2}  => ${this.highestCardTrumpOrdering(card1, card2)}`);
            return this.highestCardTrumpOrdering(card1, card2);
        } else if (this.isTrump(card1) && !this.isTrump(card2)) {
            // console.log(`trump over suit: ${card1}, ${card2} => ${card1}`);
            return card1
        } else if (!this.isTrump(card1) && this.isTrump(card2)) {
            // console.log(`not trump by trump: ${card1}, ${card2} => ${card2}`);
            return card2;
        } else if (Cards.getSuit(card1, this) !== Cards.getSuit(card2, this)) {
            // console.log(`stays at card1: ${card1}, ${card2} => ${card1}`);
            return card1;
        } else if (Cards.getSuit(card1, this) === Cards.getSuit(card2, this)) {
            //  console.log(`suit over suit: ${card1}, ${card2} => ${this.highestCardSuitOrdering(card1, card2)}`);
            return this.highestCardSuitOrdering(card1, card2);
        } else {
            //  console.log(`stays at card1: ${card1}, ${card2} => ${card1}`);
            return card1;
        }
    }

    getTrumpOrdering(): Card[] {
        if (this.mode == GameModeEnum.CALL_GAME) {
            return DefaultTrumpOrdering;
        } else if (this.mode == GameModeEnum.SOLO) {
            let suit = this.suit as Suit;
            return OberAndUnter.concat(Suits[suit])
        } else if (this.mode == GameModeEnum.WENZ) {
            return Unter;
        } else {
            throw Error('not implemented');
        }
    }

    getSuitOrdering(suit: Suit): Card[] {
        if (this.mode == GameModeEnum.CALL_GAME || this.mode == GameModeEnum.SOLO) {
            return Suits[suit];
        } else if (this.mode == GameModeEnum.WENZ) {
            let ober = suit + "O" as Card;
            return Suits[suit].splice(3, 0, ober);
        } else {
            throw Error('not implemented');
        }
    }

    getMode() {
        return this.mode;
    }

    getSuitOfTheGame() {
        return this.suit;
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

    private highestCardTrumpOrdering(card1: Card, card2: Card) {
        if (!this.isTrump(card1) || !this.isTrump(card2)) {
            throw Error('two trump cards required');
        }

        if (this.getTrumpOrdering().indexOf(card1) < this.getTrumpOrdering().indexOf(card2)) {
            return card1;
        } else {
            return card2;
        }
    }

    private highestCardSuitOrdering(card1: Card, card2: Card) {
        if (this.isTrump(card1) || this.isTrump(card2)) {
            throw Error('two suit cards required');
        }

        if (this.getSuitOrdering(Cards.getSuit(card1, this)).indexOf(card1) > this.getSuitOrdering(Cards.getSuit(card1, this)).indexOf(card2)) {
            return card2;
        } else {
            // also if different suit
            return card1;
        }
    }
}

export {GameMode, GameModeEnum};