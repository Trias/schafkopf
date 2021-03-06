import {Card} from "../cards/Card";
import {GameMode, GameModeEnum} from "../GameMode";
import {FinishedRound, Round} from "../Round";
import {ColorWithTrump} from "../cards/Color";
import {difference, filter, includes, intersection, without} from "lodash";
import GameAssumptions, {PlayerConfidence} from "./GameAssumptions";
import {getCardLengthsByColor} from "../cards/CardSet";
import {getPlayableCards} from "../PlayableMoves";
import CardRank from "../cards/CardRank";
import {RoundAnalyzer} from "./RoundAnalyzer";
import {GameHistory} from "./GameHistory";

type TeamPartnerScore = {
    score: number, reasons: string[]
};

export type ColorFreeAssumption = {
    assumption: boolean, reasons: string[]
};

export class GameAssumptionsInCallGame implements GameAssumptions {
    private readonly gameHistory: GameHistory;
    private readonly thisPlayerName: string;
    private readonly gameMode: GameMode;
    private readonly possibleTeamPartnerScores: { [index in string]: TeamPartnerScore };
    private readonly playerNames: readonly string[];
    private readonly possiblyColorFreeScores: { [index in string]: ColorFreeAssumption };
    private roundsWithTell: number;
    private readonly otherPlayerNamesWithoutCaller?: string[];
    private probablyHighestTrump: { [index in string]: Card } = {};
    private readonly startCardSet: Card[];

    // private otherPlayers?: [Player, Player, Player];

    constructor(history: GameHistory, thisPlayerName: string, playerNames: string[], gameMode: GameMode, startCardSet: Card[], rounds: FinishedRound[] = [], round: Round | null = null) {
        this.thisPlayerName = thisPlayerName;
        this.gameHistory = history;
        this.playerNames = playerNames;
        this.startCardSet = startCardSet;
        this.possibleTeamPartnerScores = {};
        this.possiblyColorFreeScores = {};
        this.roundsWithTell = 0;

        this.gameMode = gameMode;
        this.otherPlayerNamesWithoutCaller = filter(this.playerNames, p => p != this.thisPlayerName && p != this.gameMode.getCallingPlayerName())!;

        if (this.otherPlayerNamesWithoutCaller.length == 0) {
            throw Error('empty other playerNames');
        }
        for (let playerName of this.otherPlayerNamesWithoutCaller) {
            this.possibleTeamPartnerScores[playerName] = {score: 0, reasons: []};
        }

        let i = 0;
        if (rounds.length) {
            for (let round of rounds) {
                // replay if called with round data... on card played analyzed whole round, so it's okay..
                this.onCardPlayed(round as Round, i);
                this.onRoundCompleted(round, i);
            }
            i++;
        }

        if (round && !round.isEmpty()) {
            this.onCardPlayed(round, i);
        }
    }

    getPossibleTeamPartnerForPlayerName(playerName: string): PlayerConfidence {
        if (playerName == this.thisPlayerName) {
            if (this.gameHistory.isTeamPartnerKnownToMe(this.startCardSet)) {
                let partnerName = this.gameHistory.getTeamPartnerNameForPlayerName(this.thisPlayerName, this.startCardSet)!;
                let reasons = ['knowledge: i have the ace'];
                if (this.possibleTeamPartnerScores[partnerName]) {
                    reasons = reasons.concat(this.possibleTeamPartnerScores[partnerName]!.reasons)
                }
                return {playerName: partnerName, confidence: 1, reasons: reasons}
            }
        }
        if (this.gameHistory.isTeamPartnerKnown()) {
            let partnerName = this.gameHistory.getTeamPartnerNameForPlayerName(playerName, this.startCardSet)!;
            let reasons = ['knowledge: publically known'];
            if (this.possibleTeamPartnerScores[partnerName]) {
                reasons = reasons.concat(this.possibleTeamPartnerScores[partnerName]!.reasons)
            }
            return {playerName: partnerName, confidence: 1, reasons: reasons}
        }
        let highestScore = 0;
        let partner = null;
        let reasons = ["no tells"];
        let confidence = 0;

        for (let playerCandidateName of this.playerNames) {
            if (playerCandidateName in this.possibleTeamPartnerScores) {
                let scoreWithReasons = this.possibleTeamPartnerScores[playerCandidateName];
                if (scoreWithReasons.score > highestScore) {
                    partner = playerCandidateName;
                    highestScore = scoreWithReasons.score;
                    reasons = scoreWithReasons.reasons;
                    confidence = highestScore; // / this.roundsWithTell;
                } else if (scoreWithReasons.score == highestScore && highestScore > 0) {
                    reasons = [`equal score of player ${playerName} and ${playerCandidateName}`].concat(scoreWithReasons.reasons).concat(reasons);
                    partner = null;
                    confidence = 0;
                }
            }
        }

        return {playerName: partner, confidence, reasons};
    }

