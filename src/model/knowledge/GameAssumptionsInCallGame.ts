import GameKnowledge from "./GameKnowledge";
import GameEventsReceiverInterface from "./GameEventsReceiverInterface";
import {Card} from "../cards/Card";
import {Player, PlayerWithNameOnly} from "../Player";
import {GameMode, GameModeEnum} from "../GameMode";
import {FinishedRound, Round} from "../Round";
import {ColorWithTrump} from "../cards/Color";
import {difference, includes, intersection, without} from "lodash";
import GameAssumptions from "./GameAssumptions";
import {getCardLengthsByColor} from "../cards/CardSet";
import {getPlayableCards} from "../PlayableMoves";
import CardRank from "../cards/CardRank";

type TeamPartnerScore = {
    score: number, reasons: string[]
};

export type ColorFreeAssumption = {
    assumption: boolean, reasons: string[]
};

type PlayerConfidence = {
    player?: PlayerWithNameOnly, confidence: number, reasons: string[],
}


export default class GameAssumptionsInCallGame implements GameEventsReceiverInterface, GameAssumptions {
    private gameKnowledge: GameKnowledge;
    private gameMode!: GameMode;
    private possibleTeamPartnerScores: { [index in string]: TeamPartnerScore };
    private readonly thisPlayer: PlayerWithNameOnly;
    private readonly players: readonly PlayerWithNameOnly[];
    private possiblyColorFreeScores: { [index in string]: ColorFreeAssumption };
    private roundsWithTell: number;
    private otherPlayersWithoutCaller?: PlayerWithNameOnly[];
    private probablyHighestTrump: { [index in string]: Card } = {};

    // private otherPlayers?: [Player, Player, Player];

    constructor(gameKnowledge: GameKnowledge, thisPlayer: PlayerWithNameOnly, players: readonly [PlayerWithNameOnly, PlayerWithNameOnly, PlayerWithNameOnly, PlayerWithNameOnly]) {
        this.gameKnowledge = gameKnowledge;
        this.thisPlayer = thisPlayer;
        this.players = players;
        this.possibleTeamPartnerScores = {};
        this.possiblyColorFreeScores = {};
        this.roundsWithTell = 0;
    }

    getPossibleTeamPartnerForPlayer(player: PlayerWithNameOnly): PlayerConfidence {
        if (player.getName() == this.thisPlayer.getName()) {
            if (this.gameKnowledge.isTeamPartnerKnown()) {
                let partner = this.gameKnowledge.getTeamPartner()!;
                let reasons = ['knowledge: i have the ace'];
                if (this.possibleTeamPartnerScores[partner.getName()]) {
                    reasons = reasons.concat(this.possibleTeamPartnerScores[partner.getName()]!.reasons)
                }
                return {player: partner, confidence: 1, reasons: reasons}
            }
        }
        if (this.gameKnowledge.isTeamPartnerPublicallyKnown()) {
            let partner = this.gameKnowledge.getTeamPartnerForPlayer(player)!;
            let reasons = ['knowledge: publically known'];
            if (this.possibleTeamPartnerScores[partner.getName()]) {
                reasons = reasons.concat(this.possibleTeamPartnerScores[partner.getName()]!.reasons)
            }
            return {player: partner, confidence: 1, reasons: reasons}
        }
        let highestScore = 0;
        let partner = undefined;
        let reasons = ["no tells"];
        let confidence = 0;


        for (let playerCandidate of this.players) {
            if (playerCandidate.getName() in this.possibleTeamPartnerScores) {
                let scoreWithReasons = this.possibleTeamPartnerScores[playerCandidate.getName()];
                if (scoreWithReasons.score > highestScore) {
                    partner = playerCandidate;
                    highestScore = scoreWithReasons.score;
                    reasons = scoreWithReasons.reasons;
                    confidence = highestScore / this.roundsWithTell;
                } else if (scoreWithReasons.score == highestScore && highestScore > 0) {
                    reasons = [`equal score of player ${player} and ${playerCandidate}`].concat(scoreWithReasons.reasons).concat(reasons);
                    partner = undefined;
                    confidence = 0;
                }
            }
        }

        return {player: partner, confidence, reasons};
    }

