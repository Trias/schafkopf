import {FinishedRound, Round} from "../Round";
import {GameMode} from "../GameMode";

export default interface GameEventsReceiverInterface {
    onRoundCompleted(round: FinishedRound, roundIndex: number): void;

    onCardPlayed(round: Round): void;

    onGameModeDecided(gameMode: GameMode): void;

    // klopfered(player: Player): void;
}