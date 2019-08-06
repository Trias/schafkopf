// based on:
//
// LPlayer.java
// -----------------------
// The LeprechaunsPlayer for the gaming Instance
// (C) by Dirk Friedenberger; projekte@frittenburger.de
// created 11.12.2006
//
//
// This program is free software; you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation; either version 2 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program; if not, write to the Free Software
// Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA

import StrategyInterface from "../StrategyInterface";
import {GameWorld} from "../../GameWorld";
import {Card} from "../../cards/Card";
import {canPlayCard, getPlayableCards} from "../../PlayableMoves";
import {clone, cloneDeep} from "lodash";
import {RoundAnalyzer} from "../../knowledge/RoundAnalyzer";
import {GameMode, GameModeEnum} from "../../GameMode";
import {callableColors, ColorWithTrump, PlainColor} from "../../cards/Color";
import {determineGameMode} from "../rules/shouldCall/determineGameMode";
import {Round} from "../../Round";
import {Player, PlayerInterface} from "../../Player";
import {hasColor, sortByNaturalOrdering} from "../../cards/CardSet";
import {CardFilter} from "./heuristic/CardFilter";

export class Leprechauns implements StrategyInterface {
    private thisPlayer: Player;

    constructor(thisPlayer: Player) {
        this.thisPlayer = thisPlayer;
    }

    chooseToRaise(cardSet: ReadonlyArray<Card>): boolean {
        return false;
    }

    chooseCardToPlay(world: GameWorld, cardSet: Card[]) {
        let selcard: Card | null = null;
        let cardwins: number = 0;
        let points: number = 0;
        //minpoints if the probability is smaller than 0.5
        let minpoints: number = 120;
        let minselcard: Card | null = null;
        let c = clone(cardSet);

        // optimization?
        c = sortByNaturalOrdering(c).reverse();

        for (let i = 0; i < c.length; i++) {
            if (canPlayCard(world.gameMode, c, c[i], world.round)) {
                if (selcard == null) {
                    selcard = minselcard = c[i];
                }
                let newRound = cloneDeep(world.round);
                newRound.addCard(c[i]);
                let wins = this.getWinProbability(world, newRound);
                let roundAnalyzer = new RoundAnalyzer(newRound, world.gameMode);

                let p = roundAnalyzer.getPoints();

                if (wins > cardwins || (wins * 1.1 > cardwins && p > points)) {
                    selcard = c[i];
                    points = p;
                    cardwins = wins;
                }
                if (p < minpoints) {
                    minselcard = c[i];
                    minpoints = p;
                }
            }
        }
        // this is modified from the original....do not schmier without knowledge of parter...
        if (cardwins > 0.5 && selcard != null)
            return selcard;
        else if (minselcard != null)
            return minselcard;

        throw Error("Something is wrong, no valid card found " + selcard + " / " + minselcard);
    }

    chooseGameToCall(cardSet: Card[], previousGameMode: GameMode, playerIndex: number, allowedGameModes: GameModeEnum[]): [GameModeEnum?, PlainColor?] {
        return determineGameMode(previousGameMode, cardSet, allowedGameModes);
    }

    /*
    SpecificGame g[] = new SpecificGame[0];

int select = -1;
double maxval = 0.0;
//check for every game
if(game.equals(schafkopf))
{
    g = new SpecificGame[]{
    new SpecificGame( RufSpiel , Eichel ),
        new SpecificGame( RufSpiel , Gruen ),
        new SpecificGame( RufSpiel , Schell ),
        new SpecificGame( FarbSolo , Eichel ),
        new SpecificGame( FarbSolo , Gruen ),
        new SpecificGame( FarbSolo , Herz ),
        new SpecificGame( FarbSolo , Schell ),
        new SpecificGame( Geier ),
        new SpecificGame( Wenz )
};
}
if(game.equals(skat))
{
    g = new SpecificGame[]{
    new SpecificGame( FarbSpiel , Eichel ).GroundValue( 12 ),
        new SpecificGame( FarbSpiel , Gruen ).GroundValue( 11 ),
        new SpecificGame( FarbSpiel , Herz ).GroundValue( 10 ),
        new SpecificGame( FarbSpiel , Schell ).GroundValue( 9 ),
        new SpecificGame( Grand ).GroundValue( 24 )
};
}


for(int i = 0;i < g.length;i++)
{
    int card[]       = gi.getOwnCards();
    int head[]       = new int[]{ 0 , 0 , 0 , 0 , 0 , 0 , 0 , 0 , 0 , 0 };
    int heads        = 0; //Number of first heads
    int allheads     = 0; //Number of all heads
    int trump        = 0;
    int colored_head = 0; //the heads of the cards if not trumb
    int color[]      = new int[]{ 0 , 0 , 0 , 0 };
    int faildcolors  = 0;
    if(g[i].getColor() > 0)
        color[gi.Color2Index(g[i].getColor())] = 99; //not a failed color
    for(int x = 0;x < card.length;x++)
    {
        int r = gi.getOrder(g[i].getGame(),g[i].getColor(),card[x]);
        if(gi.isTrump(g[i].getGame(),g[i].getColor(),card[x]))
        {
            trump++;
            if(0 <= r && r < head.length)
                head[r] = 1;
        }
        else
        {
            color[gi.Color2Index(g[i].getColor())]++;
            if(r == 0) colored_head++;
        }
    }
    for(int x = 0;x < head.length;x++)
    {
        if(head[x] == 0) continue;

        allheads++;
        if(heads == x) heads++;
    }
    for(int x = 0;x < color.length;x++)
    if(color[x] == 0) faildcolors++;

    //now we can calculate an value beetween 0.0 and 1.0 (++)
    //allheads , heads , trump , colored_head , faildcolors
    double val = 0.0;
    if((double)trump/card.length >= 0.6) //5/8 ,  6/10
    {
        val = heads * 0.2 + allheads * 0.05;  //trumps
        val += 0.1 * faildcolors;
        val += 0.1 * colored_head;
    }
    g[i].setHeads(heads);
    log(gi,"calc "+g[i].getGame()+","+g[i].getColor()+" tr:"+trump+
        " h:"+heads+" ah:"+allheads+" ch:"+colored_head+
        " faildc:"+faildcolors+" val:"+d2s(val)+" bidval "+g[i].getValue());

    if(val >= maxval && val > 0.0)
    {
        select = i;
        maxval = val;
    }

}
if(select < 0)
    return null;
return g[select];
}*/

