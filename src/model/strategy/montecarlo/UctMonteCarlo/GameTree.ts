import {Card} from "../../../cards/Card";

export type GameTree = {
    card: Card | null;
    runs: number;
    wins: number;
    children: GameTree[];
    playedCards: Card[];
    parent: GameTree | null;
};