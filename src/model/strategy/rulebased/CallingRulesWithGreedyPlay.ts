import StrategyInterface from "../StrategyInterface";
import {PlainColor} from "../../cards/Color";
import {GameMode, GameModeEnum} from "../../GameMode";
import {Card} from "../../cards/Card";
import {getPlayableCards} from "../../PlayableMoves";
import {determineGameMode} from "../rules/shouldCall/determineGameMode";
import {GameWorld} from "../../GameWorld";
import {sortByNaturalOrdering} from "../../cards/CardSet";
import {shuffle} from "../../../utils/shuffle";

export default class CallingRulesWithGreedyPlay implements StrategyInterface {

    chooseCardToPlay(world: GameWorld, cardSet: Card[]): Card {
        let playableCards = getPlayableCards(cardSet, world.gameMode, world.round);
        let roundAnalyzer = world.round.getRoundAnalyzer(world.gameMode);

        if (!playableCards.length) {
            throw Error(`no playable card found! ${cardSet}`);
        }

        if (world.round.getPlayedCards().length == 0) {
            let shuffledPlayableCards = shuffle(playableCards);

            return shuffledPlayableCards[0];
        }

        let cards = sortByNaturalOrdering(playableCards);

        let bestCard;
        if (world.gameMode.getOrdering().rightBeatsLeftCard(roundAnalyzer.getHighestCard(), cards[0])) {
            bestCard = cards[0];
        } else {
            let shuffledPlayableCards = shuffle(playableCards);

            bestCard = shuffledPlayableCards[0];
        }

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