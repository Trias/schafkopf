import {Card} from "./cards/Card";
import {GameMode} from "./GameMode";
import {Player, PlayerWithNameOnly} from "./Player";
import cardRankToValue from "./cards/CardRankToValue";
import CardRankToValue from "./cards/CardRankToValue";
import {ColorWithTrump} from "./cards/Color";
import CardRank from "./cards/CardRank";
import {getRank} from "./cards/CardSet";
import {clone, findIndex, includes} from "lodash";

class Round implements FinishedRound {
    private playedCards: Card[];
    private startPlayer: PlayerWithNameOnly;
    private players: readonly PlayerWithNameOnly[];
    private readonly gameMode: GameMode;

    // TODO use player names, not objects.
    constructor(startPlayer: PlayerWithNameOnly, players: readonly PlayerWithNameOnly[], gameMode: GameMode) {
        this.players = players;
        this.gameMode = gameMode;
        this.playedCards = [];
        this.startPlayer = startPlayer;
    }

    nextRound(activePlayer: Player) {
        return new Round(activePlayer, this.players, this.gameMode);
    }

    clone() {
        let r = new Round(this.startPlayer, this.players, this.gameMode);
        r.playedCards = clone(this.playedCards);

        return r;
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
        if (this.playedCards.length >= 4) {
            throw Error('round is finished');
        }

        if (includes(this.playedCards, card)) {
            throw Error('invariant violated');
        }

        this.playedCards.push(card);
    }

    getStartPlayer() {
        return this.startPlayer;
    }

    getLastPlayer() {
        return this.players[(this.players.indexOf(this.startPlayer) + 3) % 4];
    }

    getSecondPlayer() {
        return this.players[(this.players.indexOf(this.startPlayer) + 1) % 4];
    }

    getThirdPlayer() {
        return this.players[(this.players.indexOf(this.startPlayer) + 2) % 4];
    }

    getWinningCardIndex() {
        if (!this.isFinished()) {
            throw Error('round not finished');
        } else {
            return this.playedCards.indexOf(this.getHighestCard());
        }
    }

    getWinningPlayer() {
        return this.players[(this.getWinningCardIndex() + this.players.indexOf(this.getStartPlayer())) % 4];
    }

    getPlayerForCard(card: Card): PlayerWithNameOnly {
        let index = this.playedCards.indexOf(card);

        if (index == -1) {
            throw Error('card no included in round');
        }
        return this.players[(this.players.indexOf(this.getStartPlayer()) + index) % 4];

    }

    getPoints(): number {
        let points = 0;
        for (let playedCard of this.playedCards) {
            let cardRank = getRank(playedCard);
            let addedPoints = cardRankToValue[cardRank];
            points = points + addedPoints;
        }

        return points;
    }

    getCards(): readonly Card[] {
        return this.playedCards;
    }

    getPosition(): number {
        return this.playedCards.length;
    }

    finish() {
        if (!this.isFinished()) {
            throw Error('game not yet finished');
        }

        return this as FinishedRound;
    }

    hasOffColorSchmier() {
        for (let card of this.playedCards) {
            if (this.gameMode.getOrdering().getColor(card) !== this.getRoundColor()
                && CardRankToValue[card[1] as CardRank] >= 10
                && card != this.getWinningCard()
            ) {
                return true;
            }
        }

        return false;
    }

    hasSchmier() {
        for (let card of this.playedCards) {
            if (CardRankToValue[card[1] as CardRank] >= 10 && card != this.getWinningCard()) {
                return true;
            }
        }

        return false;
    }

