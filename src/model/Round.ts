import {Card} from "./cards/Card";
import {includes} from "lodash";
import {GameMode} from "./GameMode";
import {RoundAnalyzer} from "./knowledge/RoundAnalyzer";

class Round implements FinishedRound {
    private readonly playedCards: Card[];
    private readonly startPlayerName: string;
    private readonly playerNames: readonly string[];

    constructor(startPlayerName: string, playerNames: readonly string[], playedCards: Card[] = []) {
        if (!startPlayerName || playerNames.indexOf(startPlayerName) == -1) {
            throw Error('player not found');
        }
        this.playerNames = playerNames;
        this.playedCards = playedCards;
        this.startPlayerName = startPlayerName;
    }

    nextRound(activePlayerName: string) {
        return new Round(activePlayerName, this.playerNames);
    }

    isEmpty() {
        return this.playedCards.length === 0;
    }

    isFinished() {
        return this.playedCards.length === 4;
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

    getStartPlayerName() {
        return this.startPlayerName;
    }

    getSecondPlayerName() {
        return this.playerNames[(this.playerNames.indexOf(this.startPlayerName) + 1) % 4];
    }

    getThirdPlayerName() {
        return this.playerNames[(this.playerNames.indexOf(this.startPlayerName) + 2) % 4];
    }

    getLastPlayerName() {
        return this.playerNames[(this.playerNames.indexOf(this.startPlayerName) + 3) % 4];
    }

    getPlayerNameForCard(card: Card): string {
        let index = this.playedCards.indexOf(card);

        if (index == -1) {
            throw Error('card no included in round');
        }
        return this.playerNames[(this.playerNames.indexOf(this.getStartPlayerName()) + index) % 4];

    }

    getPlayedCards(): Card[] {
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


    getPositionOfCard(card: Card) {
        return this.playedCards.indexOf(card);
    }

    getCardForPlayerName(playerName: string) {
        let playerIndex = this.playerNames.indexOf(playerName);
        let startPlayerIndex = this.playerNames.indexOf(this.startPlayerName);
        let playedCardsOffset = (playerIndex + 4 - startPlayerIndex) % 4;

        if (playedCardsOffset >= this.playedCards.length) {
            return null;
        } else {
            return this.playedCards[playedCardsOffset];
        }
    }

    playerBefore(lastPlayerName: string) {
        let index = this.playerNames.indexOf(lastPlayerName);

        if (index < 0) {
            throw Error('player not found');
        }

        return this.playerNames[(index - 1 + 4) % 4];
    }

    playerAfter(lastPlayerName: string) {
        let index = this.playerNames.indexOf(lastPlayerName);

        if (index < 0) {
            throw Error('player not found');
        }

        return this.playerNames[(index + 1 + 4) % 4];
    }

    isLeftPlayerBeforeRightPlayer(name1: string, name2: string) {
        let index1 = this.playerNames.indexOf(name1);
        let index2 = this.playerNames.indexOf(name2);
        let startPlayerIndex = this.playerNames.indexOf(this.getStartPlayerName());

        if (index1 < index2) {
            if (startPlayerIndex <= index1 || startPlayerIndex > index2) {
                return true;
            } else {
                // between index 1 and index2
                return false;
            }
        } else if (index1 == index2) {
            // hmm...
            return false;
        } else {
            if (startPlayerIndex <= index1 && startPlayerIndex > index2) {
                return true;
            } else {
                return false;
            }
        }
    }

    getNextPlayerName() {
        return this.playerAfter(this.getCurrentPlayerName());
    }

    getCurrentPlayerName() {
        return this.getPlayerNameAtPosition(this.getPosition());
    }

    getPlayerPositionByName(name: string) {
        let index = this.playerNames.indexOf(name);
        if (index < 0) {
            throw Error('player not found');
        }

        return (index - this.getStartPlayerIndex() + 4) % 4;
    }

    getPlayerNameAtPosition(position: number) {
        if (position < 0) {
            throw Error('no negative indices allowed');
        }
        return this.playerNames[(this.getStartPlayerIndex() + position + 4) % 4];
    }

    getStartPlayerIndex() {
        let index = this.playerNames.indexOf(this.getStartPlayerName());

        if (index < 0) {
            throw Error('player not found');
        }

        return index;
    }

    getRoundAnalyzer(gameMode: GameMode) {
        return new RoundAnalyzer(this, gameMode);
    }

    getLastPlayedCard() {
        if (!this.getPlayedCards().length) {
            throw Error('no last played card!');
        }
        return this.getPlayedCards()[this.getPlayedCards().length - 1];
    }

    getLastPlayedPlayerName() {
        if (this.getPosition() == 0) {
            throw Error('at beginning, no player played');
        }
        return this.getPlayerNameAtPosition(this.getPosition() - 1);
    }

    isMittelHand() {
        return this.getPosition() == 1 || this.getPosition() == 2;
    }

    isHinterHand() {
        return this.getPosition() == 3;
    }

    getFirstPlayedCard() {
        if (this.getPlayedCards().length == 0) {
            throw Error('no first played card');
        } else {
            return this.getPlayedCards()[0];
        }
    }
}

export {Round, FinishedRound};

interface FinishedRound {
    getPlayedCards(): readonly Card[];

    getStartPlayerName(): string;

    getPlayerNameForCard(card: Card): string;

    getRoundAnalyzer(gameMode: GameMode): RoundAnalyzer;
}