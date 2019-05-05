/**
 * information about won points, team alignment, available cards & trumps....
 *
 */
import {Card} from "../cards/Card";
import GameEventsReceiverInterface from "./GameEventsReceiverInterface";
import {GameMode, GameModeEnum} from "../GameMode";
import {FinishedRound} from "../Round";
import CardSet from "../cards/CardSet";
import {PlayerWithNameOnly} from "../Player";
import {difference, eq, without} from "lodash";
import {CallableColor, ColorWithTrump} from "../cards/Color";

type ColorInfoType = { [index in ColorWithTrump]: boolean };
type CardsInfoType = { [index in ColorWithTrump]: readonly Card[] };

export default class GameKnowledge implements GameEventsReceiverInterface {
    private readonly startHandCards: readonly Card[];
    // private playedCards: Card[];
    //  private knownCards: Card[];
    // private rounds: FinishedRound[];
    private gameMode: GameMode;
    private hasCalledAce: boolean;
    private teamPartner: PlayerWithNameOnly | undefined;
    private readonly thisPlayer: PlayerWithNameOnly;
    private readonly allPlayers: readonly PlayerWithNameOnly[];
    private pointsForPlayer: Map<PlayerWithNameOnly, number>;
    private otherTeam: readonly PlayerWithNameOnly[];
    private ownTeam: readonly PlayerWithNameOnly[];
    private angespieltByColor: ColorInfoType;
    private playedCardsByPlayer: Map<PlayerWithNameOnly, Card[]>;
    private colorFreeByPlayer: Map<PlayerWithNameOnly, ColorInfoType>;
    private hasCalledAceBeenPlayed = false;
    private thisPlayerIsPlaying?: boolean;

    // without cards on hand, iE public knowledge
    private remainingCardsByColor: CardsInfoType;

    // includes cards on Hand
    private unplayedCardsByColor: CardsInfoType;
    private currentHandCards: readonly Card[];
    private readonly otherPlayers: PlayerWithNameOnly[];

