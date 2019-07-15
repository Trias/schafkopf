import {GameWorld} from "../../../GameWorld";
import {Card, cardToValue} from "../../../cards/Card";
import {getCardsByColor} from "../../../cards/CardSet";
import {callableColors} from "../../../cards/Color";
import {Round} from "../../../Round";
import {GameMode} from "../../../GameMode";
import {clone, reverse} from "lodash";

export function filterBadPairs(world: GameWorld, playableCards: Card[]) {
    let cardsByColorNoTrump = getCardsByColor(playableCards.filter(card => !world.gameMode.getOrdering().isTrump(card)), world.gameMode);

    let goodCards: Card[] = [];

    for (let color of callableColors) {
        if (!(cardsByColorNoTrump[color].length == 2 && cardsByColorNoTrump[color][0][1] == "X" && cardToValue(cardsByColorNoTrump[color][1]) <= 4
            || cardsByColorNoTrump[color].length == 1 && cardToValue(cardsByColorNoTrump[color][0]) >= 10
            || cardsByColorNoTrump[color].length == 2 && cardToValue(cardsByColorNoTrump[color][0]) >= 10 && cardToValue(cardsByColorNoTrump[color][0]) >= 10
        )) {
            goodCards = goodCards.concat(cardsByColorNoTrump[color]);
        }
    }

    return goodCards;
}

export function getWinningCards(playableCards: Card[], round: Round, gameMode: GameMode) {
    let winningCards = [];
    let roundAnalyzer = round.getRoundAnalyzer(gameMode);

    for (let card of playableCards) {
        if (gameMode.getOrdering().rightBeatsLeftCard(roundAnalyzer.getHighestCard(), card)) {
            winningCards.push(card);
        }
    }

    return winningCards;
}

export function sortByPointsAscending(cardSet: Card[]) {
    let pointsRanking = ["A", "X", "K", "O", "U", "9", "8", "7"];
    return clone(cardSet).sort((a, b) => pointsRanking.indexOf(b[1]) - pointsRanking.indexOf(a[1]));
}

export function sortByPointsDescending(cardSet: Card[]) {
    return reverse(sortByPointsAscending(cardSet));
}

export function areWeBothHinterhand(world: GameWorld, partnerName: string | null) {
    return world.round.isHinterHand() || world.round.getPosition() == 2 && world.round.getLastPlayerName() === partnerName;
}

export function areOpponentsBothHinterhand(world: GameWorld, partnerName: string | null) {
    return world.round.getPosition() == 0 && world.round.getNextPlayerName() === partnerName || world.round.getPosition() == 1 && world.round.getStartPlayerName() === partnerName;
}

export function canForceWinTrumpRound(remainingTrumps: Card[], card: Card) {
    if (remainingTrumps[0] == card) {
        return true;
    } else {
        return false;
    }
}