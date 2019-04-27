/**
 * up to 8 cards hold by one player
 */
import {CardEnum, Card} from "./Card";
import {ColorEnum} from "./ColorEnum";
import {without} from "lodash";

export default class CardSet {
    private readonly cards: CardEnum[];
    constructor(cards: CardEnum[]){

        if(cards.length > 8){
            throw Error('to many cards in cardSet')
        }
        this.cards = cards;
    }
    hasCard(otherCard: CardEnum): boolean {
        return this.cards.reduce((prev: boolean, card: CardEnum): boolean => {
            return prev || card === otherCard;
        }, false);
    }

    hasColor(otherColor: ColorEnum){
        return this.cards.reduce((prev: boolean, card: CardEnum): boolean => {
            return prev || Card.getColor(card) === otherColor;
        }, false);
    }

    asArray(): CardEnum[] {
        return this.cards;
    }

    removeCard(card: CardEnum): CardSet {
        if(this.cards.indexOf(card) < 0){
            throw Error(`card (${card}) not in Deck ${this.cards.toString()}`);
        }
        return new CardSet(without(this.cards, card));
    }
}