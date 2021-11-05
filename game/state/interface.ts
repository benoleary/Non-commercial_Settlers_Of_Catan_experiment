import { HexCornerDirection, HexMatrix, HexToHexDirection, ImmutableHex } from "../board/hex";
import { AuthenticatedPlayer } from "../player/player";

export type GamePhase = "InitialPlacement" | "NormalTurns" | "Finished";
export type PlayerNamesInTurnOrder = [string, string, string] | [string, string, string, string];
export type RequestEffect = "RefusedSameTurn" | "SuccessfulSameTurn" | "SuccessfulNewTurn";
export type RequestResult = [RequestEffect, string];

export interface CanTakePlayerRequests {
    getReadableState(): ReadableState

    getActivePlayer(): AuthenticatedPlayer | undefined

    placeInitialSettlement(
        requestingPlayer: AuthenticatedPlayer,
        rowIndexFromZeroInBoard: number,
        hexIndexFromZeroInRow: number,
        settlementCorner: HexCornerDirection,
        roadEdge: HexToHexDirection
    ): [CanTakePlayerRequests, RequestResult]

    beginNextNormalTurn(
        requestingPlayer: AuthenticatedPlayer
    ): [CanTakePlayerRequests, RequestResult]
}

export interface ReadableState {
    viewBoard(): HexMatrix<ImmutableHex>
    getPhase(): GamePhase
    getPlayer(playerIdentifier: string): AuthenticatedPlayer | undefined
    getLastSuccessfulRequestResult(): RequestResult | undefined
}
