import { HexBoard, HexMatrix, ImmutableHex } from "./board/hex"
import { AuthenticatedPlayer } from "./player/player"

export type GamePhase = "InitialPlacement" | "NormalTurns" | "Finished"
export type PlayerNamesInTurnOrder = [string, string, string] | [string, string, string, string];
export type RequestEffect = "RefusedSameTurn" | "SuccessfulSameTurn" | "SuccessfulNewTurn"
export type RequestResult = [RequestEffect, string]

export class Game {
    constructor(private hexBoard: HexBoard, playerNamesInTurnOrder: PlayerNamesInTurnOrder) {
        this.internalState = new GameInFirstInitialPlacement(playerNamesInTurnOrder);
     }

    viewBoard(): HexMatrix<ImmutableHex> {
        return this.hexBoard.viewBoard();
    }

    getPhase(): GamePhase {
        // TODO: change one the game has states.
        return "InitialPlacement";
    }

    getPlayer(playerIdentifier: string): AuthenticatedPlayer | undefined {
        return this.internalState.getPlayer(playerIdentifier);
    }

    getActivePlayerName(): string | undefined {
        return this.internalState.getActivePlayerName();
    }

    // TODO: make this a fancy wrapper around calling a CanTakePlayerRequests method with
    // variadic arguments.
    placeInitialSettlement(
        requestingPlayerIdentifier: string,
        rowIndexFromOneInBoard: number,
        hexIndexFromOneInRow: number,
        settlementCorner: string,
        roadDirectionFromSettlement: string
    ): RequestResult {
        const requestingPlayer = this.getPlayer(requestingPlayerIdentifier);
        if (requestingPlayer == undefined) {
            return ["RefusedSameTurn", `Unknown player ${requestingPlayerIdentifier}`];
        }

        const internalResult =
            this.internalState.placeInitialSettlement(
                requestingPlayer,
                rowIndexFromOneInBoard,
                hexIndexFromOneInRow,
                settlementCorner,
                roadDirectionFromSettlement
            );

        this.internalState = internalResult[0];
        return internalResult[1];
    }

    private internalState: CanTakePlayerRequests
}


interface CanTakePlayerRequests {
    placeInitialSettlement(
        requestingPlayerIdentifier: AuthenticatedPlayer,
        rowIndexFromOneInBoard: number,
        hexIndexFromOneInRow: number,
        settlementCorner: string,
        roadDirectionFromSettlement: string
    ): [CanTakePlayerRequests, RequestResult]

    getPlayer(playerIdentifier: string): AuthenticatedPlayer | undefined

    getActivePlayerName(): string | undefined
}

class InternalState {
    constructor(
        public gamePhase: GamePhase, public playersInTurnOrder: AuthenticatedPlayer[]
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

abstract class GameInInitialPlacement implements CanTakePlayerRequests {
    abstract placeInitialSettlement(
        requestingPlayer: AuthenticatedPlayer,
        rowIndexFromOneInBoard: number,
        hexIndexFromOneInRow: number,
        settlementCorner: string,
        roadDirectionFromSettlement: string
    ): [CanTakePlayerRequests, RequestResult]

    getPlayer(playerIdentifier: string): AuthenticatedPlayer | undefined {
        return this.internalState.playersByName[playerIdentifier];
    }

    getActivePlayerName(): string | undefined {
        return this.playersInPlacementOrder[0]?.playerName;
    }

    constructor(
        protected internalState: InternalState,
        protected playersInPlacementOrder: AuthenticatedPlayer[]
    ) { }
}

class GameInFirstInitialPlacement extends GameInInitialPlacement {
    placeInitialSettlement(
        requestingPlayer: AuthenticatedPlayer,
        rowIndexFromOneInBoard: number,
        hexIndexFromOneInRow: number,
        settlementCorner: string,
        roadDirectionFromSettlement: string
    ): [CanTakePlayerRequests, RequestResult] {
        return [this, ["RefusedSameTurn", "not yet implemented"]];
    }

    constructor(playerNamesInTurnOrder: PlayerNamesInTurnOrder) {
        const initialState = new InternalState(
            "InitialPlacement",
            playerNamesInTurnOrder.map(playerName => new AuthenticatedPlayer(playerName))
        );
        super(
            initialState,
            initialState.playersInTurnOrder.slice()
        );
    }

}

class GameInSecondInitialPlacement extends GameInInitialPlacement {
    placeInitialSettlement(
        requestingPlayer: AuthenticatedPlayer,
        rowIndexFromOneInBoard: number,
        hexIndexFromOneInRow: number,
        settlementCorner: string,
        roadDirectionFromSettlement: string
    ): [CanTakePlayerRequests, RequestResult] {
        return [this, ["RefusedSameTurn", "not yet implemented"]];
    }

    constructor(stateAfterFirstPlacements: InternalState) {
        super(
            stateAfterFirstPlacements,
            stateAfterFirstPlacements.playersInTurnOrder.slice().reverse()
        );
    }
}