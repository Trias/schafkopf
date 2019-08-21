import {Card} from "../../../cards/Card";
import {getAces, getNonTrumps, sortByNaturalOrdering, sortByPointsAscending} from "../../../cards/CardSet";
import {find, remove} from "lodash";
import {GameWorld} from "../../../GameWorld";
import {CardFilter} from "./CardFilter";

export class Actions {
    private readonly report: (conclusion: string, card: Card, cardSet: Card[]) => void;
    private readonly world: GameWorld;

    constructor(world: GameWorld, report: (conclusion: string, card: Card, cardSet: Card[]) => void) {
        this.world = world;
        this.report = report;
    }

    playLowestCardByPoints(playableCards: Card[]) {
        if (playableCards.length == 0) {
            throw Error('no cardset provided');
        }
        let card = sortByPointsAscending(playableCards)[0];
        this.report('playLowestCardByPoints', card, playableCards);
        return card;
    }

    playLowestCardByRank(playableCards: Card[]) {
        if (playableCards.length == 0) {
            throw Error('no cardset provided');
        }
        let card = sortByNaturalOrdering(playableCards)[playableCards.length - 1];
        this.report('playLowestCardByRank', card, playableCards);
        return card;
    }

    playBlankCardOrLowestCardByPoints(playableCards: Card[]) {
        if (playableCards.length == 0) {
            throw Error('no cardset provided');
        }
        let blankCard = (new CardFilter(this.world, playableCards)).lowValueBlankCard;

        if (blankCard) {
            let card = blankCard;
            this.report('playBlankCardOrLowestCardByPoints->playBlankCard', card, playableCards);
            return card;
        } else {
            let card = sortByPointsAscending(playableCards)[0];
            this.report('playBlankCardOrLowestCardByPoints->playLowestCardByPoints', card, playableCards);
            return card;
        }
    }

    playTrumpPreferPoints(playableCards: Card[]) {
        if (playableCards.length == 0) {
            throw Error('no cardset provided');
        }
        let playableCardsByPointsAscending = sortByPointsAscending(playableCards);
        let playableCardsNoOber = playableCardsByPointsAscending.filter(card => card[1] != "O");
        let playableCardsNoHighTrumps = playableCardsByPointsAscending.filter(card => card[1] != "O" && card[1] != "U");

        if (playableCardsNoHighTrumps.length) {
            let card = playableCardsNoHighTrumps[playableCardsNoHighTrumps.length - 1];
            this.report('playTrumpPreferPoints->playHighestLowTrumpByPoints', card, playableCards);
            return card;
        } else if (playableCardsNoOber.length) {
            let card = playableCardsNoOber[playableCardsNoOber.length - 1];
            this.report('playTrumpPreferPoints->playLowestUnter', card, playableCards);
            return card;
        } else {
            let card = playableCardsByPointsAscending[playableCardsByPointsAscending.length - 1];
            this.report('playTrumpPreferPoints->playLowestOber', card, playableCards);
            return card;
        }
    }

    playAceOrColorOrTrump(playableCards: Card[]) {
        if (playableCards.length == 0) {
            throw Error('no cardset provided');
        }
        let aces = getAces(playableCards);

        remove(aces, ace => ace == this.world.gameMode.getCalledAce() || ace == "HA");

        if (aces.length) {
            let card = aces[0]; //sample(aces)!;
            this.report('playAceOrColorOrTrump->playAce', card, playableCards);
            return card;
        }

        let colorCards = getNonTrumps(playableCards, this.world.gameMode);
        if (colorCards.length) {
            let card = sortByPointsAscending(colorCards)[0]; //sample(colorCards)!;

            this.report('playAceOrColorOrTrump->playLowestColorCardByPoints', card, playableCards);

            return card;
        } else {
            let card = playableCards[0]; //sample(playableCards)!;

            // possibly a bad choice in endgame...
            this.report('playAceOrColorOrTrump->playTrump', card, playableCards);

            return card;
        }
    }

    playBlankCardOrSchmier(playableCards: Card[]) {
        if (playableCards.length == 0) {
            throw Error('no cardset provided');
        }
        let blankCard = (new CardFilter(this.world, playableCards)).highValueBlankCard;
        let playableCardsByPointsAscendingNoAcesOrTrump = sortByPointsAscending(playableCards)
            .filter(card => card[1] != "A")
            .filter(card => !this.world.gameMode.getOrdering().isTrump(card));
        if (blankCard) {
            this.report('playBlankCardOrSchmier->playBlankCard', blankCard, playableCards);

            return blankCard;
        } else {
            if (playableCardsByPointsAscendingNoAcesOrTrump.length) {
                let card = playableCardsByPointsAscendingNoAcesOrTrump[playableCardsByPointsAscendingNoAcesOrTrump.length - 1];
                this.report('playBlankCardOrSchmier->playHighestNonTrumpCardByPoints', card, playableCards);

                return card;
            } else {
                let card = sortByPointsAscending(playableCards)[playableCards.length - 1];
                this.report('playBlankCardOrSchmier->playHighestCardByPoints', card, playableCards);

                return card;
            }
        }
    }

    playLowestCardByMixedRanking(playableCards: Card[]) {
        if (playableCards.length == 0) {
            throw Error('no cardset provided');
        }
        let order = ['7', '8', '9', 'K', 'U', 'X', 'A', 'O'];

        let playableCardsSorted = playableCards.sort((a, b) => order.indexOf(a[1]) > order.indexOf(b[1]) ? 1 : -1);

        let card = playableCardsSorted[0];
        this.report('playLowestCardByMixedRanking', card, playableCards);
        return card;
    }

    playHighestCardByRank(playableCards: Card[]) {
        if (playableCards.length == 0) {
            throw Error('no cardset provided');
        }
        let card = sortByNaturalOrdering(playableCards)[0];
        this.report('playHighestCardByRank', card, playableCards);
        return card;
    }

    playHighestCardByPoints(playableCards: Card[]) {
        if (playableCards.length == 0) {
            throw Error('no cardset provided');
        }
        let card = sortByPointsAscending(playableCards)[playableCards.length - 1];
        this.report('playHighestCardByPoints', card, playableCards);
        return card;
    }

    playKingOrLower(callColorCards: Card[]) {
        let king = find(callColorCards, card => card[1] == "K");
        let nine = find(callColorCards, card => card[1] == "9");

        if (king && nine) {
            this.report('playKingOrLower', nine, callColorCards);
            return nine;
        } else if (king) {
            this.report('playKingOrLower', king, callColorCards);
            return king;
        } else {
            throw Error('preconditions not met!');
        }
    }
}