    isPlayerNamePossiblyColorFree(playerName: string, color: ColorWithTrump): ColorFreeAssumption {
        if (this.gameHistory.isPlayerNameColorFree(playerName, color)) {
            let reasons = ['knowledge'];
            reasons = reasons.concat((this.possiblyColorFreeScores[playerName + color] || {reasons: []}).reasons);
            return {assumption: true, reasons};
        } else {
            return this.possiblyColorFreeScores[playerName + color] || {assumption: false, reasons: []};
        }
    }

    getProbablyHighestTrumpByPlayerName(playerName: string) {
        return this.probablyHighestTrump[playerName]!
    }

    onCardPlayed(round: Round, roundIndex: number) {
        let roundAnalyzer = new RoundAnalyzer(round as Round, this.gameMode);
        if (this.gameMode.getMode() == GameModeEnum.CALL_GAME && !this.gameHistory.isTeamPartnerKnownToMe(this.startCardSet)) {
            let tell = false;
            // if another player plays trump this is a good indication she has the ace.
            if (round.getStartPlayerName() !== this.thisPlayerName) {
                if (roundAnalyzer.getRoundColor() == ColorWithTrump.TRUMP
                    && round.getStartPlayerName() !== this.gameMode.getCallingPlayerName()
                    && roundIndex < 5
                ) {
                    this.markPlayerAsPossiblePartnerByTrump(round, roundIndex);
                    tell = true;
                }
            }

            // if another player schmiers the calling player this is a good indication she has the ace
            if (roundAnalyzer.getHighestCardPlayerName() == this.gameMode.getCallingPlayerName() && round.hasPlayerPlayed(this.gameMode.getCallingPlayerName())
                && roundAnalyzer.hasOffColorSchmier()
                && roundIndex < 5) {
                let player = roundAnalyzer.getOffColorSchmierPlayerName();
                if (player && player != this.thisPlayerName) {
                    this.markPlayerAsPossiblePartnerBySchmier(player, roundIndex);
                    tell = true;
                }
            }

            // if another player begins with color this is a somewhat good indication she does not have the ace
            if (roundAnalyzer.getRoundColor() !== ColorWithTrump.TRUMP
                && round.getStartPlayerName() !== this.gameMode.getCallingPlayerName()
                && round.getStartPlayerName() !== this.thisPlayerName
                && roundIndex < 5
            ) {
                let player = round.getStartPlayerName();
                this.markPlayerAsPossiblePartnerByColorPlay(player, roundIndex);
                tell = true;
            }

            // if another player wins a round and gets schmier this is a weak indication she does not have the ace
            if (roundAnalyzer.getHighestCardPlayerName() !== this.gameMode.getCallingPlayerName()
                && roundAnalyzer.hasSchmier()
                && <number>roundAnalyzer.getSchmierCardIndex() > roundAnalyzer.getHighestCardPosition()
                && roundIndex < 5
            ) {
                let players = difference(roundAnalyzer.getSchmierPlayerNames(), [this.thisPlayerName, roundAnalyzer.getHighestCardPlayerName(), this.gameMode.getCallingPlayerName()!]);

                for (let player of players) {
                    this.markPlayerAsPossiblePartnerBySchmierToOtherPlayer(player, roundIndex);
                    tell = true;
                }
            }

            /*
            if (this.gameMode.getOrdering().getColor(roundAnalyzer.getHighestCard()) === ColorWithTrump.TRUMP
                && roundIndex < 5
            ) {
                for (let card of round.getPlayedCards()) {
                    if (this.gameMode.getOrdering().getColor(card) === ColorWithTrump.TRUMP
                        && card != roundAnalyzer.getHighestCard()
                        && card[1] == "O"
                    ) {
                        let playerName = round.getPlayerNameForCard(card);

                        if (roundAnalyzer.getWinningPlayerName() == this.gameMode.getCallingPlayerName()
                            && playerName !=this.thisPlayerName
                        ) {
                            this.markPlayerAsPossiblePartnerByGivingUpOberToOtherPlayer(playerName, roundIndex);
                            tell = true;
                        }
                    }
                }
            }
             */

            if (tell) {
                this.roundsWithTell = this.roundsWithTell + 1;
            }
        }
    }

