import {GameWorld} from "../../../GameWorld";
import {Card} from "../../../cards/Card";
import {getPlayableCards} from "../../../PlayableMoves";
import {allOfColor, getHighTrumps, getTrumps, sortByNaturalOrdering} from "../../../cards/CardSet";
import {ColorWithTrump} from "../../../cards/Color";
import {
    areWeBothHinterhand,
    canForceWinTrumpRound,
    filterBadPairs,
    getWinningCards,
    sortByPointsAscending
} from "./helper";
import {cloneDeep, includes} from "lodash";
import {CardPlayStrategy} from "./CardPlayStrategy";
import GameAssumptions from "../../../knowledge/GameAssumptions";
import {Actions} from "./Actions";
import {CardFilter} from "./CardFilter";

export class AdvancedHeuristic implements CardPlayStrategy {
    private readonly startCardSet: Card[];
    private readonly name: string;
    private readonly assumptions: GameAssumptions;
    private readonly report: (reasons: string[], secondOrderReasons: string[], conclusion: string, card: Card) => void;

    constructor(name: string, startCardSet: Card[], assumptions: GameAssumptions, report: ((reasons: string[], secondOrderReasons: string[], conclusion: string, card: Card) => void) | null = null) {
        this.name = name;
        this.assumptions = assumptions;
        this.startCardSet = cloneDeep(startCardSet); // meh....
        this.report = report || (() => {
        });
    }

