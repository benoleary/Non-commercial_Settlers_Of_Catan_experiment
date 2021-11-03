import { RequestResult } from "../game/state/interface";

export interface CommandParser {
    getHelpText(): string

    performRequest(playerIdentifier: string, requestWords: string[]): RequestResult
}