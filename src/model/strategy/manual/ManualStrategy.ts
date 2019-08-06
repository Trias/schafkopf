import StrategyInterface from "../StrategyInterface";
import {PlainColor} from "../../cards/Color";
import {GameMode, GameModeEnum} from "../../GameMode";
import {Card} from "../../cards/Card";
import {GameWorld} from "../../GameWorld";
import {getCallableColors} from "../../cards/CardSet";
import {includes} from "lodash";
import {getPlayableCards} from "../../PlayableMoves";
import log from "../../../logging/log";
import colors from "chalk";
import prompt from 'prompts';
import {MoveEvaluation} from "../../reporting/MoveEvaluation";

export class ManualStrategy implements StrategyInterface {
    async chooseCardToPlay(world: GameWorld, cardSet: readonly Card[]): Promise<Card> {
        let playableCards = getPlayableCards(cardSet, world.gameMode, world.round);
        let i = 0;
        let initial = 0;
        let choices = cardSet.map(card => {
            if (includes(playableCards, card)) {
                initial = i;
                return {title: card, value: card}
            } else {
                i++;
                return {title: card, value: card, disabled: true}
            }
        });
        let card = await prompt({
            type: 'select',
            name: 'card',
            message: `choose a card`,
            initial,
            choices
        });

        return card.card;
    }

    async chooseGameToCall(cardSet: readonly Card[], previousGameMode: GameMode, playerIndex: number, allowedGameModes: GameModeEnum[]): Promise<[GameModeEnum?, PlainColor?]> {
        let choices;

        log.gameInfo("your cards: " + colors.bold(cardSet.toString()));
        if (previousGameMode.isCallGame()) {
            choices = [{title: "pass", value: ""}];
        } else {
            choices = [{title: "pass", value: ""}, ...getCallableColors(cardSet)
                .map(color => {
                    return {title: "call color " + color as string, value: color as string}
                })];
        }
        let color = await prompt({
            type: 'select',
            name: 'game',
            message: `choose a game to play`,
            choices
        });

        if (color.game) {
            return [GameModeEnum.CALL_GAME, color.game];
        } else {
            return [];
        }
    }

    chooseToRaise(cardSet: readonly Card[]): boolean {
        return false;
    }

    injectMoveEvaluation(moveEvaluation: MoveEvaluation) {

    }
}