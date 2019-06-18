/**
 * information about won points, team alignment, available cards & trumps....
 *
 */
import {Card} from "../cards/Card";
import GameEventsReceiverInterface from "./GameEventsReceiverInterface";
import {GameMode, GameModeEnum} from "../GameMode";
import {FinishedRound} from "../Round";
import {allOfColor, getCardsByColor, hasCard, removeCard} from "../cards/CardSet";
import {PlayerWithNameOnly} from "../Player";
import {difference, eq, without} from "lodash";
import {CallableColor, ColorWithTrump} from "../cards/Color";
import CardDeck from "../cards/sets/CardDeck";

type ColorInfoType = { [index in ColorWithTrump]: boolean };
type CardsInfoType = { [index in ColorWithTrump]: readonly Card[] };

// TODO split into public history and private knowledge
export default class GameKnowledge implements GameEventsReceiverInterface {
    private readonly startHandCards: readonly Card[];
    private readonly playedCards: Card[];
    //  private knownCards: Card[];
    // private rounds: FinishedRound[];
    private gameMode: GameMode;
    private hasCalledAce: boolean;
    private teamPartner: PlayerWithNameOnly | undefined;
    private readonly thisPlayer: PlayerWithNameOnly;
    private readonly allPlayers: readonly PlayerWithNameOnly[];
    private readonly pointsForPlayer: { [index in string]: number };
    private otherTeam: readonly PlayerWithNameOnly[];
    private ownTeam: readonly PlayerWithNameOnly[];
    private readonly angespieltByColor: ColorInfoType;
    private readonly playedCardsByPlayer: { [index in string]: Card[] };
    private readonly colorFreeByPlayer: { [index in string]: ColorInfoType };
    private hasCalledAceBeenPlayed = false;
    private thisPlayerIsPlaying?: boolean;

    // without cards on hand, iE public knowledge
    private remainingCardsByColor: CardsInfoType;
    private remainingCards: readonly Card[];

    // includes cards on Hand
    private remainingCardsByColorWithHandCards: CardsInfoType;
    private currentHandCards: readonly Card[];
    private readonly otherPlayers: PlayerWithNameOnly[];

    constructor(startHandCards: readonly Card[], self: PlayerWithNameOnly, allPlayer: readonly PlayerWithNameOnly[]) {
        this.startHandCards = startHandCards;
        this.currentHandCards = startHandCards;
        // this.knownCards = clone(startHandCards);
        this.thisPlayer = self;
        this.allPlayers = allPlayer;
        this.otherPlayers = without(allPlayer, self);
        this.playedCards = [];
        // this.rounds = [];
        this.gameMode = new GameMode(GameModeEnum.RETRY);
        this.hasCalledAce = false;

        this.otherTeam = [];
        this.ownTeam = [];

        this.pointsForPlayer = {};
        this.playedCardsByPlayer = {};
        this.colorFreeByPlayer = {};
        for (let player of allPlayer) {
            this.pointsForPlayer[player.getName()] = 0;
            this.playedCardsByPlayer[player.getName()] = [];
            if (player.getName() != this.thisPlayer.getName()) {
                this.colorFreeByPlayer[player.getName()] = {
                    [ColorWithTrump.EICHEL]: false,
                    [ColorWithTrump.GRAS]: false,
                    [ColorWithTrump.HERZ]: false,
                    [ColorWithTrump.SCHELLE]: false,
                    [ColorWithTrump.TRUMP]: false,
                };
            }
        }

        this.angespieltByColor = {
            [ColorWithTrump.EICHEL]: false,
            [ColorWithTrump.GRAS]: false,
            [ColorWithTrump.HERZ]: false,
            [ColorWithTrump.SCHELLE]: false,
            [ColorWithTrump.TRUMP]: false,
        };

        this.remainingCardsByColor = {E: [], G: [], H: [], S: [], T: []};
        this.remainingCards = difference(CardDeck, this.startHandCards);
        this.remainingCardsByColorWithHandCards = {E: [], G: [], H: [], S: [], T: []};
    }

    getPlayedCards() {
        return this.playedCards;
    }

    getRemainingCards() {
        return this.remainingCards;
    }

    onCardPlayed(card: Card, player: PlayerWithNameOnly, index: number): void {
        //  this.knownCards.push(card);
        this.playedCards.push(card);

        let cardColor = this.gameMode.getOrdering().getColor(card);

        this.remainingCardsByColorWithHandCards[cardColor] = removeCard(this.remainingCardsByColorWithHandCards[cardColor], card);

        if (player.getName() == this.thisPlayer.getName()) {
            this.currentHandCards = removeCard(this.currentHandCards, card);
        } else {
            this.remainingCards = removeCard(this.remainingCards, card);
            this.remainingCardsByColor[cardColor] = removeCard(this.remainingCardsByColor[cardColor], card);
        }

        if (this.gameMode.isCallGame() && card === this.gameMode.getCalledAce()) {
            this.hasCalledAceBeenPlayed = true;
        }
    }

