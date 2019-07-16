import {Card} from "../../../cards/Card";
import {getAces, getNonTrumps, sortByNaturalOrdering, sortByPointsAscending} from "../../../cards/CardSet";
import {remove} from "lodash";
import {GameWorld} from "../../../GameWorld";
import {CardFilter} from "./CardFilter";

export class Actions {
    private readonly report: (conclusion: string, card: Card) => void;
    private readonly world: GameWorld;

    constructor(world: GameWorld, report: (conclusion: string, card: Card) => void) {
        this.world = world;
        this.report = report;
    }

    playLowestCardByPoints(playableCards: Card[]) {
        let card = sortByPointsAscending(playableCards)[0];
        this.report('playLowestCardByPoints', card);
        return card;
    }

    playLowestCardByRank(playableCards: Card[]) {
        let card = sortByNaturalOrdering(playableCards)[playableCards.length - 1];
        this.report('playLowestCardByRank', card);
        return card;
    }

    playBlankCardOrLowestCardByPoints(playableCards: Card[]) {
        let blankCard = (new CardFilter(this.world, playableCards)).lowValueBlankCard;

        if (blankCard) {
            let card = blankCard;
            this.report('playBlankCardOrLowestCardByPoints->playBlankCard', card);
            return card;
        } else {
            let card = sortByPointsAscending(playableCards)[0];
            this.report('playBlankCardOrLowestCardByPoints->playLowestCardByPoints', card);
            return card;
        }
    }

    playTrumpPreferPoints(playableCards: Card[]) {
        let playableCardsByPointsAscending = sortByPointsAscending(playableCards);
        let playableCardsNoOber = playableCardsByPointsAscending.filter(card => card[1] != "O");
        let playableCardsNoHighTrumps = playableCardsByPointsAscending.filter(card => card[1] != "O" && card[1] != "U");

        if (playableCardsNoHighTrumps.length) {
            let card = playableCardsNoHighTrumps[playableCardsNoHighTrumps.length - 1];
            this.report('playTrumpPreferPoints->playHighestLowTrumpByPoints', card);
            return card;
        } else if (playableCardsNoOber.length) {
            let card = playableCardsNoOber[playableCardsNoOber.length - 1];
            this.report('playTrumpPreferPoints->playLowestUnter', card);
            return card;
        } else {
            let card = playableCardsByPointsAscending[playableCardsByPointsAscending.length - 1];
            this.report('playTrumpPreferPoints->playLowestOber', card);
            return card;
        }
    }

    playAceOrColorOrTrump(playableCards: Card[]) {
        let aces = getAces(playableCards);

        remove(aces, ace => ace == this.world.gameMode.getCalledAce() || ace == "HA");

        if (aces.length) {
            let card = aces[0]; //sample(aces)!;
            this.report('playAceOrColorOrTrump->playAce', card);
            return card;
        }

        let colorCards = getNonTrumps(playableCards, this.world.gameMode);
        if (colorCards.length) {
            let card = colorCards[0]; //sample(colorCards)!;

            this.report('playAceOrColorOrTrump->playColorCard', card);

            return card;
        } else {
            let card = playableCards[0]; //sample(playableCards)!;

            // possibly a bad choice in endgame...
            this.report('playAceOrColorOrTrump->playTrump', card);

            return card;
        }
    }

    playBlankCardOrSchmier(playableCards: Card[]) {
        let blankCard = (new CardFilter(this.world, playableCards)).highValueBlankCard;
        let playableCardsByPointsAscendingNoAcesOrTrump = playableCards
            .filter(card => card[1] != "A")
            .filter(card => !this.world.gameMode.getOrdering().isTrump(card));
        if (blankCard) {
            this.report('playBlankCardOrSchmier->playBlankCard', blankCard);

            return blankCard;
        } else {
            if (playableCardsByPointsAscendingNoAcesOrTrump.length) {
                let card = playableCardsByPointsAscendingNoAcesOrTrump[playableCardsByPointsAscendingNoAcesOrTrump.length - 1];
                this.report('playBlankCardOrSchmier->playHighestCardByPoints(noAcesOrTrump)', card);

                return card;
            } else {
                let card = sortByPointsAscending(playableCards)[playableCards.length - 1];
                this.report('playBlankCardOrSchmier->playHighestCardByPoints', card);

                return card;
            }
        }
    }

    playLowestCardByMixedRanking(playableCards: Card[]) {
        let order = ['7', '8', '9', 'K', 'U', 'X', 'A', 'O'];

        let playableCardsSorted = playableCards.sort((a, b) => order.indexOf(a[1]) > order.indexOf(b[1]) ? 1 : -1);

        let card = playableCardsSorted[0];
        this.report('playLowestCardByMixedRanking', card);
        return card;
    }

    playHighestCardByRank(cardSet: Card[]) {
        let card = sortByNaturalOrdering(cardSet)[0];
        this.report('playHighestCardByRank', card);
        return card;
    }

    playHighestCardByPoints(playablePoints: Card[]) {
        let card = sortByPointsAscending(playablePoints)[playablePoints.length - 1];
        this.report('playHighestCardByPoints', card);
        return card;
    }
}