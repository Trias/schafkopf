/**
 * *public* information about won points, team alignment, available cards & trumps....
 *
 */
import {Card} from "../cards/Card";
import {GameMode, GameModeEnum} from "../GameMode";
import {FinishedRound, Round} from "../Round";
import {allOfColor, getCardsByColor, hasCard, removeCard, sortByNaturalOrdering} from "../cards/CardSet";
import {clone, cloneDeep, difference, eq, includes, without} from "lodash";
import {colorsWithTrump, ColorWithTrump, PlainColor} from "../cards/Color";
import CardDeck from "../cards/sets/CardDeck";
import {RoundAnalyzer} from "./RoundAnalyzer";

type ColorInfoType = { [index in string]: boolean };
type CardsInfoType = { [index in string]: Card[] };

export class GameHistory {
    private readonly playedCards: Card[];
    private readonly gameMode: GameMode;
    private readonly allPlayersNames: readonly string[];
    private readonly pointsForPlayerName: { [index in string]: number };
    private playingTeamNames: string[];
    private opposingTeamNames: string[];
    private readonly angespieltByColor: ColorInfoType;
    private readonly playedCardsByPlayerName: { [index in string]: Card[] };
    private readonly colorFreeByPlayerName: { [index in string]: ColorInfoType };
    private hasCalledAceBeenPlayed = false;

    private readonly remainingCardsByColor: CardsInfoType;
    private remainingCards: Card[];

    constructor(allPlayerNames: readonly string[], gameMode: GameMode) {
        this.allPlayersNames = allPlayerNames;
        this.playedCards = [];

        this.pointsForPlayerName = {};
        this.playedCardsByPlayerName = {};
        this.colorFreeByPlayerName = {};
        for (let playerName of allPlayerNames) {
            this.pointsForPlayerName[playerName] = 0;
            this.playedCardsByPlayerName[playerName] = [];
            this.colorFreeByPlayerName[playerName] = {
                [ColorWithTrump.EICHEL]: false,
                [ColorWithTrump.GRAS]: false,
                [ColorWithTrump.HERZ]: false,
                [ColorWithTrump.SCHELLE]: false,
                [ColorWithTrump.TRUMP]: false,
            };
        }

        this.angespieltByColor = {
            [ColorWithTrump.EICHEL]: false,
            [ColorWithTrump.GRAS]: false,
            [ColorWithTrump.HERZ]: false,
            [ColorWithTrump.SCHELLE]: false,
            [ColorWithTrump.TRUMP]: false,
        };

        this.gameMode = gameMode;
        this.remainingCards = clone(CardDeck) as Card[];
        this.remainingCardsByColor = {
            E: clone(this.gameMode.getOrdering().getColorOrdering(PlainColor.EICHEL)) as Card[],
            G: clone(this.gameMode.getOrdering().getColorOrdering(PlainColor.GRAS)) as Card[],
            H: clone(this.gameMode.getOrdering().getColorOrdering(PlainColor.HERZ)) as Card[],
            S: clone(this.gameMode.getOrdering().getColorOrdering(PlainColor.SCHELLE)) as Card[],
            T: clone(this.gameMode.getOrdering().getTrumpOrdering()) as Card[]
        };

        if (this.gameMode.isSinglePlay()) {
            this.playingTeamNames = [this.gameMode.getCallingPlayerName()];
            this.opposingTeamNames = difference(this.allPlayersNames, this.playingTeamNames);
        } else {
            this.playingTeamNames = [];
            this.opposingTeamNames = [];
        }
    }

    getPlayedCards() {
        return this.playedCards;
    }

    getRemainingCards() {
        return this.remainingCards;
    }

    onCardPlayed(round: Round): void {
        let card = round.getLastPlayedCard();
        let playerName = round.getLastPlayedPlayerName();

        this.playedCards.push(card);

        let cardColor = this.gameMode.getOrdering().getColor(card);

        this.remainingCards = removeCard(this.remainingCards, card);
        this.remainingCardsByColor[cardColor] = removeCard(this.remainingCardsByColor[cardColor], card);

        if (this.gameMode.isCallGame() && card === this.gameMode.getCalledAce()) {
            this.hasCalledAceBeenPlayed = true;
            this.playingTeamNames = [playerName, this.gameMode.getCallingPlayerName()];
            this.opposingTeamNames = difference(this.allPlayersNames, this.playingTeamNames);
        }

        let roundColor = round.getRoundAnalyzer(this.gameMode).getRoundColor();

        if (roundColor != cardColor) {
            this.colorFreeByPlayerName[playerName]![roundColor] = true;
        }

        this.playedCardsByPlayerName[playerName]!.push(card);
    }