    onGameModeDecided(gameMode: GameMode): void {
        this.gameMode = gameMode;

        if (this.gameMode.isCallGame()) {
            this.hasCalledAce = hasCard(this.startHandCards, this.gameMode.getCalledAce());
            if (this.hasCalledAce) {
                this.teamPartner = this.gameMode.getCallingPlayer();
                this.ownTeam = [this.thisPlayer, this.teamPartner!];
                this.otherTeam = difference(this.allPlayers, this.ownTeam);
                this.thisPlayerIsPlaying = true;
            } else {
                this.thisPlayerIsPlaying = false;
            }
        } else if (this.gameMode.isSinglePlay()) {
            if (this.gameMode.getCallingPlayer() == this.thisPlayer) {
                this.ownTeam = [this.thisPlayer];
                this.otherTeam = difference(this.allPlayers, this.ownTeam);
                this.thisPlayerIsPlaying = true;
            } else {
                this.otherTeam = [this.gameMode.getCallingPlayer()!];
                this.ownTeam = without(this.allPlayers, this.gameMode.getCallingPlayer()!);
                this.thisPlayerIsPlaying = false;
            }
        } else {
            throw Error('not implemented');
        }

        this.remainingCardsByColor = {
            [CallableColor.EICHEL]: difference(this.allEichelCardsInGame(), this.myEichelCards()),
            [CallableColor.GRAS]: difference(this.allGrasCardsInGame(), this.myGrasCards()),
            [CallableColor.SCHELLE]: difference(this.allSchelleCardsInGame(), this.mySchelleCards()),
            [ColorWithTrump.HERZ]: difference(this.allHerzCardsInGame(), this.myHerzCards()),
            [ColorWithTrump.TRUMP]: difference(this.allTrumpCardsInGame(), this.myTrumpCards()),
        };
        this.colorFreeByPlayer[this.thisPlayer.getName()] = {
            [ColorWithTrump.EICHEL]: this.myEichelCards().length === 0,
            [ColorWithTrump.GRAS]: this.myGrasCards().length === 0,
            [ColorWithTrump.HERZ]: this.myHerzCards().length === 0,
            [ColorWithTrump.SCHELLE]: this.mySchelleCards().length === 0,
            [ColorWithTrump.TRUMP]: this.myTrumpCards().length === 0,
        };

        this.remainingCardsByColorWithHandCards = {
            [CallableColor.EICHEL]: this.allEichelCardsInGame(),
            [CallableColor.GRAS]: this.allGrasCardsInGame(),
            [CallableColor.SCHELLE]: this.allSchelleCardsInGame(),
            [ColorWithTrump.HERZ]: this.allHerzCardsInGame(),
            [ColorWithTrump.TRUMP]: this.allTrumpCardsInGame(),
        };
    }

    getOwnTeamPoints(): number {
        let myTeam;
        if (this.ownTeam) {
            myTeam = this.ownTeam
        } else {
            myTeam = [this.thisPlayer];
        }

        let points = 0;
        for (let player of myTeam) {
            points = points + this.pointsForPlayer[player.getName()]!
        }

        return points;
    }

    getOtherTeamPoints(): number | null {
        if (!this.otherTeam.length) {
            return null;
        }

        let points = 0;
        for (let player of this.otherTeam) {
            points = points + this.pointsForPlayer[player.getName()]!
        }

        return points;
    }

    hasColorBeenAngespielt(color: ColorWithTrump) {
        return this.angespieltByColor[color];
    }

    onRoundCompleted(round: FinishedRound, roundIndex: number): void {
        // this.rounds.push(round);

        let winningPlayer = round.getWinningPlayer();
        this.pointsForPlayer[winningPlayer.getName()] = this.pointsForPlayer[winningPlayer.getName()]! + round.getPoints();

        this.determineTeams(round);

        let roundColor = round.getRoundColor();
        this.angespieltByColor[roundColor] = true;

        // todo: better in onCard..?
        for (let card of round.getCards()) {
            let playingPlayer = round.getPlayerForCard(card);
            let cardColor = this.gameMode.getOrdering().getColor(card);

            this.playedCardsByPlayer[playingPlayer.getName()]!.push(card);

            if (!this.colorFreeByPlayer[playingPlayer.getName()]![roundColor]) {
                if (roundColor != cardColor) {
                    if (this.thisPlayer.getName() == "Player 1") {
                        //  console.log(`player ${playingPlayer} marked color free of ${roundColor} because did not follow suit`);
                    }
                    this.colorFreeByPlayer[playingPlayer.getName()]![roundColor] = true;
                }
                if (this.doIHaveAllCardsOfColor(cardColor) || this.remainingCardsByColorWithHandCards[cardColor].length == 0) {
                    for (let otherPlayer of this.otherPlayers) {
                        if (this.thisPlayer.getName() == "Player 1") {
                            // console.log(`player ${otherPlayer} marked color free of ${roundColor} because all color cards played or held by player are played`);
                        }
                        this.colorFreeByPlayer[otherPlayer.getName()]![cardColor] = true;
                    }
                }
            }
        }
    }

