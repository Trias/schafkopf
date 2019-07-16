import {CardFilter} from "./CardFilter";
import {ColorWithTrump} from "../../../cards/Color";

export default function getInPlayConditions(cardFilter: CardFilter, cardInfos: any, reasons: string[]) {
    function withReporting(test: (() => boolean), reason: string) {
        let result = test();
        if (result) {
            reasons.push(reason)
        } else {
            reasons.push(`not(${reason})`);
        }
        return result;
    }

    let {
        knownPartnerHasRound,
        potentialPartnerHasRound,
        highestCardInRoundIsHighestCardInColor,
        trumpRound,
        isHinterhand,
        colorRoundProbablyWonByPartner,
        mustFollowSuit,
        highConfidenceInPotentialPartner,
        highestTrumpMayBeOvertrumped,
        roundIsExpensive,
        haveColorAce,
        colorMayRun,
        isColorRoundTrumped,
        isColor10InPlay,
        opponentsAreInHinterhand,
        myTeamIsHinterhand,
        roundColorHasBeenPlayed,
        winningCardIsHighestInColor,
        roundCanBeOvertrumped,
        partnerIsBehindMe,
        partnerIsTrumpFree,
        hasLowValueBlankCard,
        isPartnerFreeOfRoundColor,
        onlyTrumpCards,
        notInPlayingTeam,
        callColorCount,
        trumpCount,
        highestCardColor
    } = cardInfos;

    let partnerHasRound = knownPartnerHasRound || potentialPartnerHasRound;
    let roundIsProbablySafe = highestCardInRoundIsHighestCardInColor && trumpRound || isHinterhand || colorRoundProbablyWonByPartner;
    let haveNonTrumpCards = cardFilter.playableCardsByPointsNoTrumps.length > 0;
    let hasLowTrumps = cardFilter.lowTrumps.length > 0;
    let hasTrumpWithoutOber = cardFilter.playableCardsNoOber.length > 0;
    let hasGoodWinningCards = cardFilter.goodWinningCardsNoOberNoPoints.length > 0;
    let hasWinningCards = cardFilter.winningCards.length > 0;
    let aceIsProbablySafeToPlay = haveColorAce && colorMayRun;
    let hasTrumps = cardFilter.trumps.length > 0;
    let hasUnter = cardFilter.unter.length > 0;
    let hasWinningTrumpsWithoutVolle = cardFilter.winningCardsWithoutVolle.length > 0;
    let hasWinningCardsNoOberNoVolle = cardFilter.winningCardsNoOberNoPoints.length > 0;
    let hasLowWinningTrump = cardFilter.lowWinningTrumps.length > 0;

    let roundMayBeWonByPartner = roundCanBeOvertrumped && partnerIsBehindMe && !partnerIsTrumpFree;
    let canTrumpColorRound = !trumpRound && !mustFollowSuit;
    let roundIsProbablySafeIfTrumped = !roundColorHasBeenPlayed || myTeamIsHinterhand || isHinterhand;

    let partnerMayBeAbleTrump = partnerIsBehindMe
        && isPartnerFreeOfRoundColor
        && !partnerIsTrumpFree
        && !(highestCardInRoundIsHighestCardInColor && highestCardColor == ColorWithTrump.TRUMP);
    /*
                                if (!partnerIsBehindMe) {
                                    secondOrderReasons.push('partner is not behind me');
                                }

                                if (!roundCanBeOvertrumped) {
                                    secondOrderReasons.push('round cannot be overtrumped');
                                }
     */            /*
               if (!partnerHasRound && potentialPartnerHasRound) {
                    secondOrderReasons.push(`potential partner (${potentialPartnerConfidence.playerName}, reasons: ${potentialPartnerConfidence.reasons} with confidence ${potentialPartnerConfidence.confidence}) has round\n`);
                }
             */
    /*
if (highestCardInRoundIsHighestCardInColor && trumpRound) {
        secondOrderReasons.push('highest trump played');
    }
    if (isHinterhand) {
        secondOrderReasons.push('hinterhand');
    }
*/
    /*
                        if (!roundColorHasBeenPlayed) {
                    secondOrderReasons.push('color has not been played yet');
                }

                if (myTeamIsHinterhand) {
                    secondOrderReasons.push('we are hinterhand');
                }

                if (isHinterhand) {
                    secondOrderReasons.push('hinterhand');
                }

                if (roundColorHasBeenPlayed) {
                    secondOrderReasons.push('color has been angespielt');
                }

                if (!myTeamIsHinterhand) {
                    secondOrderReasons.push('we are not both hinterhand')
                }
                if (!isHinterhand) {
                    secondOrderReasons.push('not hinterhand');
                }
*/

    let canDiscardCalledColor = notInPlayingTeam && callColorCount == 1 && trumpCount > 0;

    return {
        // TODO: second order conditions.
        partnerHasRound: () => withReporting(() => partnerHasRound, 'partnerHasRound'),
        roundIsProbablySafe: () => withReporting(() => roundIsProbablySafe, "roundIsProbablySafe"),
        mustFollowSuit: () => withReporting(() => mustFollowSuit, "mustFollowSuit"),
        trumpRound: () => withReporting(() => trumpRound, "trumpRound"),
        highConfidenceInPotentialPartner: () => withReporting(() => highConfidenceInPotentialPartner, "highConfidenceInPotentialPartner"),
        haveNonTrumpCards: () => withReporting(() => haveNonTrumpCards, "haveNonTrumpCards"),
        hasLowTrumps: () => withReporting(() => hasLowTrumps, "hasLowTrumps"),
        hasTrumpWithoutOber: () => withReporting(() => hasTrumpWithoutOber, "hasTrumpWithoutOber"),
        highestTrumpMayBeOvertrumped: () => withReporting(() => highestTrumpMayBeOvertrumped, "highestTrumpMayBeOvertrumped"),
        roundIsExpensive: () => withReporting(() => roundIsExpensive, "roundIsExpensive"),
        hasGoodWinningCards: () => withReporting(() => hasGoodWinningCards, "hasGoodWinningCards"),
        hasWinningCards: () => withReporting(() => hasWinningCards, "hasWinningCards"),
        aceIsProbablySafeToPlay: () => withReporting(() => aceIsProbablySafeToPlay, "aceIsProbablySafeToPlay"),
        isColorRoundTrumped: () => withReporting(() => isColorRoundTrumped, "isColorRoundTrumped"),
        hasTrumps: () => withReporting(() => hasTrumps, "hasTrumps"),
        hasUnter: () => withReporting(() => hasUnter, "hasUnter"),
        isColor10InPlay: () => withReporting(() => isColor10InPlay, "isColor10InPlay"),
        opponentsAreInHinterhand: () => withReporting(() => opponentsAreInHinterhand, "opponentsAreInHinterhand"),
        canTrumpColorRound: () => withReporting(() => canTrumpColorRound, "canTrumpColorRound"),
        roundIsProbablySafeIfTrumped: () => withReporting(() => roundIsProbablySafeIfTrumped, "roundIsProbablySafeIfTrumped"),
        hasWinningTrumpsWithoutVolle: () => withReporting(() => hasWinningTrumpsWithoutVolle, "hasWinningTrumpsWithoutVolle"),
        hasWinningCardsNoOberNoVolle: () => withReporting(() => hasWinningCardsNoOberNoVolle, "hasWinningCardsNoOberNoVolle"),
        isHinterhand: () => withReporting(() => isHinterhand, "isHinterhand"),
        hasLowWinningTrump: () => withReporting(() => hasLowWinningTrump, "hasLowWinningTrump"),
        winningCardIsHighestInColor: () => withReporting(() => winningCardIsHighestInColor, "winningCardIsHighestInColor"),
        roundMayBeWonByPartner: () => withReporting(() => roundMayBeWonByPartner, "roundMayBeWonByPartner"),
        hasLowValueBlankCard: () => withReporting(() => hasLowValueBlankCard, "hasLowValueBlankCard"),
        canDiscardCalledColor: () => withReporting(() => canDiscardCalledColor, "canDiscardCalledColor"),
        partnerMayBeAbleTrump: () => withReporting(() => partnerMayBeAbleTrump, "partnerMayBeAbleTrump"),
        onlyTrumpCards: () => withReporting(() => onlyTrumpCards, "onlyTrumpCards"),
    }
}