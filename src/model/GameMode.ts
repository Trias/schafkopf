/**
 *
 * information about the chosen game (Rufspiel, Solo, Wenz,...)
 */

import TrumpOrderingCallGame from "./orderings/TrumpOrderingCallGame";
import {Faces} from "./orderings/ColorOrderingCallGame";
import {ColorEnum} from "./ColorEnum";
import {Card, CardEnum} from "./Card";
import Game from "./Game";
import Player from "./Player";

enum GameModeEnum {
    CALL_GAME = "C",
    WENZ = "W",
    SOLO = "S",
    RETRY = "R",
}

class GameMode {
    private readonly mode: GameModeEnum;
    private readonly color?: ColorEnum;
    private readonly callingPlayer?: Player;
    constructor(mode: GameModeEnum, callingPlayer?: Player, color?: ColorEnum){
        this.mode = mode;
        this.color = color;
        this.callingPlayer = callingPlayer;
    }

    isTrump(card: CardEnum) {
        if(this.mode === GameModeEnum.CALL_GAME){
            return TrumpOrderingCallGame.indexOf(card) !== -1;
        }

        throw Error('not implemented');
    }

    getGameResult(game: Game){

    }

    highestCard(card1:CardEnum, card2:CardEnum){
        if(this.isTrump(card1) && this.isTrump(card2)){
            console.log(`trump over trump: ${card1}, ${card2}  => ${this.highestCardTrumpOrdering(card1, card2)}`);
            return this.highestCardTrumpOrdering(card1, card2);
        } else if(this.isTrump(card1) && !this.isTrump(card2)){
            console.log(`trump over color: ${card1}, ${card2} => ${card1}`);
            return card1
        }else if(!this.isTrump(card1) && this.isTrump(card2)){
            console.log(`not trump by trump: ${card1}, ${card2} => ${card2}`);
            return card2;
        }else if(Card.getColor(card1) !== Card.getColor(card2)){
            console.log(`stays at card1: ${card1}, ${card2} => ${card1}`);
            return card1;
        }else if(Card.getColor(card1) === Card.getColor(card2)){
            console.log(`color over color: ${card1}, ${card2} => ${this.highestCardColorOrdering(card1, card2)}`);
            return this.highestCardColorOrdering(card1, card2);
        }else{
            console.log(`stays at card1: ${card1}, ${card2} => ${card1}`);
            return card1;
        }
    }

    private highestCardTrumpOrdering(card1:CardEnum, card2:CardEnum) {
        if(!this.isTrump(card1) || !this.isTrump(card2)){
            throw Error('two trump cards required');
        }

        if(this.mode === GameModeEnum.CALL_GAME){
            if(TrumpOrderingCallGame.indexOf(card1) < TrumpOrderingCallGame.indexOf(card2)){
                return card1;
            }else {
                return card2;
            }
        }

        throw Error('not implemented');
    }

    private highestCardColorOrdering(card1:CardEnum, card2:CardEnum) {
        if(this.isTrump(card1) || this.isTrump(card2)) {
            throw Error('two color cards required');
        }

        if(this.mode === GameModeEnum.CALL_GAME) {
            if (Faces.indexOf(Card.getFace(card1)) > Faces.indexOf(Card.getFace(card2))) {
                return card2;
            } else {
                // also if different color
                return card1;
            }
        }

        throw Error('not implemented');
    }

    static compareGameModes(gameModeNext: GameMode, gameModePrev: GameMode):number{
        if(gameModePrev.getMode() === GameModeEnum.SOLO || gameModePrev.getMode() === GameModeEnum.WENZ){
            return -1;
        }else if(gameModeNext.getMode() === gameModePrev.getMode()){
            return 0;
        }else{
            return 1;
        }
    }

    getMode() {
        return this.mode;
    }

    getColor() {
        return this.color;
    }

    getCallingPlayer() {
        return this.callingPlayer;
    }
}

export {GameMode, GameModeEnum};