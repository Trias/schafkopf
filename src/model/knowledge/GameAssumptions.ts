import {Round} from "../Round";
import {Card} from "../cards/Card";
import {ColorWithTrump} from "../cards/Color";
import {ColorFreeAssumption} from "./GameAssumptionsInCallGame";

export default interface GameAssumptions {
    isThisRoundProbablyWon(round: Round, currentHandCards: Card[]): boolean;

    isThisRoundProbablyLost(round: Round, currentHandCards: Card[]): boolean;

    isTeampartnerProbablyKnown(): boolean;

    getPossiblePartnerName(): string | undefined;

    getPossiblyHighestTrumpOfPartner(): Card;

    isPlayerNamePossiblyColorFree(callingPlayer: string, color: ColorWithTrump): ColorFreeAssumption;

    isPlayerNameProbablyTrumpFree(partner: string): boolean;

    isOpposingTeamPossiblyColorFree(color: ColorWithTrump): boolean;

    willLikelyWinRoundWithCard(round: Round, card: Card, currentHandCards: Card[]): boolean;

}