    onRoundCompleted(round: FinishedRound, roundIndex: number): void {
        let roundAnalyzer = new RoundAnalyzer(round as Round, this.gameMode);

        // color free assumptions
        if (this.gameMode.getOrdering().getColor(roundAnalyzer.getHighestCard()) === ColorWithTrump.TRUMP
            && roundIndex <= 5
        ) {
            if (roundAnalyzer.getRoundColor() == ColorWithTrump.TRUMP) {
                let i = 0;
                for (let card of round.getPlayedCards()) {
                    if (this.gameMode.getOrdering().getColor(card) === ColorWithTrump.TRUMP
                        && (card[1] == "O" || card[1] == "X" || card[1] == "A")
                    ) {
                        let player = round.getPlayerNameForCard(card);

                        if (!this.isPlayerLikelyMitspieler(player)) {
                            let {reasons} = this.possiblyColorFreeScores[player + roundAnalyzer.getRoundColor()] || {reasons: []};
                            reasons.push(`player ${player} possibly forced to play high value card ${card} to opponent in round ${roundIndex + 1}`);
                            this.possiblyColorFreeScores[player + ColorWithTrump.TRUMP] = {assumption: true, reasons};
                        }
                    }
                    i = i + 1;
                }
            }
        }

        // detect color frees before partner assignment??
        if ((this.gameHistory.isTeamPartnerKnown() || this.gameMode.isSinglePlay())
            && roundIndex <= 5
        ) {
            let schmierPlayer = roundAnalyzer.getSchmierPlayerNames();

            let opponentSchmiers;
            if (this.gameHistory.getNonPlayingTeam().indexOf(roundAnalyzer.getWinningPlayerName()) !== -1) {
                opponentSchmiers = intersection(this.gameHistory.getPlayingTeamNames(), schmierPlayer);
            } else {
                opponentSchmiers = intersection(this.gameHistory.getNonPlayingTeam(), schmierPlayer);
            }

            for (let player of opponentSchmiers) {
                let {reasons} = this.possiblyColorFreeScores[player + roundAnalyzer.getRoundColor()] || {reasons: []};
                reasons.push(`player ${player} schmiers opponent in round ${roundIndex + 1}`);
                this.possiblyColorFreeScores[player + roundAnalyzer.getRoundColor()] = {assumption: true, reasons};
            }
        }
    }

    getPossiblePartnerName(): string | null {
        return this.getPossibleTeamPartnerForPlayerName(this.thisPlayerName).playerName;
    }

    getPossiblyHighestTrumpOfPartner(): Card {
        let possiblePartner = this.getPossiblePartnerName();
        if (possiblePartner) {
            return this.getProbablyHighestTrumpByPlayerName(possiblePartner);
        } else {
            return this.gameHistory.getRemainingCards()[0] as Card;
        }

    }

    isOpposingTeamPossiblyColorFree(color: ColorWithTrump): boolean {
        let opposingTeam = this.getLikelyOpposingTeam();
        if (!opposingTeam) {
            return false;
        }

        for (let opponent of opposingTeam) {
            if (!this.isPlayerNamePossiblyColorFree(opponent, color).assumption) {
                return false;
            }
        }

        return true;
    }

