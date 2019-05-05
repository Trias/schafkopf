import {FinishedRound} from "../Round";
import {GameMode} from "../GameMode";
import {PlayerWithNameOnly} from "../Player";
import {Card} from "../cards/Card";

export default interface GameEventsReceiverInterface {
    onRoundCompleted(round: FinishedRound, roundIndex: number): void;

    onCardPlayed(card: Card, player: PlayerWithNameOnly, index: number): void;

    onGameModeDecided(gameMode: GameMode): void;

    // klopfered(player: Player): void;
}