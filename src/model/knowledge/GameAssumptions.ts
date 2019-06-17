import {Round} from "../Round";
import {PlayerWithNameOnly} from "../Player";
import {Card} from "../cards/Card";
import {ColorWithTrump} from "../cards/Color";
import {ColorFreeAssumption} from "./GameAssumptionsInCallGame";

export default interface GameAssumptions {
    isThisRoundProbablyWon(round: Round): boolean;

    isThisRoundProbablyLost(round: Round): boolean;

    isTeampartnerProbablyKnown(): boolean;

    getPossiblePartner(): PlayerWithNameOnly | undefined;

    getPossiblyHighestTrumpOfPartner(): Card;

    isPlayerPossiblyColorFree(callingPlayer: PlayerWithNameOnly, color: ColorWithTrump): ColorFreeAssumption;

    isPlayerProbablyTrumpFree(partner: PlayerWithNameOnly): boolean;

    isOpposingTeamPossiblyColorFree(color: ColorWithTrump): boolean;

    willLikelyWinRoundWithCard(round: Round, card: Card): boolean;

}