    isPlayerPossiblyColorFree(player: PlayerWithNameOnly, color: ColorWithTrump): ColorFreeAssumption {
        if (this.gameKnowledge.isPlayerColorFree(player, color)) {
            let reasons = ['knowledge'];
            reasons = reasons.concat((this.possiblyColorFreeScores[player + color] || {reasons: []}).reasons);
            return {assumption: true, reasons};
        } else {
            return this.possiblyColorFreeScores[player + color] || {assumption: false, reasons: []};
        }
    }

    getProbablyHighestTrumpByPlayer(player: PlayerWithNameOnly) {
        return this.probablyHighestTrump[player.getName()]!
    }

    onCardPlayed(card: Card, player: PlayerWithNameOnly, index: number): void {
    }

    onGameModeDecided(gameMode: GameMode): void {
        // TODO class is already named.. so makes little sense here....
        this.gameMode = gameMode;

        // this.noneCaller = difference(this.players, [this.gameMode.getCallingPlayer()]) as [Player, Player, Player];
        //    this.otherPlayers = without(this.players, this.thisPlayer) as [Player, Player, Player];
        this.otherPlayersWithoutCaller = difference(this.players, [this.thisPlayer, this.gameMode.getCallingPlayer()!]);

        for (let player of this.otherPlayersWithoutCaller) {
            this.possibleTeamPartnerScores[player.getName()] = {score: 0, reasons: []};
        }
    }

