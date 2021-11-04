import { HexBoard, HexCornerDirection, HexMatrix, HexToHexDirection, ImmutableHex }
    from "./board/hex";
import { AuthenticatedPlayer } from "./player/player";
import { CanTakePlayerRequests, GamePhase, PlayerNamesInTurnOrder, RequestResult }
    from "./state/interface";
import { InInitialPlacement } from "./state/InInitialPlacement";

export { PlayerNamesInTurnOrder }

export class Game {
    constructor(
        public readonly playerNamesInTurnOrder: PlayerNamesInTurnOrder,
        hexBoard: HexBoard
    ) {
        this.internalState =
            InInitialPlacement.createInInitialPlacement(playerNamesInTurnOrder, hexBoard);
    }

    viewBoard(): HexMatrix<ImmutableHex> {
        return this.internalState.getReadableState().viewBoard();
    }

    getPhase(): GamePhase {
        return this.internalState.getReadableState().getPhase();
    }

    getPlayer(playerIdentifier: string): AuthenticatedPlayer | undefined {
        return this.internalState.getReadableState().getPlayer(playerIdentifier);
    }

    getActivePlayerName(): string | undefined {
        return this.internalState.getActivePlayer()?.playerName;
    }

    placeInitialSettlement(
        requestingPlayerIdentifier: string,
        rowIndexFromZeroInBoard: number,
        hexIndexFromZeroInRow: number,
        settlementCorner: HexCornerDirection,
        roadEdge: HexToHexDirection
    ): RequestResult {
        return this.authenticateThenDelegate(
            requestingPlayerIdentifier,
            (requestingPlayer: AuthenticatedPlayer) =>
                this.internalState.placeInitialSettlement(
                    requestingPlayer,
                    rowIndexFromZeroInBoard,
                    hexIndexFromZeroInRow,
                    settlementCorner,
                    roadEdge
                )
        );
    }

    beginNextNormalTurn(requestingPlayerIdentifier: string): RequestResult {
        return this.authenticateThenDelegate(
            requestingPlayerIdentifier,
            (requestingPlayer: AuthenticatedPlayer) =>
                this.internalState.beginNextNormalTurn(
                    requestingPlayer
                )
        );
    }

    private internalState: CanTakePlayerRequests

    private authenticateThenDelegate(
        requestingPlayerIdentifier: string,
        delegatedFunction:
            (requestingPlayer: AuthenticatedPlayer) => [CanTakePlayerRequests, RequestResult]
    ): RequestResult {
        const requestingPlayer = this.getPlayer(requestingPlayerIdentifier);
        if (requestingPlayer == undefined) {
            return ["RefusedSameTurn", `Unknown player ${requestingPlayerIdentifier}`];
        }

        const delegatedResult = delegatedFunction(requestingPlayer);

        this.internalState = delegatedResult[0];
        return delegatedResult[1];
    }
}
