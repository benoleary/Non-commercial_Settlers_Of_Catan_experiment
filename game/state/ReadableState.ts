import { HexMatrix, ImmutableHex } from "../board/hex";
import { AuthenticatedPlayer } from "../player/player";

export type GamePhase = "InitialPlacement" | "NormalTurns" | "GameOver";
export type PlayerNamesInTurnOrder = [string, string, string] | [string, string, string, string];
export type RequestEffect = "RefusedSameTurn" | "SuccessfulSameTurn" | "SuccessfulNewTurn"| "RefusedGameOver";
export type RequestResult = [RequestEffect, string];

/**
 * This should just expose read-only state as players would see the game.
 */
export interface ReadableState {
    viewBoard(): HexMatrix<ImmutableHex>
    getPhase(): GamePhase
    getPlayer(playerIdentifier: string): AuthenticatedPlayer | undefined
    getLastSuccessfulRequestResult(): RequestResult | undefined
}