    onRoundCompleted(round: FinishedRound, roundIndex: number): void {
        if (this.gameMode.getMode() == GameModeEnum.CALL_GAME && !this.gameKnowledge.isTeamPartnerKnown()) {
            let tell = false;
            // if another player plays trump this is a good indication she has the ace.
            if (round.getStartPlayer() !== this.thisPlayer) {
                if (round.getRoundColor() == ColorWithTrump.TRUMP
                    && round.getStartPlayer() !== this.gameMode.getCallingPlayer()
                    && roundIndex <= 5
                ) {
                    this.markPlayerAsPossiblePartnerByTrump(round, roundIndex);
                    tell = true;
                }
            }

            // if another player schmiers the calling player this is a good indication she has the ace
            if (round.getWinningPlayer() == this.gameMode.getCallingPlayer()
                && round.hasOffColorSchmier()
                && roundIndex <= 5
            ) {
                let player = round.getOffColorSchmierPlayer();
                if (player && player.getName() != this.thisPlayer.getName()) {
                    this.markPlayerAsPossiblePartnerBySchmier(player, roundIndex);
                    tell = true;
                }
            }

            // if another player begins with color this is a somewhat good indication she does not have the ace
            if (round.getRoundColor() !== ColorWithTrump.TRUMP
                && round.getStartPlayer() !== this.gameMode.getCallingPlayer()
                && round.getStartPlayer() !== this.thisPlayer
                && roundIndex <= 5
            ) {
                let player = round.getStartPlayer();
                this.markPlayerAsPossiblePartnerByColorPlay(player, roundIndex);
                tell = true;
            }

            // if another player wins a round and gets schmier this is a weak indication she does not have the ace
            if (round.getWinningPlayer() !== this.gameMode.getCallingPlayer()
                && round.hasSchmier()
                && <number>round.getSchmierCardIndex() > round.getWinningCardIndex()
                && roundIndex <= 5
            ) {
                let players = difference(round.getSchmierPlayer(), [this.thisPlayer, round.getWinningPlayer(), this.gameMode.getCallingPlayer()!]);

                for (let player of players) {
                    this.markPlayerAsPossiblePartnerBySchmierToOtherPlayer(player, roundIndex);
                    tell = true;
                }
            }

            if (this.gameMode.getOrdering().getColor(round.getWinningCard()) === ColorWithTrump.TRUMP
                && roundIndex <= 5
            ) {
                for (let card of round.getCards()) {
                    if (this.gameMode.getOrdering().getColor(card) === ColorWithTrump.TRUMP
                        && card != round.getWinningCard()
                        && card[1] == "O"
                    ) {
                        let player = round.getPlayerForCard(card);

                        if (round.getWinningPlayer() == this.gameMode.getCallingPlayer()
                            && player.getName() != this.thisPlayer.getName()
                        ) {
                            this.markPlayerAsPossiblePartnerByGivingUpOberToOtherPlayer(player, roundIndex);
                            tell = true;
                        }
                    }
                }
            }

            if (tell) {
                this.roundsWithTell = this.roundsWithTell + 1;
            }
        }

        // color free assumptions
        if (this.gameMode.getOrdering().getColor(round.getWinningCard()) === ColorWithTrump.TRUMP
            && roundIndex <= 5
        ) {
            if (round.getRoundColor() == ColorWithTrump.TRUMP) {
                let i = 0;
                for (let card of round.getCards()) {
                    if (this.gameMode.getOrdering().getColor(card) === ColorWithTrump.TRUMP
                        && (card[1] == "O" || card[1] == "X" || card[1] == "A")
                    ) {
                        let player = round.getPlayerForCard(card);

                        if (!this.isPlayerLikelyMitspieler(player)) {
                            let {reasons} = this.possiblyColorFreeScores[player + round.getRoundColor()] || {reasons: []};
                            reasons.push(`player ${player} possibly forced to play high value card ${card} to opponent in round ${roundIndex}`);
                            this.possiblyColorFreeScores[player + ColorWithTrump.TRUMP] = {assumption: true, reasons};
                        }
                    }
                    i = i + 1;
                }
            }
        }

        // detect color frees before partner assignment??
        if ((this.gameKnowledge.isTeamPartnerKnown()
            && this.gameKnowledge.getHasCalledAceBeenPlayed() || this.gameMode.isSinglePlay())
            && roundIndex <= 5
        ) {
            let schmierPlayer = round.getSchmierPlayer();

            let opponentSchmiers;
            if (this.gameKnowledge.getNonPlayingTeam().indexOf(round.getWinningPlayer()) !== -1) {
                opponentSchmiers = intersection(this.gameKnowledge.getPlayingTeam(), schmierPlayer);
            } else {
                opponentSchmiers = intersection(this.gameKnowledge.getNonPlayingTeam(), schmierPlayer);
            }

            for (let player of opponentSchmiers) {
                let {reasons} = this.possiblyColorFreeScores[player + round.getRoundColor()] || {reasons: []};
                reasons.push(`player ${player} schmiers opponent in round ${roundIndex}`);
                this.possiblyColorFreeScores[player + round.getRoundColor()] = {assumption: true, reasons};
            }
        }
    }

    getPossiblePartner(): PlayerWithNameOnly | undefined {
        return this.getPossibleTeamPartnerForPlayer(this.thisPlayer).player;
    }

    getPossiblyHighestTrumpOfPartner(): Card {
        let possiblePartner = this.getPossiblePartner();
        if (possiblePartner) {
            return this.getProbablyHighestTrumpByPlayer(possiblePartner);
        } else {
            return this.gameKnowledge.getRemainingCards()[0] as Card;
        }

    }

    isOpposingTeamPossiblyColorFree(color: ColorWithTrump): boolean {
        let opposingTeam = this.getLikelyOpposingTeam();
        if (!opposingTeam) {
            return false;
        }

        for (let opponent of opposingTeam) {
            if (!this.isPlayerPossiblyColorFree(opponent, color).assumption) {
                return false;
            }
        }

        return true;
    }

