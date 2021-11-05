import { HexCornerDirection, HexToHexDirection } from "../board/hex";
import { ResourceCardSet } from "../resource/resource";
import { AuthenticatedPlayer } from "../player/player";
import { ReadableState, RequestResult } from "./ReadableState";
import { CanTakePlayerRequests } from "./CanTakePlayerRequests";
import { InternalState } from "./InternalState";

/**
 * This class applies all the rules for the phase of the game which would be considered the "main"
 * phase of the game, afer the initial pieces have been placed: players rolling the dice for
 * production, making trades, and buying and placing pieces on the board (also buying and playing
 * development cards but these will not be implemented). It creaates an AfterVictory instance with
 * its InternalState instance once an action results in a player reaching the threshold to win.
 */
export class AfterVictory implements CanTakePlayerRequests {
    // The code responsible for creating an AfterVictory will have determined that the game has
    // been won, and will thus know won anyway.
    static createAfterVictory(
        internalState: InternalState,
        winningPlayer: AuthenticatedPlayer
    ): CanTakePlayerRequests {
        return new AfterVictory(internalState, winningPlayer);
    }

    getReadableState(): ReadableState {
        return this.internalState;
    }

    getActivePlayer(): AuthenticatedPlayer | undefined {
        return undefined;
    }

    placeInitialSettlement(
        requestingPlayer: AuthenticatedPlayer,
        rowIndexFromZeroInBoard: number,
        hexIndexFromZeroInRow: number,
        settlementCorner: HexCornerDirection,
        roadEdge: HexToHexDirection
    ): [CanTakePlayerRequests, RequestResult] {
        return [this, this.internalState.lastSuccessfulRequestResult!];
    }


    beginNextNormalTurn(
        requestingPlayer: AuthenticatedPlayer
    ): [CanTakePlayerRequests, RequestResult] {
        return [this, this.internalState.lastSuccessfulRequestResult!];
    }

    makeMaritimeTrade(
        requestingPlayer: AuthenticatedPlayer,
        offeredOutgoingResources: ResourceCardSet,
        desiredIncomingResources: ResourceCardSet
    ): [CanTakePlayerRequests, RequestResult] {
        return [this, this.internalState.lastSuccessfulRequestResult!];
    }

    private constructor(
        private internalState: InternalState,
        private winningPlayer: AuthenticatedPlayer
    ) {
        this.internalState.gamePhase = "GameOver";

        const finalScores =
            this.internalState.playersInTurnOrder.map(
                gamePlayer => `${gamePlayer.playerName}: ${gamePlayer.getVictoryPointScore()}`
            ).join(", ");
        this.internalState.lastSuccessfulRequestResult = [
            "RefusedGameOver",
            `Game over, won by ${this.winningPlayer.playerName} - final scores: ${finalScores}`
        ];
    }
}