    doIHaveAllCardsOfColor(color: ColorWithTrump) {
        if (this.colorFreeByPlayer[this.thisPlayer.getName()]![color]) {
            return false;
        }
        return eq(this.remainingCardsByColorWithHandCards[color], allOfColor(this.currentHandCards, color, this.gameMode));
    }

    highestUnplayedCardForColor(color: ColorWithTrump) {
        if (this.remainingCardsByColorWithHandCards[color].length == 0) {
            return null;
        }
        return this.remainingCardsByColorWithHandCards[color][0];
    }

    doIHaveTheHighestCardForColor(color: ColorWithTrump) {
        let highestCard = this.highestUnplayedCardForColor(color);
        if (highestCard) {
            return hasCard(this.currentHandCards, highestCard);
        } else {
            return false;
        }
    }

    isTeamPartnerKnown() {
        return !!this.ownTeam.length;
    }

    private allTrumpCardsInGame() {
        return this.gameMode.getOrdering().getTrumpOrdering();
    }

    private allEichelCardsInGame() {
        return this.gameMode.getOrdering().getColorOrdering(ColorWithTrump.EICHEL);
    }

    private allGrasCardsInGame() {
        return this.gameMode.getOrdering().getColorOrdering(ColorWithTrump.GRAS);
    }

    private allHerzCardsInGame() {
        return this.gameMode.getOrdering().getColorOrdering(ColorWithTrump.HERZ);
    }

    private allSchelleCardsInGame() {
        return this.gameMode.getOrdering().getColorOrdering(ColorWithTrump.SCHELLE);
    }

    isPlayerColorFree(player: PlayerWithNameOnly, color: ColorWithTrump) {
        return this.colorFreeByPlayer[player.getName()]![color];
    }

    getColorFreeByPlayer() {
        return this.colorFreeByPlayer;
    }

    getCurrentRankWithEqualRanksOfCardInColor(cards: readonly Card[], color: ColorWithTrump): { [index in Card]?: number } {
        let cardsInColor = allOfColor(cards, color, this.gameMode);
        let currentRank = 0;
        let result: { [index in Card]?: number } = {};
        let lastCard;
        for (let i = 0; i < this.remainingCardsByColorWithHandCards[color].length; i++) {
            let card = this.remainingCardsByColorWithHandCards[color][i];
            if (cardsInColor.indexOf(card) !== -1) {
                if (lastCard && result[lastCard] === currentRank - 1) {
                    currentRank = currentRank - 1;
                }
                result[card] = currentRank;
            }

            lastCard = card;
            currentRank = currentRank + 1;
        }

        return result;
    }

    isAnyoneDefinitelyFreeOfColor(color: ColorWithTrump) {
        // für wenz leicht andere regeln....
        if (this.gameMode.getMode() == GameModeEnum.CALL_GAME || this.gameMode.getMode() == GameModeEnum.SOLO) {
            for (let player of this.allPlayers) {
                if (this.colorFreeByPlayer[player.getName()]![color]) {
                    return true;
                }
            }
            if (color != ColorWithTrump.TRUMP) {
                if (allOfColor(this.startHandCards, color, this.gameMode).length > 3) {
                    return true;
                }

                if (this.angespieltByColor[color]) {
                    return true;
                }
            } else {
                if (this.playedTrumpCards().length + this.myCurrentTrumpCards().length > 14) {
                    return true;
                }
            }

            // does not imply the opposite....
            return false;
        }

        throw Error('not implemented');

    }

    getHasCalledAceBeenPlayed() {
        if (this.gameMode.isSinglePlay()) {
            throw Error('no called ace in single play..');
        }
        return this.hasCalledAceBeenPlayed;
    }

    getTeamPartner() {
        return without(this.ownTeam, this.thisPlayer).pop()!;
    }

    getNonPlayingTeam() {
        if (this.isThisPlayerPlaying()) {
            return this.otherTeam;
        } else {
            return this.ownTeam;
        }
    }

    getPlayingTeam() {
        if (this.isThisPlayerPlaying()) {
            return this.ownTeam;
        } else {
            return this.otherTeam;
        }
    }