    constructor(startHandCards: readonly Card[], self: PlayerWithNameOnly, allPlayer: readonly PlayerWithNameOnly[]) {
        this.startHandCards = startHandCards;
        this.currentHandCards = startHandCards;
        // this.knownCards = clone(startHandCards);
        this.thisPlayer = self;
        this.allPlayers = allPlayer;
        this.otherPlayers = without(allPlayer, self);
        // this.playedCards = [];
        // this.rounds = [];
        this.gameMode = new GameMode(GameModeEnum.RETRY);
        this.hasCalledAce = false;

        this.otherTeam = [];
        this.ownTeam = [];

        this.pointsForPlayer = new Map<PlayerWithNameOnly, number>();
        this.playedCardsByPlayer = new Map<PlayerWithNameOnly, Card[]>();
        this.colorFreeByPlayer = new Map<PlayerWithNameOnly, { [index in ColorWithTrump]: boolean }>();
        for (let player of allPlayer) {
            this.pointsForPlayer.set(player, 0);
            this.playedCardsByPlayer.set(player, []);
            if (player != this.thisPlayer) {
                this.colorFreeByPlayer.set(player, {
                    [ColorWithTrump.EICHEL]: false,
                    [ColorWithTrump.GRAS]: false,
                    [ColorWithTrump.HERZ]: false,
                    [ColorWithTrump.SCHELLE]: false,
                    [ColorWithTrump.TRUMP]: false,
                });
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
        this.unplayedCardsByColor = {E: [], G: [], H: [], S: [], T: []};
    }

    onCardPlayed(card: Card, player: PlayerWithNameOnly, index: number): void {
        //  this.knownCards.push(card);
        //   this.playedCards.push(card);

        let cardColor = this.gameMode.getOrdering().getColor(card);

        this.unplayedCardsByColor[cardColor] = CardSet.removeCard(this.unplayedCardsByColor[cardColor], card);

        if (player == this.thisPlayer) {
            this.currentHandCards = CardSet.removeCard(this.currentHandCards, card);
        } else {
            this.remainingCardsByColor[cardColor] = CardSet.removeCard(this.remainingCardsByColor[cardColor], card);
        }

        if (this.gameMode.isCallGame() && card === this.gameMode.getCalledAce()) {
            this.hasCalledAceBeenPlayed = true;
        }
    }

    onGameModeDecided(gameMode: GameMode): void {
        this.gameMode = gameMode;

        if (this.gameMode.isCallGame()) {
            this.hasCalledAce = CardSet.hasCard(this.startHandCards, this.gameMode.getCalledAce());
            if (this.hasCalledAce) {
                this.teamPartner = this.gameMode.getCallingPlayer();
                this.ownTeam = [this.thisPlayer, this.teamPartner!];
                this.otherTeam = difference(this.allPlayers, this.ownTeam);
                this.thisPlayerIsPlaying = true;
            }
        } else if (this.gameMode.isSinglePlay()) {
            if (this.gameMode.getCallingPlayer() == this.thisPlayer) {
                this.ownTeam = [this.thisPlayer];
                this.otherTeam = difference(this.allPlayers, this.ownTeam);
                this.thisPlayerIsPlaying = true;
            } else {
                this.otherTeam = [this.gameMode.getCallingPlayer()!];
                this.ownTeam = difference(this.allPlayers, this.otherTeam);
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
        this.colorFreeByPlayer.set(this.thisPlayer, {
            [ColorWithTrump.EICHEL]: this.myEichelCards().length === 0,
            [ColorWithTrump.GRAS]: this.myGrasCards().length === 0,
            [ColorWithTrump.HERZ]: this.myHerzCards().length === 0,
            [ColorWithTrump.SCHELLE]: this.mySchelleCards().length === 0,
            [ColorWithTrump.TRUMP]: this.myTrumpCards().length === 0,
        });

        this.unplayedCardsByColor = {
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
            points = points + this.pointsForPlayer.get(player)!
        }

        return points;
    }

    getOtherTeamPoints(): number | null {
        if (!this.otherTeam.length) {
            return null;
        }

        let points = 0;
        for (let player of this.otherTeam) {
            points = points + this.pointsForPlayer.get(player)!
        }

        return points;
    }

    hasColorBeenAngespielt(color: ColorWithTrump) {
        return this.angespieltByColor[color];
    }

    onRoundCompleted(round: FinishedRound, roundIndex: number): void {
        // this.rounds.push(round);

        let winningPlayer = round.getWinningPlayer();
        this.pointsForPlayer.set(winningPlayer, this.pointsForPlayer.get(winningPlayer)! + round.getPoints());

        this.determineTeams(round);

        let roundColor = round.getRoundColor();
        this.angespieltByColor[roundColor] = true;

        // todo: better in onCard..?
        for (let card of round.getCards()) {
            let playingPlayer = round.getPlayerForCard(card);
            let cardColor = this.gameMode.getOrdering().getColor(card);

            this.playedCardsByPlayer.get(playingPlayer)!.push(card);

            if (!this.colorFreeByPlayer.get(playingPlayer)![roundColor]) {
                if (roundColor != cardColor) {
                    if (this.thisPlayer.getName() == "Player 1") {
                        console.log(`player ${playingPlayer} marked color free of ${roundColor} because did not bedien`);
                    }
                    this.colorFreeByPlayer.get(playingPlayer)![roundColor] = true;
                }
                if (this.doIHaveAllCardsOfColor(cardColor) || this.unplayedCardsByColor[cardColor].length == 0) {
                    for (let otherPlayer of this.otherPlayers) {
                        if (this.thisPlayer.getName() == "Player 1") {
                            console.log(`player ${otherPlayer} marked color free of ${roundColor} because all color cards played or held by player are played`);
                        }
                        this.colorFreeByPlayer.get(otherPlayer)![cardColor] = true;
                    }
                }
            }
        }
    }

    doIHaveAllCardsOfColor(color: ColorWithTrump) {
        if (this.colorFreeByPlayer.get(this.thisPlayer)![color]) {
            return false;
        }
        return eq(this.unplayedCardsByColor[color], CardSet.allOfColor(this.currentHandCards, color, this.gameMode));
    }

    highestUnplayedCardForColor(color: ColorWithTrump) {
        if (this.unplayedCardsByColor[color].length == 0) {
            return null;
        }
        return this.unplayedCardsByColor[color][0];
    }

    doIHaveTheHighestCardForColor(color: ColorWithTrump) {
        let highestCard = this.highestUnplayedCardForColor(color);
        if (highestCard) {
            return CardSet.hasCard(this.currentHandCards, highestCard);
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

    private myTrumpCards() {
        return CardSet.allOfColor(this.startHandCards, ColorWithTrump.TRUMP, this.gameMode);
    }

    private myEichelCards() {
        return CardSet.allOfColor(this.startHandCards, CallableColor.EICHEL, this.gameMode);
    }

    private myHerzCards() {
        return CardSet.allOfColor(this.startHandCards, ColorWithTrump.HERZ, this.gameMode);
    }

    private myGrasCards() {
        return CardSet.allOfColor(this.startHandCards, CallableColor.GRAS, this.gameMode);
    }

    private mySchelleCards() {
        return CardSet.allOfColor(this.startHandCards, CallableColor.SCHELLE, this.gameMode);
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

    isPlayerColorFree(player: PlayerWithNameOnly, color: ColorWithTrump) {
        return this.colorFreeByPlayer.get(player)![color];
    }

    getCurrentRankOfCardInColor(card: Card) {
        let color = this.gameMode.getOrdering().getColor(card);

        return this.remainingCardsByColor[color].indexOf(card);
    }

    getCurrentRankWithEqualRanksOfCardInColor(cards: readonly Card[], color: ColorWithTrump): { [index in Card]?: number } {
        let cardsInColor = CardSet.allOfColor(cards, color, this.gameMode);
        let currentRank = 0;
        let result: { [index in Card]?: number } = {};
        let lastCard;
        for (let i = 0; i < this.unplayedCardsByColor[color].length; i++) {
            let card = this.unplayedCardsByColor[color][i];
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

    private determineTeams(round: FinishedRound) {
        if (this.gameMode.getMode() == GameModeEnum.CALL_GAME && !this.isTeamPartnerKnown()) {
            if (CardSet.hasCard(round.getCards(), this.gameMode.getCalledAce())) {
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
        }
    }

    isThisPlayerPlaying() {
        return this.thisPlayerIsPlaying;
    }

    isTeamPartnerPublicallyKnown() {
        return this.hasCalledAceBeenPlayed;
    }

    getTeamPartnerForPlayer(player: PlayerWithNameOnly): PlayerWithNameOnly | null {
        if (player == this.thisPlayer) {
            return this.getTeamPartner();
        } else if (this.startHandCards.indexOf(this.gameMode.getCalledAce()) !== -1) {
            if (player == this.gameMode.getCallingPlayer()) {
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
}