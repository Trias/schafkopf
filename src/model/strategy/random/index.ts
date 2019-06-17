import StrategyInterface from "../StrategyInterface";
import {sample, shuffle} from "lodash"
import {callableColors, PlainColor, plainColors} from "../../cards/Color";
import {GameMode, GameModeEnum} from "../../GameMode";
import {FinishedRound, Round} from "../../Round";
import {Card} from "../../cards/Card";
import {canCallColor, getPlayableCards} from "../../PlayableMoves";
import {RandomCard} from "../rules/inplay/RandomCard";
import {Player} from "../../Player";
import {chooseBestCard} from "../helper";

export default class RandomStrategy implements StrategyInterface {
    chooseCardToPlay(round: Round, cardSet: readonly Card[], gameMode: GameMode, playedRounds: FinishedRound[]): Card {
        if (playedRounds.length + cardSet.length != 8) {
            throw Error('invariant violated');
        }
        let playableCards = getPlayableCards(cardSet, gameMode, round);

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

    setPlayer(player: Player): void {
        // dont care...
    }

    skipInference(): boolean {
        return true;
    }


}