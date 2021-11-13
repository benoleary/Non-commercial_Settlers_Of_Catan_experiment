import { HexCornerDirection, HexIndexInRow, HexToHexDirection, RowIndexInBoard }
    from "../game/board/hex";

/**
 * This class encapsulates the interpretation of text input from the players as grid indices
 * starting from zero for the internal representation of the hexes.
 */
export class HexSelector {
    static convertToGridIndices(
        rowIdentifier: string,
        hexWithinRow: string
    ): [(RowIndexInBoard | undefined), (HexIndexInRow | undefined)] {
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

    static convertToHexCorner(playerInput: string): HexCornerDirection | undefined {
        const uppercaseInput = playerInput.toUpperCase();
        const validInputs =
            HexSelector.VALID_CORNER_DIRECTIONS.filter(
                validDirection => validDirection == uppercaseInput
            );

        if (validInputs.length != 1) {
            return undefined
        }

        return validInputs[0];
    }

    static convertToHexToHex(playerInput: string): HexToHexDirection | undefined {
        const uppercaseInput = playerInput.toUpperCase();
        const validInputs =
            HexSelector.VALID_HEX_TO_HEX_DIRECTIONS.filter(
                validDirection => validDirection == uppercaseInput
            );

        if (validInputs.length != 1) {
            return undefined
        }

        return validInputs[0];
    }

    private static readonly VALID_CORNER_DIRECTIONS: HexCornerDirection[] =
        ["N", "NE", "SE", "S", "SW", "NW"];
    private static readonly VALID_HEX_TO_HEX_DIRECTIONS: HexToHexDirection[] =
        ["NE", "E", "SE", "SW", "W", "NW"];
}