    isPlayerNameProbablyTrumpFree(playerName: string): boolean {
        return this.isPlayerNamePossiblyColorFree(playerName, ColorWithTrump.TRUMP).assumption;
    }

    isTeampartnerProbablyKnown(): boolean {
        return !!this.getPossibleTeamPartnerForPlayerName(this.thisPlayerName).playerName;
    }

    isThisRoundProbablyLost(round: Round, currentHandCards: Card[]): boolean {
        let roundAnalyzer = new RoundAnalyzer(round, this.gameMode);
        let winningCard = roundAnalyzer.getWinningCard();
        let winningPlayer = roundAnalyzer.getWinningPlayerName();
        let opposingTeam = this.getLikelyOpposingTeam();
        let partnerName = this.getPossiblePartnerName();
        let winningCardColor = this.gameMode.getOrdering().getColor(winningCard);
        let rank = this.gameHistory.getCurrentRankOfCardInColor(winningCard, round.getPlayedCards());
        let myBestPlayableCard = getPlayableCards(currentHandCards, this.gameMode, round)[0];
        let myBestRank = this.gameHistory.getCurrentRankOfCardInColor(myBestPlayableCard, round.getPlayedCards());
        let colorOfMyBestCard = this.gameMode.getOrdering().getColor(myBestPlayableCard);
        let myBestCardBeatsCurrentBestCard = this.gameMode.getOrdering().rightBeatsLeftCard(winningCard, myBestPlayableCard);
        let roundBelongsToOpposingTeam = includes(opposingTeam, winningPlayer);

        if (!partnerName) {
            return !myBestCardBeatsCurrentBestCard;
        }

        let partnerIsBehindMe = round.isLeftPlayerBeforeRightPlayer(this.thisPlayerName, partnerName);

        if (rank == 0 && winningCardColor == ColorWithTrump.TRUMP && roundBelongsToOpposingTeam) {
            return true;
        }

        let ownColorCount = getCardLengthsByColor(currentHandCards, this.gameMode)[winningCardColor];

        if (rank == 0
            && roundBelongsToOpposingTeam
            && !this.gameHistory.hasColorBeenAngespielt(winningCardColor)
            && winningCardColor != ColorWithTrump.TRUMP
            && round.getPosition() < 3
            && !includes(opposingTeam, round.getLastPlayerName())
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

    isThisRoundProbablyWon(round: Round, currentHandCards: Card[]): boolean {
        return !this.isThisRoundProbablyLost(round, currentHandCards);
    }

    willLikelyWinRoundWithCard(round: Round, card: Card, currentHandCards: Card[]): boolean {
        let roundAnalyzer = new RoundAnalyzer(round, this.gameMode);
        let isThisRoundProbablyLost = this.isThisRoundProbablyLost(round, currentHandCards);

        if (isThisRoundProbablyLost) {
            return false;
        }

        let winningCard = roundAnalyzer.getWinningCard();
        let partner = this.getPossiblePartnerName();
        let roundColor = roundAnalyzer.getRoundColor();
        let colorOfCard = this.gameMode.getOrdering().getColor(card);
        let isInBackHandPosition = round.getPosition() == 3 || round.getPosition() == 2 && partner == round.getLastPlayerName();

        if (colorOfCard == ColorWithTrump.TRUMP
            && roundColor != ColorWithTrump.TRUMP
            && !this.gameHistory.hasColorBeenAngespielt(roundColor)) {
            return true;
        }

        if (card[1] as CardRank == "A"
            && !this.gameHistory.hasColorBeenAngespielt(roundColor)
            && roundColor == card[0] as ColorWithTrump
            && roundColor != ColorWithTrump.TRUMP) {
            return true;
        }

        if (this.gameHistory.getCurrentRankOfCardInColor(card, round.getPlayedCards()) < 2
            && colorOfCard == ColorWithTrump.TRUMP) {
        }

        if (this.gameMode.getOrdering().rightBeatsLeftCard(winningCard, card)
            && isInBackHandPosition) {
            return true
        }

        return false;
    }

    getLikelyOpposingTeam() {
        let partnerName = this.getPossiblePartnerName();
        if (!partnerName) {
            return null;
        }

        return without(this.playerNames, this.thisPlayerName, partnerName);
    }

    private scorePlayer(playerName: string, scoreAdd: number, reason: string) {
        if (playerName in this.possibleTeamPartnerScores) {
            let {score, reasons} = this.possibleTeamPartnerScores[playerName]!;

            if (!includes(reasons, reason)) {
                reasons.push(reason);
                score = score + scoreAdd;

                this.possibleTeamPartnerScores[playerName] = {
                    score,
                    reasons
                };
            }
        }
    }

    private markPlayerAsPossiblePartnerByTrump(round: FinishedRound, roundIndex: number) {
        // rather not get fooled by Eichel-ober...haha nice one ;)
        let firstCard = round.getPlayedCards()[0];
        let score = this.gameHistory.getCurrentRankWithEqualRanksOfCardInColor([firstCard], ColorWithTrump.TRUMP, round.getPlayedCards())[firstCard] == 0 ? 0 : 0.7;
        if (this.thisPlayerName === this.gameMode!.getCallingPlayerName()) {
            let player = round.getStartPlayerName();
            this.scorePlayer(player, score, `${player} begins with trump in round ${roundIndex + 1}`);
        } else {
            let potentialPartner = difference(this.otherPlayerNamesWithoutCaller, [round.getStartPlayerName()]).pop()!;
            this.scorePlayer(potentialPartner, score, `${round.getStartPlayerName()} begins with trump in round ${roundIndex + 1}`);
        }
    }

    private markPlayerAsPossiblePartnerBySchmier(schmierer: string, roundIndex: number) {
        if (this.thisPlayerName === this.gameMode!.getCallingPlayerName()) {
            this.scorePlayer(schmierer, 0.8, `${schmierer} schmiers calling player in round ${roundIndex + 1}`);
        } else {
            let potentialPartner = difference(this.otherPlayerNamesWithoutCaller, [schmierer]).pop()!;
            this.scorePlayer(potentialPartner, 0.8, `${schmierer} schmiers calling player in round ${roundIndex + 1}`);
        }
    }

    private markPlayerAsPossiblePartnerByColorPlay(player: string, roundIndex: number) {
        let reason = `${player} plays color calling player in round ${roundIndex + 1}`;
        if (this.thisPlayerName === this.gameMode!.getCallingPlayerName()) {
            this.scorePlayer(player, -0.3, reason);
        } else {
            this.scorePlayer(player, 0.3, reason);
        }
    }

    private markPlayerAsPossiblePartnerBySchmierToOtherPlayer(player: string, roundIndex: number) {
        let reason = `${player} schmiers color in round ${roundIndex + 1} to other player`;
        if (this.thisPlayerName === this.gameMode!.getCallingPlayerName()) {
            this.scorePlayer(player, -0.25, reason);
        } else {
            this.scorePlayer(player, 0.25, reason);
        }
    }

    /*
    private markPlayerAsPossiblePartnerByGivingUpOberToOtherPlayer(player: string, roundIndex: number) {
        let reason = `${player} plays ober but looses in round ${roundIndex} to other player`;
        if (this.thisPlayerName === this.gameMode!.getCallingPlayerName()) {
            this.scorePlayer(player, -0.25, reason);
        } else {
            this.scorePlayer(player, 0.25, reason);
        }
    }
    */

    private isPlayerLikelyMitspieler(otherPlayer: string) {
        if (otherPlayer == this.gameMode.getCallingPlayerName()) {
            return {assumption: true, confidence: 1, reasons: ['is calling player']};
        }
        let {playerName, confidence, reasons} = this.getPossibleTeamPartnerForPlayerName(otherPlayer);
        if (playerName && playerName == this.gameMode.getCallingPlayerName()) {
            return {assumption: true, confidence, reasons};
        } else {
            let reason = `likely partner ${playerName} is not calling player!`;
            if (!includes(reasons, reason)) {
                reasons.push(reason);
            }
            return {assumption: false, confidence, reasons};
        }
    }
}