import { Game } from "../game/state";
import { RequestResult } from "../game/state/interface";
import { HexSelector } from "./HexSelector";
import { CommandParser, INVALID_INPUT_EFFECT } from "./CommandParser";

export class InitialPlacementCommandParser implements CommandParser {
    constructor(private currentGame: Game) { }

    getHelpText(): string {
        const possiblePlayerNumbers =
            `1/2/3${this.currentGame.playerNamesInTurnOrder.length > 3 ? "/4" : ""}`;

        return [
            "Initial settlement placement phase.",
            `The active player is ${this.currentGame.getActivePlayerName()}`,
            "Enter your command in the following form:",
            "P R H CD RD",
            `P is the player (${possiblePlayerNumbers})`,
            "R is the row letter (A/B/C/D/E - A the southernmost row, E the northernmost)",
            "H is the hex number from the westernmost of the hexes of the chosen row",
            "CD is the corner direction for placing the settlement on the chosen hex (N/NE/SE/S/SW/NW)",
            "RD is the road direction from the placed settlement (N/NE/SE/S/SW/NW)",
            "E.g. \"1 A 1 NW NE\"",
            "for player 1 to put an initial settlement on the westernmost hex of the",
            "southernmost row on its north-western corner with a road going north-east"
        ].join("\n");
    }

    performRequest(playerIdentifier: string, requestWords: string[]): RequestResult {
        if (requestWords.length != 4) {
            return [
                "RefusedSameTurn",
                "Required exactly 5 \"words\": player number, row letter, hex number,"
                + " settlement corner, road edge"
            ];
        }

        const [rowIndexInBoardFromZero, hexIndexInRowFromZero] =
            HexSelector.convertToGridIndices(requestWords[0]!, requestWords[1]!);

        if (rowIndexInBoardFromZero == undefined) {
            return [
                INVALID_INPUT_EFFECT,
                `Could not understand ${requestWords[0]} as a valid row`
            ];
        }
        if (hexIndexInRowFromZero == undefined) {
            return [
                INVALID_INPUT_EFFECT,
                `Could not understand ${requestWords[1]} as a valid hex within the chosen row`
            ];
        }

        const settlementCorner = HexSelector.convertToHexCorner(requestWords[2]!);
        if (settlementCorner == undefined) {
            return [
                INVALID_INPUT_EFFECT,
                `Could not understand ${requestWords[2]} as a valid corner of the chosen hex`
            ];
        }

        const roadEdge = HexSelector.convertToHexToHex(requestWords[3]!);
        if (roadEdge == undefined) {
            return [
                INVALID_INPUT_EFFECT,
                `Could not understand ${requestWords[3]} as a valid edge of the chosen hex`
            ];
        }

        return this.currentGame.placeInitialSettlement(
                playerIdentifier,
                rowIndexInBoardFromZero,
                hexIndexInRowFromZero,
                settlementCorner,
                roadEdge
            );
    }
}