    getOwnTeamPoints(playerName: string): number | null {
        if (this.playingTeamNames.length && includes(this.playingTeamNames, playerName)) {
            return this.getTeamPoints(this.playingTeamNames);
        } else if (this.opposingTeamNames.length && includes(this.opposingTeamNames, playerName)) {
            return this.getTeamPoints(this.opposingTeamNames);
        }

        return null;
    }

    getTeamPoints(playerNames: string[]) {
        let points = 0;
        for (let playerName of playerNames) {
            points = points + this.pointsForPlayerName[playerName]!
        }

        return points;
    }

    getOtherTeamPoints(playerName: string): number | null {
        if (this.opposingTeamNames.length && includes(this.opposingTeamNames, playerName)) {
            return this.getTeamPoints(this.opposingTeamNames);
        } else if (this.playingTeamNames.length && includes(this.playingTeamNames, playerName)) {
            return this.getTeamPoints(this.playingTeamNames);
        }

        return null;
    }

    hasColorBeenAngespielt(color: ColorWithTrump) {
        return this.angespieltByColor[color];
    }

    onRoundCompleted(round: FinishedRound): void {
        let roundAnalyzer = new RoundAnalyzer(round as Round, this.gameMode);

        let winningPlayerName = roundAnalyzer.getWinningPlayerName();
        this.pointsForPlayerName[winningPlayerName] = this.pointsForPlayerName[winningPlayerName]! + roundAnalyzer.getPoints();

        if (this.isDavongelaufen(round)) {
            this.determineTeamsFromDavongelaufeneRufsau(round);
        }

        let card = round.getPlayedCards()[0];
        let roundColor = this.gameMode.getOrdering().getColor(card);
        this.angespieltByColor[roundColor] = true;
    }

    doIHaveAllCardsOfColor(playerName: string, cardSet: Card[], color: ColorWithTrump) {
        return eq(this.remainingCardsByColor[color], allOfColor(cardSet, color, this.gameMode));
    }

    highestUnplayedCardForColor(color: ColorWithTrump) {
        if (this.remainingCardsByColor[color].length == 0) {
            return null;
        }
        return this.remainingCardsByColor[color][0];
    }

    doIHaveTheHighestCardForColor(cardSet: Card[], color: ColorWithTrump) {
        let highestCard = this.highestUnplayedCardForColor(color);
        if (highestCard) {
            return hasCard(cardSet, highestCard);
        } else {
            return false;
        }
    }

    isTeamPartnerKnown() {
        return !!this.opposingTeamNames.length && !!this.playingTeamNames.length;
    }

    isTeamPartnerKnownToMe(startCards: readonly Card[]) {
        if (this.isTeamPartnerKnown() || includes(startCards, this.gameMode.getCalledAce())) {
            return true;
        } else {
            return false;
        }
    }

    isPlayerNameColorFree(playerName: string, color: ColorWithTrump) {
        return this.colorFreeByPlayerName[playerName]![color];
    }

    getColorFreeByPlayerName() {
        return this.colorFreeByPlayerName;
    }

    getColorFreeByPlayerNameWithoutMyCards(playerName: string, myCards: Card[]) {
        let remainingColorsWithoutCardSet = this.getRemainingCardsByColorWithoutCardSet(myCards);
        let colorFreeByPlayer: { [index in string]: { [index in string]: boolean } } = {};

        for (let player of this.allPlayersNames) {
            for (let color of colorsWithTrump) {
                colorFreeByPlayer[player] = colorFreeByPlayer[player] || {};
                colorFreeByPlayer[player][color] = !remainingColorsWithoutCardSet[color].length
            }
        }

        return colorFreeByPlayer;
    }

    getCurrentRankWithEqualRanksOfCardInColor(cards: readonly Card[], color: ColorWithTrump, roundCards: readonly Card[] = []): { [index in Card]?: number } {
        let roundCardsInColor = allOfColor(roundCards, color, this.gameMode);
        let currentRank = 0;
        let result: { [index in Card]?: number } = {};
        let lastCard;

        let remainingCardsOfColor = sortByNaturalOrdering([...this.remainingCardsByColor[color], ...roundCardsInColor]);

        for (let i = 0; i < remainingCardsOfColor.length; i++) {
            let card = remainingCardsOfColor[i];
            if (!includes(remainingCardsOfColor, card)) {
                throw Error('card not in color?');
            }

            if (lastCard && result[lastCard] === currentRank - 1) {
                currentRank = currentRank - 1;
            }
            if (includes(cards, card)) {
                result[card] = currentRank;
            }

            lastCard = card;
            currentRank = currentRank + 1;
        }

        return result;
    }

