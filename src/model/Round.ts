import {Card} from "./cards/Card";
import {GameMode} from "./GameMode";
import Player from "./Player";
import cardRankToValue from "./cards/CardRankToValue";
import CardsOrdering from "./cards/CardsOrdering";
import {ColorWithTrump} from "./cards/Color";

class Round {
    private playedCards: Card[];
    private readonly startPlayer: Player;
    private readonly players: Player[];

    constructor(startPlayer: Player, players: Player[]) {
        this.players = players;
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

    getWinningCardIndex(gameMode: GameMode) {
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

    getWinningPlayer(gameMode: GameMode) {
        return this.players[(this.getWinningCardIndex(gameMode) + this.players.indexOf(this.getStartPlayer())) % 4];
    }

    // noinspection JSUnusedGlobalSymbols
    getPlayerForCard(card: Card): Player {
        let index = this.playedCards.indexOf(card);

        if (index == -1) {
            throw Error('card no included in round');
        }
        return this.players[(this.players.indexOf(this.getStartPlayer()) + index) % 4];

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

    finish() {
        if (!this.isFinished()) {
            throw Error('game not yet finished');
        }

        return this as FinishedRound;
    }
}

export {Round, FinishedRound};

type FinishedRound = {
    getCards(): Card[];
    getPoints(): number;
    getWinningPlayer(gameMode: GameMode): Player;
    getStartPlayer(): Player;
    getRoundColor(gameMode: GameMode): ColorWithTrump;
    getPlayerForCard(card: Card): Player;
}