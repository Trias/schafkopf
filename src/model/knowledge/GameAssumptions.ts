import {FinishedRound, Round} from "../Round";
import {Card} from "../cards/Card";
import {ColorWithTrump} from "../cards/Color";
import {ColorFreeAssumption} from "./GameAssumptionsInCallGame";

export type PlayerConfidence = {
    playerName: string | null, confidence: number, reasons: string[],
}

export default interface GameAssumptions {
    isThisRoundProbablyWon(round: Round, currentHandCards: Card[]): boolean;

    isThisRoundProbablyLost(round: Round, currentHandCards: Card[]): boolean;

    isTeampartnerProbablyKnown(): boolean;

    getPossiblePartnerName(): string | null;

    getPossiblyHighestTrumpOfPartner(): Card;

    isPlayerNamePossiblyColorFree(callingPlayer: string, color: ColorWithTrump): ColorFreeAssumption;

    isPlayerNameProbablyTrumpFree(partner: string): boolean;

    isOpposingTeamPossiblyColorFree(color: ColorWithTrump): boolean;

    willLikelyWinRoundWithCard(round: Round, card: Card, currentHandCards: Card[]): boolean;

    onCardPlayed(round: Round, roundIndex: number): void;

    onRoundCompleted(round: FinishedRound, roundIndex: number): void;

    getPossibleTeamPartnerForPlayerName(playerName: string): PlayerConfidence;

}
