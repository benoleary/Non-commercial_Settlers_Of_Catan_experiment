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
        return this.internalState.getPhase();
    }

    getPlayer(playerIdentifier: string): AuthenticatedPlayer | undefined {
        return this.internalState.getPlayer(playerIdentifier);
    }

    getActivePlayerName(): string | undefined {
        return this.internalState.getActivePlayerName();
    }

    placeInitialSettlement(
        requestingPlayerIdentifier: string,
        rowIndexFromOneInBoard: number,
        hexIndexFromOneInRow: number,
        settlementCorner: string,
        roadDirectionFromSettlement: string
    ): RequestResult {
        return this.validateThenDelegate(
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

    private validateThenDelegate(
        requestingPlayerIdentifier: string,
        delegatedFunction: (requestingPlayer: AuthenticatedPlayer) => [CanTakePlayerRequests, RequestResult]
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
    getPhase(): GamePhase

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
    getPhase(): GamePhase {
        return this.internalState.gamePhase;
    }

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
        return this.getActivePlayer()?.playerName;
    }

    constructor(
        protected internalState: InternalState,
        protected playersInPlacementOrder: AuthenticatedPlayer[]
    ) { }

    protected getActivePlayer(): AuthenticatedPlayer | undefined {
        return this.playersInPlacementOrder[0];
    }
}

class GameInFirstInitialPlacement extends GameInInitialPlacement {
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
        return [this, ["RefusedSameTurn", "not yet fully implemented"]];
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