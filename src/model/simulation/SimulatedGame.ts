import {GameMode} from "../GameMode";
import {PlayerMap} from "../Player";
import {FinishedRound, Round} from "../Round";
import {Card} from "../cards/Card";
import GameResult from "../GameResult";
import {RoundAnalyzer} from "../knowledge/RoundAnalyzer";
import {GameWorld} from "../GameWorld";

export class SimulatedGame {
    private readonly playerMap: PlayerMap;
    private readonly world: GameWorld;
    private readonly gameMode: GameMode;

    constructor(world: GameWorld) {
        this.world = world;
        this.gameMode = world.gameMode;
        this.playerMap = world.playerMap;
    }

    simulateWithCard(playerName: string, card: Card) {
        let round = this.world.round;
        if (playerName != round.getCurrentPlayerName()) {
            throw Error('cannot force play other player');
        }
        this.forcePlayCard(round.getCurrentPlayerName(), card);
        this.simulateRounds();

        let result = this.getGameResult();

        // console.log(colors.blue(`${JSON.stringify(rounds.map(r => r.getCards()))}`) + colors.red(`points: ${JSON.stringify(result.getPlayersPoints(this.thisPlayer.getName()))}`));

        return result.hasPlayerWon(playerName);
    }

    simulateOneRoundWithCard(playerName: string, card: Card) {
        let round = this.world.round;
        if (playerName != round.getCurrentPlayerName()) {
            throw Error('cannot force play other player');
        }
        this.forcePlayCard(round.getCurrentPlayerName(), card);
        this.simulateRound();

        return round;
    }

    private simulateRounds(): readonly FinishedRound[] {
        let roundIndex = this.world.rounds.length;
        for (let i = roundIndex; i < 8; i++) {
            this.simulateRound();
        }

        return this.world.rounds;
    }

    getGameResult() {
        if (this.world.rounds.length != 8) {
            throw Error('not finished yet!');
        }
        return new GameResult(this.world);
    }

    private forcePlayCard(playerName: string, card: Card) {
        let activePlayer = this.playerMap[playerName];
        activePlayer.forcePlayCard(this.world, card);
    }

    // todo: into game history class?.... played called influences which cards are allowed to play
    private markCalledAce(round: Round) {
        let roundAnalyzer = new RoundAnalyzer(round, this.gameMode);
        if (this.gameMode!.isCallGame()
            && !this.gameMode!.getHasAceBeenCalled()
            && roundAnalyzer.getRoundColor() == this.gameMode!.getColorOfTheGame()
        ) {
            this.gameMode!.setHasAceBeenCalled();
        }
    }

    simulateRound() {
        if (this.world.rounds.length > 8) {
            throw Error('more than 8 rounds');
        }
        for (let j = this.world.round.getPosition(); j < 4; j++) {
            this.playerMap[this.world.round.getCurrentPlayerName()].playCard(this.world);
        }

        this.markCalledAce(this.world.round);

        this.world.rounds.push(this.world.round);

        for (let player of Object.values(this.playerMap)) {
            if (this.world.rounds.length + player.getCurrentCardSet().length != 8) {
                throw new Error('invariant violated');
            }
        }

        this.world.round = this.world.round.nextRound(this.world.round.getRoundAnalyzer(this.world.gameMode).getWinningPlayerName());

    }

    simulate(playerName: string) {
        this.simulateRounds();

        let result = this.getGameResult();

        // console.log(colors.blue(`${JSON.stringify(rounds.map(r => r.getCards()))}`) + colors.red(`points: ${JSON.stringify(result.getPlayersPoints(this.thisPlayer.getName()))}`));

        return result.hasPlayerWon(playerName);
    }

    simulatePlayerBefore(playerName: string) {
        while (this.world.round.getPosition() != this.world.round.getPlayerPositionByName(playerName)) {
            let player = this.world.playerMap[this.world.round.getCurrentPlayerName()];
            player.playCard(this.world);
        }
    }
}