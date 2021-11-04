import { HexBoard, HexCornerDirection, HexToHexDirection } from "../board/hex";
import { RoadPiece, SettlementPiece } from "../board/piece";
import { ResourceType } from "../resource/resource";
import { AuthenticatedPlayer } from "../player/player";
import { CanTakePlayerRequests, PlayerNamesInTurnOrder, ReadableState, RequestResult } from "./interface";
import { InternalState } from "./InternalState";
import { InNormalTurns } from "./InNormalTurns";

export class InInitialPlacement implements CanTakePlayerRequests {
    static createInInitialPlacement(
        playerNamesInTurnOrder: PlayerNamesInTurnOrder,
        hexBoard: HexBoard
    ): CanTakePlayerRequests {
        const initialState = new InternalState(
            hexBoard,
            playerNamesInTurnOrder.map(playerName => new AuthenticatedPlayer(playerName)),
            "InitialPlacement"
        );

        // We need a shallow copy of the players since we will be removing players from this list
        // once they have made their move. For the first round of initial placements, the players
        // place their initial settlements in the normal turn order.
        return new InInitialPlacement(
            initialState,
            initialState.playersInTurnOrder.slice(),
            false,
            // The next round needs basically the same thing but in reverse order, but also with
            // the allocation of resources occuring with the second placement.
            (internalState: InternalState) => new InInitialPlacement(
                internalState,
                internalState.playersInTurnOrder.slice().reverse(),
                true,
                // After the second round of initial placements, we move into normal turns.
                InNormalTurns.createInNormalTurns
            )
        );
    }

    getReadableState(): ReadableState {
        return this.internalState;
    }

    getActivePlayer(): AuthenticatedPlayer | undefined {
        return this.playersInPlacementOrder[0];
    }

    placeInitialSettlement(
        requestingPlayer: AuthenticatedPlayer,
        rowIndexFromZeroInBoard: number,
        hexIndexFromZeroInRow: number,
        settlementCorner: HexCornerDirection,
        roadEdge: HexToHexDirection
    ): [CanTakePlayerRequests, RequestResult] {
        if (requestingPlayer != this.getActivePlayer()) {
            const refusalMessage =
                `${requestingPlayer.playerName} is not the active player,`
                + ` ${this.getActivePlayer()?.playerName} is`;
            return [this, ["RefusedSameTurn", refusalMessage]];
        }

        const chosenRow = this.internalState.hexBoard.changeBoard()[rowIndexFromZeroInBoard];
        if (chosenRow == undefined) {
            const refusalMessage =
                `Row ${rowIndexFromZeroInBoard} is not a valid row index,`
                + ` the range is 0 to ${this.internalState.hexBoard.changeBoard().length - 1}`;
            return [this, ["RefusedSameTurn", refusalMessage]];
        }

        const chosenHex = chosenRow[hexIndexFromZeroInRow];
        if (chosenHex == undefined) {
            const refusalMessage =
                `Hex ${hexIndexFromZeroInRow} is not a valid hex index,`
                + ` the range is 0 to ${chosenRow.length - 1}`;
            return [this, ["RefusedSameTurn", refusalMessage]];
        }

        const giveResourceFromHexToPlayer =
            this.isSecondRound
            ? (hexResource: ResourceType) => requestingPlayer.acceptResource(hexResource, 1n)
            : undefined;

        const [isPlaced, refusalMessage] =
            chosenHex.acceptInitialSettlementAndRoad(
                new SettlementPiece(requestingPlayer, "village"),
                settlementCorner,
                new RoadPiece(requestingPlayer),
                roadEdge,
                giveResourceFromHexToPlayer
            );

        if (!isPlaced) {
            return [this, ["RefusedSameTurn", refusalMessage]];
        }

        // Now the next player gets to place a settlement, or we move to the second round.
        this.playersInPlacementOrder.splice(0, 1);

        const successMessage =
            `Player ${requestingPlayer.playerName} placed`
            + ` on hex ${rowIndexFromZeroInBoard}-${hexIndexFromZeroInRow}`
            + ` a settlement on corner ${settlementCorner}`
            + ` and a road on edge ${roadEdge}`;

        if (this.playersInPlacementOrder.length > 0) {
            return [this, ["SuccessfulSameTurn", successMessage]];
        }

        const nextRound = this.createNextRound(this.internalState);
        return [nextRound, ["SuccessfulNewTurn", successMessage]];
    }

    beginNextNormalTurn(
        requestingPlayer: AuthenticatedPlayer
    ): [CanTakePlayerRequests, RequestResult] {
        return [this, ["RefusedSameTurn", "still in initial settlement placement phase "]];
    }

    private constructor(
        private internalState: InternalState,
        private playersInPlacementOrder: AuthenticatedPlayer[],
        private isSecondRound: boolean,
        private createNextRound: (internalState: InternalState) => CanTakePlayerRequests
    ) { }
}
