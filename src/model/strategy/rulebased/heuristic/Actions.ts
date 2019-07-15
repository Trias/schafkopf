import {Card} from "../../../cards/Card";
import {sortByPointsAscending} from "./helper";
import {getAces, getNonTrumps, sortByNaturalOrdering} from "../../../cards/CardSet";
import {remove} from "lodash";
import {GameWorld} from "../../../GameWorld";
import {CardFilter} from "./CardFilter";

export class Actions {
    private readonly report: (conclusion: string, card: Card) => void;
    private readonly world: GameWorld;
    private readonly cardFilter: CardFilter;

    constructor(world: GameWorld, report: (conclusion: string, card: Card) => void) {
        this.world = world;
        this.report = report;
        this.cardFilter = new CardFilter(world);
    }

    playLowestCardByPoints(playableCards: Card[]) {
        let card = sortByPointsAscending(playableCards)[0];
        this.report('play lowest valued card', card);
        return card;
    }

    playLowestCardByRank(playableCards: Card[]) {
        let card = sortByNaturalOrdering(playableCards)[playableCards.length - 1];
        this.report('play lowest valued card', card);
        return card;
    }

    playBlankCardOrLowestCardByPoints(playableCards: Card[]) {
        let blankCard = this.cardFilter.getLowValueBlankCard(playableCards);

        if (blankCard) {
            let card = blankCard;
            this.report('playBlankCardOrLowestCardByPoints: play blank card', card);
            return card;
        } else {
            let card = sortByPointsAscending(playableCards)[0];
            this.report('playBlankCardOrLowestCardByPoints: play lowest valued card', card);
            return card;
        }
    }

    playTrumpPreferPoints(playableCards: Card[]) {
        let playableCardsByPointsAscending = sortByPointsAscending(playableCards);
        let playableCardsNoOber = playableCardsByPointsAscending.filter(card => card[1] != "O");
        let playableCardsNoHighTrumps = playableCardsByPointsAscending.filter(card => card[1] != "O" && card[1] != "U");

        if (playableCardsNoHighTrumps.length) {
            let card = playableCardsNoHighTrumps[playableCardsNoHighTrumps.length - 1];
            this.report('playTrumpPreferPoints: maximum points but no hightrump', card);
            return card;
        } else if (playableCardsNoOber.length) {
            let card = playableCardsNoOber[playableCardsNoOber.length - 1];
            this.report('playTrumpPreferPoints: play lowest unter', card);
            return card;
        } else {
            let card = playableCardsByPointsAscending[playableCardsByPointsAscending.length - 1];
            this.report('playTrumpPreferPoints: play lowest ober', card);
            return card;
        }
    }

    playAceOrColorOrTrump(playableCards: Card[]) {
        let aces = getAces(playableCards);

        remove(aces, ace => ace == this.world.gameMode.getCalledAce() || ace == "HA");

        if (aces.length) {
            let card = aces[0]; //sample(aces)!;
            this.report('playAceOrColorOrTrump: play ace', card);
            return card;
        }

        let colorCards = getNonTrumps(playableCards, this.world.gameMode);
        if (colorCards.length) {
            let card = colorCards[0]; //sample(colorCards)!;

            this.report('playAceOrColorOrTrump: play random color card', card);

            return card;
        } else {
            let card = playableCards[0]; //sample(playableCards)!;

            // possibly a bad choice in endgame...
            this.report('playAceOrColorOrTrump: play random card', card);

            return card;
        }
    }

    playBlankCardOrSchmier(playableCards: Card[]) {
        let blankCard = this.cardFilter.getHighValueBlankCard(playableCards);
        let playableCardsByPointsAscendingNoAcesOrTrump = playableCards
            .filter(card => card[1] != "A")
            .filter(card => !this.world.gameMode.getOrdering().isTrump(card));
        if (blankCard) {
            this.report('playBlankCardOrSchmier: play blank card', blankCard);

            return blankCard;
        } else {
            if (playableCardsByPointsAscendingNoAcesOrTrump.length) {
                let card = playableCardsByPointsAscendingNoAcesOrTrump[playableCardsByPointsAscendingNoAcesOrTrump.length - 1];
                this.report('playBlankCardOrSchmier: play maximum points but no aces', card);

                return card;
            } else {
                let card = sortByPointsAscending(playableCards)[playableCards.length - 1];
                this.report('playBlankCardOrSchmier: play maximum points', card);

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