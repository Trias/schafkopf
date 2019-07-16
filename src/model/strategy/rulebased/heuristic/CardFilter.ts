import {Card, cardToValue} from "../../../cards/Card";
import {
    allOfColor,
    getCardsByColor,
    getHighTrumps,
    getShortestColors,
    getTrumps,
    sortByNaturalOrdering,
} from "../../../cards/CardSet";
import {GameWorld} from "../../../GameWorld";
import {getPlayableCards} from "../../../PlayableMoves";
import {RoundAnalyzer} from "../../../knowledge/RoundAnalyzer";

// todo: more lazyness?
export class CardFilter {
    private world: GameWorld;
    private readonly cardSet: Card[];
    private roundAnalyzer: RoundAnalyzer;

    constructor(world: GameWorld, cardSet: Card[]) {
        this.world = world;
        this.cardSet = cardSet;
        this.roundAnalyzer = world.round.getRoundAnalyzer(this.world.gameMode);
    }

    get playableCards() {
        return sortByNaturalOrdering(getPlayableCards(this.cardSet, this.world.gameMode, this.world.round));
    }

    get highValueBlankCard() {
        return this.getBlankCardWithComparison(this.playableCards, (a, b) => cardToValue(a) > cardToValue(b));
    }

    get lowValueBlankCard() {
        return this.getBlankCardWithComparison(this.playableCards, (a, b) => cardToValue(a) < cardToValue(b));
    }

    get winningCards() {
        let winningCards = [];
        let roundAnalyzer = this.world.round.getRoundAnalyzer(this.world.gameMode);

        for (let card of this.playableCards) {
            if (this.world.gameMode.getOrdering().rightBeatsLeftCard(roundAnalyzer.getHighestCard(), card)) {
                winningCards.push(card);
            }
        }

        return winningCards;
    }

    get callColorCards() {
        return allOfColor(this.playableCards, this.world.gameMode.getCalledColor(), this.world.gameMode);
    }

    get lowWinningTrumps() {
        return this.winningCards.filter(card => card[1] != "O" && card[1] != "U");
    }

    get winningCardsWithoutVolle() {
        return this.winningCards.filter(card => card[1] != "A" && card[1] != "X");
    }

    get winningCardsNoOberNoPoints() {
        return this.winningCards
            .filter(card => card[1] != "O" && card[1] != "A" && card[1] != "X");
    }

    get unter() {
        return this.playableCards.filter(card => card[1] == "U");
    }

    get playableCardsNoTrumps() {
        return this.playableCards.filter(card => !this.world.gameMode.getOrdering().isTrump(card));
    }

    get playableTrumpCards() {
        return this.playableCards.filter(card => this.world.gameMode.getOrdering().isTrump(card));
    }

    get goodWinningCardsNoOberNoPoints() {
        let highestCardColor = this.world.gameMode.getOrdering().getColor(this.roundAnalyzer.getHighestCard());
        let cardRanksWithRoundCards = this.world.history.getCurrentRankWithEqualRanksOfCardInColor([...this.cardSet, ...this.world.round.getPlayedCards()], highestCardColor, this.world.round.getPlayedCards());

        return this.winningCards
            .filter(card => card[1] != "O" && card[1] != "A" && card[1] != "X")
            .filter(card => cardRanksWithRoundCards[card]! + 2 < cardRanksWithRoundCards[this.roundAnalyzer.getHighestCard()]!);
    }

    get trumps() {
        return sortByNaturalOrdering(getTrumps(this.playableCards, this.world.gameMode));
    }

    get highTrumps() {
        return getHighTrumps(this.trumps, this.world.gameMode);
    }

    get playableCardsNoOber() {
        return this.playableCards.filter(card => card[1] != "O");
    }

    get lowTrumps() {
        return this.playableCards.filter(card => card[1] != "O" && card[1] != "U");
    }

    get playableCardsByPointsNoTrumps() {
        return this.playableCards.filter(card => !this.world.gameMode.getOrdering().isTrump(card));
    }

    private getBlankCardWithComparison(playableCards: Card[], compare: (a: Card, b: Card) => boolean) {
        let shortestColors = getShortestColors(playableCards, this.world.gameMode);
        let cardsByColor = getCardsByColor(playableCards, this.world.gameMode);

        let blankCard = null;
        if (cardsByColor[shortestColors[0]].length == 1) {
            let card = cardsByColor[shortestColors[0]][0];
            if (!blankCard && card[1] != "A" || card[1] != "A" && blankCard && compare(card, blankCard)) {
                blankCard = card;
            }
        }
        return blankCard;
    }
}