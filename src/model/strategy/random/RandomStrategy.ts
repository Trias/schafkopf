import StrategyInterface from "../StrategyInterface";
import {includes} from "lodash"
import {callableColors, PlainColor, plainColors} from "../../cards/Color";
import {GameMode, GameModeEnum} from "../../GameMode";
import {Card} from "../../cards/Card";
import {canCallColor, getPlayableCards} from "../../PlayableMoves";
import {GameWorld} from "../../GameWorld";
import {shuffle} from "../../../utils/shuffle";
import {sample} from "../../../utils/sample";

export default class RandomStrategy implements StrategyInterface {
    chooseCardToPlay(world: GameWorld, cardSet: readonly Card[]): Card {
        if (world.rounds.length + cardSet.length != 8) {
            throw Error('invariant violated');
        }
        let playableCards = getPlayableCards(cardSet, world.gameMode, world.round);

        if (!playableCards.length) {
            throw Error(`no playable card found! ${cardSet}`);
        }

        return sample(playableCards)!;
    }

    chooseGameToCall(cardSet: readonly Card[], previousGameMode: GameMode, playerIndex: number, allowedGameModes: GameModeEnum[]): [GameModeEnum?, PlainColor?] {
        if (Math.random() < 0.25) {
            return [];
        }

        if (includes(allowedGameModes, GameModeEnum.SOLO)) {
            if (Math.random() < 0.05) {
                let callColor = sample(plainColors);
                return [GameModeEnum.SOLO, callColor];
            }
        }

        if (includes(allowedGameModes, GameModeEnum.WENZ)) {
            if (Math.random() < 0.05) {
                return [GameModeEnum.WENZ];
            }
        }
        if (includes(allowedGameModes, GameModeEnum.CALL_GAME)) {

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
        return [];
    }

    chooseToRaise(cardSet: readonly Card[]): boolean {
        return Math.random() < 0.1;
    }
}