    getCurrentRankOfCardInColor(card: Card) {
        let color = this.gameMode.getOrdering().getColor(card);

        return this.remainingCardsByColor[color].indexOf(card);
    }

    private myTrumpCards() {
        return allOfColor(this.currentHandCards, ColorWithTrump.TRUMP, this.gameMode);
    }

    private myEichelCards() {
        return allOfColor(this.currentHandCards, CallableColor.EICHEL, this.gameMode);
    }

    private myHerzCards() {
        return allOfColor(this.currentHandCards, ColorWithTrump.HERZ, this.gameMode);
    }

    private myGrasCards() {
        return allOfColor(this.currentHandCards, CallableColor.GRAS, this.gameMode);
    }

    private mySchelleCards() {
        return allOfColor(this.currentHandCards, CallableColor.SCHELLE, this.gameMode);
    }

    private myCurrentTrumpCards() {
        return allOfColor(this.currentHandCards, ColorWithTrump.TRUMP, this.gameMode);
    }

    private playedTrumpCards() {
        return allOfColor(this.playedCards, ColorWithTrump.TRUMP, this.gameMode);
    }

    private determineTeams(round: FinishedRound) {
        if (this.gameMode.getMode() == GameModeEnum.CALL_GAME && !this.isTeamPartnerKnown()) {
            if (this.roundIncludesCalledAce(round)) {
                this.determineTeamsFromCalledAceInRound(round);
            } else if (this.isDavongelaufen(round)) {
                this.determineTeamsFromDavongelaufeneRufsau(round);
            }
        }
    }

    private roundIncludesCalledAce(round: FinishedRound) {
        return hasCard(round.getCards(), this.gameMode.getCalledAce());
    }

    private isDavongelaufen(round: FinishedRound) {
        return round.getRoundColor() == this.gameMode.getColorOfTheGame()
            && !hasCard(round.getCards(), this.gameMode.getCalledAce());
    }

    private determineTeamsFromDavongelaufeneRufsau(round: FinishedRound) {
        if (this.gameMode.getCallingPlayer() == this.thisPlayer) {
            this.teamPartner = round.getStartPlayer();
            this.thisPlayerIsPlaying = true;
        } else {
            let callAcePlayer = round.getStartPlayer();
            this.teamPartner = without(this.allPlayers, this.thisPlayer, this.gameMode.getCallingPlayer(), callAcePlayer).pop();
            this.thisPlayerIsPlaying = false;
        }
    }

    private determineTeamsFromCalledAceInRound(round: FinishedRound) {
        if (this.gameMode.getCallingPlayer() == this.thisPlayer) {
            this.teamPartner = round.getPlayerForCard(this.gameMode.getCalledAce());
            this.thisPlayerIsPlaying = true;
        } else {
            let callAcePlayer = round.getPlayerForCard(this.gameMode.getCalledAce());
            this.teamPartner = without(this.allPlayers, this.thisPlayer, this.gameMode.getCallingPlayer(), callAcePlayer).pop();
            this.thisPlayerIsPlaying = false;
        }

        this.ownTeam = [this.thisPlayer, this.teamPartner!];
        this.otherTeam = difference(this.allPlayers, this.ownTeam);
    }

    isThisPlayerPlaying() {
        return this.thisPlayerIsPlaying;
    }

    isTeamPartnerPublicallyKnown() {
        return this.hasCalledAceBeenPlayed;
    }

    getTeamPartnerForPlayer(player: PlayerWithNameOnly): PlayerWithNameOnly | null {
        if (player.getName() == this.thisPlayer.getName()) {
            return this.getTeamPartner();
        } else if (this.startHandCards.indexOf(this.gameMode.getCalledAce()) !== -1) {
            if (player.getName() == this.gameMode.getCallingPlayer().getName()) {
                return this.thisPlayer;
            } else {
                return without(this.allPlayers, player, this.gameMode.getCallingPlayer(), this.thisPlayer).pop()!;
            }
        } else {
            if (this.isTeamPartnerPublicallyKnown()) {
                if (this.getPlayingTeam().indexOf(player) !== -1) {
                    return without(this.getPlayingTeam(), player).pop()!;
                } else {
                    return without(this.getNonPlayingTeam(), player).pop()!;
                }
            } else {
                return null;
            }
        }
    }

    hasPlayerAbspatzenCallColor() {
        if (!this.gameMode.isCallGame()) {
            throw Error('only available in call game');
        }

        if (this.isTeamPartnerPublicallyKnown()) {
            throw Error('function call does no make sense here...');
        }
        let cardPlayedByCaller = this.playedCardsByPlayer[this.gameMode.getCallingPlayer().getName()];
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

    getPlayedCardsByPlayer(name: string) {
        return this.playedCardsByPlayer[name]!;
    }

    getCurrentHandCards() {
        return this.currentHandCards;
    }
}