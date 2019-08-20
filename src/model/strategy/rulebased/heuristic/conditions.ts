import {CardInfos} from "./cardInfos";

export default function getConditions(cardInfos: CardInfos, reasons: string[]) {
    function withReporting(test: boolean, reason: string) {
        if (test) {
            reasons.push(reason)
        } else {
            reasons.push(`not(${reason})`);
        }
        return test;
    }

    let handler = {
        get: function (target: CardInfos, name: (keyof CardInfos)) {
            if (name in target) {
                return withReporting(!!target[name], name);
            } else {
                throw Error('method not on proxy target');
            }
        }
    };

    return new Proxy(cardInfos, handler);

    // TODO: second order conditions.
    /*
                                if (!partnerIsBehindMe) {
                                    secondOrderReasons.push('partner is not behind me');
                                }

                                if (!roundCanBeOvertrumped) {
                                    secondOrderReasons.push('round cannot be overtrumped');
                                }
     */
    /*
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
}