import {ColorWithTrump} from "../../../cards/Color";
import {allOfColor, sortByNaturalOrdering,} from "../../../cards/CardSet";
import {CardFilter} from "./CardFilter";
import {Card} from "../../../cards/Card";
import {GameWorld} from "../../../GameWorld";
import GameAssumptions from "../../../knowledge/GameAssumptions";
import {includes} from "lodash";
import {memoize} from "../../../../utils/memoize";

// lazy but with a good memory
export class CardInfos {
    private readonly world: GameWorld;
    private readonly name: string;
    private readonly cardSet: Card[];
    private readonly assumptions: GameAssumptions;
    private readonly startCardSet: ReadonlyArray<Card>;
    private readonly cardFilter: CardFilter;

    constructor(world: GameWorld, name: string, cardSet: Card[], assumptions: GameAssumptions, cardFilter: CardFilter, startCardSet: readonly Card[]) {
        this.world = world;
        this.name = name;
        this.cardSet = cardSet;
        this.assumptions = assumptions;
        this.cardFilter = cardFilter;
        this.startCardSet = startCardSet;
    }

    @memoize
    get roundAnalyzer() {
        return this.world.round.getRoundAnalyzer(this.world.gameMode)
    }

    @memoize
    get isStartPosition() {
        return this.world.round.isEmpty();
    }

    @memoize
    get trumpCount() {
        return this.cardFilter.trumps.length;
    }

    // partner stuff
    @memoize
    get partnerName() {
        return this.world.history.getTeamPartnerNameForPlayerName(this.name, this.startCardSet);
    }

    @memoize
    get knownPartnerHasRound() {
        return !this.isStartPosition && !!this.partnerName && this.world.round.getPlayerNameAtPosition(this.roundAnalyzer.getHighestCardPosition()) === this.partnerName;
    }

    @memoize
    get potentialPartnerName() {
        return this.assumptions.getPossiblePartnerName();
    }

    @memoize
    get potentialPartnerConfidence() {
        return this.assumptions.getPossibleTeamPartnerForPlayerName(this.name);
    }

    @memoize
    get isCaller() {
        return this.world.gameMode.getCallingPlayerName() == this.name;
    }

    @memoize
    get isInPlayingTeam() {
        return this.world.history.isPlayerPlaying(this.name, this.startCardSet);
    }

    @memoize
    get isPotentialPartnerPossiblyTrumpFree() {
        return !!(this.potentialPartnerName && this.assumptions.isPlayerNameProbablyTrumpFree(this.potentialPartnerName));
    }

// stuff about game history
    @memoize
    get remainingTrumps() {
        return sortByNaturalOrdering(this.world.history.getRemainingCardsByColor()[ColorWithTrump.TRUMP]);
    }

    @memoize
    get canForceWinRound() {
        return this.remainingTrumps[0] == this.cardFilter.trumps[0];
    }

    @memoize
    get hasCalledColorBeenAngespielt() {
        return this.world.history.hasColorBeenAngespielt(this.world.gameMode.getCalledColor());
    }

    @memoize
    get hasTrumps() {
        return this.trumpCount > 0;
    }

    @memoize
    get hasSinglePlayableCard() {
        return this.cardFilter.playableCards.length == 1;
    }

    @memoize
    get canSearchCalledAce() {
        return this.cardFilter.callColorCards.length > 0 && !this.hasCalledColorBeenAngespielt;
    }

    @memoize
    get cardRanksForTrumpCards() {
        return this.world.history.getCurrentRankWithEqualRanksOfCardInColor(this.cardSet, ColorWithTrump.TRUMP, this.world.round.getPlayedCards());
    }

    @memoize
    get averageRankOfHighTrumps() {
        return this.cardFilter.highTrumps.reduce((prev, cur) => prev + this.cardRanksForTrumpCards[cur]!, 0) / this.cardFilter.highTrumps.length;
    }

    @memoize
    get hasDominantTrumps() {
        return this.averageRankOfHighTrumps <= 1;
    }

    @memoize
    get hasAGoodAmountOfHighTrumps() {
        return this.cardFilter.highTrumps.length * 2 > this.cardFilter.trumps.length && this.cardFilter.trumps.length > 2;
    }

    @memoize
    get hasMoreThan1TrumpsWithoutVolle() {
        return this.cardFilter.trumpsWithoutVolle.length > 1;
    }

    @memoize
    get roundColor() {
        return this.roundAnalyzer.getRoundColor();
    }

// card stuff
    @memoize
    get cardRanks() {
        return this.world.history.getCurrentRankWithEqualRanksOfCardInColor(this.cardSet, this.roundColor, this.world.round.getPlayedCards());
    }

