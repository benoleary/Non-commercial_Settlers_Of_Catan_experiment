import { HexCornerDirection, HexToHexDirection } from "../board/hex";
import { DiceRollScore } from "../resource/resource";
import { AuthenticatedPlayer } from "../player/player";
import { CanTakePlayerRequests, ReadableState, RequestResult } from "./interface";
import { InternalState } from "./InternalState";

export class InNormalTurns implements CanTakePlayerRequests {
    static createInNormalTurns(internalState: InternalState): CanTakePlayerRequests {
        return new InNormalTurns(internalState);
    }

    getReadableState(): ReadableState {
        return this.internalState;
    }

    getActivePlayer(): AuthenticatedPlayer | undefined {
        return this.internalState.playersInTurnOrder[this.activePlayerIndex];
    }

    placeInitialSettlement(
        requestingPlayer: AuthenticatedPlayer,
        rowIndexFromZeroInBoard: number,
        hexIndexFromZeroInRow: number,
        settlementCorner: HexCornerDirection,
        roadEdge: HexToHexDirection
    ): [CanTakePlayerRequests, RequestResult] {
        return [this, ["RefusedSameTurn", "initial settlement placement phase is over"]];
    }


    beginNextNormalTurn(
        requestingPlayer: AuthenticatedPlayer
    ): [CanTakePlayerRequests, RequestResult] {
        if (requestingPlayer != this.getActivePlayer()) {
            const refusalMessage =
                `${requestingPlayer.playerName} is not the active player,`
                + ` ${this.getActivePlayer()?.playerName} is`;
            return [this, ["RefusedSameTurn", refusalMessage]];
        }

        this.activePlayerIndex = (this.activePlayerIndex + 1) % this.numberOfPlayers;
        const diceRollScore = this.beginTurn();
        return [
            this,
            [
                "SuccessfulNewTurn",
                `Player ${requestingPlayer.playerName} passed turn`
                + ` to player ${this.getActivePlayer()?.playerName}`
                + ` and the dice rolled ${diceRollScore}`
            ]
        ];
    }

    private constructor(private internalState: InternalState) {
        this.internalState.gamePhase = "NormalTurns";
        this.numberOfPlayers = this.internalState.playersInTurnOrder.length;
        this.activePlayerIndex = 0;
        this.beginTurn();
    }

    private beginTurn(): DiceRollScore {
        // This should roll the dice and return the result for printing.
        return 7n;
    }

    private readonly numberOfPlayers: number;
    private activePlayerIndex: number;
}
