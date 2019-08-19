import {Card} from "./Card";
import {clone, includes} from "lodash";
import {GameModeEnum} from "../GameMode";
import DefaultTrumpOrdering from "./sets/CallGameTrumps";
import {ColorWithTrump, PlainColor} from "./Color";
import OberAndUnter from "./sets/OberAndUnter";
import {CardsByColor} from "./sets/CardsByColor";
import Unter from "./sets/Unter";

export default class CardsOrdering {
    private readonly gameModeEnum: GameModeEnum;
    private readonly color?: PlainColor;

    constructor(gameModeEnum: GameModeEnum, color?: PlainColor) {
        this.gameModeEnum = gameModeEnum;
        this.color = color;
    }

    isTrump(card: Card) {
        return includes(this.getTrumpOrdering(), card);
    }

    highestCard(card1: Card, card2: Card) {
        if (this.isTrump(card1) && this.isTrump(card2)) {
            //console.log(`trump over trump: ${card1}, ${card2}  => ${this.highestCardTrumpOrdering(card1, card2)}`);
            return this.highestCardTrumpOrdering(card1, card2);
        } else if (this.isTrump(card1) && !this.isTrump(card2)) {
            // console.log(`trump over color: ${card1}, ${card2} => ${card1}`);
            return card1
        } else if (!this.isTrump(card1) && this.isTrump(card2)) {
            // console.log(`not trump by trump: ${card1}, ${card2} => ${card2}`);
            return card2;
        } else if (this.getColor(card1) !== this.getColor(card2)) {
            // console.log(`stays at card1: ${card1}, ${card2} => ${card1}`);
            return card1;
        } else if (this.getColor(card1) === this.getColor(card2)) {
            //  console.log(`color over color: ${card1}, ${card2} => ${this.highestCardColorOrdering(card1, card2)}`);
            return this.highestCardColorOrdering(card1, card2);
        } else {
            //  console.log(`stays at card1: ${card1}, ${card2} => ${card1}`);
            return card1;
        }
    }

    rightBeatsLeftCard(card1: Card, card2: Card) {
        return this.highestCard(card1, card2) == card2;
    }

    getTrumpOrdering(): readonly Card[] {
        if (this.gameModeEnum == GameModeEnum.CALL_GAME) {
            return DefaultTrumpOrdering;
        } else if (this.gameModeEnum == GameModeEnum.SOLO) {
            let color = this.color as PlainColor;
            return OberAndUnter.concat(CardsByColor[color])
        } else if (this.gameModeEnum == GameModeEnum.WENZ) {
            return Unter;
        } else {
            return DefaultTrumpOrdering;
        }
    }

    getColorOrdering(color: PlainColor): readonly Card[] {
        if (this.gameModeEnum == GameModeEnum.CALL_GAME || this.gameModeEnum == GameModeEnum.SOLO || this.gameModeEnum == GameModeEnum.RETRY) {
            if (color == ColorWithTrump.HERZ && this.gameModeEnum == GameModeEnum.CALL_GAME
                || this.gameModeEnum == GameModeEnum.SOLO && color === this.color) {
                return [];
            } else {
                return CardsByColor[color];
            }
        } else if (this.gameModeEnum == GameModeEnum.WENZ) {
            let ober = color + "O" as Card;
            let myClone = clone(CardsByColor[color]) as Card[];
            myClone.splice(3, 0, ober);
            return myClone as readonly Card[];
        } else {
            throw Error('not implemented');
        }
    }

    isOfColor(card: Card, color: ColorWithTrump) {
        return color === this.getColor(card);
    }

    getColor(card: Card): ColorWithTrump {
        if (includes(this.getTrumpOrdering(), card)) {
            return ColorWithTrump.TRUMP;
        }
        return card[0] as ColorWithTrump;
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

    private highestCardColorOrdering(card1: Card, card2: Card) {
        if (this.isTrump(card1) || this.isTrump(card2)) {
            throw Error('two color cards required');
        }

        if (this.getColorOrdering(this.getColor(card1) as PlainColor).indexOf(card1) > this.getColorOrdering(this.getColor(card2) as PlainColor).indexOf(card2)) {
            return card2;
        } else {
            // also if different color
            return card1;
        }
    }

    getTrumpsOfCardSet(cardSet: Card[]) {
        return cardSet.filter(card => this.isTrump(card));
    }
}