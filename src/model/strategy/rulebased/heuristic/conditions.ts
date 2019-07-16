import {GameWorld} from "../../../GameWorld";
import {Card} from "../../../cards/Card";

export default function getConditions(world: GameWorld, cardSet: Card[], cardInfos: any, reasons: string[]) {
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
        hasSinglePlayableCard,
        isStartPosition,
        isInPlayingTeam,
        hasTrumps,
        isPotentialPartnerPossiblyTrumpFree,
        canForceWinRound,
        hasAGoodAmountOfHighTrumps,
        hasDominantTrumps,
        isCaller,
        canSearchCalledAce
    } = cardInfos;

    return {
        hasSinglePlayableCard: () => withReporting(() => hasSinglePlayableCard, 'hasSinglePlayableCard'),
        isStartPosition: () => withReporting(() => isStartPosition, 'isStartPosition'),
        isInPlayingTeam: () => withReporting(() => isInPlayingTeam, 'isInPlayingTeam'),
        hasTrumps: () => withReporting(() => hasTrumps, 'hasTrumps'),
        isPotentialPartnerPossiblyTrumpFree: () => withReporting(() => isPotentialPartnerPossiblyTrumpFree, 'isPotentialPartnerPossiblyTrumpFree'),
        canForceWinRound: () => withReporting(() => canForceWinRound, 'canForceWinRound'),
        hasAGoodAmountOfHighTrumps: () => withReporting(() => hasAGoodAmountOfHighTrumps, 'hasAGoodAmountOfHighTrumps'),
        hasDominantTrumps: () => withReporting(() => hasDominantTrumps, 'hasDominantTrumps'),
        isCaller: () => withReporting(() => isCaller, 'isCaller'),
        canSearchCalledAce: () => withReporting(() => canSearchCalledAce, 'canSearchCalledAce'),
    }
}