import { Game } from "../game/state";
import { RequestEffect, RequestResult } from "../game/state/interface";
import { HexCornerDirection, HexIndexInRow, HexToHexDirection, RowIndexInBoard }
    from "../game/board/hex";
import { CommandParser } from "./CommandParser";

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
            InitialPlacementCommandParser.convertToGridIndices(requestWords[0]!, requestWords[1]!);

        if (rowIndexInBoardFromZero == undefined) {
            return [
                InitialPlacementCommandParser.invalidInputEffect,
                `Could not understand ${requestWords[0]} as a valid row`
            ];
        }
        if (hexIndexInRowFromZero == undefined) {
            return [
                InitialPlacementCommandParser.invalidInputEffect,
                `Could not understand ${requestWords[1]} as a valid hex within the chosen row`
            ];
        }

        const settlementCorner =
            InitialPlacementCommandParser.convertToHexCorner(requestWords[2]!);
        if (settlementCorner == undefined) {
            return [
                InitialPlacementCommandParser.invalidInputEffect,
                `Could not understand ${requestWords[2]} as a valid corner of the chosen hex`
            ];
        }

        const roadEdge = InitialPlacementCommandParser.convertToHexToHex(requestWords[3]!);
        if (roadEdge == undefined) {
            return [
                InitialPlacementCommandParser.invalidInputEffect,
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

    private static convertToGridIndices(
        rowIdentifier: string,
        hexWithinRow: string
    ): [RowIndexInBoard | undefined, HexIndexInRow | undefined] {
        const uppercaseRow = rowIdentifier.toUpperCase();
        let rowIndex: RowIndexInBoard | undefined = undefined;
        if (uppercaseRow == "A") {
            rowIndex = 0;
        } else if (uppercaseRow == "B") {
            rowIndex = 1;
        } else if (uppercaseRow == "C") {
            rowIndex = 2;
        } else if (uppercaseRow == "D") {
            rowIndex = 3;
        } else if (uppercaseRow == "E") {
            rowIndex = 4;
        } else {
            return [undefined, undefined];
        }

        // The northernmost two rows have dummy undefined hexes, so we start counting from the
        // first valid hex.
        if (rowIndex == 4) {
            if (hexWithinRow == "1") {
                return [rowIndex, 2];
            }
            if (hexWithinRow == "2") {
                return [rowIndex, 3];
            }
            if (hexWithinRow == "3") {
                return [rowIndex, 4];
            }
        }

        if (rowIndex == 3) {
            if (hexWithinRow == "1") {
                return [rowIndex, 1];
            }
            if (hexWithinRow == "2") {
                return [rowIndex, 2];
            }
            if (hexWithinRow == "3") {
                return [rowIndex, 3];
            }
            if (hexWithinRow == "4") {
                return [rowIndex, 4];
            }
        }

        if (hexWithinRow == "1") {
            return [rowIndex, 0];
        }
        if (hexWithinRow == "2") {
            return [rowIndex, 1];
        }
        if (hexWithinRow == "3") {
            return [rowIndex, 2];
        }
        if (hexWithinRow == "4") {
            return [rowIndex, 3];
        }
        if (hexWithinRow == "5") {
            return [rowIndex, 4];
        }

        return [rowIndex, undefined];
    }

    private static convertToHexCorner(playerInput: string): HexCornerDirection | undefined {
        const uppercaseInput = playerInput.toUpperCase();
        const validInputs =
            InitialPlacementCommandParser.validCornerDirections.filter(
                validDirection => validDirection == uppercaseInput
            );

        if (validInputs.length != 1) {
            return undefined
        }

        return validInputs[0];
    }

    private static convertToHexToHex(playerInput: string): HexToHexDirection | undefined {
        const uppercaseInput = playerInput.toUpperCase();
        const validInputs =
            InitialPlacementCommandParser.validHexToHexDirections.filter(
                validDirection => validDirection == uppercaseInput
            );

        if (validInputs.length != 1) {
            return undefined
        }

        return validInputs[0];
    }

    private static readonly invalidInputEffect: RequestEffect = "RefusedSameTurn";
    private static readonly validCornerDirections: HexCornerDirection[] =
        ["N", "NE", "SE", "S", "SW", "NW"];
    private static readonly validHexToHexDirections: HexToHexDirection[] =
        ["NE", "E", "SE", "SW", "W", "NW"];
}