import { HexBoard, HexCornerDirection, HexToHexDirection } from "../board/hex";
import { RoadPiece, SettlementPiece } from "../board/piece";
import { SixSidedDie } from "../die/die";
import { ResourceType } from "../resource/resource";
import { AuthenticatedPlayer, PlayerColor } from "../player/player";
import { ResourceCardSet } from "../resource/resource";
import { PlayerNamesAndColorsInTurnOrder, ReadableState, RequestResult } from "./ReadableState";
import { CanTakePlayerRequests } from "./CanTakePlayerRequests";
import { InternalState } from "./InternalState";
import { InNormalTurns } from "./InNormalTurns";

/**
 * This class applies all the rules for the phase of the game where players are placing their
 * initial settlements with roads, using an instance of InternalState to represent the state of
 * the game without rules, which is passed on to the InNormalTurns instance which applies the
 * rules to the phase following the initial placement phase.
 *
 * Actually an instance of InInitialPlacement represents one round of players making one placement
 * each. Once the first round is finished, the initial instance creates a new instance with the
 * players in the reverse order (as specified by the rules to try to mitigate the advantage of
 * playing first) and the same InternalState instance. Then that instance creates the InNormalTurns
 * instance, again with the same InternalState instance.
 */
export class InInitialPlacement implements CanTakePlayerRequests {
    static createInInitialPlacement(
        playerNamesAndColorsInTurnOrder: PlayerNamesAndColorsInTurnOrder,
        hexBoard: HexBoard,
        sixSidedDie: SixSidedDie
    ): CanTakePlayerRequests {
        const initialState = new InternalState(
            hexBoard,
            sixSidedDie,
            playerNamesAndColorsInTurnOrder.map(
                playerNameAndColor =>
                    new AuthenticatedPlayer(playerNameAndColor[0], playerNameAndColor[1])
            ),
            "InitialPlacement"
        );
        initialState.lastSuccessfulRequestResult = [
            "SuccessfulNewTurn",
            "First initial placement turn has begun"
        ];

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

        const pieceColor = requestingPlayer.playerColor;
        const [isPlaced, refusalMessage] =
            chosenHex.acceptInitialSettlementAndRoad(
                requestingPlayer.getVillageFactory(),
                settlementCorner,
                requestingPlayer.getRoadFactory(),
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
            this.internalState.lastSuccessfulRequestResult =
                ["SuccessfulSameTurn", successMessage];
            return [this, this.internalState.lastSuccessfulRequestResult];
        }

        // It is important to update lastSuccessfulRequestResult before creating nextRound so
        // that we do not overwrite a new lastSuccessfulRequestResult written by nextRound.
        this.internalState.lastSuccessfulRequestResult = ["SuccessfulNewTurn", successMessage];
        const nextRound = this.createNextRound(this.internalState);
        return [nextRound, this.internalState.lastSuccessfulRequestResult];
    }

    beginNextNormalTurn(
        requestingPlayer: AuthenticatedPlayer
    ): [CanTakePlayerRequests, RequestResult] {
        return [this, ["RefusedSameTurn", "still in initial settlement placement phase"]];
    }

    makeMaritimeTrade(
        requestingPlayer: AuthenticatedPlayer,
        offeredOutgoingResources: ResourceCardSet,
        desiredIncomingResources: ResourceCardSet
    ): [CanTakePlayerRequests, RequestResult] {
        return [this, ["RefusedSameTurn", "still in initial settlement placement phase"]];
    }

    buildRoad(
        requestingPlayer: AuthenticatedPlayer,
        rowIndexFromZeroInBoard: number,
        hexIndexFromZeroInRow: number,
        roadEdge: HexToHexDirection
    ): [CanTakePlayerRequests, RequestResult] {
        return [this, ["RefusedSameTurn", "still in initial settlement placement phase"]];
    }

    buildSettlement(
        requestingPlayer: AuthenticatedPlayer,
        rowIndexFromZeroInBoard: number,
        hexIndexFromZeroInRow: number,
        settlementCorner: HexCornerDirection
    ): [CanTakePlayerRequests, RequestResult] {
        return [this, ["RefusedSameTurn", "still in initial settlement placement phase"]];
    }

    private constructor(
        private internalState: InternalState,
        private playersInPlacementOrder: AuthenticatedPlayer[],
        private isSecondRound: boolean,
        private createNextRound: (internalState: InternalState) => CanTakePlayerRequests
    ) { }
}
