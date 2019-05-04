import {Card} from "./cards/Card";
import {GameMode} from "./GameMode";
import Player from "./Player";
import cardRankToValue from "./cards/CardRankToValue";
import CardRankToValue from "./cards/CardRankToValue";
import CardsOrdering from "./cards/CardsOrdering";
import {ColorWithTrump} from "./cards/Color";
import CardRank from "./cards/CardRank";

class Round implements FinishedRound {
    private readonly playedCards: Card[];
    private readonly startPlayer: Player;
    private readonly players: readonly Player[];
    private readonly gameMode: GameMode;

    constructor(startPlayer: Player, players: readonly Player[], gameMode: GameMode) {
        this.players = players;
        this.gameMode = gameMode;
        this.playedCards = [];
        this.startPlayer = startPlayer;
    }

    isEmpty() {
        return this.playedCards.length === 0;
    }

    isFinished() {
        return this.playedCards.length === 4;
    }

    getRoundColor() {
        if (this.isEmpty()) {
            throw Error('no card played');
        } else {
            return this.gameMode.getOrdering().getColor(this.playedCards[0]);
        }
    }

    addCard(card: Card) {
        this.playedCards.push(card);
    }

    getStartPlayer() {
        return this.startPlayer;
    }

    getWinningCardIndex() {
        if (!this.isFinished()) {
            throw Error('round not finished');
        } else {
            let highestCard = this.playedCards[0];
            let highestCardIndex = 0;
            for (let i = 1; i < this.playedCards.length; i++) {
                let newHighestCardCandidate = this.gameMode.getOrdering().highestCard(highestCard, this.playedCards[i]);
                if (highestCard !== newHighestCardCandidate) {
                    // console.log(`new highest card: ${newHighestCardCandidate}`);
                    highestCardIndex = i;
                    highestCard = newHighestCardCandidate;
                }
            }
            return highestCardIndex;
        }
    }

    getWinningPlayer() {
        return this.players[(this.getWinningCardIndex() + this.players.indexOf(this.getStartPlayer())) % 4];
    }

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

    getCards(): readonly Card[] {
        return this.playedCards;
    }

    finish() {
        if (!this.isFinished()) {
            throw Error('game not yet finished');
        }

        return this as FinishedRound;
    }

    hasOffColorSchmier() {
        for (let card of this.playedCards) {
            if (this.gameMode.getOrdering().getColor(card) !== this.getRoundColor() && CardRankToValue[card[1] as CardRank] >= 10) {
                return true;
            }
        }

        return false;
    }

    hasSchmier() {
        for (let card of this.playedCards) {
            if (CardRankToValue[card[1] as CardRank] >= 10) {
                return true;
            }
        }

        return false;
    }

    getSchmierPlayer() {
        let schmierPlayer = [];
        for (let card of this.playedCards) {
            if (CardRankToValue[card[1] as CardRank] >= 10) {
                schmierPlayer.push(this.getPlayerForCard(card));
            }
        }

        return schmierPlayer as readonly Player[];
    }

    getSchmierCardIndex() {
        for (let i = 0; i < this.playedCards.length; i++) {
            let card = this.playedCards[i];
            if (CardRankToValue[card[1] as CardRank] >= 10) {
                if (i != this.getWinningCardIndex()) {
                    return i;
                }
            }
        }
        return null;
    }

    getOffColorSchmierPlayer() {
        for (let card of this.playedCards) {
            if (this.gameMode.getOrdering().getColor(card) !== this.getRoundColor() && CardRankToValue[card[1] as CardRank] >= 10) {
                return this.getPlayerForCard(card);
            }
        }

        return null;
    }

    getWinningCard() {
        return this.playedCards[this.getWinningCardIndex()];
    }

    getPlayerIndex(player: Player) {
        return this.players.indexOf(player);
    }
}

export {Round, FinishedRound};

type FinishedRound = {
    getCards(): readonly Card[];
    getPoints(): number;
    getWinningPlayer(): Player;
    getStartPlayer(): Player;
    getRoundColor(): ColorWithTrump;
    getPlayerForCard(card: Card): Player;
    hasOffColorSchmier(): boolean;
    getOffColorSchmierPlayer(): Player | null;
    hasSchmier(): boolean;
    getSchmierPlayer(): readonly Player[];
    getSchmierCardIndex(): number | null;
    getPlayerIndex(player: Player): number;
    getWinningCard(): Card;
    getWinningCardIndex(): number;
}