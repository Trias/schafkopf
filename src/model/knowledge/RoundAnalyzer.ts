import {Round} from "../Round";
import CardRankToValue from "../cards/CardRankToValue";
import CardRank from "../cards/CardRank";
import {getRank} from "../cards/CardSet";
import {GameMode} from "../GameMode";

export class RoundAnalyzer {
    private round: Round;
    private gameMode: GameMode;

    constructor(round: Round, gameMode: GameMode) {
        this.round = round;
        this.gameMode = gameMode;
    }

    hasOffColorSchmier() {
        for (let card of this.round.getPlayedCards()) {
            if (this.gameMode.getOrdering().getColor(card) !== this.getRoundColor()
                && CardRankToValue[card[1] as CardRank] >= 10
                && card != this.getHighestCard()
            ) {
                return true;
            }
        }

        return false;
    }

    hasSchmier() {
        for (let card of this.round.getPlayedCards()) {
            if (CardRankToValue[card[1] as CardRank] >= 10 && card != this.getHighestCard()) {
                return true;
            }
        }

        return false;
    }

    getSchmierPlayerNames() {
        let schmierPlayerName = [];
        for (let card of this.round.getPlayedCards()) {
            if (CardRankToValue[card[1] as CardRank] >= 10 && card != this.getHighestCard()) {
                schmierPlayerName.push(this.round.getPlayerNameForCard(card));
            }
        }

        return schmierPlayerName as string[];
    }

    getSchmierCardIndex() {
        let cards = this.round.getPlayedCards();
        for (let i = 0; i < cards.length; i++) {
            let card = cards[i];
            if (CardRankToValue[card[1] as CardRank] >= 10) {
                if (i != this.getHighestCardPosition()) {
                    return i;
                }
            }
        }
        return null;
    }

    getOffColorSchmierPlayerName() {
        let cards = this.round.getPlayedCards();

        for (let card of cards) {
            if (this.gameMode.getOrdering().getColor(card) !== this.getRoundColor() && CardRankToValue[card[1] as CardRank] >= 10) {
                return this.round.getPlayerNameForCard(card);
            }
        }

        return null;
    }

    getWinningCard() {
        return this.round.getPlayedCards()[this.getWinningCardPosition()];
    }

    getHighestCard() {
        let cards = this.round.getPlayedCards();
        let highestCard = cards[0];
        for (let i = 1; i < cards.length; i++) {
            let newHighestCardCandidate = this.gameMode.getOrdering().highestCard(highestCard, this.round.getPlayedCards()[i]);
            if (highestCard !== newHighestCardCandidate) {
                highestCard = newHighestCardCandidate;
            }
        }
        return highestCard;
    }

    getHighestCardPlayerName() {
        let position = this.getHighestCardPosition();

        return this.round.getPlayerNameAtPosition(position);
    }

    getHighestCardPosition(): number {
        let highestCard = this.getHighestCard();

        return this.round.getPositionOfCard(highestCard);
    }

    getPoints(): number {
        let points = 0;
        for (let playedCard of this.round.getPlayedCards()) {
            let cardRank = getRank(playedCard);
            let addedPoints = CardRankToValue[cardRank];
            points = points + addedPoints;
        }

        return points;
    }

    getWinningCardPosition() {
        if (!this.round.isFinished()) {
            throw Error('round not finished');
        } else {
            return this.round.getPlayedCards().indexOf(this.getHighestCard());
        }
    }

    getWinningPlayerName() {
        return this.round.getPlayerNameAtPosition(this.getWinningCardPosition() % 4);
    }

    getRoundColor() {
        if (this.round.isEmpty()) {
            throw Error('no card played');
        } else {
            return this.gameMode.getOrdering().getColor(this.round.getPlayedCards()[0]);
        }
    }
}