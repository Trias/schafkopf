import StrategyInterface from "../StrategyInterface";
import {filter} from "lodash"
import {PlainColor} from "../../cards/Color";
import {GameMode, GameModeEnum} from "../../GameMode";
import {Card} from "../../cards/Card";
import {canPlayCard} from "../../PlayableMoves";
import {determineGameMode} from "../rules/shouldCall/determineGameMode";
import {GameWorld} from "../../GameWorld";
import {shuffle} from "../../../utils/shuffle";

export default class CallingRulesWithRandomPlay implements StrategyInterface {

    chooseCardToPlay(world: GameWorld, cardSet: readonly Card[]): Card {
        let playableCards = filter(cardSet, card => {
            return canPlayCard(world.gameMode, cardSet, card, world.round)
        });

        if (!playableCards.length) {
            throw Error(`no playable card found! ${cardSet}`);
        }

        let shuffledPlayableCards = shuffle(playableCards);

        let bestCard = shuffledPlayableCards[0];

        if (!bestCard) {
            throw Error('no best card found')
        } else {
            return bestCard;
        }
    }

    chooseGameToCall(cardSet: Card[], previousGameMode: GameMode, playerIndex: number, allowedGameModes: GameModeEnum[]): [GameModeEnum?, PlainColor?] {
        return determineGameMode(previousGameMode, cardSet, allowedGameModes);
    }

    chooseToRaise(cardSet: readonly Card[]): boolean {
        return false;
    }
}