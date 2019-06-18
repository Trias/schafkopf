import GameKnowledge from "../knowledge/GameKnowledge";
import {Player} from "../Player";
import {GameMode} from "../GameMode";
import {clone, remove, sample, shuffle, without} from "lodash";
import {Card} from "../cards/Card";
import {removeCard} from "../cards/CardSet";
import {Round} from "../Round";
import GamePhase from "../GamePhase";

export function generateRandomWorldConsistentWithGameKnowledge(gameMode: GameMode, gameKnowledge: GameKnowledge, otherPlayers: Player[], thisPlayer: Player, round: Round): Player[] {
    let remainingCards = gameKnowledge.getRemainingCards();
    let shuffledRemainingCards = shuffle(remainingCards) as Card[];
    let remainingCardsByColor = gameKnowledge.getRemainingCardsByColor();
    let colorFreeByPlayer = gameKnowledge.getColorFreeByPlayer();

    let players = clone(otherPlayers);
    let cardsToPossiblePlayer: { [index in string]?: Player[] } = {};
    let playerToCards: { [index in string]?: Card[] } = {
        [players[0].getName()]: [],
        [players[1].getName()]: [],
        [players[2].getName()]: [],
    };
    let playerToPossibleCards: { [index in string]?: Card[] } = {
        [players[0].getName()]: [],
        [players[1].getName()]: [],
        [players[2].getName()]: [],
    };

    // if this simulation is made in the middle of the round...
    let overflow = remainingCards.length % 3;
    let numberOfCardsPerPlayer = {
        [players[0].getName()]: Math.floor(remainingCards.length / 3),
        [players[1].getName()]: Math.floor(remainingCards.length / 3),
        [players[2].getName()]: Math.floor(remainingCards.length / 3),
    };

    let lastPlayer = round.getStartPlayer();
    while (overflow > 0) {
        let player = round.playerBefore(lastPlayer.getName());

        lastPlayer = player;
        numberOfCardsPerPlayer[player.getName()]++;
        overflow--;
    }

    for (let card of remainingCards) {
        let color = gameMode.getOrdering().getColor(card);
        cardsToPossiblePlayer[card] = [];
        for (let player of players) {
            if (!colorFreeByPlayer[player.getName()][color]) {
                cardsToPossiblePlayer[card]!.push(player);
                playerToPossibleCards[player.getName()]!.push(card);
            }
        }
    }

    function assignCardAndUpdateConstraints(playerName: string, card: Card) {
        playerToCards[playerName]!.push(card);
        remainingCards = removeCard(remainingCards, card);
        shuffledRemainingCards = removeCard(shuffledRemainingCards, card) as Card[];
        if (remainingCards.length != shuffledRemainingCards.length) {
            throw Error('invariant violated');
        }
        cardsToPossiblePlayer[card] = [];
        for (let player of players) {

            // does it mutate? ...
            remove(playerToPossibleCards[player.getName()]!, card);
        }
    }

    function assignCardsAndUpdateConstraints(playerName: string, cards: Card[]) {
        for (let card of cards) {
            assignCardAndUpdateConstraints(playerName, card);
        }
    }

    function checkAndAssignForcedCardSets() {
        for (let player of players) {
            let possibleCards = playerToPossibleCards[player.getName()]!;
            if (possibleCards.length && possibleCards.length == numberOfCardsPerPlayer[player.getName()] - playerToCards[player.getName()]!.length) {
                assignCardsAndUpdateConstraints(player.getName(), possibleCards);
            } else if (possibleCards.length < numberOfCardsPerPlayer[player.getName()] - playerToCards[player.getName()]!.length) {
                throw Error('impossible to assign cards!');
            }
        }
    }

    function assignForcedCards() {
        checkAndAssignForcedCardSets();

        for (let card of remainingCards) {
            if (cardsToPossiblePlayer[card]!.length == 1) {
                assignCardAndUpdateConstraints(cardsToPossiblePlayer[card]![0].getName(), card);
                // inelegant restart....
                assignForcedCards();
                break;
            } else if (cardsToPossiblePlayer[card]!.length == 0) {
                throw Error('impossible to assign cards');
            }
        }
    }

    // rufer kann nicht das ruf ass haben
    if (gameMode.isCallGame()) {
        remove(cardsToPossiblePlayer[gameMode.getCalledAce()!]!, (player) => player.getName() == gameMode.getCallingPlayer().getName());
        remove(playerToPossibleCards[gameMode.getCallingPlayer().getName()]!, card => card == gameMode.getCalledAce());
    }
    // rufer muss eine ruf farben karte haben...
    if (gameMode.isCallGame() && !gameKnowledge.isTeamPartnerPublicallyKnown() && !gameKnowledge.hasPlayerAbspatzenCallColor()
        && gameMode.getCallingPlayer().getName() != thisPlayer.getName()
    ) {
        let callColorCard = sample(without(remainingCardsByColor[gameMode.getCalledColor()]!, gameMode.getCalledAce()!));
        if (callColorCard) {
            playerToCards[gameMode.getCallingPlayer().getName()]!.push(callColorCard);
            remainingCards = removeCard(remainingCards, callColorCard);
            shuffledRemainingCards = removeCard(shuffledRemainingCards, callColorCard) as Card[];
            if (remainingCards.length != shuffledRemainingCards.length) {
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
        let player = players[i];
        let card = shuffledRemainingCards[0];
        //let player = sample(differenceWith(cardsToPossiblePlayer[card]!, fullPlayers, (p1, p2) => p1.getName() == p2.getName()) as Player[]) as Player;

        if (numberOfCardsPerPlayer[player.getName()] > playerToCards[player.getName()]!.length) {
            assignCardAndUpdateConstraints(player.getName(), card);
        } else {
            i++;
            //fullPlayers.push(player);
            for (let [card, possiblePlayers] of Object.entries(cardsToPossiblePlayer)) {
                cardsToPossiblePlayer[card] = without(possiblePlayers, player) as Player[];
            }
        }

        checkAndAssignForcedCardSets();
    }

    if (shuffledRemainingCards.length > 0) {
        throw Error('no all cards assigned!')
    }


    for (let player of players) {
        player.setCurrentCardSet(playerToCards[player.getName()]!);
        player.startCardSet = playerToCards[player.getName()]!.concat(gameKnowledge.getPlayedCardsByPlayer(player.getName()));
        player.gamePhase = GamePhase.ALL_CARDS_DEALT;
        player.gameKnowledge = new GameKnowledge(player.startCardSet, player, [thisPlayer, ...players]);
        player.players = [thisPlayer, ...players];
        player.onGameModeDecided(gameMode);
        player.gamePhase = GamePhase.IN_PLAY;

        let currentRoundCard = round.getCardForPlayer(player.getName());

        if (currentRoundCard) {
            player.startCardSet = player.startCardSet.concat(currentRoundCard);
        }

        if (player.startCardSet.length != 8) {
            throw Error('startcardset must have 8 cards');
        }
    }

    return players;
}