    @memoize
    get winningCards() {
        return sortByNaturalOrdering(this.cardFilter.winningCards);
    }

    @memoize
    get potentialPartnerHasRound() {
        return this.potentialPartnerName == this.roundAnalyzer.getHighestCardPlayerName(); // && potentialPartnerConfidence.confidence > 0.0;
    }

    @memoize
    get partnerIsBehindMe() {
        return this.partnerName ? this.world.round.getPlayerPositionByName(this.partnerName) > this.world.round.getPosition() : false;
    }

    @memoize
    get highestCardColor() {
        return this.world.gameMode.getOrdering().getColor(this.roundAnalyzer.getHighestCard());
    }

    @memoize
    get cardRanksWithRoundCards() {
        return this.world.history.getCurrentRankWithEqualRanksOfCardInColor([...this.cardSet, ...this.world.round.getPlayedCards()], this.highestCardColor, this.world.round.getPlayedCards());
    }

    @memoize
    get roundIsExpensive() {
        return this.roundAnalyzer.getPoints() > 4 && this.world.round.getPosition() < 2 || this.roundAnalyzer.getPoints() > 10 && this.world.round.getPosition() >= 2;
    }

    @memoize
    get highestCardInRoundIsHighestCardInColor() {
        return this.cardRanksWithRoundCards[this.roundAnalyzer.getHighestCard()] === 0;
    }

    @memoize
    get roundColorHasBeenPlayed() {
        return this.world.history.hasColorBeenAngespielt(this.roundColor);
    }

    @memoize
    get someoneIsDefinitelyFreeOfRoundColor() {
        return this.world.history.isAnyoneDefinitelyFreeOfColor(this.cardSet, this.roundColor);
    }

    @memoize
    get isHinterhand() {
        return this.world.round.isHinterHand();
    }

    @memoize
    get colorRoundProbablyWonByPartner() {
        return this.highestCardInRoundIsHighestCardInColor && !this.roundColorHasBeenPlayed && !this.someoneIsDefinitelyFreeOfRoundColor;
    }

    @memoize
    get isTrumpRound() {
        return this.roundColor == ColorWithTrump.TRUMP;
    }

    @memoize
    get mustFollowSuit() {
        return this.roundColor == this.world.gameMode.getOrdering().getColor(this.cardFilter.playableCards[0]);
    }

    @memoize
    get isColorRoundTrumped() {
        return !this.isTrumpRound && this.world.gameMode.getOrdering().isTrump(this.roundAnalyzer.getHighestCard());
    }

    @memoize
    get opponentsAreInHinterhand() {
        return !!(this.potentialPartnerName && this.potentialPartnerName != this.world.round.getLastPlayerName());
    }

    @memoize
    get isColor10InPlay() {
        return includes(this.world.history.getRemainingCardsByColor()[this.roundColor], this.roundColor + 'X' as Card);
    }

    @memoize
    get highestTrumpMayBeOvertrumped() {
        return this.cardRanksWithRoundCards[this.winningCards[0]]! + Math.floor(8 / (this.world.rounds.length + 2)) < this.cardRanksWithRoundCards[this.roundAnalyzer.getHighestCard()]!;
    }

    @memoize
    get colorMayRun() {
        return !this.roundColorHasBeenPlayed && !this.someoneIsDefinitelyFreeOfRoundColor;
    }

    @memoize
    get haveColorAce() {
        return !!(this.winningCards.length && this.winningCards[0][1] == "A");
    }

    @memoize
    get myTeamIsHinterhand() {
        return this.world.round.isHinterHand() || this.world.round.getPosition() == 2 && this.world.round.getLastPlayerName() === this.partnerName;
    }

    @memoize
    get winningCardColor() {
        return this.winningCards.length && this.world.gameMode.getOrdering().getColor(this.winningCards[0]);
    }

    @memoize
    get winningCardIsTrump() {
        return this.winningCardColor == ColorWithTrump.TRUMP;
    }

    @memoize
    get winningCardIsHighestInColor(): boolean {
        return !!(!this.winningCardIsTrump && this.winningCards.length && this.cardRanks[this.winningCards[0]]! == 0);
    }

    @memoize
    get hasLowValueBlankCard() {
        return !!this.cardFilter.lowValueBlankCard;
    }

    @memoize
    get roundCanBeOvertrumped() {
        return this.cardRanksWithRoundCards[this.roundAnalyzer.getHighestCard()]! > 1;
    }

