import { HexBoard, HexMatrix, ImmutableHex } from "./board/hex"
import { AuthenticatedPlayer } from "./player/player"

export type GamePhase = "InitialPlacement" | "NormalTurns" | "Finished"
export type PlayerNamesInTurnOrder = [string, string, string] | [string, string, string, string];
export type RequestEffect = "RefusedSameTurn" | "SuccessfulSameTurn" | "SuccessfulNewTurn"
export type RequestResult = [RequestEffect, string]

export class Game {
    constructor(private hexBoard: HexBoard, playerNamesInTurnOrder: PlayerNamesInTurnOrder) {
        this.internalState = new GameInInitialPlacement(playerNamesInTurnOrder);
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

    // TODO: make this a fancy wrapper around calling a CanTakePlayerRequests method with
    // variadic arguments.
    placeInitialSettlement(requestingPlayerIdentifier: string): RequestResult {
        const requestingPlayer = this.getPlayer(requestingPlayerIdentifier);
        if (requestingPlayer == undefined) {
            return ["RefusedSameTurn", `Unknown player ${requestingPlayerIdentifier}`];
        }

        const internalResult = this.internalState.placeInitialSettlement(requestingPlayer);

        this.internalState = internalResult[0];
        return internalResult[1];
    }

    private internalState: CanTakePlayerRequests
}


interface CanTakePlayerRequests {
    placeInitialSettlement(
        requestingPlayer: AuthenticatedPlayer
    ): [CanTakePlayerRequests, RequestResult]

    getPlayer(playerIdentifier: string): AuthenticatedPlayer | undefined
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

class GameInInitialPlacement implements CanTakePlayerRequests {
    placeInitialSettlement(
        requestingPlayer: AuthenticatedPlayer
    ): [CanTakePlayerRequests, RequestResult] {
        return [this, ["RefusedSameTurn", "not yet implemented"]];
    }

    getPlayer(playerIdentifier: string): AuthenticatedPlayer | undefined {
        return this.internalState.playersByName[playerIdentifier];
    }

    constructor(playerNamesInTurnOrder: PlayerNamesInTurnOrder) {
        this.internalState =
            new InternalState(
                "InitialPlacement",
                playerNamesInTurnOrder.map(playerName => new AuthenticatedPlayer(playerName))
            );

        this.playersInPlacementOrder =
            this.internalState.playersInTurnOrder.concat(
                this.internalState.playersInTurnOrder.slice().reverse()
            );
    }

    private internalState: InternalState
    private playersInPlacementOrder: AuthenticatedPlayer[]
}