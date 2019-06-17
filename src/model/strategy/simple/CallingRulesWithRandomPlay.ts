import StrategyInterface from "../StrategyInterface";
import {filter} from "lodash"
import {PlainColor} from "../../cards/Color";
import {GameMode, GameModeEnum} from "../../GameMode";
import {FinishedRound, Round} from "../../Round";
import {Card} from "../../cards/Card";
import {canPlayCard} from "../../PlayableMoves";
import {RandomCard} from "../rules/inplay/RandomCard";
import {chooseBestCard} from "../helper";
import {determineGameMode} from "../rules/shouldCall/determineGameMode";

export default class SimpleStrategy implements StrategyInterface {

    chooseCardToPlay(round: Round, cardSet: readonly Card[], gameMode: GameMode, playedRounds: FinishedRound[]): Card {
        let playableCards = filter(cardSet, card => {
            return canPlayCard(gameMode, cardSet, card, round)
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

    chooseGameToCall(cardSet: readonly Card[], previousGameMode: GameMode, playerIndex: number): [GameModeEnum?, PlainColor?] {
        return determineGameMode(previousGameMode, cardSet);
    }

    chooseToRaise(cardSet: readonly Card[]): boolean {
        return false;
    }

    skipInference(): boolean {
        return true;
    }
}