    isPlayerProbablyTrumpFree(player: Player): boolean {
        return this.isPlayerPossiblyColorFree(player, ColorWithTrump.TRUMP).assumption;
    }

    isTeampartnerProbablyKnown(): boolean {
        return !!this.getPossibleTeamPartnerForPlayer(this.thisPlayer).player;
    }

    isThisRoundProbablyLost(round: Round): boolean {
        let winningCard = round.getWinningCard();
        let winningPlayer = round.getWinningPlayer();
        let opposingTeam = this.getLikelyOpposingTeam();
        let partner = this.getPossiblePartner();
        let currentHandCards = this.gameKnowledge.getCurrentHandCards();
        let winningCardColor = this.gameMode.getOrdering().getColor(winningCard);
        let rank = this.gameKnowledge.getCurrentRankOfCardInColor(winningCard);
        let myBestPlayableCard = getPlayableCards(currentHandCards, this.gameMode, round)[0];
        let myBestRank = this.gameKnowledge.getCurrentRankOfCardInColor(myBestPlayableCard);
        let colorOfMyBestCard = this.gameMode.getOrdering().getColor(myBestPlayableCard);
        let myBestCardBeatsCurrentBestCard = this.gameMode.getOrdering().rightBeatsLeftCard(winningCard, myBestPlayableCard);
        let roundBelongsToOpposingTeam = includes(opposingTeam, winningPlayer);

        if (!partner) {
            return !myBestCardBeatsCurrentBestCard;
        }

        let partnerIsBehindMe = round.isLeftPlayerBeforeRightPlayer(this.thisPlayer.getName(), partner.getName());

        if (rank == 0 && winningCardColor == ColorWithTrump.TRUMP && roundBelongsToOpposingTeam) {
            return true;
        }

        let ownColorCount = getCardLengthsByColor(this.gameKnowledge.getCurrentHandCards(), this.gameMode)[winningCardColor];

        if (rank == 0
            && roundBelongsToOpposingTeam
            && !this.gameKnowledge.hasColorBeenAngespielt(winningCardColor)
            && winningCardColor != ColorWithTrump.TRUMP
            && round.getPosition() < 3
            && !includes(opposingTeam, round.getLastPlayer())
            && ownColorCount < 3) {
            return true;
        }

        if (winningCardColor == ColorWithTrump.TRUMP
            && roundBelongsToOpposingTeam
            && rank < myBestRank
            && colorOfMyBestCard == ColorWithTrump.TRUMP
            && !partnerIsBehindMe) {
            return true;
        }

        if (!partnerIsBehindMe && roundBelongsToOpposingTeam && !myBestCardBeatsCurrentBestCard) {
            return true
        }

        return false;
    }

    isThisRoundProbablyWon(round: Round): boolean {
        return !this.isThisRoundProbablyLost(round);
    }

    willLikelyWinRoundWithCard(round: Round, card: Card): boolean {
        let isThisRoundProbablyLost = this.isThisRoundProbablyLost(round);

        if (isThisRoundProbablyLost) {
            return false;
        }

        let winningCard = round.getWinningCard();
        let partner = this.getPossiblePartner();
        let roundColor = round.getRoundColor();
        let colorOfCard = this.gameMode.getOrdering().getColor(card);
        let isInBackHandPosition = round.getPosition() == 3 || round.getPosition() == 2 && partner == round.getLastPlayer();

        if (colorOfCard == ColorWithTrump.TRUMP
            && roundColor != ColorWithTrump.TRUMP
            && !this.gameKnowledge.hasColorBeenAngespielt(roundColor)) {
            return true;
        }

        if (card[1] as CardRank == "A"
            && this.gameKnowledge.hasColorBeenAngespielt(roundColor)
            && roundColor == card[0] as ColorWithTrump
            && roundColor != ColorWithTrump.TRUMP) {
            return true;
        }

        if (this.gameKnowledge.getCurrentRankOfCardInColor(card) < 2
            && colorOfCard == ColorWithTrump.TRUMP) {
        }

        if (this.gameMode.getOrdering().rightBeatsLeftCard(winningCard, card)
            && isInBackHandPosition) {
            return true
        }

        return false;
    }

