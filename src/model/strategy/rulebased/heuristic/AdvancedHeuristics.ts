import {GameWorld} from "../../../GameWorld";
import {Card} from "../../../cards/Card";
import {cloneDeep} from "lodash";
import {CardPlayStrategy} from "../../CardPlayStrategy";
import GameAssumptions from "../../../knowledge/GameAssumptions";
import {Actions} from "./Actions";
import getConditions from "./conditions";
import getInPlayConditions from "./inPlayConditions";
import getCardInfos, {CardInfoBase, CardInfosInPlay} from "./cardInfos";
import {CardFilter} from "./CardFilter";

export type AdvancedHeuristicOptions = {
    name: string,
    startCardSet: Card[],
    assumptions: GameAssumptions,
    report?: ((reasons: string[], secondOrderReasons: string[], conclusion: string, card: Card, cardSet: Card[]) => void) | null
}

export class AdvancedHeuristic implements CardPlayStrategy {
    private readonly startCardSet: Card[];
    private readonly name: string;
    private readonly assumptions: GameAssumptions;
    private readonly report: (reasons: string[], secondOrderReasons: string[], conclusion: string, card: Card, cardSet: Card[]) => void;

    constructor(options: AdvancedHeuristicOptions) {
        this.name = options.name;
        this.assumptions = options.assumptions;
        this.startCardSet = cloneDeep(options.startCardSet);
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
        let cardInfos = getCardInfos(world, this.name, cardSet, this.assumptions, this.startCardSet);
        let conditions = getConditions(world, cardSet, <CardInfoBase>cardInfos, reasons);

        if (cardFilter.playableCards.length == 0) {
            throw Error('no playable card?');
        }

        if (conditions.hasSinglePlayableCard()) {
            return actions.playHighestCardByRank(cardFilter.playableCards);
        }

        if (conditions.isStartPosition()) {
            if (conditions.isInPlayingTeam()) {
                if (conditions.hasTrumps()) {
                    if (conditions.isPotentialPartnerPossiblyTrumpFree()) {
                        if (conditions.canForceWinRound()) {
                            return actions.playHighestCardByRank(cardFilter.trumps);
                        } else {
                            return actions.playAceOrColorOrTrump(cardFilter.playableCards);
                        }
                    } else {
                        if (conditions.hasAGoodAmountOfHighTrumps()) {
                            if (conditions.hasDominantTrumps()) {
                                return actions.playHighestCardByRank(cardFilter.trumps);
                            } else {
                                return actions.playLowestCardByRank(cardFilter.highTrumps);
                            }
                        } else {
                            if (conditions.hasMoreThan1TrumpsWithoutVolle()) {
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
                if (conditions.canSearchCalledAce()) {
                    return actions.playHighestCardByRank(cardFilter.callColorCards);
                } else {
                    return actions.playAceOrColorOrTrump(cardFilter.playableCards);
                }
            }
        } else {
            let inPlayConditions = getInPlayConditions(cardFilter, <CardInfosInPlay>cardInfos, reasons);

            if (inPlayConditions.partnerHasRound()) {
                if (inPlayConditions.roundIsProbablySafe()) {
                    if (inPlayConditions.mustFollowSuit()) {
                        if (inPlayConditions.isTrumpRound()) {
                            return actions.playTrumpPreferPoints(cardFilter.playableCards);
                        } else {
                            if (inPlayConditions.highConfidenceInPotentialPartner()) {
                                return actions.playHighestCardByPoints(cardFilter.playableCards);
                            } else {
                                return actions.playLowestCardByPoints(cardFilter.playableCards);
                            }
                        }
                    } else {
                        if (inPlayConditions.hasOnlyTrumpCards()) {
                            if (inPlayConditions.hasLowTrumps()) {
                                return actions.playHighestCardByPoints(cardFilter.lowTrumps);
                            } else {
                                return actions.playLowestCardByRank(cardFilter.trumps);
                            }
                        } else {
                            return actions.playBlankCardOrSchmier(cardFilter.playableCards);
                        }
                    }
                } else {
                    if (inPlayConditions.mustFollowSuit()) {
                        if (inPlayConditions.isTrumpRound()) {
                            if (inPlayConditions.highestTrumpMayBeOvertrumped()) {
                                if (inPlayConditions.roundIsExpensive()) {
                                    return actions.playHighestCardByRank(cardFilter.playableCards);
                                } else {
                                    if (inPlayConditions.hasGoodWinningCards()) {
                                        return actions.playLowestCardByRank(cardFilter.goodWinningCardsNoOberNoPoints);
                                    } else {
                                        return actions.playLowestCardByPoints(cardFilter.playableCards);
                                    }
                                }
                            } else {
                                return actions.playLowestCardByRank(cardFilter.playableCards);
                            }
                        } else {
                            if (inPlayConditions.hasWinningCards()) {
                                if (inPlayConditions.aceIsProbablySafeToPlay()) {
                                    return actions.playHighestCardByPoints(cardFilter.playableCards);
                                } else {
                                    return actions.playLowestCardByPoints(cardFilter.playableCards);
                                }
                            } else {
                                return actions.playLowestCardByPoints(cardFilter.playableCards);
                            }
                        }
                    } else {
                        if (inPlayConditions.isTrumpRound()) {
                            return actions.playLowestCardByPoints(cardFilter.playableCards);
                        } else {
                            if (inPlayConditions.isColorRoundTrumped()) {
                                return actions.playHighestCardByPoints(cardFilter.playableCards);
                            } else {
                                if (inPlayConditions.hasOnlyTrumpCards()) {
                                    if (inPlayConditions.roundIsExpensive()) {
                                        if (inPlayConditions.hasUnter()) {
                                            return actions.playLowestCardByRank(cardFilter.unter);
                                        } else {
                                            return actions.playLowestCardByPoints(cardFilter.playableCards);
                                        }
                                    } else {
                                        return actions.playLowestCardByPoints(cardFilter.playableCards);
                                    }
                                } else {
                                    if (inPlayConditions.hasTrumps()) {
                                        if (inPlayConditions.roundIsExpensive()) {
                                            if (inPlayConditions.hasUnter()) {
                                                return actions.playHighestCardByRank(cardFilter.unter);
                                            } else {
                                                return actions.playHighestCardByRank(cardFilter.trumps);
                                            }
                                        } else {
                                            if (inPlayConditions.opponentsAreInHinterhand()) {
                                                if (inPlayConditions.isColor10InPlay()) {
                                                    if (inPlayConditions.hasUnter()) {
                                                        return actions.playLowestCardByRank(cardFilter.unter);
                                                    } else {
                                                        return actions.playHighestCardByRank(cardFilter.trumps);
                                                    }
                                                } else {
                                                    return actions.playBlankCardOrLowestCardByPoints(cardFilter.playableCardsNoTrumps);
                                                }
                                            } else {
                                                return actions.playBlankCardOrLowestCardByPoints(cardFilter.playableCardsNoTrumps);
                                            }
                                        }
                                    } else {
                                        return actions.playLowestCardByPoints(cardFilter.playableCardsNoTrumps);
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                if (inPlayConditions.hasWinningCards()) {
                    if (inPlayConditions.canTrumpColorRound()) {
                        if (inPlayConditions.roundIsProbablySafeIfTrumped()) {
                            return actions.playTrumpPreferPoints(cardFilter.winningCards);
                        } else {
                            if (inPlayConditions.hasWinningTrumpsWithoutVolle()) {
                                if (inPlayConditions.hasWinningCardsNoOberNoVolle()) {
                                    return actions.playLowestCardByRank(cardFilter.winningCardsNoOberNoPoints);
                                } else {
                                    return actions.playLowestCardByRank(cardFilter.winningCardsWithoutVolle);
                                }
                            } else {
                                // TODO: weak spot here
                                return actions.playLowestCardByMixedRanking(cardFilter.playableCards);
                            }
                        }
                    } else {
                        if (inPlayConditions.isTrumpRound()) {
                            if (inPlayConditions.isHinterhand()) {
                                if (inPlayConditions.hasLowWinningTrump()) {
                                    return actions.playLowestCardByPoints(cardFilter.lowWinningTrumps);
                                } else {
                                    return actions.playLowestCardByRank(cardFilter.winningCards);
                                }
                            } else {
                                if (inPlayConditions.hasWinningTrumpsWithoutVolle()) {
                                    return actions.playLowestCardByRank(cardFilter.winningCardsWithoutVolle);
                                } else {
                                    // TODO: weak spot here
                                    return actions.playLowestCardByPoints(cardFilter.playableCards)
                                }
                            }
                        } else {
                            if (inPlayConditions.isHinterhand()) {
                                return actions.playHighestCardByPoints(cardFilter.winningCards);
                            } else {
                                if (inPlayConditions.winningCardIsHighestInColor()) {
                                    return actions.playHighestCardByRank(cardFilter.winningCards);
                                } else {
                                    return actions.playLowestCardByRank(cardFilter.winningCards);
                                }
                            }
                        }
                    }
                } else {
                    if (inPlayConditions.isTrumpRound()) {
                        if (inPlayConditions.roundMayBeWonByPartner()) {
                            return actions.playHighestCardByPoints(cardFilter.playableCards);
                        } else {
                            return actions.playLowestCardByMixedRanking(cardFilter.playableCards);
                        }
                    } else {
                        if (inPlayConditions.hasLowValueBlankCard()) {
                            return actions.playBlankCardOrSchmier(cardFilter.playableCards);
                        } else {
                            if (inPlayConditions.canDiscardCalledColor()) {
                                return actions.playHighestCardByPoints(cardFilter.callColorCards);
                            } else {
                                if (inPlayConditions.partnerMayBeAbleToTrump()) {
                                    return actions.playHighestCardByPoints(cardFilter.playableCards);
                                } else {
                                    if (inPlayConditions.hasOnlyTrumpCards()) {
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