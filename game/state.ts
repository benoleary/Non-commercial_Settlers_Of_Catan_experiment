import { HexBoard, HexMatrix, ImmutableHex } from "./board/hex"
import { AuthenticatedPlayer } from "./player/player"

export type GamePhase = "InitialPlacement" | "NormalTurns" | "Finished"
export type PlayerNamesInTurnOrder = [string, string, string] | [string, string, string, string];
export type RequestEffect = "RefusedSameTurn" | "SuccessfulSameTurn" | "SuccessfulNewTurn"
export type RequestResult = [RequestEffect, string]

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
        rowIndexFromOneInBoard: number,
        hexIndexFromOneInRow: number,
        settlementCorner: string,
        roadDirectionFromSettlement: string
    ): RequestResult {
        return this.authenticateThenDelegate(
            requestingPlayerIdentifier,
            (requestingPlayer: AuthenticatedPlayer) =>
                this.internalState.placeInitialSettlement(
                    requestingPlayer,
                    rowIndexFromOneInBoard,
                    hexIndexFromOneInRow,
                    settlementCorner,
                    roadDirectionFromSettlement
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
        rowIndexFromOneInBoard: number,
        hexIndexFromOneInRow: number,
        settlementCorner: string,
        roadDirectionFromSettlement: string
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
        rowIndexFromOneInBoard: number,
        hexIndexFromOneInRow: number,
        settlementCorner: string,
        roadDirectionFromSettlement: string
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
            // The next round needs basically the same thing but in reverse order, but also with
            // the allocation of resources occuring with the second placement.
            (internalState: InternalState) => new InInitialPlacement(
                internalState,
                internalState.playersInTurnOrder.slice().reverse(),
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
        rowIndexFromOneInBoard: number,
        hexIndexFromOneInRow: number,
        settlementCorner: string,
        roadDirectionFromSettlement: string
    ): [CanTakePlayerRequests, RequestResult] {
        if (requestingPlayer != this.getActivePlayer()) {
            const refusalMessage =
                `${requestingPlayer.playerName} is not the active player,`
                + ` ${this.getActivePlayer()?.playerName} is`;
            return [this, ["RefusedSameTurn", refusalMessage]];
        }

        const chosenRow = this.internalState.hexBoard.changeBoard()[rowIndexFromOneInBoard - 1];
        if (chosenRow == undefined) {
            const refusalMessage =
                `Row ${rowIndexFromOneInBoard} is not a valid row,`
                + ` the range is 1 to ${this.internalState.hexBoard.changeBoard().length}`;
            return [this, ["RefusedSameTurn", refusalMessage]];
        }

        const chosenHex = chosenRow[hexIndexFromOneInRow - 1];
        if (chosenHex == undefined) {
            const refusalMessage =
                `Hex ${hexIndexFromOneInRow} is not a valid hex,`
                + ` the range is 1 to ${this.internalState.hexBoard.changeBoard().length}`;
            return [this, ["RefusedSameTurn", refusalMessage]];
        }

        if (!this.playersInPlacementOrder) {
            const nextRound = this.createNextRound(this.internalState);
            return [nextRound, ["RefusedSameTurn", "not yet fully implemented"]];
        }

        return [this, ["RefusedSameTurn", "not yet fully implemented"]];
    }

    private constructor(
        private internalState: InternalState,
        private playersInPlacementOrder: AuthenticatedPlayer[],
        private createNextRound: (internalState: InternalState) => CanTakePlayerRequests
    ) { }
}
