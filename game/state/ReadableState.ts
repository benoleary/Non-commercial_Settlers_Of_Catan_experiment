import { HexMatrix, ImmutableHex } from "../board/hex";
import { AuthenticatedPlayer, PlayerColor } from "../player/player";

export type GamePhase = "InitialPlacement" | "NormalTurns" | "GameOver";
export type PlayerNameAndColor = [string, PlayerColor];
export type PlayerNamesAndColorsInTurnOrder =
    [PlayerNameAndColor, PlayerNameAndColor, PlayerNameAndColor]
    | [PlayerNameAndColor, PlayerNameAndColor, PlayerNameAndColor, PlayerNameAndColor];
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
