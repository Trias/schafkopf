import StrategyInterface from "../StrategyInterface";
import {callableColors, ColorWithTrump, PlainColor} from "../../cards/Color";
import {GameMode, GameModeEnum} from "../../GameMode";
import {Card, cardToValue} from "../../cards/Card";
import {getPlayableCards} from "../../PlayableMoves";
import {determineGameMode} from "../rules/shouldCall/determineGameMode";
import {GameWorld} from "../../GameWorld";
import {
    allOfColor,
    getAces,
    getCardLengthsByColor,
    getCardsByColor,
    getNonTrumps,
    getShortestColors,
    getTrumps,
    highTrumps,
    sortByNaturalOrdering
} from "../../cards/CardSet";
import {clone, remove, reverse, shuffle} from "lodash";
import {Player} from "../../Player";
import {Round} from "../../Round";

let colors = require("colors");

function filterBadPairs(world: GameWorld, playableCards: Card[]) {
    let cardsByColorNoTrump = getCardsByColor(playableCards.filter(card => !world.gameMode.getOrdering().isTrump(card)), world.gameMode);

    let goodCards: Card[] = [];

    for (let color of callableColors) {
        if (!(cardsByColorNoTrump[color].length == 2 && cardsByColorNoTrump[color][0][1] == "X" && cardToValue(cardsByColorNoTrump[color][1]) <= 4
            || cardsByColorNoTrump[color].length == 1 && cardsByColorNoTrump[color][0][1] == "X"
        )) {
            goodCards = goodCards.concat(cardsByColorNoTrump[color]);
        }
    }

    return goodCards;
}

function getWinningCards(playableCards: Card[], round: Round, gameMode: GameMode) {
    let winningCards = [];
    let roundAnalyzer = round.getRoundAnalyzer(gameMode);

    for (let card of playableCards) {
        if (gameMode.getOrdering().rightBeatsLeftCard(roundAnalyzer.getHighestCard(), card)) {
            winningCards.push(card);
        }
    }

    return winningCards;
}

function sortByPointsAscending(cardSet: Card[]) {
    let pointsRanking = ["A", "X", "K", "O", "U", "9", "8", "7"];
    return clone(cardSet).sort((a, b) => pointsRanking.indexOf(b[1]) - pointsRanking.indexOf(a[1]));
}

function sortByPointsDescending(cardSet: Card[]) {
    return reverse(sortByPointsAscending(cardSet));
}

function report(reasons: string[], conclusion: string, card: Card) {
    console.log(colors.green(reasons.toString() + ' => ' + conclusion + ': ' + card));
}

function weAreHinterhand(world: GameWorld, partnerName: string | null) {
    return world.round.isHinterHand() || world.round.getPosition() == 2 && world.round.getLastPlayerName() === partnerName;
}

export default class CallingRulesWithSimpleStrategy implements StrategyInterface {
    private thisPlayer: Player;

    constructor(thisPlayer: Player) {
        this.thisPlayer = thisPlayer;
    }

