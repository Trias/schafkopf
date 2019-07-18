import StrategyInterface from "../StrategyInterface";
import {callableColors, PlainColor} from "../../cards/Color";
import {GameMode, GameModeEnum} from "../../GameMode";
import {Card} from "../../cards/Card";
import {GameWorld} from "../../GameWorld";
import {getCallableColors} from "../../cards/CardSet";
import {includes} from "lodash";
import {getPlayableCards} from "../../PlayableMoves";
import log from "../../../logging/log";
import colors from "colors";

const prompt = require('prompt-sync')();


export class ManualStrategy implements StrategyInterface {
    chooseCardToPlay(world: GameWorld, cardSet: readonly Card[]): Card {
        let playableCards = getPlayableCards(cardSet, world.gameMode, world.round);
        while (true) {
            let card = prompt(`choose a card of set ${cardSet.toString()}: `);
            if (includes(playableCards, card)) {
                return card;
            } else {
                if (includes(cardSet, card)) {
                    log.error('card is not playable!');
                } else {
                    log.error(`could not recognize ${card}, try again`);
                }
            }
        }
    }

    chooseGameToCall(cardSet: readonly Card[], previousGameMode: GameMode, playerIndex: number, allowedGameModes: GameModeEnum[]): [GameModeEnum?, PlainColor?] {
        log.gameInfo("your cards: " + colors.bold(cardSet.toString()));
        let color = prompt(`choose an ace color to call: `);

        while (color) {
            if (includes(getCallableColors(cardSet), color)) {
                return [GameModeEnum.CALL_GAME, color];
            } else {
                if (includes(callableColors, color)) {
                    log.error('color is not callable');
                } else {
                    log.error(`could not recognize ${color}, try again. Valid colors are ${callableColors.toString()}`);
                }
                color = prompt(`choose an ace color to call: `);
            }
        }

        return [];
    }

    chooseToRaise(cardSet: readonly Card[]): boolean {
        return false;
    }
}