    getSchmierPlayer() {
        let schmierPlayer = [];
        for (let card of this.playedCards) {
            if (CardRankToValue[card[1] as CardRank] >= 10 && card != this.getWinningCard()) {
                schmierPlayer.push(this.getPlayerForCard(card));
            }
        }

        return schmierPlayer as readonly PlayerWithNameOnly[];
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

    getHighestCard() {
        let highestCard = this.playedCards[0];
        for (let i = 1; i < this.playedCards.length; i++) {
            let newHighestCardCandidate = this.gameMode.getOrdering().highestCard(highestCard, this.playedCards[i]);
            if (highestCard !== newHighestCardCandidate) {
                highestCard = newHighestCardCandidate;
            }
        }
        return highestCard;
    }

    getHighestCardIndex() {
        let highestCard = this.getHighestCard();

        return this.getIndexOfCard(highestCard);
    }

    getIndexOfCard(card: Card) {
        return this.playedCards.indexOf(card);
    }

    setPlayers(players: PlayerWithNameOnly[]) {
        // todo restrict with types
        this.players = players;
        this.startPlayer = players[0];
    }

    getCardForPlayer(playerName: string) {
        let playerIndex = findIndex(this.players, (p => p.getName() == playerName));
        let startPlayerIndex = findIndex(this.players, (p => p.getName() == this.startPlayer.getName()));
        let playedCardsOffset = (playerIndex + 4 - startPlayerIndex) % 4;

        if (playedCardsOffset >= this.playedCards.length) {
            return null;
        } else {
            return this.playedCards[playedCardsOffset];
        }
    }

    playerBefore(lastPlayerName: string) {
        let index = findIndex(this.players, p => p.getName() == lastPlayerName)!;

        if (index < 0) {
            throw Error('player not found');
        }

        return this.players[(index - 1 + 4) % 4];
    }

    playerAfter(lastPlayerName: string) {
        let index = findIndex(this.players, p => p.getName() == lastPlayerName)!;

        if (index < 0) {
            throw Error('player not found');
        }

        return this.players[(index + 1 + 4) % 4];
    }

    isLeftPlayerBeforeRightPlayer(name1: string, name2: string) {
        let index1 = findIndex(this.players, p => p.getName() == name1)!;
        let index2 = findIndex(this.players, p => p.getName() == name2)!;
        let startPlayerIndex = findIndex(this.players, p => p.getName() == this.getStartPlayer().getName())!;

        if (index1 < index2) {
            if (startPlayerIndex <= index1 || startPlayerIndex > index2) {
                return true;
            } else {
                // between index 1 and index2
                return false;
            }
        } else if (index1 == index2) {
            // hmm...
            return true;
        } else {
            if (startPlayerIndex <= index1 && startPlayerIndex > index2) {
                return true;
            } else {
                return false;
            }
        }
    }

    getNextPlayer() {
        let currentPlayer = this.getCurrentPlayer();
        return this.playerAfter(currentPlayer.getName());
    }

    getCurrentPlayer() {
        let position = this.getPosition();
        return this.getPlayerAtPosition(position);
    }

    getPlayerPosition(name: string) {
        let index = findIndex(this.players, p => p.getName() == name);
        if (index < 0) {
            throw Error('player not found');
        }

        return (index - this.getStartPlayerIndex() + 4) % 4;
    }

    setStartPlayer(player: Player) {
        this.startPlayer = player;
    }

    private getPlayerAtPosition(position: number) {
        return this.players[(this.getStartPlayerIndex() + position + 4) % 4];
    }

    private getStartPlayerIndex() {
        let startPlayer = this.getStartPlayer();

        let index = this.players.indexOf(startPlayer);

        if (index < 0) {
            throw Error('player not found');
        }

        return index;
    }
}

export {Round, FinishedRound, MinimalRound};

interface MinimalRound {
    getCards(): readonly Card[];

    getRoundColor(): ColorWithTrump;

    isEmpty(): boolean;
}

interface FinishedRound {
    getCards(): readonly Card[];
    getPoints(): number;
    getWinningPlayer(): PlayerWithNameOnly;
    getStartPlayer(): PlayerWithNameOnly;
    getRoundColor(): ColorWithTrump;
    getPlayerForCard(card: Card): PlayerWithNameOnly;
    hasOffColorSchmier(): boolean;
    getOffColorSchmierPlayer(): PlayerWithNameOnly | null;
    hasSchmier(): boolean;
    getSchmierPlayer(): readonly PlayerWithNameOnly[];
    getSchmierCardIndex(): number | null;
    getWinningCard(): Card;
    getWinningCardIndex(): number;
}