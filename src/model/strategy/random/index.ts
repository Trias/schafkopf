import StrategyInterface from "../StrategyInterface";
import {sample, shuffle} from "lodash"
import {callableColors, PlainColor, plainColors} from "../../cards/Color";
import {GameMode, GameModeEnum} from "../../GameMode";
import {Card} from "../../cards/Card";
import {canCallColor, getPlayableCards} from "../../PlayableMoves";
import {RandomCard} from "../rules/inplay/RandomCard";
import {chooseBestCard} from "../helper";
import {GameWorld} from "../../GameWorld";

export default class RandomStrategy implements StrategyInterface {
    chooseCardToPlay(world: GameWorld, cardSet: readonly Card[]): Card {
        if (world.rounds.length + cardSet.length != 8) {
            throw Error('invariant violated');
        }
        let playableCards = getPlayableCards(cardSet, world.gameMode, world.round);

        if (!playableCards.length) {
            throw Error(`no playable card found! ${cardSet}`);
        }

        return chooseBestCard((new RandomCard).rateCardSet(playableCards))!;
    }

    chooseGameToCall(cardSet: readonly Card[], previousGameMode: GameMode, playerIndex: number): [GameModeEnum?, PlainColor?] {
        if (Math.random() < 0.25) {
            return [];
        }

        if (Math.random() < 0.05) {
            let callColor = sample(plainColors);
            return [GameModeEnum.SOLO, callColor];
        }

        if (Math.random() < 0.05) {
            return [GameModeEnum.WENZ];
        }

        let shuffledColors = shuffle(callableColors);
        let callColor = null;
        for (let color of shuffledColors) {
            if (Math.random() < 0.8 && canCallColor(cardSet, color)) {
                callColor = color;
            }
        }

        if (callColor) {
            return [GameModeEnum.CALL_GAME, callColor];
        } else {
            return [];
        }
    }

    chooseToRaise(cardSet: readonly Card[]): boolean {
        return Math.random() < 0.1;
    }
}