import { RequestEffect, RequestResult } from "../game/state/interface";

export const INVALID_INPUT_EFFECT: RequestEffect = "RefusedSameTurn";

export interface CommandParser {
    getHelpText(): string

    performRequest(playerIdentifier: string, requestWords: string[]): RequestResult
}