    sameGroup(world: GameWorld, player1: string, player2: string) {
        return world.history.getTeamPartnerNameForPlayerName(player1) == player2
    }

    notSameGroup(world: GameWorld, player1: string, player2: string) {
        return world.history.getTeamPartnerNameForPlayerName(player1) != player2 && world.history.getTeamPartnerNameForPlayerName(player1) != null;
    }

    getWinProbability(world: GameWorld, round: Round): number {
        let roundAnalyzer = round.getRoundAnalyzer(world.gameMode);
        let wpid = roundAnalyzer.getHighestCardPlayerName();
        let mpid = this.thisPlayer.getName();
        let np = round.getCurrentPlayerName();
        let winprob;

        if (round.getPosition() == 4) {
            //is the Last Player in Round
            if (this.sameGroup(world, mpid, wpid))
                winprob = 1.0;
            else if (this.notSameGroup(world, mpid, wpid))
                winprob = 0.0;
            else //unknown
                winprob = 0.5;
        } else {
            let bc = this.getBestCard(world, round, world.playerMap[np], this.notSameGroup(world, mpid, wpid));
            let nextPlayerRound = cloneDeep(round);
            nextPlayerRound.addCard(bc);
            let wp = this.getWinProbability(world, nextPlayerRound);

            if (this.notSameGroup(world, wpid, np) || (wp < 0.5)) {
                //next player will try to bit the round
                let bt = this.getBestTrump(world, round, world.playerMap[np], true);
                let nextPlayerTrumpRound = cloneDeep(round);
                if (bt != null) {
                    nextPlayerTrumpRound.addCard(bt);
                    wp = this.getWinProbability(world, nextPlayerTrumpRound);
                }
            }
            if (this.sameGroup(world, this.thisPlayer.getName(), np))
                winprob = wp;
            else
                winprob = (1.0 - wp);
        }
        return winprob;
    }

    getBestCard(world: GameWorld, round: Round, player: PlayerInterface, isenemy: boolean): Card {
        //Function must get best card; if player has played color, this card must be of this color
        let roundAnalyzer = round.getRoundAnalyzer(world.gameMode);
        if (roundAnalyzer.getRoundColor() == ColorWithTrump.TRUMP) {
            let bt = this.getBestTrump(world, round, player, isenemy);
            if (bt != null)
                return bt;
        } else {
            let color = roundAnalyzer.getRoundColor();
            //if player pid has color, get the best card
            if (hasColor(player.getCurrentCardSet(), color, world.gameMode)) {
                let playableCards = getPlayableCards(player.getCurrentCardSet(), world.gameMode, world.round);
                return playableCards[isenemy ? 0 : Math.min(3, playableCards.length - 1)]; //the best if enemy
            }
        }
        //drop best card

        for (let someColor of callableColors) {
            if (hasColor(player.getCurrentCardSet(), someColor, world.gameMode)) {
                let playableCards = getPlayableCards(player.getCurrentCardSet(), world.gameMode, world.round);
                return playableCards[isenemy ? 0 : Math.min(3, playableCards.length - 1)]; //the best if enemy
            }
        }
        //error only trump available
        let cardFilter = new CardFilter(world, player.getCurrentCardSet());
        return cardFilter.trumps[isenemy ? 0 : Math.min(3, cardFilter.trumps.length - 1)];
    }

    getBestTrump(world: GameWorld, round: Round, player: PlayerInterface, isenemy: boolean): Card | null {
        //Function must get best trump or 1 if player has no more trump
        let cardFilter = new CardFilter(world, player.getCurrentCardSet());

        if (!cardFilter.trumps.length)
            return null;

        return cardFilter.trumps[isenemy ? 0 : Math.min(3, cardFilter.trumps.length - 1)];
    }
}