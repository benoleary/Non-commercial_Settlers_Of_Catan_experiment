import { Game } from "../game/state";
import { RequestResult } from "../game/state/interface";
import { CommandParser } from "./CommandParser";

export class NormalTurnsCommandParser implements CommandParser {
    constructor(private currentGame: Game) { }

    getHelpText(): string {
        const possiblePlayerNumbers =
            `1/2/3${this.currentGame.playerNamesInTurnOrder.length > 3 ? "/4" : ""}`;

        return [
            "Normal turns phase.",
            `The active player is ${this.currentGame.getActivePlayerName()}`,
            "There are several possible commands",
            `(P is the number of the player requesting the action: ${possiblePlayerNumbers})`,
            "1) \"P next\" to pass the turn to the next player"
        ].join("\n");
    }

    performRequest(playerIdentifier: string, requestWords: string[]): RequestResult {
        const actionWord = requestWords[0]?.toUpperCase();

        if (actionWord == undefined) {
            return [
                "RefusedSameTurn",
                "Required at least 1 word to determine which action has been requested"
            ];
        }

        if (actionWord == "NEXT") {
            return this.currentGame.beginNextNormalTurn(playerIdentifier);
        }

        return [
            "RefusedSameTurn",
            `Could not understand ${actionWord} as a valid action`
        ];
    }
}