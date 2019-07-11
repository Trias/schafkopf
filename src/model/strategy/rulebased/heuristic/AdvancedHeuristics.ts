import {GameWorld} from "../../../GameWorld";
import {Card, cardToValue} from "../../../cards/Card";
import {getPlayableCards} from "../../../PlayableMoves";
import {
    allOfColor,
    getAces,
    getCardsByColor,
    getNonTrumps,
    getShortestColors,
    getTrumps,
    highTrumps,
    sortByNaturalOrdering
} from "../../../cards/CardSet";
import {ColorWithTrump} from "../../../cards/Color";
import {
    canForceWinTrumpRound,
    filterBadPairs,
    getWinningCards,
    opponentsAreHinterhand,
    sortByPointsAscending,
    sortByPointsDescending,
    weAreHinterhand
} from "./helper";
import {cloneDeep, remove} from "lodash";
import {CardPlayStrategy} from "./CardPlayStrategy";
import GameAssumptions from "../../../knowledge/GameAssumptions";

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

        let assumptions = this.assumptions;

        let playableCards = getPlayableCards(cardSet, world.gameMode, world.round);
        let roundAnalyzer = world.round.getRoundAnalyzer(world.gameMode);
        let partnerName = world.history.getTeamPartnerNameForPlayerName(this.name, this.startCardSet);
        let partnerHasRound = !world.round.isEmpty() && partnerName && world.round.getPlayerNameAtPosition(roundAnalyzer.getHighestCardPosition()) === partnerName;

        if (!playableCards.length) {
            throw Error(`no playable card found! ${cardSet}`);
        }

        if (playableCards.length == 1) {
            reasons.push('blank card');
            let conclusion = 'playCard';
            let card = playableCards[0];
            report(conclusion, card);
            return playableCards[0];
        }

        let potentialPartnerName = assumptions.getPossiblePartnerName();
        let potentialPartnerConfidence = this.assumptions.getPossibleTeamPartnerForPlayerName(this.name);
        let isCaller = world.gameMode.getCallingPlayerName() == this.name;

        if (world.round.isEmpty()) {
            reasons.push('start player');
            let isInPlayingTeam = world.history.isPlayerPlaying(this.name, this.startCardSet);
            if (isInPlayingTeam) {
                reasons.push('in playing team');
                let trumps = getTrumps(playableCards, world.gameMode);

                if (trumps.length) {
                    reasons.push('has trumps');

                    trumps = sortByNaturalOrdering(trumps);

                    let highTrumpsArray = highTrumps(trumps, world.gameMode);

                    if (potentialPartnerName && assumptions.isPlayerNameProbablyTrumpFree(potentialPartnerName)
                        || trumps.length == 1
                    ) {
                        if (potentialPartnerName && assumptions.isPlayerNameProbablyTrumpFree(potentialPartnerName)) {
                            reasons.push('partner is trump free');
                        }

                        if (trumps.length == 1) {
                            reasons.push('only one trump left');
                        }

                        let remainingTrumps = sortByNaturalOrdering(world.history.getRemainingCardsByColor()[ColorWithTrump.TRUMP]);

                        if (remainingTrumps.length <= 2 && canForceWinTrumpRound(remainingTrumps, trumps[0])) {
                            reasons.push('endgame');
                            reasons.push('can win trump round by force');

                            let card = trumps[0];
                            report('play trump', card);
                            return card;
                        } else if (remainingTrumps.length > 8) {
                            reasons.push('early game, lots of trumps, better loose my trump now......');
                            let card = trumps[0];
                            report('play trump', card);
                            return card;
                        } else {
                            reasons.push('cannot win trump round by force');
                            return playAceOrColorOrTrump(playableCards, world, reasons);
                        }

                    } else if (highTrumpsArray.length * 2 > trumps.length && trumps.length > 2) {
                        reasons.push('has a lot of high trumps');

                        let cardRanks = world.history.getCurrentRankWithEqualRanksOfCardInColor(cardSet, ColorWithTrump.TRUMP, world.round.getPlayedCards());

                        let ranksCount = highTrumpsArray.reduce((prev, cur) => prev + cardRanks[cur]!, 0) / highTrumpsArray.length;

                        if (ranksCount > 2) {
                            let card = highTrumpsArray[highTrumpsArray.length - 1];

                            reasons.push('not very dominant trumps');

                            report('playLowestHighTrump', card);
                            return card;

                        } else {
                            reasons.push('dominant trumps');

                            let card = trumps[0];

                            report('playHighestTrump', card);
                            return card;
                        }

                    } else if (isCaller) {
                        reasons.push('is calling player');

                        let card = trumps[0];

                        report('playHighestTrump', card);
                        return card;
                    } else {
                        reasons.push('not calling player');

                        let card = trumps[trumps.length - 1];

                        report('playLowestTrump', card);
                        return card;
                    }
                } else {
                    reasons.push('has no trumps');
                    return playAceOrColorOrTrump(playableCards, world, reasons);
                }
            } else {
                reasons.push('not in playing team');

                if (world.gameMode.isCallGame()) {
                    let callColorCards = allOfColor(playableCards, world.gameMode.getCalledColor(), world.gameMode);

                    if (!isInPlayingTeam && callColorCards.length != 0 && !world.history.hasColorBeenAngespielt(world.gameMode.getCalledColor())) {
                        reasons.push('is call game');
                        reasons.push('has call color');
                        reasons.push('call color has not been played');

                        let card = callColorCards[0];
                        report('playCallColor', card);
                        return card;
                    }
                }

                return playAceOrColorOrTrump(playableCards, world, reasons);
            }
        } else {
            let roundColor = roundAnalyzer.getRoundColor();
            let cardRanks = world.history.getCurrentRankWithEqualRanksOfCardInColor(cardSet, roundColor, world.round.getPlayedCards());

            let winningCards = sortByNaturalOrdering(getWinningCards(playableCards, world.round, world.gameMode));
            let playableCardsByPointsAscending = sortByPointsAscending(playableCards);
            // confidence is not working.....
            let potentialPartnerHasRound = potentialPartnerName == roundAnalyzer.getHighestCardPlayerName(); // && potentialPartnerConfidence.confidence > 0.0;
            let partnerIsBehindMe = partnerName ? world.round.getPlayerPositionByName(partnerName) > world.round.getPosition() : false;
            //let partnerHasPlayed = partnerName?(world.round.getPlayerPositionByName(partnerName) < world.round.getPosition()): false;

            let highestCardColor = world.gameMode.getOrdering().getColor(roundAnalyzer.getHighestCard());
            let cardRanksWithRoundCards = world.history.getCurrentRankWithEqualRanksOfCardInColor([...cardSet, ...world.round.getPlayedCards()], highestCardColor, world.round.getPlayedCards());

            let roundIsExpensive = roundAnalyzer.getPoints() > 4 && world.round.getPosition() < 2 || roundAnalyzer.getPoints() > 10 && world.round.getPosition() >= 2;

            let myTrumps = playableCards.filter(card => world.gameMode.getOrdering().isTrump(card));

            reasons.push('not at start position');

            if (partnerHasRound || potentialPartnerHasRound) {
                if (partnerHasRound) {
                    reasons.push('partner has round');
                } else if (potentialPartnerHasRound) {
                    reasons.push('potential partner has round');

                    secondOrderReasons.push(`potential partner (${potentialPartnerConfidence.playerName}, reasons: ${potentialPartnerConfidence.reasons} with confidence ${potentialPartnerConfidence.confidence}) has round\n`);
                }
                //let cardRanksWithoutRoundCards = world.history.getCurrentRankWithEqualRanksOfCardInColor(cardSet, color);

                if (cardRanksWithRoundCards[roundAnalyzer.getHighestCard()] === 0 && roundColor == ColorWithTrump.TRUMP
                    || world.round.isHinterHand()
                    || cardRanksWithRoundCards[roundAnalyzer.getHighestCard()] === 0
                    && !world.history.hasColorBeenAngespielt(roundColor) && allOfColor(this.startCardSet, roundColor, world.gameMode).length < 4
                ) {
                    reasons.push('we will probably win this round');
                    // todo: ober/punkte dilemma
                    let roundColor = roundAnalyzer.getRoundColor();
                    if (roundColor != world.gameMode.getOrdering().getColor(playableCardsByPointsAscending[0])) {
                        // schmieren !
                        reasons.push('i dont have round color');

                        let playableCardsByPointsAscendingNoTrumps = playableCardsByPointsAscending.filter(card => !world.gameMode.getOrdering().isTrump(card));

                        if (playableCardsByPointsAscendingNoTrumps.length) {
                            reasons.push('i have non trump cards');
                            return schmierOrFreimachen(playableCardsByPointsAscending, world, reasons);
                        } else {
                            reasons.push('i only have trump cards');
                            let playableCardsByPointsAscendingNoHighTrumps = playableCardsByPointsAscending.filter(card => card[1] != "O" && card[1] != "U");
                            if (playableCardsByPointsAscendingNoHighTrumps.length) {
                                reasons.push('i have low trumps');
                                let card = playableCardsByPointsAscending[playableCardsByPointsAscending.length - 1];
                                report('play high value trump', card);
                                return card;
                            } else {
                                let playableCardsByPointsAscendingNoOber = playableCardsByPointsAscending.filter(card => card[1] != "O");
                                if (playableCardsByPointsAscendingNoOber.length) {
                                    let card = playableCardsByPointsAscendingNoOber[playableCardsByPointsAscendingNoOber.length - 1];
                                    report('play high value trump including unter', card);
                                    return card;
                                } else {
                                    let playableCardsByNatSort = sortByNaturalOrdering(playableCards);
                                    let card = playableCardsByNatSort[playableCardsByNatSort.length - 1];
                                    report('play lowest trump', card);
                                    return card;
                                }
                            }
                        }
                    } else {
                        reasons.push('i have the same color');

                        if (roundColor == ColorWithTrump.TRUMP) {
                            reasons.push('trump round');

                            return playTrumpPreferPoints(playableCardsByPointsAscending, reasons);
                        } else {
                            reasons.push('color round');

                            if (potentialPartnerHasRound && potentialPartnerConfidence.confidence < 1) {
                                reasons.push('partner not known with enough confidence');
                                let card = playableCardsByPointsAscending[0];
                                report('play minimal points', card);
                                return card;
                            } else {
                                reasons.push('partner known with enough confidence');
                                let card = playableCardsByPointsAscending[playableCardsByPointsAscending.length - 1];
                                report('play maximum points', card);
                                return card;
                            }
                        }
                    }
                } else {
                    reasons.push('round may be lost anyways...');
                    if (roundColor != world.gameMode.getOrdering().getColor(playableCardsByPointsAscending[0])) {
                        reasons.push('no bedienpflicht');

                        if (roundColor == ColorWithTrump.TRUMP) {
                            reasons.push('trump round');
                            let card = playableCardsByPointsAscending[0];
                            report('play lowest valued card', card);

                            return card;
                        } else {
                            reasons.push('color round');
                            if (world.gameMode.getOrdering().isTrump(roundAnalyzer.getHighestCard())) {
                                reasons.push('round was trumped by partner');
                                let card = playableCardsByPointsAscending[playableCardsByPointsAscending.length - 1];
                                report('play highest valued card', card);
                                return card;
                            } else {
                                let playableCardsNoTrumps = playableCardsByPointsAscending.filter(card => !world.gameMode.getOrdering().isTrump(card));
                                let playableTrumpCards = playableCardsByPointsAscending.filter(card => world.gameMode.getOrdering().isTrump(card));
                                if (playableCardsNoTrumps.length) {
                                    reasons.push('i have non-trump cards');
                                    if (playableTrumpCards.length) {
                                        reasons.push('i have trump cards');
                                        if (roundIsExpensive) {
                                            reasons.push('points in round, trying to trump');
                                            let card = sortByNaturalOrdering(playableTrumpCards)[playableTrumpCards.length - 1];

                                            report('trump round with lowest trump', card);

                                            return card;
                                        } else {
                                            reasons.push('not enough points in round');

                                            if (opponentsAreHinterhand(world, potentialPartnerName!) || potentialPartnerName != world.round.getLastPlayerName()) {
                                                reasons.push('opponents are hinterhand');

                                                let card = sortByNaturalOrdering(playableTrumpCards)[playableTrumpCards.length - 1];

                                                report('trump round with lowest trump', card);

                                                return card;

                                            } else {
                                                reasons.push('opponents are not hinterhand');

                                                let blankCard = getLowValueBlankCard(world, playableCards);

                                                if (blankCard) {
                                                    reasons.push('i have a blank card');
                                                    let card = blankCard;
                                                    report('play blank card', card);
                                                    return card;
                                                } else {
                                                    let card = playableCardsNoTrumps[0];
                                                    report('play lowest valued card but no trump', card);
                                                    return card;
                                                }
                                            }
                                        }
                                    } else {
                                        let card = playableCardsNoTrumps[0];
                                        report('play lowest valued card but no trump', card);
                                        return card;
                                    }
                                } else {
                                    reasons.push('i have only trump cards');

                                    if (roundIsExpensive) {
                                        reasons.push('points in round, trying to trump');
                                        let unter = playableCardsByPointsAscending.filter(card => card[1] == "U");

                                        if (unter.length) {
                                            let card = unter[unter.length - 1];
                                            report('play unter', card);
                                            return card;
                                        } else {
                                            // TODO: not very considerate...

                                            let card = playableCardsByPointsAscending[0];
                                            report('play lowest valued card', card);
                                            return card;
                                        }
                                    } else {
                                        reasons.push('not a valuable round');
                                        let card = playableCardsByPointsAscending[0];
                                        report('play lowest valued card', card);
                                        return card;
                                    }
                                }
                            }
                        }
                    } else {
                        reasons.push('bedienpflicht');

                        if (roundColor == ColorWithTrump.TRUMP) {
                            reasons.push('trump round');

                            // patented formula to calculate good enough high trump margins....
                            if (cardRanksWithRoundCards[winningCards[0]]! + Math.floor(8 / (world.rounds.length + 2)) < cardRanksWithRoundCards[roundAnalyzer.getHighestCard()]!) {
                                reasons.push('trump is pretty low and i can overtrump');
                                let goodWinningCardsNoOberNoPoints = winningCards
                                    .filter(card => card[1] != "O" && card[1] != "A" && card[1] != "X")
                                    .filter(card => cardRanksWithRoundCards[card]! + 2 < cardRanksWithRoundCards[roundAnalyzer.getHighestCard()]!);
                                if (roundIsExpensive) {
                                    let card = winningCards[0];
                                    report('play highest trump', card);
                                    return card;
                                } else if (goodWinningCardsNoOberNoPoints.length) {
                                    reasons.push('i have winning non-ober');
                                    let card = goodWinningCardsNoOberNoPoints[goodWinningCardsNoOberNoPoints.length - 1];
                                    report('play winning trump no ober', card);
                                    return card;
                                } else {
                                    reasons.push('i have winning ober');
                                    let card = winningCards[0];
                                    report('play high value trump including ober', card);
                                    return card;
                                }
                            } else {
                                reasons.push('trump is pretty safe, let\'s see if opponents will trump');

                                return playLowValueTrumpOrColorCard(reasons, playableCards);
                            }
                        } else {
                            reasons.push('color round');

                            if (winningCards.length) {
                                reasons.push('i can win round');
                                if (winningCards[0][1] == "A" && !world.history.hasColorBeenAngespielt(roundColor)) {
                                    reasons.push('i have ace');

                                    let card = winningCards[0];
                                    report('play ace', winningCards[0]);
                                    return card;
                                }
                                if (opponentsAreHinterhand(world, potentialPartnerName)) {
                                    reasons.push('opponents are hinterhand');
                                    let card = sortByPointsAscending(playableCards)[0];
                                    report('play lowest points', card);
                                    return card;
                                } else {
                                    let card = winningCards[0];
                                    report('play winning card', card);
                                    return card;
                                }
                            } else {
                                reasons.push('i cannot win round');
                                let card = sortByPointsAscending(playableCards)[0];
                                report('play lowest points', card);
                                return card;
                            }
                        }
                    }
                }
            } else if (winningCards.length) {
                reasons.push('has winning cards');
                reasons.push('partner does not have round');

                let winningCardsWithoutPoints = winningCards.filter(card => card[1] != "A" && card[1] != "X");

                let color = world.gameMode.getOrdering().getColor(winningCards[0]);

                if (color == ColorWithTrump.TRUMP
                    && roundAnalyzer.getRoundColor() != ColorWithTrump.TRUMP) {
                    reasons.push('color round but can trump round');

                    if (!world.history.hasColorBeenAngespielt(roundAnalyzer.getRoundColor()) || weAreHinterhand(world, partnerName)) {
                        if (world.history.hasColorBeenAngespielt(roundAnalyzer.getRoundColor())) {
                            reasons.push('color has not been played yet');
                        }

                        if (weAreHinterhand(world, partnerName)) {
                            reasons.push('we are hinterhand')
                        }

                        return playTrumpPreferPoints(winningCards, reasons);
                    } else {
                        reasons.push('color has been angespielt');
                        if (winningCardsWithoutPoints.length) {
                            reasons.push('has low value trump');

                            let withoutOber = winningCardsWithoutPoints.filter(card => card[1] != "O");

                            if (withoutOber.length) {
                                reasons.push('has low value trump without ober');

                                let card = sortByNaturalOrdering(withoutOber)[withoutOber.length - 1];
                                // TODO consider playing unter instead of low trumps..
                                report('play low points trump card', card);

                                return card;
                            } else {
                                let card = sortByNaturalOrdering(winningCardsWithoutPoints)[winningCardsWithoutPoints.length - 1];
                                // TODO not exactly sure in these cases
                                report('play low points trump card', card);

                                return card;
                            }
                        } else {
                            let card = sortByNaturalOrdering(winningCards)[winningCards.length - 1];
                            // TODO not exactly sure in these cases
                            report('play low points trump card', card);

                            return card;
                        }
                    }
                }

                if (color == ColorWithTrump.TRUMP && roundColor == ColorWithTrump.TRUMP) {
                    reasons.push('trump round');

                    if (weAreHinterhand(world, partnerName)) {
                        reasons.push('we are hinterhand');
                        let lowWinningTrumps = winningCards.filter(card => card[1] != "O" && card[1] != "U");
                        if (lowWinningTrumps.length) {
                            reasons.push('we have low winning trumps');
                            let card = sortByPointsAscending(lowWinningTrumps)[0];
                            report('play lowest winning trump card with highest points', card);
                            return card;
                        } else {
                            reasons.push('no low winning trumps');
                            // todo: gute pos zum freimachen...
                            let card = sortByNaturalOrdering(winningCards)[winningCards.length - 1];
                            report('play lowest winning trump card with highest points', card);
                            return card;
                        }
                    } else if (!winningCardsWithoutPoints.length) {
                        reasons.push('no cheap trump cards');

                        let card = sortByPointsAscending(winningCards)[0];
                        report('play trump card with lowest points', card);
                        return card;
                    } else {
                        reasons.push('we are not hinterhand');
                        let card = winningCards[0];
                        report('play highest trump card', card);
                        return card;
                    }
                } else {
                    reasons.push('color round');

                    if (cardRanks[winningCards[0]]! <= 2 && color == ColorWithTrump.TRUMP) {
                        reasons.push('winningCard is trump');
                        reasons.push('winning card is not absolutely winning');

                        if (!world.history.isAnyoneDefinitelyFreeOfColor(cardSet, roundAnalyzer.getRoundColor())
                            && !world.history.hasColorBeenAngespielt(roundAnalyzer.getRoundColor())) {
                            reasons.push('color may run');
                            let winningCardsWithPoints = winningCards.filter(card => card[1] == "A" || card[1] == "X" || card[1] == "K");

                            if (winningCardsWithPoints.length) {
                                reasons.push('have trump Ace/10/king');
                                let card = sortByPointsDescending(winningCardsWithPoints)[0];
                                report('play card with most points', card);
                                return card;
                            } else {
                                reasons.push('have no trump points');

                                let card = sortByNaturalOrdering(winningCards)[winningCards.length - 1];
                                report('play lowest winning card', card);
                                return card;
                            }
                        } else {
                            reasons.push('color may not run');
                            // TODO abspatzen / schmieren?
                            let card = sortByNaturalOrdering(winningCards)[winningCards.length - 1];

                            report('play lowest winning card', card);

                            return card;
                        }

                    } else if (weAreHinterhand(world, partnerName)) {
                        reasons.push('we are hinterhand');
                        let card = sortByPointsAscending(winningCards)[winningCards.length - 1];
                        report('play lowest winning trump with highest points', card);
                        return card;
                    } else if (cardRanks[winningCards[0]]! == 0 && color != ColorWithTrump.TRUMP) {
                        reasons.push('winning card is highest in color');

                        let card = winningCards[0];
                        report('play winning card', card);
                        return card;
                    } else {
                        let card = winningCards[winningCards.length - 1];
                        report('play lowest winning trump', card);
                        return card;
                    }
                }
            } else {
                reasons.push('partner does no have round');
                reasons.push('cannot win round');
                let blankCard = getLowValueBlankCard(world, playableCards);

                if (roundColor == ColorWithTrump.TRUMP) {
                    reasons.push('trump round');
                    if (cardRanksWithRoundCards[roundAnalyzer.getHighestCard()]! > 1 && partnerIsBehindMe) {
                        reasons.push('maybe partner will get round');
                        let card = sortByPointsDescending(playableCards)[0];
                        report('play high value card', card);
                        return card;
                    } else {
                        reasons.push('partner may not be able to win round');
                        return playLowValueTrumpOrColorCard(reasons, playableCards);
                    }
                } else if (blankCard) {
                    reasons.push('color round');
                    reasons.push('i have a blank card');
                    return freimachen(reasons, blankCard);
                } else {
                    reasons.push('color round');
                    let cardsFilteredByBadPairs = filterBadPairs(world, playableCards);

                    let callColorCards = allOfColor(playableCards, world.gameMode.getCalledColor(), world.gameMode);
                    if (partnerName != world.gameMode.getCallingPlayerName() && callColorCards.length) {
                        reasons.push('Im not the calling player');
                        let card = callColorCards[0];
                        report('play call color', card);
                        return card;
                    } else if (partnerIsBehindMe && world.history.isPlayerNameColorFree(partnerName!, roundColor)) {
                        reasons.push('partner is behind me');
                        let cards = sortByPointsDescending(playableCards);
                        let card = cards[0];
                        report('play maximal points', card);
                        return card;
                    } else if (cardsFilteredByBadPairs.length) {
                        reasons.push('i have good nixer');
                        let cardsByPoints = sortByPointsAscending(cardsFilteredByBadPairs);

                        let card = cardsByPoints[0];
                        report('play lowest value but no 10/x pair', card);
                        return card;
                    } else if (myTrumps.length == playableCards.length) {
                        reasons.push('i have only trump');
                        let card = sortByNaturalOrdering(playableCards)[playableCards.length - 1];
                        report('play lowest valued card', card);
                        return card;
                    } else {
                        reasons.push('i have only 10-x pairs');

                        let card = playableCardsByPointsAscending[0];
                        report('play lowest valued card', card);

                        return card;
                    }
                }
            }
        }

        function playTrumpPreferPoints(playableCards: Card[], reasons: string[]) {
            let playableCardsByPointsAscending = sortByPointsAscending(playableCards);
            let playableCardsNoOber = playableCardsByPointsAscending.filter(card => card[1] != "O");
            let playableCardsNoHighTrumps = playableCardsByPointsAscending.filter(card => card[1] != "O" && card[1] != "U");

            if (playableCardsNoHighTrumps.length) {
                reasons.push('have low trumps');
                let card = playableCardsNoHighTrumps[playableCardsNoHighTrumps.length - 1];
                report('play maximum points but no hightrump', card);
                return card;
            } else if (playableCardsNoOber.length) {
                let card = playableCardsNoOber[playableCardsNoOber.length - 1];
                report('play maximum points but no ober', card);
                return card;
            } else {
                let card = playableCardsByPointsAscending[playableCardsByPointsAscending.length - 1];
                report('play maximum points', card);
                return card;
            }
        }

        function playAceOrColorOrTrump(playableCards: Card[], world: GameWorld, reasons: string[]) {
            let aces = getAces(playableCards);

            remove(aces, ace => ace == world.gameMode.getCalledAce() || ace == "HA");

            if (aces.length) {
                reasons.push('has aces of color');
                let card = aces[0]; //sample(aces)!;
                report('play ace', card);
                return card;
            }

            let colorCards = getNonTrumps(playableCards, world.gameMode);
            if (colorCards.length) {
                reasons.push('i have color cards');
                let card = colorCards[0]; //sample(colorCards)!;

                report('play random color card', card);

                return card;
            } else {
                reasons.push('i have only trump cards');
                let card = playableCards[0]; //sample(playableCards)!;

                // possibly a bad choice in endgame...
                report('play random card', card);

                return card;
            }
        }

        function schmierOrFreimachen(playableCardsByPointsAscending: Card[], world: GameWorld, reasons: string[]) {
            let blankCard = getHighValueBlankCard(world, playableCardsByPointsAscending);

            if (blankCard) {
                return freimachen(reasons, blankCard);
            } else {
                reasons.push('can schmier');

                let playableCardsByPointsAscendingNoAcesOrTrump = playableCardsByPointsAscending
                    .filter(card => card[1] != "A")
                    .filter(card => !world.gameMode.getOrdering().isTrump(card));
                if (playableCardsByPointsAscendingNoAcesOrTrump.length) {
                    let card = playableCardsByPointsAscendingNoAcesOrTrump[playableCardsByPointsAscendingNoAcesOrTrump.length - 1];
                    report('play maximum points but no aces', card);

                    return card;
                } else {
                    let card = playableCardsByPointsAscending[playableCardsByPointsAscending.length - 1];
                    report('play maximum points', card);

                    return card;
                }
            }
        }

        function getHighValueBlankCard(world: GameWorld, playableCards: Card[]) {
            return getBlankCardWithComparison(world, playableCards, (a, b) => cardToValue(a) > cardToValue(b));
        }

        function getLowValueBlankCard(world: GameWorld, playableCards: Card[]) {
            return getBlankCardWithComparison(world, playableCards, (a, b) => cardToValue(a) < cardToValue(b));
        }

        function getBlankCardWithComparison(world: GameWorld, playableCards: Card[], compare: (a: Card, b: Card) => boolean) {
            let shortestColors = getShortestColors(playableCards, world.gameMode);
            let cardsByColor = getCardsByColor(playableCards, world.gameMode);

            let blankCard = null;
            if (cardsByColor[shortestColors[0]].length == 1) {
                let card = cardsByColor[shortestColors[0]][0];
                if (!blankCard && card[1] != "A" || card[1] != "A" && blankCard && compare(card, blankCard)) {
                    blankCard = card;
                }
            }
            return blankCard;
        }

        function freimachen(reasons: string[], bestCard: any) {
            reasons.push('i have a blank card');
            let card = bestCard;
            report('play freimachen', card);

            return card;
        }

        function playLowValueTrumpOrColorCard(reasons: string[], playableCards: Card[]) {
            let order = ['7', '8', '9', 'K', 'U', 'X', 'A', 'O'];

            let playableCardsSorted = playableCards.sort((a, b) => order.indexOf(a[1]) > order.indexOf(b[1]) ? 1 : -1);

            let card = playableCardsSorted[0];
            report('play low value trump or color card', card);
            return card;
        }

        throw Error('return path missed?');
    }
}
