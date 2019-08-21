import {GameWorld} from "../../../GameWorld";
import {Card} from "../../../cards/Card";
import {CardPlayStrategy} from "../../CardPlayStrategy";
import GameAssumptions from "../../../knowledge/GameAssumptions";
import {Actions} from "./Actions";
import getConditions from "./conditions";
import {CardInfos} from "./cardInfos";
import {CardFilter} from "./CardFilter";

export type AdvancedHeuristicOptions = {
    name: string,
    startCardSet: readonly Card[],
    assumptions: GameAssumptions,
    report?: ((reasons: string[], secondOrderReasons: string[], conclusion: string, card: Card, cardSet: Card[]) => void) | null
}

export class AdvancedHeuristic implements CardPlayStrategy {
    private readonly startCardSet: readonly Card[];
    private readonly name: string;
    private readonly assumptions: GameAssumptions;
    private readonly report: (reasons: string[], secondOrderReasons: string[], conclusion: string, card: Card, cardSet: Card[]) => void;

    constructor(options: AdvancedHeuristicOptions) {
        this.name = options.name;
        this.assumptions = options.assumptions;
        this.startCardSet = options.startCardSet;
        this.report = options.report || (() => {
        });
    }

    chooseCardToPlay(world: GameWorld, cardSet: Card[]) {
        let reasons: string[] = [];
        let secondOrderReasons: string[] = [];
        let report = (conclusion: string, card: Card, cardSet: Card[]) => {
            this.report(reasons, secondOrderReasons, conclusion, card, cardSet);
        };

        let cardFilter = new CardFilter(world, cardSet);
        let actions = new Actions(world, report);
        let cardInfos = new CardInfos(world, this.name, cardSet, this.assumptions, cardFilter, this.startCardSet);
        let conditions = getConditions(cardInfos, world, reasons, secondOrderReasons);

        if (cardFilter.playableCards.length == 0) {
            throw Error('no playable card?');
        }

        if (conditions.hasSinglePlayableCard) {
            return actions.playHighestCardByRank(cardFilter.playableCards);
        }

        if (conditions.isStartPosition) {
            if (conditions.isInPlayingTeam) {
                if (conditions.hasTrumps) {
                    if (conditions.canForceWinRound) {
                        return actions.playHighestCardByRank(cardFilter.trumps);
                    } else {
                        if (conditions.hasAGoodAmountOfHighTrumps) {
                            if (conditions.hasDominantTrumps) {
                                return actions.playHighestCardByRank(cardFilter.trumps);
                            } else {
                                return actions.playLowestCardByRank(cardFilter.highTrumps);
                            }
                        } else {
                            if (conditions.hasMoreThan1TrumpsWithoutVolle) {
                                return actions.playLowestCardByRank(cardFilter.trumpsWithoutVolle);
                            } else {
                                return actions.playAceOrColorOrTrump(cardFilter.playableCards);
                            }
                        }
                    }
                } else {
                    return actions.playAceOrColorOrTrump(cardFilter.playableCards);
                }
            } else {
                if (conditions.canSearchCalledAce) {
                    return actions.playHighestCardByRank(cardFilter.callColorCards);
                } else {
                    return actions.playAceOrColorOrTrump(cardFilter.playableCards);
                }
            }
        } else {
            if (conditions.partnerHasRound) {
                if (conditions.roundIsProbablySafe) {
                    if (conditions.mustFollowSuit) {
                        if (conditions.isTrumpRound) {
                            return actions.playTrumpPreferPoints(cardFilter.playableCards);
                        } else {
                            if (conditions.highConfidenceInPotentialPartner) {
                                return actions.playHighestCardByPoints(cardFilter.playableCards);
                            } else {
                                return actions.playLowestCardByPoints(cardFilter.playableCards);
                            }
                        }
                    } else {
                        if (conditions.hasOnlyTrumpCards) {
                            if (conditions.hasLowTrumps) {
                                return actions.playHighestCardByPoints(cardFilter.lowTrumps);
                            } else {
                                return actions.playLowestCardByRank(cardFilter.trumps);
                            }
                        } else {
                            return actions.playBlankCardOrSchmier(cardFilter.playableCards);
                        }
                    }
                } else {
                    if (conditions.mustFollowSuit) {
                        if (conditions.isTrumpRound) {
                            if (conditions.highestTrumpMayBeOvertrumped) {
                                if (conditions.roundIsExpensive) {
                                    return actions.playHighestCardByRank(cardFilter.playableCards);
                                } else {
                                    if (conditions.hasGoodWinningCards) {
                                        return actions.playLowestCardByRank(cardFilter.goodWinningCardsNoOberNoPoints);
                                    } else {
                                        return actions.playLowestCardByPoints(cardFilter.playableCards);
                                    }
                                }
                            } else {
                                return actions.playLowestCardByRank(cardFilter.playableCards);
                            }
                        } else {
                            if (conditions.hasWinningCards) {
                                if (conditions.aceIsProbablySafeToPlay) {
                                    return actions.playHighestCardByPoints(cardFilter.playableCards);
                                } else {
                                    return actions.playLowestCardByPoints(cardFilter.playableCards);
                                }
                            } else {
                                return actions.playLowestCardByPoints(cardFilter.playableCards);
                            }
                        }
                    } else {
                        if (conditions.isTrumpRound) {
                            return actions.playLowestCardByPoints(cardFilter.playableCards);
                        } else {
                            if (conditions.roundIsExpensive) {
                                if (conditions.hasUnter) {
                                    return actions.playHighestCardByRank(cardFilter.unter);
                                } else {
                                    if (conditions.hasTrumps) {
                                        return actions.playHighestCardByRank(cardFilter.trumps);
                                    } else {
                                        return actions.playBlankCardOrLowestCardByPoints(cardFilter.playableCards);
                                    }
                                }
                            } else {
                                if (conditions.isColor10InPlay) {
                                    if (conditions.hasUnter) {
                                        return actions.playLowestCardByRank(cardFilter.unter);
                                    } else {
                                        return actions.playBlankCardOrLowestCardByPoints(cardFilter.playableCards);
                                    }
                                } else {
                                    return actions.playBlankCardOrLowestCardByPoints(cardFilter.playableCards);
                                }
                            }
                        }
                    }
                }
            } else {
                if (conditions.hasWinningCards) {
                    if (conditions.canTrumpColorRound) {
                        if (conditions.roundIsProbablySafeIfTrumped) {
                            return actions.playTrumpPreferPoints(cardFilter.winningCards);
                        } else {
                            if (conditions.hasWinningTrumpsWithoutVolle) {
                                if (conditions.hasWinningCardsNoOberNoVolle) {
                                    return actions.playLowestCardByRank(cardFilter.winningCardsNoOberNoPoints);
                                } else {
                                    return actions.playLowestCardByRank(cardFilter.winningCardsWithoutVolle);
                                }
                            } else {
                                return actions.playLowestCardByMixedRanking(cardFilter.playableCards);
                            }
                        }
                    } else {
                        if (conditions.isTrumpRound) {
                            if (conditions.isHinterhand) {
                                if (conditions.hasLowWinningTrump) {
                                    return actions.playHighestCardByPoints(cardFilter.lowWinningTrumps);
                                } else {
                                    return actions.playLowestCardByRank(cardFilter.winningCards);
                                }
                            } else {
                                if (conditions.hasWinningTrumpsWithoutVolle) {
                                    return actions.playLowestCardByRank(cardFilter.winningCardsWithoutVolle);
                                } else {
                                    return actions.playLowestCardByPoints(cardFilter.playableCards)
                                }
                            }
                        } else {
                            if (conditions.isHinterhand) {
                                return actions.playHighestCardByPoints(cardFilter.winningCards);
                            } else {
                                if (conditions.winningCardIsHighestInColor) {
                                    return actions.playHighestCardByRank(cardFilter.winningCards);
                                } else {
                                    return actions.playLowestCardByRank(cardFilter.winningCards);
                                }
                            }
                        }
                    }
                } else {
                    if (conditions.isTrumpRound) {
                        if (conditions.roundMayBeWonByPartner) {
                            return actions.playHighestCardByPoints(cardFilter.playableCards);
                        } else {
                            return actions.playLowestCardByMixedRanking(cardFilter.playableCards);
                        }
                    } else {
                        if (conditions.hasLowValueBlankCard) {
                            return actions.playBlankCardOrSchmier(cardFilter.playableCards);
                        } else {
                            if (conditions.canDiscardCalledColor) {
                                return actions.playHighestCardByPoints(cardFilter.callColorCards);
                            } else {
                                if (conditions.partnerMayBeAbleToTrump) {
                                    return actions.playHighestCardByPoints(cardFilter.playableCards);
                                } else {
                                    if (conditions.hasOnlyTrumpCards) {
                                        return actions.playLowestCardByMixedRanking(cardFilter.playableCards);
                                    } else {
                                        return actions.playLowestCardByPoints(cardFilter.playableCards);
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