    getLikelyOpposingTeam() {
        let partner = this.getPossiblePartner();
        if (!partner) {
            return null;
        }

        return without(this.players, this.thisPlayer, partner);
    }

    private scorePlayer(player: PlayerWithNameOnly, scoreAdd: number, reason: string) {
        let {score, reasons} = this.possibleTeamPartnerScores[player.getName()]!;

        reasons.push(reason);
        score = score + scoreAdd;

        this.possibleTeamPartnerScores[player.getName()] = {
            score,
            reasons
        };
    }

    private markPlayerAsPossiblePartnerByTrump(round: FinishedRound, roundIndex: number) {
        if (this.thisPlayer.getName() === this.gameMode!.getCallingPlayer().getName()) {
            let player = round.getStartPlayer();
            this.scorePlayer(player, 0.9, `${player} begins with trump in round ${roundIndex}`);
        } else {
            let potentialPartner = difference(this.otherPlayersWithoutCaller, [round.getStartPlayer()]).pop()!;
            this.scorePlayer(potentialPartner, 0.9, `${round.getStartPlayer()} begins with trump in round ${roundIndex}`);
        }
    }

    private markPlayerAsPossiblePartnerBySchmier(schmierer: PlayerWithNameOnly, roundIndex: number) {
        if (this.thisPlayer.getName() === this.gameMode!.getCallingPlayer().getName()) {
            this.scorePlayer(schmierer, 0.8, `${schmierer} schmiers calling player in round ${roundIndex}`);
        } else {
            let potentialPartner = difference(this.otherPlayersWithoutCaller, [schmierer]).pop()!;
            this.scorePlayer(potentialPartner, 0.8, `${schmierer} schmiers calling player in round ${roundIndex}`);
        }
    }

    private markPlayerAsPossiblePartnerByColorPlay(player: PlayerWithNameOnly, roundIndex: number) {
        let reason = `${player} plays color calling player in round ${roundIndex}`;
        if (this.thisPlayer.getName() === this.gameMode!.getCallingPlayer().getName()) {
            this.scorePlayer(player, -0.5, reason);
        } else {
            this.scorePlayer(player, 0.5, reason);
        }
    }

    private markPlayerAsPossiblePartnerBySchmierToOtherPlayer(player: PlayerWithNameOnly, roundIndex: number) {
        let reason = `${player} schmiers color in round ${roundIndex} to other player`;
        if (this.thisPlayer.getName() === this.gameMode!.getCallingPlayer().getName()) {
            this.scorePlayer(player, -0.25, reason);
        } else {
            this.scorePlayer(player, 0.25, reason);
        }
    }

    private markPlayerAsPossiblePartnerByGivingUpOberToOtherPlayer(player: PlayerWithNameOnly, roundIndex: number) {
        let reason = `${player} plays ober but looses in round ${roundIndex} to other player`;
        if (this.thisPlayer.getName() === this.gameMode!.getCallingPlayer().getName()) {
            this.scorePlayer(player, -0.25, reason);
        } else {
            this.scorePlayer(player, 0.25, reason);
        }
    }

    private isPlayerLikelyMitspieler(otherPlayer: PlayerWithNameOnly) {
        if (otherPlayer.getName() == this.gameMode.getCallingPlayer().getName()) {
            return {assumption: true, confidence: 1, reasons: ['is calling player']};
        }
        let {player, confidence, reasons} = this.getPossibleTeamPartnerForPlayer(otherPlayer);
        if (player && player.getName() == this.gameMode.getCallingPlayer().getName()) {
            return {assumption: true, confidence, reasons};
        } else {
            reasons.push(`likely partner ${player} is not calling player!`);
            return {assumption: false, confidence, reasons};
        }
    }
}