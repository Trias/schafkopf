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
import {humanTranslation} from "../../../logging/humanTranslation";
import {determineGameMode} from "../rules/shouldCall/determineGameMode";

export class ManualStrategy implements StrategyInterface {
    private moveEvaluation?: MoveEvaluation;

    async chooseCardToPlay(world: GameWorld, cardSet: Card[]): Promise<Card> {
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
        let cardAnswers = await prompt({
            type: 'select',
            name: 'card',
            message: `choose a card`,
            initial,
            choices
        });

        if (this.moveEvaluation) {
            let cardByHeuristics = await this.moveEvaluation.getBestMove(world, cardSet);

            if (cardByHeuristics.card != cardAnswers.card) {
                log.report(`Die Heuristik hätte ${cardByHeuristics.card} statt ${cardAnswers.card} gespielt. \nGründe:`);
                log.report(cardByHeuristics.reasons.map(humanTranslation).map((r, i) => `${(i + 1)}. ${r}`).join('\n'));
                log.report(`-> ${humanTranslation(cardByHeuristics.conclusion)} aus den Karten ${cardByHeuristics.cardSet}`)
            }
        }

        return cardAnswers.card;
    }

    async chooseGameToCall(cardSet: Card[], previousGameMode: GameMode, playerIndex: number, allowedGameModes: GameModeEnum[]): Promise<[GameModeEnum?, PlainColor?]> {
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
        let gameAnswer = await prompt({
            type: 'select',
            name: 'game',
            message: `choose a game to play`,
            choices
        });

        // this callback was a weird idea....
        let gameMode = determineGameMode(previousGameMode, cardSet, allowedGameModes, (reasons: string[], gameMode: GameModeEnum, color: PlainColor) => {
            if (reasons && !gameAnswer.game) {
                log.report('Die Heuristik hätte das Spiel gemacht. Grund:');
                log.report(reasons.join('\n'));
            }

            if (reasons && gameAnswer.game && gameAnswer.game != color) {
                log.report('Die Heuristik hätte eine andere Farbe gerufen: ' + color);
            }
        });

        if (!gameMode.length && gameAnswer.game) {
            log.report('Die Heuristik hätte das Spiel nicht gemacht');
        }

        if (gameAnswer.game) {
            return [GameModeEnum.CALL_GAME, gameAnswer.game];
        } else {
            return [];
        }
    }

    chooseToRaise(cardSet: readonly Card[]): boolean {
        return false;
    }

    injectMoveEvaluation(moveEvaluation: MoveEvaluation) {
        this.moveEvaluation = moveEvaluation;
    }
}