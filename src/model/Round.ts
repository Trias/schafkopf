import {Card} from "./cards/Card";
import {GameMode} from "./GameMode";
import Player from "./Player";
import cardRankToValue from "./cards/CardRankToValue";
import CardsOrdering from "./cards/CardsOrdering";

export default class Round {
    private playedCards: Card[];
    private readonly startPlayer: Player;

    constructor(startPlayer: Player) {
        this.playedCards = [];
        this.startPlayer = startPlayer;
    }

    isEmpty() {
        return this.playedCards.length === 0;
    }

    isFinished() {
        return this.playedCards.length === 4;
    }

    getRoundColor(gameMode: GameMode) {
        if (this.isEmpty()) {
            throw Error('no card played');
        } else {
            return gameMode.getOrdering().getColor(this.playedCards[0]);
        }
    }

    addCard(card: Card) {
        this.playedCards.push(card);
    }

    getStartPlayer() {
        return this.startPlayer;
    }

    getWinnerIndex(gameMode: GameMode) {
        if (!this.isFinished()) {
            throw Error('round not finished');
        } else {
            let highestCard = this.playedCards[0];
            let highestCardIndex = 0;
            for (let i = 1; i < this.playedCards.length; i++) {
                let newHighestCardCandidate = gameMode.getOrdering().highestCard(highestCard, this.playedCards[i]);
                if (highestCard !== newHighestCardCandidate) {
                    // console.log(`new highest card: ${newHighestCardCandidate}`);
                    highestCardIndex = i;
                    highestCard = newHighestCardCandidate;
                }
            }
            return highestCardIndex;
        }
    }

    getWinningPlayer(gameMode: GameMode, players: Player[]) {
        return players[(this.getWinnerIndex(gameMode) + players.indexOf(this.getStartPlayer())) % 4];
    }

    getPoints(): number {
        let points = 0;
        for (let playedCard of this.playedCards) {
            let cardRank = CardsOrdering.getRank(playedCard);
            let addedPoints = cardRankToValue[cardRank];
            points = points + addedPoints;
        }

        return points;
    }

    getCards() {
        return this.playedCards;
    }
}