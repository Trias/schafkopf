import {Card, cardToValue} from "../../../cards/Card";
import {getCardsByColor, getShortestColors} from "../../../cards/CardSet";
import {GameWorld} from "../../../GameWorld";

export class CardFilter {
    private world: GameWorld;

    constructor(world: GameWorld) {
        this.world = world;
    }

    getHighValueBlankCard(playableCards: Card[]) {
        return this.getBlankCardWithComparison(playableCards, (a, b) => cardToValue(a) > cardToValue(b));
    }

    getLowValueBlankCard(playableCards: Card[]) {
        return this.getBlankCardWithComparison(playableCards, (a, b) => cardToValue(a) < cardToValue(b));
    }

    getBlankCardWithComparison(playableCards: Card[], compare: (a: Card, b: Card) => boolean) {
        let shortestColors = getShortestColors(playableCards, this.world.gameMode);
        let cardsByColor = getCardsByColor(playableCards, this.world.gameMode);

        let blankCard = null;
        if (cardsByColor[shortestColors[0]].length == 1) {
            let card = cardsByColor[shortestColors[0]][0];
            if (!blankCard && card[1] != "A" || card[1] != "A" && blankCard && compare(card, blankCard)) {
                blankCard = card;
            }
        }
        return blankCard;
    }
}

