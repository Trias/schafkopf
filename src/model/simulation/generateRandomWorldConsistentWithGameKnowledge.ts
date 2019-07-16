import {PlayerMap} from "../Player";
import {difference, remove, sample, shuffle, without} from "lodash";
import {Card} from "../cards/Card";
import {removeCard} from "../cards/CardSet";
import {GameWorld} from "../GameWorld";
import {DummyPlayer} from "./DummyPlayer";
import {CardPlayStrategy} from "../strategy/CardPlayStrategy";
import GameAssumptions from "../knowledge/GameAssumptions";

export function generateRandomWorldConsistentWithGameKnowledge(world: GameWorld, playerName: string, strategyConstructor: new (name: string, startCardSet: Card[], assumptions: GameAssumptions) => CardPlayStrategy): GameWorld {
    let thisPlayer = world.playerMap[playerName];

    let remainingCardsWithoutHandCards = difference(world.history.getRemainingCards(), [...thisPlayer.getStartCardSet(), ...world.round.getPlayedCards()]);
    let shuffledRemainingCards = shuffle(remainingCardsWithoutHandCards) as Card[];
    let remainingCardsWithoutHandCardsByColor = world.history.getRemainingCardsByColorWithoutCardSet([...thisPlayer.getStartCardSet(), ...world.round.getPlayedCards()]);

    let colorFreeByPlayer = world.history.getColorFreeByPlayerNameWithoutMyCards(playerName, thisPlayer.getStartCardSet());

    let otherPlayerNames = without(Object.keys(world.playerMap), playerName);
    let cardsToPossiblePlayerNames: { [index in string]?: string[] } = {};

    let playerToCards: { [index in string]?: Card[] } = {};
    let playerToPossibleCards: { [index in string]?: Card[] } = {};
    let overflow = remainingCardsWithoutHandCards.length % 3;
    let numberOfCardsPerPlayer: { [index in string]?: number } = {};

    for (let otherPlayerName of otherPlayerNames) {
        playerToCards[otherPlayerName] = [];
        playerToPossibleCards[otherPlayerName] = [];
        numberOfCardsPerPlayer[otherPlayerName] = Math.floor(remainingCardsWithoutHandCards.length / 3);
    }

    // if this simulation is made in the middle of the round...
    let lastPlayerName = world.round.getCurrentPlayerName();
    while (overflow > 0) {
        let playerName = world.round.playerAfter(lastPlayerName);

        lastPlayerName = playerName;
        numberOfCardsPerPlayer[playerName]!++;
        overflow--;
    }

    for (let card of remainingCardsWithoutHandCards) {
        let color = world.gameMode.getOrdering().getColor(card);
        cardsToPossiblePlayerNames[card] = [];
        for (let playerName of otherPlayerNames) {
            if (!colorFreeByPlayer[playerName][color]) {
                cardsToPossiblePlayerNames[card]!.push(playerName);
                playerToPossibleCards[playerName]!.push(card);
            }
        }
    }

    function assignCardAndUpdateConstraints(playerName: string, card: Card) {
        playerToCards[playerName]!.push(card);
        remainingCardsWithoutHandCards = removeCard(remainingCardsWithoutHandCards, card);
        shuffledRemainingCards = removeCard(shuffledRemainingCards, card) as Card[];
        if (remainingCardsWithoutHandCards.length != shuffledRemainingCards.length) {
            throw Error('invariant violated');
        }
        cardsToPossiblePlayerNames[card] = [];
        for (let playerName of otherPlayerNames) {
            remove(playerToPossibleCards[playerName]!, card);
        }
    }

    function assignCardsAndUpdateConstraints(playerName: string, cards: Card[]) {
        for (let card of cards) {
            assignCardAndUpdateConstraints(playerName, card);
        }
    }

    function checkAndAssignForcedCardSets() {
        for (let playerName of otherPlayerNames) {
            let possibleCards = playerToPossibleCards[playerName]!;
            if (possibleCards.length && possibleCards.length == numberOfCardsPerPlayer[playerName]! - playerToCards[playerName]!.length) {
                assignCardsAndUpdateConstraints(playerName, possibleCards);
            } else if (possibleCards.length < numberOfCardsPerPlayer[playerName]! - playerToCards[playerName]!.length) {
                throw Error('impossible to assign cards!');
            }
        }
    }

    function assignForcedCards() {
        checkAndAssignForcedCardSets();

        for (let card of remainingCardsWithoutHandCards) {
            if (cardsToPossiblePlayerNames[card]!.length == 1) {
                assignCardAndUpdateConstraints(cardsToPossiblePlayerNames[card]![0], card);
                // inelegant restart....
                assignForcedCards();
                break;
            } else if (cardsToPossiblePlayerNames[card]!.length == 0) {
                throw Error('impossible to assign cards');
            }
        }
    }

    // rufer kann nicht das ruf ass haben
    if (world.gameMode.isCallGame()) {
        remove(cardsToPossiblePlayerNames[world.gameMode.getCalledAce()!]!, (playerName) => playerName == world.gameMode.getCallingPlayerName());
        remove(playerToPossibleCards[world.gameMode.getCallingPlayerName()]!, card => card == world.gameMode.getCalledAce());
    }
    // rufer muss eine ruf farben karte haben...
    if (world.gameMode.isCallGame()
        && !world.history.isTeamPartnerKnownToMe(thisPlayer.getStartCardSet())
        && !world.history.hasPlayerAbspatzenCallColor()
        && world.gameMode.getCallingPlayerName() != playerName) {

        let callColorCard = sample(without(remainingCardsWithoutHandCardsByColor[world.gameMode.getCalledColor()]!, world.gameMode.getCalledAce()!));
        if (callColorCard) {
            playerToCards[world.gameMode.getCallingPlayerName()]!.push(callColorCard);
            remainingCardsWithoutHandCards = removeCard(remainingCardsWithoutHandCards, callColorCard);
            shuffledRemainingCards = removeCard(shuffledRemainingCards, callColorCard) as Card[];
            if (remainingCardsWithoutHandCards.length != shuffledRemainingCards.length) {
                throw Error('invariant violated');
            }
        } else {
            // sad sad but we assume all is well... may happen if player has abgespatzed the color.. we currently do not track this well
        }

    }

    assignForcedCards();

    // do player to possible card...

    let i = 0;
    while (shuffledRemainingCards.length > 0 && i < 3) {
        let playerName = otherPlayerNames[i];
        let card = shuffledRemainingCards[0];
        //let player = sample(differenceWith(cardsToPossiblePlayer[card]!, fullPlayers, (p1, p2) => p1.getName() == p2.getName()) as Player[]) as Player;

        if (numberOfCardsPerPlayer[playerName]! > playerToCards[playerName]!.length) {
            assignCardAndUpdateConstraints(playerName, card);
        } else {
            i++;
            //fullPlayers.push(player);
            for (let [card, possiblePlayerNames] of Object.entries(cardsToPossiblePlayerNames)) {
                cardsToPossiblePlayerNames[card] = without(possiblePlayerNames, playerName);
            }
        }

        checkAndAssignForcedCardSets();
    }

    if (shuffledRemainingCards.length > 0) {
        throw Error('no all cards assigned!')
    }

    let playerMap: PlayerMap = {};
    playerMap[playerName] = thisPlayer.getDummyClone(world, strategyConstructor);
    for (let playerName of otherPlayerNames) {
        let startCardSet = playerToCards[playerName]!.concat(world.history.getPlayedCardsByPlayer(playerName));

        let currentCardSet = playerToCards[playerName]!;

        playerMap[playerName] = new DummyPlayer(playerName, world.playerNames, world.gameMode, world.history, startCardSet, currentCardSet, world.rounds, world.round, strategyConstructor);

        if (startCardSet.length != 8) {
            throw Error('startcardset must have 8 cards');
        }
    }

    return world.cloneWithNewPlayerMap(playerMap);
}