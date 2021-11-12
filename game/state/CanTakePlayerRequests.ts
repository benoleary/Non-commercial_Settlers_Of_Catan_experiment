import { HexCornerDirection, HexToHexDirection } from "../board/hex";
import { AuthenticatedPlayer } from "../player/player";
import { ResourceCardSet } from "../resource/resource";
import { ReadableState, RequestResult } from "./ReadableState";

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

    makeMaritimeTrade(
        requestingPlayer: AuthenticatedPlayer,
        offeredOutgoingResources: ResourceCardSet,
        desiredIncomingResources: ResourceCardSet
    ): [CanTakePlayerRequests, RequestResult]

    buildRoad(
        requestingPlayer: AuthenticatedPlayer,
        rowIndexFromZeroInBoard: number,
        hexIndexFromZeroInRow: number,
        roadEdge: HexToHexDirection
    ): [CanTakePlayerRequests, RequestResult]

    buildSettlement(
        requestingPlayer: AuthenticatedPlayer,
        rowIndexFromZeroInBoard: number,
        hexIndexFromZeroInRow: number,
        settlementCorner: HexCornerDirection
    ): [CanTakePlayerRequests, RequestResult]

    upgradeToCity(
        requestingPlayer: AuthenticatedPlayer,
        rowIndexFromZeroInBoard: number,
        hexIndexFromZeroInRow: number,
        settlementCorner: HexCornerDirection
    ): [CanTakePlayerRequests, RequestResult]
}