    chooseCardToPlay(world: GameWorld, cardSet: Card[]): Card {
        // TODO: assumptions
        // TODO: schmieren/ abwerfen
        // todo combine with monte carlo
        // todo compare with monte carlo

        let playableCards = getPlayableCards(cardSet, world.gameMode, world.round);
        let roundAnalyzer = world.round.getRoundAnalyzer(world.gameMode);
        let partnerName = world.history.getTeamPartnerNameForPlayerName(this.thisPlayer.getName());
        let partnerHasRound = !world.round.isEmpty() && partnerName && world.round.getPlayerNameAtPosition(roundAnalyzer.getHighestCardPosition()) === partnerName;

        if (!playableCards.length) {
            throw Error(`no playable card found! ${cardSet}`);
        }

        let reasons: string[] = [];

        if (playableCards.length == 1) {
            reasons.push('blank card');
            let conclusion = 'playCard';
            let card = playableCards[0];
            report(reasons, conclusion, card);
            return playableCards[0];
        }

        if (world.round.isEmpty()) {
            reasons.push('start player');
            let isInPlayingTeam = world.history.isPlayerPlaying(this.thisPlayer.getName(), this.thisPlayer.getStartCardSet());
            if (isInPlayingTeam) {
                reasons.push('in playing team');
                let trumps = getTrumps(playableCards, world.gameMode);

                if (trumps.length) {
                    reasons.push('has trumps');

                    trumps = sortByNaturalOrdering(trumps);

                    let highTrumpsArray = highTrumps(trumps, world.gameMode);

                    if (highTrumpsArray.length * 2 > trumps.length) {
                        reasons.push('has a lot of high trumps');

                        let card = trumps[0];
                        report(reasons, 'playHighestTrump', card);
                        return card;
                    } else {
                        let card = trumps[trumps.length - 1];
                        report(reasons, 'playLowestTrump', card);
                        return card;
                    }
                } else {
                    return this.playAceOrColorOrTrump(playableCards, world, reasons);
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
                        report(reasons, 'playCallColor', card);
                        return card;
                    }
                }

                return this.playAceOrColorOrTrump(playableCards, world, reasons);
            }
        } else {
            let playableCardsByPointsAscending = sortByPointsAscending(playableCards);
            reasons.push('not at start position');
            // TODO: abspatzen??
            let winningCards = sortByNaturalOrdering(getWinningCards(playableCards, world.round, world.gameMode));

            if (winningCards.length && !partnerHasRound) {
                reasons.push('has winning cards');
                reasons.push('partner does not have round');

                let winningCardsWithoutPoints = winningCards.filter(card => card[1] != "A" && card[1] != "X");
                let winningCardsWithPoints = winningCards.filter(card => card[1] == "A" || card[1] == "X" || card[1] == "K");

                let color = world.gameMode.getOrdering().getColor(winningCards[0]);

                if (color == ColorWithTrump.TRUMP
                    && roundAnalyzer.getRoundColor() != ColorWithTrump.TRUMP) {

                    if (winningCardsWithPoints.length && !world.history.hasColorBeenAngespielt(roundAnalyzer.getRoundColor())) {
                        reasons.push('color round but can trump round');
                        reasons.push('i have trump ace/10/king');
                        reasons.push('color has not been played yet');

                        let card = sortByPointsDescending(winningCardsWithPoints)[0];

                        report(reasons, 'play highest valued trump card', card);
                        return card;
                    } else if (world.history.hasColorBeenAngespielt(roundAnalyzer.getRoundColor())) {
                        if (winningCardsWithoutPoints.length) {
                            let withoutOber = winningCardsWithoutPoints.filter(card => card[1] != "O");

                            if (withoutOber.length) {
                                reasons.push('color round but can trump round');
                                reasons.push('color has been played');
                                reasons.push('has low value trump');
                                reasons.push('has low value trump without ober');

                                let card = withoutOber[0];
                                // TODO consider playing unter instead of low trumps..
                                // todo abspatzen (?)
                                // todo maybe not play ober...
                                report(reasons, 'play low points trump card', card);

                                return card;
                            }
                        }
                    }
                }

                if (color == ColorWithTrump.TRUMP && roundAnalyzer.getRoundColor() == ColorWithTrump.TRUMP) {
                    reasons.push('trump round');

                    if (weAreHinterhand(world, partnerName)) {
                        reasons.push('we are hinterhand');
                        let lowWinningTrumps = winningCards.filter(card => card[1] != "O" && card[1] != "U");
                        if (lowWinningTrumps.length) {
                            reasons.push('we have low winning trumps');
                            let card = sortByPointsAscending(lowWinningTrumps)[0];
                            report(reasons, 'play lowest winning trump card with highest points', card);
                            return card;
                        } else {
                            reasons.push('no low winning trumps');
                            // todo: gute pos zum freimachen...
                            let card = sortByNaturalOrdering(winningCards)[winningCards.length - 1];
                            report(reasons, 'play lowest winning trump card with highest points', card);
                            return card;
                        }
                    } else if (!winningCardsWithoutPoints.length) {
                        reasons.push('no cheap trump cards');

                        let card = sortByPointsAscending(winningCards)[0];
                        report(reasons, 'play trump card with lowest points', card);
                        return card;
                    } else {
                        reasons.push('we are not hinterhand');
                        let card = winningCards[0];
                        report(reasons, 'play highest trump card', card);
                        return card;
                    }
                } else {
                    reasons.push('color round');

                    let cardRanks = world.history.getCurrentRankWithEqualRanksOfCardInColor(cardSet, color, world.round.getPlayedCards());
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
                                report(reasons, 'play card with most points', card);
                                return card;
                            } else {
                                reasons.push('have no trump points');

                                let card = sortByNaturalOrdering(winningCards)[winningCards.length - 1];
                                report(reasons, 'play lowest winning card', card);
                                return card;
                            }
                        } else {
                            reasons.push('color may not run');
                            // TODO abspatzen / schmieren?
                            let card = sortByNaturalOrdering(winningCards)[winningCards.length - 1];

                            report(reasons, 'play lowest winning card', card);

                            return card;
                        }

                    } else if (weAreHinterhand(world, partnerName)) {
                        reasons.push('we are hinterhand');
                        let card = sortByPointsAscending(winningCards)[winningCards.length - 1];
                        report(reasons, 'play lowest winning trump with highest points', card);
                        return card;
                    } else if (cardRanks[winningCards[0]]! == 0 && color != ColorWithTrump.TRUMP) {
                        reasons.push('winning card is highest in color');

                        let card = winningCards[0];
                        report(reasons, 'play winning card', card);
                        return card;
                    } else {
                        let card = winningCards[winningCards.length - 1];
                        report(reasons, 'play lowest winning trump', card);
                        return card;
                    }
                }
            } else if (partnerHasRound) {
                reasons.push('partner has round');
                let color = world.gameMode.getOrdering().getColor(roundAnalyzer.getHighestCard());
                let cardRanksWithRoundCards = world.history.getCurrentRankWithEqualRanksOfCardInColor([...cardSet, ...world.round.getPlayedCards()], color, world.round.getPlayedCards());
                //let cardRanksWithoutRoundCards = world.history.getCurrentRankWithEqualRanksOfCardInColor(cardSet, color);

                if (cardRanksWithRoundCards[roundAnalyzer.getHighestCard()] === 0 || world.round.isHinterHand()) {
                    reasons.push('we will win this round');
                    // todo: ober/punkte dilemma
                    let roundColor = roundAnalyzer.getRoundColor();
                    if (roundColor != world.gameMode.getOrdering().getColor(playableCardsByPointsAscending[0])) {
                        // schmieren !
                        reasons.push('i dont have round color');

                        let playableCardsByPointsAscendingNoTrumps = playableCardsByPointsAscending.filter(card => !world.gameMode.getOrdering().isTrump(card));

                        if (playableCardsByPointsAscendingNoTrumps.length) {
                            reasons.push('i have non trump cards');
                            return this.schmierOrFreimachen(playableCardsByPointsAscending, world, reasons);
                        } else {
                            reasons.push('i only have trump cards');
                            let playableCardsByPointsAscendingNoHighTrumps = playableCardsByPointsAscending.filter(card => card[1] != "O" && card[1] != "U");
                            if (playableCardsByPointsAscendingNoHighTrumps.length) {
                                reasons.push('i have low value trumps');
                                let card = playableCardsByPointsAscending[playableCardsByPointsAscending.length - 1];
                                report(reasons, 'play high value trump', card);
                                return card;
                            } else {
                                let playableCardsByPointsAscendingNoOber = playableCardsByPointsAscending.filter(card => card[1] != "O");
                                if (playableCardsByPointsAscendingNoOber.length) {
                                    let card = playableCardsByPointsAscendingNoOber[playableCardsByPointsAscendingNoOber.length - 1];
                                    report(reasons, 'play high value trump including unter', card);
                                    return card;
                                } else {
                                    let playableCardsByNatSort = sortByNaturalOrdering(playableCards);
                                    let card = playableCardsByNatSort[playableCardsByNatSort.length - 1];
                                    report(reasons, 'play lowest trump', card);
                                    return card;
                                }
                            }
                        }
                    } else {
                        reasons.push('i have the same color');

                        if (roundColor == ColorWithTrump.TRUMP) {
                            reasons.push('trump round');

                            let playableCardsNoOber = playableCardsByPointsAscending.filter(card => card[1] != "O");
                            let playableCardsNoHighTrumps = playableCardsByPointsAscending.filter(card => card[1] != "O" && card[1] != "U");

                            if (playableCardsNoHighTrumps.length) {
                                reasons.push('have low trumps');
                                let card = playableCardsNoHighTrumps[playableCardsNoHighTrumps.length - 1];
                                report(reasons, 'play maximum points but no hightrump', card);
                                return card;
                            } else if (playableCardsNoOber.length) {
                                let card = playableCardsNoOber[playableCardsNoOber.length - 1];
                                report(reasons, 'play maximum points but no ober', card);
                                return card;
                            } else {
                                let card = playableCardsByPointsAscending[playableCardsByPointsAscending.length - 1];
                                report(reasons, 'play maximum points but no ober', card);
                                return card;
                            }
                        } else {
                            reasons.push('color round');

                            let card = playableCardsByPointsAscending[playableCardsByPointsAscending.length - 1];
                            report(reasons, 'play maximum points', card);
                            return card;
                        }
                    }
                } else {
                    reasons.push('round may be lost anyways...');
                    let roundColor = roundAnalyzer.getRoundColor();
                    if (roundColor != world.gameMode.getOrdering().getColor(playableCardsByPointsAscending[0])) {
                        // throw new Error('todo');
                    }

                    let card = playableCardsByPointsAscending[0];
                    report(reasons, 'play lowest valued card', card);

                    return card;
                }
            } else {
                reasons.push('partner does no have round, round is lost');
                let blankCard = this.getLowValueBlackCard(world, playableCards);

                if (blankCard) {
                    return this.freimachen(reasons, blankCard);
                } else {
                    let cardsFilteredByBadPairs = filterBadPairs(world, playableCards);

                    if (cardsFilteredByBadPairs.length) {
                        reasons.push('i have good nixer...');
                        let cardsByPoints = sortByPointsAscending(cardsFilteredByBadPairs);

                        let card = cardsByPoints[0];
                        report(reasons, 'play lowest value but no 10/x pair', card);
                        return card;
                    } else {
                        reasons.push('i have only 10-x pairs, playing low value card.. :(...');

                        let card = playableCardsByPointsAscending[0];

                        let cardsNoOber = playableCardsByPointsAscending.filter(card => card[1] == "O");
                        if (cardsNoOber.length) {

                        }

                        report(reasons, 'play lowest valued card', card);

                        return card;
                    }
                }
            }
        }
        throw Error('return path missed?');
    }

    private playAceOrColorOrTrump(playableCards: Card[], world: GameWorld, reasons: string[]) {
        let aces = getAces(playableCards);

        remove(aces, ace => ace == world.gameMode.getCalledAce());

        if (aces.length) {
            reasons.push('has aces of color');
            let card = shuffle(aces)[0];
            report(reasons, 'play ace', card);
            return card;
        }

        let colorCards = getNonTrumps(playableCards, world.gameMode);
        if (colorCards.length) {
            reasons.push('i have color cards');
            let card = shuffle(colorCards)[0];

            report(reasons, 'play random color card', card);

            return card;
        } else {
            reasons.push('i have only trump cards');
            let card = shuffle(playableCards)[0];

            report(reasons, 'play random card', card);

            return card;
        }
    }

    private schmierOrFreimachen(playableCardsByPointsAscending: Card[], world: GameWorld, reasons: string[]) {
        let blankCard = this.getHighValueBlackCard(world, playableCardsByPointsAscending);

        if (blankCard) {
            return this.freimachen(reasons, blankCard);
        } else {
            reasons.push('can schmier');

            let playableCardsByPointsAscendingNoAces = playableCardsByPointsAscending.filter(card => card[1] != "A");
            if (playableCardsByPointsAscendingNoAces.length) {
                let card = playableCardsByPointsAscendingNoAces[playableCardsByPointsAscendingNoAces.length - 1];
                report(reasons, 'play maximum points but no aces', card);

                return card;
            } else {
                let card = playableCardsByPointsAscending[playableCardsByPointsAscending.length - 1];
                report(reasons, 'play maximum points', card);

                return card;
            }
        }
    }

    private getHighValueBlackCard(world: GameWorld, playableCardsByPointsAscending: Card[]) {
        let shortestColors = getShortestColors(playableCardsByPointsAscending, world.gameMode);
        let cardLengthsByColor = getCardLengthsByColor(playableCardsByPointsAscending, world.gameMode);
        let cardsByColor = getCardsByColor(playableCardsByPointsAscending, world.gameMode);

        let blankCard = null;
        if (cardLengthsByColor[shortestColors[0]] == 1) {
            let card = cardsByColor[shortestColors[0]][0]!;
            if (!blankCard && card[1] != "A" || card[1] != "A" && blankCard && cardToValue(card) > cardToValue(blankCard)) {
                blankCard = card;
            }
        }
        return blankCard;
    }

    private getLowValueBlackCard(world: GameWorld, playableCards: Card[]) {
        let cardLengths = getCardLengthsByColor(playableCards, world.gameMode);
        let shortestColors = getShortestColors(playableCards, world.gameMode);
        let cardsByColor = getCardsByColor(playableCards, world.gameMode);

        let blankCard = null;
        if (cardLengths[shortestColors[0]] == 1) {
            let card = cardsByColor[shortestColors[0]][0]!;
            if (!blankCard && card[1] != "A" || card[1] != "A" && blankCard && cardToValue(card) < cardToValue(blankCard)) {
                blankCard = card;
            }
        }
        return blankCard;
    }

    private freimachen(reasons: string[], bestCard: any) {
        reasons.push('can freimachen');
        let card = bestCard;
        report(reasons, 'play freimachen', card);

        return card;
    }

    chooseGameToCall(cardSet: Card[], previousGameMode: GameMode, playerIndex: number, allowedGameModes: GameModeEnum[]): [GameModeEnum?, PlainColor?] {
        return determineGameMode(previousGameMode, cardSet, allowedGameModes);
    }

    chooseToRaise(cardSet: readonly Card[]): boolean {
        return false;
    }
}