    isAnyoneDefinitelyFreeOfColor(myCards: Card[], color: ColorWithTrump) {
        // für wenz leicht andere regeln....
        if (this.gameMode.getMode() == GameModeEnum.CALL_GAME || this.gameMode.getMode() == GameModeEnum.SOLO) {
            for (let playerName of this.allPlayersNames) {
                if (this.colorFreeByPlayerName[playerName]![color]) {
                    return true;
                }
            }
            if (color != ColorWithTrump.TRUMP) {
                if (allOfColor(myCards, color, this.gameMode).length > 3) {
                    return true;
                }

                if (this.angespieltByColor[color]) {
                    return true;
                }
            } else {
                if (this.playedTrumpCards().length + allOfColor(myCards, ColorWithTrump.TRUMP, this.gameMode).length > 14) {
                    return true;
                }
            }

            // does not imply the opposite....
            return false;
        } else if (this.gameMode.isWenz()) {
            if (color != ColorWithTrump.TRUMP) {
                if (allOfColor(myCards, color, this.gameMode).length > 4) {
                    return true;
                }

                if (this.angespieltByColor[color]) {
                    return true;
                }
            }
            if (this.playedTrumpCards().length + allOfColor(myCards, ColorWithTrump.TRUMP, this.gameMode).length > 4) {
                return true;
            }
        }

        throw Error('not implemented');

    }

    getHasCalledAceBeenPlayed() {
        if (this.gameMode.isSinglePlay()) {
            throw Error('no called ace in single play..');
        }
        return this.hasCalledAceBeenPlayed;
    }

    getTeamPartnerNameForPlayerName(playerName: string, startCardSet: readonly Card[] = []) {
        if (this.isTeamPartnerKnown()) {
            if (this.isPlayerPlaying(playerName)) {
                return without(this.playingTeamNames, playerName).pop()!
            } else {
                return without(this.opposingTeamNames, playerName).pop()!
            }
        } else if (this.isTeamPartnerKnownToMe(startCardSet)) {
            return this.gameMode.getCallingPlayerName();
        } else {
            return null;
        }
    }

    getNonPlayingTeam() {
        return this.opposingTeamNames;
    }

    getPlayingTeamNames() {
        return this.playingTeamNames;
    }

    getCurrentRankOfCardInColor(card: Card, roundCards: Card[] = []) {
        let color = this.gameMode.getOrdering().getColor(card);

        return sortByNaturalOrdering([...this.remainingCardsByColor[color], ...roundCards]).indexOf(card);
    }

    isPlayerPlaying(playerName: string, startCards: readonly Card[] = []) {
        if (this.gameMode.getCallingPlayerName() == playerName) {
            return true;
        }
        if (this.gameMode.isCallGame() && includes(startCards, this.gameMode.getCalledAce())) {
            return true;
        }
        return includes(this.playingTeamNames, playerName);
    }

    hasPlayerAbspatzenCallColor() {
        if (!this.gameMode.isCallGame()) {
            throw Error('only available in call game');
        }

        if (this.isTeamPartnerKnown()) {
            throw Error('function call probably does no make sense here...');
        }
        let cardPlayedByCaller = this.playedCardsByPlayerName[this.gameMode.getCallingPlayerName()];
        let callColor = this.gameMode.getCalledColor();
        let callColorCards = getCardsByColor(cardPlayedByCaller, this.gameMode)[callColor];

        if (callColorCards.length > 0) {
            return true;
        } else {
            return false;
        }
    }

    getRemainingCardsByColor() {
        return this.remainingCardsByColor;
    }

    getRemainingCardsByColorWithoutCardSet(cardSet: Card[]) {
        let remainingCardsByColor = cloneDeep(this.remainingCardsByColor);
        for (let color of colorsWithTrump) {
            remainingCardsByColor[color] = difference(remainingCardsByColor[color], cardSet);
        }

        return remainingCardsByColor;
    }

    getPlayedCardsByPlayer(name: string) {
        return this.playedCardsByPlayerName[name]!;
    }

    private playedTrumpCards() {
        return allOfColor(this.playedCards, ColorWithTrump.TRUMP, this.gameMode);
    }

    private isDavongelaufen(round: FinishedRound) {
        return this.gameMode.isCallGame()
            && !this.hasCalledAceBeenPlayed
            && round.getRoundAnalyzer(this.gameMode).getRoundColor() == this.gameMode.getColorOfTheGame()
            && !hasCard(round.getPlayedCards(), this.gameMode.getCalledAce());
    }

    private determineTeamsFromDavongelaufeneRufsau(round: FinishedRound) {
        this.playingTeamNames = [this.gameMode.getCallingPlayerName(), round.getStartPlayerName()];
        this.opposingTeamNames = difference(this.allPlayersNames, this.playingTeamNames);
    }
}