import { HexBoard, HexCornerDirection, HexMatrix, HexToHexDirection, ImmutableHex } from "./board/hex";
import { RoadPiece, SettlementPiece } from "./board/piece";
import { ResourceType } from "./resource/resource";
import { AuthenticatedPlayer } from "./player/player";

export type GamePhase = "InitialPlacement" | "NormalTurns" | "Finished";
export type PlayerNamesInTurnOrder = [string, string, string] | [string, string, string, string];
export type RequestEffect = "RefusedSameTurn" | "SuccessfulSameTurn" | "SuccessfulNewTurn";
export type RequestResult = [RequestEffect, string];

export class Game {
    constructor(playerNamesInTurnOrder: PlayerNamesInTurnOrder, hexBoard: HexBoard) {
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


interface CanTakePlayerRequests {
    getReadableState(): ReadableState

    getActivePlayer(): AuthenticatedPlayer | undefined

    placeInitialSettlement(
        requestingPlayerIdentifier: AuthenticatedPlayer,
        rowIndexFromZeroInBoard: number,
        hexIndexFromZeroInRow: number,
        settlementCorner: HexCornerDirection,
        roadEdge: HexToHexDirection
    ): [CanTakePlayerRequests, RequestResult]
}

interface ReadableState {
    viewBoard(): HexMatrix<ImmutableHex>
    getPhase(): GamePhase
    getPlayer(playerIdentifier: string): AuthenticatedPlayer | undefined
}

class InternalState implements ReadableState {
    viewBoard(): HexMatrix<ImmutableHex> {
        return this.hexBoard.viewBoard();
    }

    getPhase(): GamePhase {
        return this.gamePhase;
    }

    getPlayer(playerIdentifier: string): AuthenticatedPlayer | undefined {
        return this.playersByName[playerIdentifier];
    }

    constructor(
        public hexBoard: HexBoard,
        public playersInTurnOrder: AuthenticatedPlayer[],
        public gamePhase: GamePhase
    ) {
        this.playersByName = {};
        for (const playerInTurnOrder of this.playersInTurnOrder) {
            this.playersByName[playerInTurnOrder.playerName] = playerInTurnOrder;
        }
    }

    playersByName: {
        [playerName: string]: AuthenticatedPlayer
    }
}

class InNormalTurns implements CanTakePlayerRequests {
    static createInNormalTurns(internalState: InternalState): CanTakePlayerRequests {
        return new InNormalTurns(internalState);
    }

    getReadableState(): ReadableState {
        return this.internalState;
    }

    getActivePlayer(): AuthenticatedPlayer | undefined {
        // TODO: implement this.
        return undefined;
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

    private constructor(private internalState: InternalState) { }
}

class InInitialPlacement implements CanTakePlayerRequests {
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
                `Row ${rowIndexFromZeroInBoard} is not a valid row,`
                + ` the range is 1 to ${this.internalState.hexBoard.changeBoard().length}`;
            return [this, ["RefusedSameTurn", refusalMessage]];
        }

        const chosenHex = chosenRow[hexIndexFromZeroInRow];
        if (chosenHex == undefined) {
            const refusalMessage =
                `Hex ${hexIndexFromZeroInRow} is not a valid hex,`
                + ` the range is 1 to ${this.internalState.hexBoard.changeBoard().length}`;
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

        if (this.playersInPlacementOrder.length > 0) {
            return [this, ["SuccessfulSameTurn", ""]];
        }

        const nextRound = this.createNextRound(this.internalState);
        return [nextRound, ["SuccessfulNewTurn", ""]];
    }

    private constructor(
        private internalState: InternalState,
        private playersInPlacementOrder: AuthenticatedPlayer[],
        private isSecondRound: boolean,
        private createNextRound: (internalState: InternalState) => CanTakePlayerRequests
    ) { }
}