    @memoize
    get callColorCards() {
        return allOfColor(this.cardFilter.playableCards, this.world.gameMode.getCalledColor(), this.world.gameMode);
    }

    get callColorCount() {
        return this.callColorCards.length;
    }

    get notInPlayingTeam() {
        return this.partnerName != this.world.gameMode.getCallingPlayerName();
    }

    @memoize
    get isPartnerFreeOfRoundColor() {
        return !!(this.potentialPartnerName && this.world.history.isPlayerNameColorFree(this.potentialPartnerName, this.roundColor));
    }

    get hasOnlyTrumpCards() {
        return this.cardFilter.trumps.length == this.cardFilter.playableCards.length;
    }

    get highConfidenceInPotentialPartner() {
        return this.potentialPartnerConfidence.confidence >= 1;
    }

    @memoize
    get partnerIsTrumpFree() {
        return !!(this.potentialPartnerName && this.world.history.isPlayerNameColorFree(this.potentialPartnerName, ColorWithTrump.TRUMP));
    }

    get partnerHasRound() {
        return this.knownPartnerHasRound || this.potentialPartnerHasRound;
    }

    get roundIsProbablySafe() {
        return this.highestCardInRoundIsHighestCardInColor && this.isTrumpRound || this.isHinterhand || this.colorRoundProbablyWonByPartner;
    }

    get hasLowTrumps() {
        return this.cardFilter.lowTrumps.length > 0;
    }

    get hasTrumpWithoutOber() {
        return this.cardFilter.playableCardsNoOber.length > 0;
    }

    get hasGoodWinningCards() {
        return this.cardFilter.goodWinningCardsNoOberNoPoints.length > 0;
    }

    get hasWinningCards() {
        return this.cardFilter.winningCards.length > 0;
    }

    get aceIsProbablySafeToPlay() {
        return this.haveColorAce && this.colorMayRun;
    }

    get hasUnter() {
        return this.cardFilter.unter.length > 0;
    }

    get hasWinningTrumpsWithoutVolle() {
        return this.cardFilter.winningCardsWithoutVolle.length > 0;
    }

    get hasWinningCardsNoOberNoVolle() {
        return this.cardFilter.winningCardsNoOberNoPoints.length > 0;
    }

    get hasLowWinningTrump() {
        return this.cardFilter.lowWinningTrumps.length > 0;
    }

    get roundMayBeWonByPartner() {
        return this.roundCanBeOvertrumped && this.partnerIsBehindMe && !this.partnerIsTrumpFree;
    }

    get canTrumpColorRound() {
        return !this.isTrumpRound && !this.mustFollowSuit;
    }

    get roundIsProbablySafeIfTrumped() {
        return !this.roundColorHasBeenPlayed || this.myTeamIsHinterhand || this.isHinterhand;
    }

    get partnerMayBeAbleToTrump() {
        return this.partnerIsBehindMe
            && this.isPartnerFreeOfRoundColor
            && !this.partnerIsTrumpFree
            && !(this.highestCardInRoundIsHighestCardInColor && this.highestCardColor == ColorWithTrump.TRUMP);
    }

    get canDiscardCalledColor() {
        return this.notInPlayingTeam && this.callColorCount == 1 && this.trumpCount > 0;
    }

    get isDavonlaufenPossibleAndSensible() {
        return this.isDavonLaufenPossible && this.isDavonlaufenSensible
    }

    get isDavonLaufenPossible() {
        if (!this.isInPlayingTeam
            || !this.isStartPosition
            || !includes(this.cardFilter.callColorCards, this.world.gameMode.getCalledAce())
            || this.world.gameMode.getHasAceBeenCalled()
            || allOfColor(this.startCardSet, this.world.gameMode.getCalledColor(), this.world.gameMode).length < 4) {
            return false;
        } else {
            return true;
        }
    }

    get isDavonlaufenSensible() {
        let callColorCards = this.cardFilter.callColorCards;

        if (callColorCards.length != 4) {
            return false;
        }

        let callColor10 = this.world.gameMode.getCalledColor() + "X";
        let callColorK = this.world.gameMode.getCalledColor() + "K";

        if (this.world.history.hasPlayerAbspatzenCallColor()) {
            if (this.world.round.getLastPlayerName() == this.partnerName) {
                return true;
            } else {
                return false;
            }
        } else {
            if (!includes(callColorCards, callColor10)) {
                return false;
            }

            if (includes(callColorCards, callColorK)) {
                // könig ist die höchste karte in der farbe, dh man fängt einen nixer vom partner, einen vom gegner, ein gegner wird / kann stechen
                return true;
            }
            return false;
        }
    }
}