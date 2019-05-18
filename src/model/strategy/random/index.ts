import StrategyInterface from "../StrategyInterface";
import {filter, sample, shuffle} from "lodash"
import {callableColors, PlainColor, plainColors} from "../../cards/Color";
import {GameMode, GameModeEnum} from "../../GameMode";
import {Round} from "../../Round";
import {Card} from "../../cards/Card";
import {canCallColor, canPlayCard} from "../../PlayableMoves";
import {playRandomCard} from "../rules/inplay/playRandomCard";
import {CardToWeights} from "../rules/CardToWeights";
import {Player} from "../../Player";

function chooseBestCard(cardToWeights: CardToWeights) {
    return Object.entries(cardToWeights).sort((a, b) => {
        return a[1]! > b[1]! ? -1 : 1;
    }).shift()![0] as Card;
}

export default class RandomStrategy implements StrategyInterface {
    chooseCardToPlay(round: Round, cardSet: readonly Card[], gameMode: GameMode): Card {
        let playableCards = filter(cardSet, card => {
            return canPlayCard(gameMode, cardSet, card, round)
        });

        if (!playableCards.length) {
            throw Error(`no playable card found! ${cardSet}`);
        }

        return chooseBestCard(playRandomCard(playableCards));
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

    setPlayer(player: Player): void {
        // dont care...
    }
}