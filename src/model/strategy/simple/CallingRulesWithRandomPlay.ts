import StrategyInterface from "../StrategyInterface";
import {filter} from "lodash"
import {PlainColor} from "../../cards/Color";
import {GameMode, GameModeEnum} from "../../GameMode";
import {Card} from "../../cards/Card";
import {canPlayCard} from "../../PlayableMoves";
import {RandomCard} from "../rules/inplay/RandomCard";
import {chooseBestCard} from "../helper";
import {determineGameMode} from "../rules/shouldCall/determineGameMode";
import {GameWorld} from "../../GameWorld";

export default class SimpleStrategy implements StrategyInterface {

    chooseCardToPlay(world: GameWorld, cardSet: readonly Card[]): Card {
        let playableCards = filter(cardSet, card => {
            return canPlayCard(world.gameMode, cardSet, card, world.round)
        });

        if (!playableCards.length) {
            throw Error(`no playable card found! ${cardSet}`);
        }

        let playRandomCard = new RandomCard();

        let bestCard = chooseBestCard(playRandomCard.rateCardSet(playableCards));

        if (!bestCard) {
            throw Error('no best card found')
        } else {
            return bestCard;
        }
    }

    chooseGameToCall(cardSet: Card[], previousGameMode: GameMode, playerIndex: number): [GameModeEnum?, PlainColor?] {
        return determineGameMode(previousGameMode, cardSet);
    }

    chooseToRaise(cardSet: readonly Card[]): boolean {
        return false;
    }
}