import {ColorWithTrump} from "../../../cards/Color";
import {allOfColor, sortByNaturalOrdering,} from "../../../cards/CardSet";
import {CardFilter} from "./CardFilter";
import {Card} from "../../../cards/Card";
import {GameWorld} from "../../../GameWorld";
import GameAssumptions from "../../../knowledge/GameAssumptions";
import {includes} from "lodash";
import {getPlayableCards} from "../../../PlayableMoves";


// TODO: use prototype? inheritance?
// TODO: be more lazy?
export default function getCardInfos(world: GameWorld, name: string, cardSet: Card[], assumptions: GameAssumptions, startCardSet: Card[]) {
    let playableCards = sortByNaturalOrdering(getPlayableCards(cardSet, world.gameMode, world.round));

    let roundAnalyzer = world.round.getRoundAnalyzer(world.gameMode);
    // card ranks

    // position stuff
    let isStartPosition = world.round.isEmpty();
    let cardFilter = new CardFilter(world, cardSet);
    let trumpCount = cardFilter.trumps.length;

    // partner stuff
    let partnerName = world.history.getTeamPartnerNameForPlayerName(name, startCardSet);
    let knownPartnerHasRound = !isStartPosition && partnerName && world.round.getPlayerNameAtPosition(roundAnalyzer.getHighestCardPosition()) === partnerName;
    let potentialPartnerName = assumptions.getPossiblePartnerName();
    let potentialPartnerConfidence = assumptions.getPossibleTeamPartnerForPlayerName(name);
    let isCaller = world.gameMode.getCallingPlayerName() == name;
    let isInPlayingTeam = world.history.isPlayerPlaying(name, startCardSet);
    let isPotentialPartnerPossiblyTrumpFree = !!(potentialPartnerName && assumptions.isPlayerNameProbablyTrumpFree(potentialPartnerName));

    // stuff about game history
    let remainingTrumps = sortByNaturalOrdering(world.history.getRemainingCardsByColor()[ColorWithTrump.TRUMP]);
    let canForceWinRound = !!(trumpCount && remainingTrumps.length <= 2 && remainingTrumps[0] == cardFilter.trumps[0]);
    let hasCalledColorBeenAngespielt = world.history.hasColorBeenAngespielt(world.gameMode.getCalledColor());
    let hasTrumps = trumpCount > 0;
    let hasSinglePlayableCard = playableCards.length == 1;
    let canSearchCalledAce = cardFilter.callColorCards.length > 0 && !hasCalledColorBeenAngespielt;

    let base = {
        hasSinglePlayableCard,
        isStartPosition,
        isInPlayingTeam,
        hasTrumps,
        isPotentialPartnerPossiblyTrumpFree,
        canForceWinRound,
        isCaller,
        canSearchCalledAce,
        knownPartnerHasRound,
        trumpCount
    };

    if (!isStartPosition) {
        let roundColor = roundAnalyzer.getRoundColor();

        // card stuff
        let cardRanks = world.history.getCurrentRankWithEqualRanksOfCardInColor(cardSet, roundColor, world.round.getPlayedCards());
        let winningCards = sortByNaturalOrdering(cardFilter.winningCards);
        let potentialPartnerHasRound = potentialPartnerName == roundAnalyzer.getHighestCardPlayerName(); // && potentialPartnerConfidence.confidence > 0.0;
        let partnerIsBehindMe = partnerName ? world.round.getPlayerPositionByName(partnerName) > world.round.getPosition() : false;
        let highestCardColor = world.gameMode.getOrdering().getColor(roundAnalyzer.getHighestCard());
        let cardRanksWithRoundCards = world.history.getCurrentRankWithEqualRanksOfCardInColor([...cardSet, ...world.round.getPlayedCards()], highestCardColor, world.round.getPlayedCards());
        let roundIsExpensive = roundAnalyzer.getPoints() > 4 && world.round.getPosition() < 2 || roundAnalyzer.getPoints() > 10 && world.round.getPosition() >= 2;
        let myTrumps = playableCards.filter(card => world.gameMode.getOrdering().isTrump(card));
        let highestCardInRoundIsHighestCardInColor = cardRanksWithRoundCards[roundAnalyzer.getHighestCard()] === 0;
        let roundColorHasBeenPlayed = world.history.hasColorBeenAngespielt(roundColor);
        let someoneIsDefinitelyFreeOfRoundColor = world.history.isAnyoneDefinitelyFreeOfColor(cardSet, roundColor);
        let isHinterhand = world.round.isHinterHand();
        let colorRoundProbablyWonByPartner = highestCardInRoundIsHighestCardInColor && !roundColorHasBeenPlayed && !someoneIsDefinitelyFreeOfRoundColor;
        let trumpRound = roundColor == ColorWithTrump.TRUMP;
        let mustFollowSuit = roundColor == world.gameMode.getOrdering().getColor(playableCards[0]);
        let isColorRoundTrumped = !trumpRound && world.gameMode.getOrdering().isTrump(roundAnalyzer.getHighestCard());
        let opponentsAreInHinterhand = potentialPartnerName && potentialPartnerName != world.round.getLastPlayerName();
        let isColor10InPlay = includes(world.history.getRemainingCardsByColor()[roundColor], roundColor + 'X' as Card);
        let highestTrumpMayBeOvertrumped = cardRanksWithRoundCards[winningCards[0]]! + Math.floor(8 / (world.rounds.length + 2)) < cardRanksWithRoundCards[roundAnalyzer.getHighestCard()]!;
        let colorMayRun = !roundColorHasBeenPlayed && !someoneIsDefinitelyFreeOfRoundColor;
        let haveColorAce = winningCards.length && winningCards[0][1] == "A";
        let myTeamIsHinterhand = world.round.isHinterHand() || world.round.getPosition() == 2 && world.round.getLastPlayerName() === partnerName;
        let winningCardColor = winningCards.length && world.gameMode.getOrdering().getColor(winningCards[0]);
        let winningCardIsTrump = winningCardColor == ColorWithTrump.TRUMP;
        let winningCardIsHighestInColor = !winningCardIsTrump && winningCards.length && cardRanks[winningCards[0]]! == 0;
        let hasLowValueBlankCard = !!cardFilter.lowValueBlankCard;
        let roundCanBeOvertrumped = cardRanksWithRoundCards[roundAnalyzer.getHighestCard()]! > 1;

        let callColorCards = allOfColor(playableCards, world.gameMode.getCalledColor(), world.gameMode);
        let callColorCount = callColorCards.length;
        let notInPlayingTeam = partnerName != world.gameMode.getCallingPlayerName();

        let isPartnerFreeOfRoundColor = potentialPartnerName && world.history.isPlayerNameColorFree(potentialPartnerName, roundColor);

        let onlyTrumpCards = myTrumps.length == playableCards.length;
        let highConfidenceInPotentialPartner = potentialPartnerConfidence.confidence >= 1;

        let partnerIsTrumpFree = potentialPartnerName && world.history.isPlayerNameColorFree(potentialPartnerName, ColorWithTrump.TRUMP);

        let cardRanksForTrumpCards = world.history.getCurrentRankWithEqualRanksOfCardInColor(cardSet, ColorWithTrump.TRUMP, world.round.getPlayedCards());
        let averageRankOfHighTrumps = cardFilter.highTrumps.reduce((prev, cur) => prev + cardRanksForTrumpCards[cur]!, 0) / cardFilter.highTrumps.length;
        let hasDominantTrumps = averageRankOfHighTrumps <= 2;
        let hasAGoodAmountOfHighTrumps = cardFilter.highTrumps.length * 2 > cardFilter.trumps.length && cardFilter.trumps.length > 2;

        return {
            hasSinglePlayableCard,
            isStartPosition,
            isInPlayingTeam,
            hasTrumps,
            isPotentialPartnerPossiblyTrumpFree,
            canForceWinRound,
            hasAGoodAmountOfHighTrumps,
            hasDominantTrumps,
            isCaller,
            canSearchCalledAce,
            partnerIsTrumpFree,
            hasLowValueBlankCard,
            onlyTrumpCards,
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
            isPartnerFreeOfRoundColor,
            notInPlayingTeam,
            callColorCount,
            trumpCount,
            highestCardColor
        };
    }

    return base;
}