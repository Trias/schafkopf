import {Card} from "../../../cards/Card";
import {GameMode, GameModeEnum} from "../../../GameMode";
import {ColorWithTrump, PlainColor, plainColors} from "../../../cards/Color";
import {allOfColor} from "../../../cards/CardSet";
import {getLaufende, hasBlankAce, hasFehlFarbeFrei, hasMinTwoFehlFarbenFrei, hasTwoBlankAces} from "./CardSetAnalyzer";
import {includes} from "lodash";
import {Player} from "../../../Player";
import RandomStrategy from "../../random";

// rather conservative estimates from sauspiel.de
export function shouldPlaySolo(cardSet: ReadonlyArray<Card>): [GameModeEnum, PlainColor] | null {
    for (let color of plainColors) {
        let testPlayer = new Player('test', RandomStrategy);
        let testGameMode: GameMode = new GameMode(GameModeEnum.SOLO, testPlayer.getName(), color);
        let trumpHandCards = allOfColor(cardSet, ColorWithTrump.TRUMP, testGameMode);
        let laufende = getLaufende(trumpHandCards, testGameMode);

        if (trumpHandCards.length > 7) {
            if (trumpHandCards[0][1] == "O") {
                return [GameModeEnum.SOLO, color];
            }
        }

        if (trumpHandCards.length > 6) {
            if (trumpHandCards[0] == "EO"
                && trumpHandCards[1][1] == "O"
                && (trumpHandCards[2][1] == "O"
                    || trumpHandCards[3][1] == "U" && trumpHandCards[3][0] != "S"
                )) {
                return [GameModeEnum.SOLO, color];
            }
            if (trumpHandCards[0][1] == "O" && trumpHandCards[0][0] !== "S"
                && (trumpHandCards[2][1] == "O" || trumpHandCards[3][1] == "U")
                && includes(trumpHandCards, color + "A")
                && includes(trumpHandCards, color + "X")
                && hasBlankAce(cardSet, testGameMode)
            ) {
                return [GameModeEnum.SOLO, color];
            }
        }

        if (trumpHandCards.length > 5) {
            if (laufende > 1 && trumpHandCards[4][1] == "U"
                && trumpHandCards[1][1] == "O"
                && (includes(trumpHandCards, color + "A")
                    || includes(trumpHandCards, color + "X"))
                && hasBlankAce(cardSet, testGameMode)
                && hasMinTwoFehlFarbenFrei(cardSet, testGameMode)
            ) {
                return [GameModeEnum.SOLO, color];
            }
            if (laufende > 1 && trumpHandCards[4][1] == "U"
                && trumpHandCards[1][1] == "O"
                && (includes(trumpHandCards, color + "A")
                    || includes(trumpHandCards, color + "X"))
                && hasBlankAce(cardSet, testGameMode)
                && hasTwoBlankAces(cardSet, testGameMode)
            ) {
                return [GameModeEnum.SOLO, color];
            }
        }

        if (trumpHandCards.length > 4) {
            if (laufende > 2
                && includes(trumpHandCards, "EU" as Card)
                && hasTwoBlankAces(cardSet, testGameMode)
                && hasFehlFarbeFrei(cardSet, testGameMode)
            ) {
                return [GameModeEnum.SOLO, color];
            }
        }
    }

    return null;
}