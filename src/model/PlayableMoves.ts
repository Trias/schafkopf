/**
 *
 * rules of schafkopf.. determine what moves you are allowed to play
 *
 */

import {Suit} from "./Suit";
import {GameMode, GameModeEnum} from "./GameMode";
import {Card, Cards} from "./Cards";
import CardRank from "./CardRank";
import CardSet from "./CardSet";
import Trick from "./Trick";
import {includes, intersection} from "lodash";

export default class PlayableMoves {
    static canCallSuit(cardsOnHand: Card[], suit: Suit) {
        let callAce: Card = suit + CardRank.ACE as Card;
        return suit !== Suit.HERZ && !CardSet.hasCard(cardsOnHand, callAce) && CardSet.hasSuitNoTrump(cardsOnHand, suit);
    }

    static canPlayCard(gameMode: GameMode, cardsOnHand: Card[], card: Card, round: Trick): boolean {
        if(round.isEmpty()){
            if (this.isCalledSuitButNotAce(gameMode, cardsOnHand, card)) {
                // console.log('ruffarbe gespielt');
                return false;
            }else{
                //  console.log('erste karte');
                return true;
            }
        }else{
            let roundSuit = round.getRoundSuit(gameMode);

            //  console.log(`round suit:${roundSuit}`);

            if (gameMode.getMode() === GameModeEnum.CALL_GAME && roundSuit === gameMode.getSuitOfTheGame() && Cards.isOfSuit(card, roundSuit, gameMode)) {
                //  console.log('ruffarbe gespielt');
                if (this.isCalledSuitButNotAce(gameMode, cardsOnHand, card)) {
                    return false;
                }
            }

            if (gameMode.getMode() === GameModeEnum.CALL_GAME && includes(gameMode.getTrumpOrdering(), round.getCards()[0])) {
                //  console.log('trumpf gespielt');
                return includes(gameMode.getTrumpOrdering(), card) || intersection(gameMode.getTrumpOrdering(), cardsOnHand).length == 0
            }

            //console.log('erste karte');

            if (!CardSet.hasSuit(cardsOnHand, roundSuit, gameMode)) {
                //console.log('farbe nicht auf der hand?');
                return true;
            }else {
                //console.log('gleiche farbe?');
                return Cards.isOfSuit(card, roundSuit, gameMode);
            }
        }
    }

    static isCalledSuitButNotAce(gameMode: GameMode, cardsOnHand: Card[], card: Card) {
        if(gameMode.getMode() == GameModeEnum.CALL_GAME
            && gameMode.getSuitOfTheGame() === Cards.getSuit(card, gameMode)
            && CardSet.hasSuit(cardsOnHand, Cards.getSuit(card, gameMode), gameMode)
            && card !== this.getCalledAce(gameMode)
            && CardSet.hasCard(cardsOnHand, this.getCalledAce(gameMode))) {
            return true
        }else{
            return false;
        }
    }

    static getCalledAce(gameMode: GameMode): Card {
        return gameMode.getSuitOfTheGame() + CardRank.ACE as Card;
    }
}