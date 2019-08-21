import {CardInfos} from "./cardInfos";
import {GameWorld} from "../../../GameWorld";

export default function getConditions(cardInfos: CardInfos, world: GameWorld, reasons: string[], secondOrderReasons: string[]) {
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
            if (!world.history.isTeamPartnerKnown() && (name == "potentialPartnerHasRound" || name == "isPartnerFreeOfRoundColor" || name == "partnerIsTrumpFree" || name == "opponentsAreInHinterhand" || name == "isPotentialPartnerPossiblyTrumpFree")) {
                secondOrderReasons.push(`potential partner (${target.potentialPartnerConfidence.playerName}, reasons: ${target.potentialPartnerConfidence.reasons} with confidence ${target.potentialPartnerConfidence.confidence})\n`);
            }
            if (name in target) {
                return withReporting(!!target[name], name);
            } else {
                throw Error('method not on proxy target');
            }
        }
    };

    return new Proxy(cardInfos, handler);
}