    determineCardToPlay(world: GameWorld, cardSet: Card[]) {
        let reasons: string[] = [];
        let secondOrderReasons: string[] = [];
        let report = (conclusion: string, card: Card) => {
            this.report(reasons, secondOrderReasons, conclusion, card);
        };

        let playableCards = sortByNaturalOrdering(getPlayableCards(cardSet, world.gameMode, world.round));
        if (!playableCards.length) {
            throw Error(`no playable card found! ${cardSet}`);
        }

        if (playableCards.length == 1) {
            reasons.push('blank card');
            let card = playableCards[0];
            report('play blank card', card);
            return playableCards[0];
        }

        // card ranks
        let cardRanksForTrumpCards = world.history.getCurrentRankWithEqualRanksOfCardInColor(cardSet, ColorWithTrump.TRUMP, world.round.getPlayedCards());

        // card filter stuff
        let playableCardsByPointsAscending = sortByPointsAscending(playableCards);
        let playableCardsNoTrumps = playableCards.filter(card => !world.gameMode.getOrdering().isTrump(card));
        let playableTrumpCards = playableCards.filter(card => world.gameMode.getOrdering().isTrump(card));
        let callColorCards = allOfColor(playableCards, world.gameMode.getCalledColor(), world.gameMode);
        let hasCallColor = callColorCards.length > 0;
        let trumps = sortByNaturalOrdering(getTrumps(playableCards, world.gameMode));
        let highTrumpsArray = getHighTrumps(trumps, world.gameMode);
        let averageRankOfHighTrumps = highTrumpsArray.reduce((prev, cur) => prev + cardRanksForTrumpCards[cur]!, 0) / highTrumpsArray.length;
        let hasDominantTrumps = averageRankOfHighTrumps <= 2;
        let trumpCount = trumps.length;
        let onlyOneTrumpLeft = trumpCount == 1;
        let hasAGoodAmountOfHighTrumps = highTrumpsArray.length * 2 > trumpCount && trumpCount > 2;

        let actions = new Actions(world, report);
        let cardFilter = new CardFilter(world);
        let assumptions = this.assumptions;
        let roundAnalyzer = world.round.getRoundAnalyzer(world.gameMode);

        // position stuff
        let isStartPosition = world.round.isEmpty();

        // partner stuff
        let partnerName = world.history.getTeamPartnerNameForPlayerName(this.name, this.startCardSet);
        let partnerHasRound = !isStartPosition && partnerName && world.round.getPlayerNameAtPosition(roundAnalyzer.getHighestCardPosition()) === partnerName;
        let potentialPartnerName = assumptions.getPossiblePartnerName();
        let potentialPartnerConfidence = this.assumptions.getPossibleTeamPartnerForPlayerName(this.name);
        let isCaller = world.gameMode.getCallingPlayerName() == this.name;
        let isInPlayingTeam = world.history.isPlayerPlaying(this.name, this.startCardSet);
        let isPotentialPartnerPossiblyTrumpFree = potentialPartnerName && assumptions.isPlayerNameProbablyTrumpFree(potentialPartnerName);

        // stuff about game history
        let remainingTrumps = sortByNaturalOrdering(world.history.getRemainingCardsByColor()[ColorWithTrump.TRUMP]);
        let canForceWinRound = trumpCount && remainingTrumps.length <= 2 && canForceWinTrumpRound(remainingTrumps, trumps[0]);
        let hasCalledColorBeenAngespielt = world.history.hasColorBeenAngespielt(world.gameMode.getCalledColor());

        if (isStartPosition) {
            reasons.push('start player');
            if (isInPlayingTeam) {
                reasons.push('in playing team');
                if (trumpCount) {
                    reasons.push('has trumps');
                    if (isPotentialPartnerPossiblyTrumpFree || onlyOneTrumpLeft) {
                        reasons.push('only a few trumps left');
                        if (isPotentialPartnerPossiblyTrumpFree) {
                            secondOrderReasons.push('potential partner is trump free');
                        }

                        if (onlyOneTrumpLeft) {
                            secondOrderReasons.push('only one trump left');
                        }

                        if (canForceWinRound) {
                            reasons.push('can win trump round by force');

                            return actions.playHighestCardByRank(trumps);
                        } else {
                            reasons.push('cannot win trump round by force');
                            return actions.playAceOrColorOrTrump(playableCards);
                        }

                    } else if (hasAGoodAmountOfHighTrumps) {
                        reasons.push('has a lot of high trumps');

                        if (!hasDominantTrumps) {
                            reasons.push('not very dominant trumps');

                            return actions.playLowestCardByRank(highTrumpsArray);
                        } else {
                            reasons.push('dominant trumps');

                            return actions.playHighestCardByRank(trumps);
                        }
                    } else if (isCaller) {
                        reasons.push('is calling player');
                        reasons.push('has no good amount of high trumps');

                        return actions.playHighestCardByRank(trumps);
                    } else {
                        reasons.push('not calling player');
                        reasons.push('has no good amount of high trumps');

                        return actions.playLowestCardByRank(trumps);
                    }
                } else {
                    reasons.push('has no trumps');
                    return actions.playAceOrColorOrTrump(playableCards);
                }
            } else {
                reasons.push('not in playing team');

                if (!isInPlayingTeam && hasCallColor && !hasCalledColorBeenAngespielt) {
                    reasons.push('has call color');
                    reasons.push('call color has not been played');

                    return actions.playHighestCardByRank(callColorCards);
                } else {
                    if (!hasCallColor) {
                        reasons.push('does not have call color');
                    }

                    if (isInPlayingTeam) {
                        reasons.push('in playing team');
                    }

                    if (hasCalledColorBeenAngespielt) {
                        reasons.push('called color has been angespielt');
                    }

                    return actions.playAceOrColorOrTrump(playableCards);
                }
            }
        } else {
            let roundColor = roundAnalyzer.getRoundColor();

            // card stuff
            let cardRanks = world.history.getCurrentRankWithEqualRanksOfCardInColor(cardSet, roundColor, world.round.getPlayedCards());

            let winningCards = sortByNaturalOrdering(getWinningCards(playableCards, world.round, world.gameMode));
            // confidence is not working.....
            let potentialPartnerHasRound = potentialPartnerName == roundAnalyzer.getHighestCardPlayerName(); // && potentialPartnerConfidence.confidence > 0.0;
            let partnerIsBehindMe = partnerName ? world.round.getPlayerPositionByName(partnerName) > world.round.getPosition() : false;
            //let partnerHasPlayed = partnerName?(world.round.getPlayerPositionByName(partnerName) < world.round.getPosition()): false;
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
            let playableCardsByPointsAscendingNoTrumps = playableCardsByPointsAscending.filter(card => !world.gameMode.getOrdering().isTrump(card));
            let playableCardsByPointsAscendingNoHighTrumps = playableCardsByPointsAscending.filter(card => card[1] != "O" && card[1] != "U");
            let playableCardsNoOber = playableCardsByPointsAscending.filter(card => card[1] != "O");
            let isColorRoundTrumped = !trumpRound && world.gameMode.getOrdering().isTrump(roundAnalyzer.getHighestCard());
            let opponentsAreInHinterhand = potentialPartnerName && potentialPartnerName != world.round.getLastPlayerName();
            let isColor10InPlay = includes(world.history.getRemainingCardsByColor()[roundColor], roundColor + 'X' as Card);
            let unter = playableTrumpCards.filter(card => card[1] != "U");
            let highestTrumpMayBeOvertrumped = cardRanksWithRoundCards[winningCards[0]]! + Math.floor(8 / (world.rounds.length + 2)) < cardRanksWithRoundCards[roundAnalyzer.getHighestCard()]!;
            let goodWinningCardsNoOberNoPoints = winningCards
                .filter(card => card[1] != "O" && card[1] != "A" && card[1] != "X")
                .filter(card => cardRanksWithRoundCards[card]! + 2 < cardRanksWithRoundCards[roundAnalyzer.getHighestCard()]!);
            let winningCardsNoOberNoPoints = winningCards
                .filter(card => card[1] != "O" && card[1] != "A" && card[1] != "X");
            let colorMayRun = !roundColorHasBeenPlayed && !someoneIsDefinitelyFreeOfRoundColor;
            let haveColorAce = winningCards.length && winningCards[0][1] == "A";
            let winningCardsWithoutPoints = winningCards.filter(card => card[1] != "A" && card[1] != "X");
            let myTeamIsHinterhand = areWeBothHinterhand(world, potentialPartnerName);
            let lowWinningTrumps = winningCards.filter(card => card[1] != "O" && card[1] != "U");
            let winningCardColor = winningCards.length && world.gameMode.getOrdering().getColor(winningCards[0]);
            let winningCardIsTrump = winningCardColor == ColorWithTrump.TRUMP;
            //let winningCardsWithPoints = winningCards.filter(card => card[1] == "A" || card[1] == "X" || card[1] == "K");
            let winningCardIsHighestInColor = !winningCardIsTrump && winningCards.length && cardRanks[winningCards[0]]! == 0;
            let lowValueBlankCard = cardFilter.getLowValueBlankCard(playableCards);
            let roundCanBeOvertrumped = cardRanksWithRoundCards[roundAnalyzer.getHighestCard()]! > 1;

            let cardsFilteredByBadPairs = filterBadPairs(world, playableCards);

            let callColorCards = allOfColor(playableCards, world.gameMode.getCalledColor(), world.gameMode);
            let trumpCount = myTrumps.length;
            let callColorCount = callColorCards.length;
            let notInPlayingTeam = partnerName != world.gameMode.getCallingPlayerName();

            let isPartnerFreeOfRoundColor = potentialPartnerName && world.history.isPlayerNameColorFree(potentialPartnerName, roundColor);

            let onlyTrumpCards = myTrumps.length == playableCards.length;
            let cardsWithoutBadPairsByPointsAscending = sortByPointsAscending(cardsFilteredByBadPairs);
            let partnerConfidenceIsHigh = potentialPartnerConfidence.confidence >= 1;

            reasons.push('not at start position');

            if (partnerHasRound || potentialPartnerHasRound) {
                reasons.push('partner has round');
                if (!partnerHasRound && potentialPartnerHasRound) {
                    secondOrderReasons.push(`potential partner (${potentialPartnerConfidence.playerName}, reasons: ${potentialPartnerConfidence.reasons} with confidence ${potentialPartnerConfidence.confidence}) has round\n`);
                }

                if (highestCardInRoundIsHighestCardInColor && trumpRound || isHinterhand || colorRoundProbablyWonByPartner) {
                    reasons.push('round is probably safe');
                    if (highestCardInRoundIsHighestCardInColor && trumpRound) {
                        secondOrderReasons.push('highest trump played');
                    }
                    if (isHinterhand) {
                        secondOrderReasons.push('hinterhand');
                    }

                    if (colorRoundProbablyWonByPartner) {
                        secondOrderReasons.push('probably safe ace by partner');
                    }
                    if (!mustFollowSuit) {
                        reasons.push('cannot follow suit');

                        if (playableCardsByPointsAscendingNoTrumps.length) {
                            reasons.push('i have non trump cards');
                            return actions.playBlankCardOrSchmier(playableCards);
                        } else {
                            reasons.push('i only have trump cards');
                            if (playableCardsByPointsAscendingNoHighTrumps.length) {
                                reasons.push('i have low trumps');
                                return actions.playHighestCardByPoints(playableCardsByPointsAscendingNoHighTrumps);
                            } else {
                                if (playableCardsNoOber.length) {
                                    reasons.push('have trumps which are not ober');
                                    return actions.playLowestCardByRank(playableCardsNoOber);
                                } else {
                                    reasons.push('have low trumps');
                                    return actions.playLowestCardByRank(myTrumps);
                                }
                            }
                        }
                    } else {
                        reasons.push('must follow suit');

                        if (trumpRound) {
                            reasons.push('trump round');

                            return actions.playTrumpPreferPoints(playableCards);
                        } else {
                            reasons.push('color round');
                            if (potentialPartnerHasRound && partnerConfidenceIsHigh) {
                                reasons.push('partner known with enough confidence');
                                reasons.push('partner has round');
                                return actions.playHighestCardByPoints(playableCards);
                            } else {
                                reasons.push('unsure about teams or winner');
                                if (!potentialPartnerHasRound) {
                                    secondOrderReasons.push('partner has not round');
                                }
                                if (!partnerConfidenceIsHigh) {
                                    secondOrderReasons.push('partner not known with enough confidence');
                                }
                                return actions.playLowestCardByPoints(playableCards);
                            }
                        }
                    }
                } else {
                    reasons.push('not hinterhand');
                    reasons.push('partner may be overtrumped');
                    reasons.push('color may not run');
                    if (!mustFollowSuit) {
                        reasons.push('cannot follow suit');

                        if (trumpRound) {
                            reasons.push('trump round');
                            return actions.playLowestCardByPoints(playableCards);
                        } else {
                            reasons.push('color round');
                            if (isColorRoundTrumped) {
                                reasons.push('round was trumped by partner');
                                return actions.playHighestCardByPoints(playableCards);
                            } else {
                                if (playableCardsNoTrumps.length) {
                                    reasons.push('have non-trump cards');
                                    if (playableTrumpCards.length) {
                                        reasons.push('have trump cards');
                                        if (roundIsExpensive) {
                                            reasons.push('round is expensive');
                                            if (unter.length) {
                                                reasons.push('have unter');
                                                return actions.playHighestCardByRank(unter);
                                            } else {
                                                reasons.push('have no unter');
                                                return actions.playLowestCardByRank(playableTrumpCards);
                                            }
                                        } else {
                                            reasons.push('round is cheap');

                                            if (opponentsAreInHinterhand) {
                                                reasons.push('opponents are hinterhand');

                                                if (isColor10InPlay) {
                                                    reasons.push('10 is still in play');

                                                    if (unter.length) {
                                                        reasons.push('have unter');

                                                        return actions.playLowestCardByRank(unter);
                                                    } else {
                                                        reasons.push('have no unter');

                                                        return actions.playHighestCardByRank(playableTrumpCards);
                                                    }
                                                } else {
                                                    reasons.push('10 is not in play');
                                                    return actions.playBlankCardOrLowestCardByPoints(playableCardsNoTrumps);
                                                }
                                            } else {
                                                reasons.push('opponents are not hinterhand');
                                                return actions.playBlankCardOrLowestCardByPoints(playableCardsNoTrumps);
                                            }
                                        }
                                    } else {
                                        reasons.push('have no trump cards');
                                        return actions.playLowestCardByPoints(playableCardsNoTrumps);
                                    }
                                } else {
                                    reasons.push('have only trump cards');
                                    if (roundIsExpensive) {
                                        reasons.push('round is expensive');

                                        if (unter.length) {
                                            reasons.push('have unter');
                                            return actions.playLowestCardByRank(unter);

                                        } else {
                                            reasons.push('have no unter');
                                            return actions.playLowestCardByPoints(playableCards);
                                        }
                                    } else {
                                        reasons.push('round is cheap');
                                        return actions.playLowestCardByPoints(playableCards);
                                    }
                                }
                            }
                        }
                    } else {
                        reasons.push('must follow suit');

                        if (trumpRound) {
                            reasons.push('trump round');

                            // patented formula to calculate good enough high trump margins....
                            if (highestTrumpMayBeOvertrumped) {
                                reasons.push('trump is pretty low and i can overtrump');
                                if (roundIsExpensive) {
                                    reasons.push('round is expensive');
                                    return actions.playHighestCardByRank(winningCards);
                                } else {
                                    reasons.push('round is cheap');
                                    if (goodWinningCardsNoOberNoPoints.length) {
                                        reasons.push('i have good winning non-ober');
                                        return actions.playLowestCardByRank(goodWinningCardsNoOberNoPoints);

                                    } else {
                                        reasons.push('hove no good winning non-ober');
                                        return actions.playLowestCardByPoints(playableCards);
                                    }
                                }
                            } else {
                                reasons.push('partner may win round');
                                return actions.playLowestCardByRank(playableCards);
                            }
                        } else {
                            reasons.push('color round');

                            if (winningCards.length) {
                                reasons.push('have winning cards');
                                if (haveColorAce && colorMayRun) {
                                    reasons.push('ace is probably safe');
                                    secondOrderReasons.push('have color ace');
                                    secondOrderReasons.push('color may run');

                                    return actions.playHighestCardByPoints(playableCards);
                                } else {
                                    reasons.push('ace is probably not safe');
                                    if (!haveColorAce) {
                                        secondOrderReasons.push('dont have color ace');
                                    }

                                    if (!colorMayRun) {
                                        secondOrderReasons.push('color may not run');
                                    }
                                    return actions.playLowestCardByPoints(playableCards);
                                }
                            } else {
                                reasons.push('cannot win round');
                                return actions.playLowestCardByPoints(playableCards);
                            }
                        }
                    }
                }
            } else {
                reasons.push('partner does not have round');
                if (winningCards.length) {
                    reasons.push('have winning cards');

                    if (!trumpRound && !mustFollowSuit) {
                        reasons.push('color round');
                        reasons.push('can trump round');

                        if (!roundColorHasBeenPlayed || myTeamIsHinterhand || isHinterhand) {
                            reasons.push('round is probably safe if trumped');
                            if (!roundColorHasBeenPlayed) {
                                secondOrderReasons.push('color has not been played yet');
                            }

                            if (myTeamIsHinterhand) {
                                secondOrderReasons.push('we are hinterhand');
                            }

                            if (isHinterhand) {
                                secondOrderReasons.push('hinterhand');
                            }

                            return actions.playTrumpPreferPoints(winningCards);
                        } else {
                            reasons.push('not safe if trumped');

                            if (roundColorHasBeenPlayed) {
                                secondOrderReasons.push('color has been angespielt');
                            }

                            if (!myTeamIsHinterhand) {
                                secondOrderReasons.push('we are not both hinterhand')
                            }
                            if (!isHinterhand) {
                                secondOrderReasons.push('not hinterhand');
                            }
                            if (winningCardsWithoutPoints.length) {
                                reasons.push('has low value trump');

                                if (winningCardsNoOberNoPoints.length) {
                                    reasons.push('has low value trump without ober');
                                    return actions.playLowestCardByRank(winningCardsNoOberNoPoints);
                                } else {
                                    reasons.push('has low value trump without ober');
                                    return actions.playLowestCardByRank(winningCardsWithoutPoints);
                                }
                            } else {
                                reasons.push('only winning ober');
                                return actions.playLowestCardByRank(winningCards);
                            }
                        }
                    } else {
                        if (trumpRound) {
                            reasons.push('trump round');

                            if (myTeamIsHinterhand) {
                                reasons.push('we are hinterhand');
                                if (lowWinningTrumps.length) {
                                    reasons.push('we have low winning trumps');
                                    return actions.playLowestCardByPoints(lowWinningTrumps);
                                } else {
                                    reasons.push('no low winning trumps');
                                    return actions.playLowestCardByRank(winningCards);
                                }
                            } else if (!winningCardsWithoutPoints.length) {
                                reasons.push('we are not hinterhand');
                                reasons.push('no cheap trump cards');

                                return actions.playLowestCardByPoints(winningCards)
                            } else {
                                reasons.push('we are not hinterhand');
                                reasons.push('have cheap trump cards');

                                return actions.playLowestCardByRank(winningCards);
                            }
                        } else {
                            reasons.push('color round');
                            reasons.push('can win round');

                            if (myTeamIsHinterhand || isHinterhand) {
                                reasons.push('hinterhand position');
                                if (myTeamIsHinterhand) {
                                    secondOrderReasons.push('we are hinterhand');
                                }
                                if (isHinterhand) {
                                    secondOrderReasons.push('hinterhand');
                                }
                                return actions.playHighestCardByPoints(winningCards);
                            } else {
                                reasons.push('we are not hinterhand');

                                if (winningCardIsHighestInColor) {
                                    reasons.push('winning card is highest in color');

                                    return actions.playHighestCardByRank(winningCards);

                                } else {
                                    reasons.push('winning card is not highest in color');

                                    return actions.playLowestCardByRank(winningCards);
                                }
                            }
                        }
                    }
                } else {
                    reasons.push('cannot win round');

                    if (trumpRound) {
                        reasons.push('trump round');
                        if (roundCanBeOvertrumped && partnerIsBehindMe) {
                            reasons.push('round may be won');

                            secondOrderReasons.push('partner is behind me');
                            secondOrderReasons.push('round can be overtrumped');
                            return actions.playHighestCardByPoints(playableCards);
                        } else {
                            reasons.push('round may be lost');
                            if (!partnerIsBehindMe) {
                                secondOrderReasons.push('partner is not behind me');
                            }

                            if (!roundCanBeOvertrumped) {
                                secondOrderReasons.push('round cannot be overtrumped');
                            }
                            return actions.playLowestCardByMixedRanking(playableCards);
                        }
                    } else {
                        reasons.push('color round');
                        if (lowValueBlankCard) {
                            reasons.push('low value blank card');
                            return actions.playBlankCardOrSchmier(playableCards);
                        } else {
                            reasons.push('no low value blank card');

                            if (notInPlayingTeam && callColorCount == 1 && trumpCount) {
                                reasons.push('can freispielen in called color');
                                secondOrderReasons.push('not in playing team');
                                secondOrderReasons.push('have call color');
                                secondOrderReasons.push('have trumps');
                                return actions.playHighestCardByPoints(callColorCards);
                            } else {
                                if (partnerIsBehindMe && isPartnerFreeOfRoundColor) {
                                    reasons.push('partner may trump');
                                    secondOrderReasons.push('partner is behind me');
                                    secondOrderReasons.push('partner is free of color');
                                    return actions.playHighestCardByPoints(playableCards);
                                } else {
                                    reasons.push('partner cannot trump');

                                    if (!partnerIsBehindMe) {
                                        secondOrderReasons.push('partner is not behind me');
                                    }
                                    if (!isPartnerFreeOfRoundColor) {
                                        secondOrderReasons.push('partner is not free of round color');
                                    }
                                    if (cardsFilteredByBadPairs.length) {
                                        reasons.push('have good low point cards');
                                        return actions.playLowestCardByPoints(cardsWithoutBadPairsByPointsAscending);
                                    } else {
                                        reasons.push('have no good low point cards');
                                        if (onlyTrumpCards) {
                                            reasons.push('have only trump');
                                            return actions.playLowestCardByMixedRanking(playableCards);
                                        } else {
                                            reasons.push('i have only 10-x pairs');
                                            return actions.playLowestCardByPoints(playableCards);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        throw Error('return path missed?');
    }
}
