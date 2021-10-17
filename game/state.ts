import { HexBoard, HexMatrix, ImmutableHex } from "./board/hex"
import { ActivePlayer, TradeOnlyPlayer } from "./player/player"

export type GamePhase = "InitialPlacement" | "NormalTurns" | "Finished"

export class Game {
    constructor(private hexBoard: HexBoard) { }

    viewBoard(): HexMatrix<ImmutableHex> {
        return this.hexBoard.viewBoard();
    }

    getPhase(): GamePhase {
        // TODO: change one the game has states.
        return "InitialPlacement";
    }

    getPlayer(playerIdentifier: string): ActivePlayer | TradeOnlyPlayer | undefined {
        return undefined;
    }
}

export type RequestEffect = "RefusedSameTurn" | "SuccessfulSameTurn" | "SuccessfulNewTurn"
export type RequestResult = [RequestEffect, string]

interface CanTakePlayerRequests {
    placeInitialSettlement(): RequestResult
}
