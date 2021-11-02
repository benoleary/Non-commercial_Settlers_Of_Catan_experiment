import { ProductionRollScore } from "../resource/resource";
import { ImmutableHex } from "./ImmutableHex";
import { MutableHex } from "./MutableHex";
import { DesertHex, FieldsHex, ForestHex, HillsHex, MountainsHex, PastureHex }
    from "./MutableProductiveHex";

// We can represent the hexes as positions on a square grid where each position is considered to
// touch the positions 1 unit away in either the x or the y direction, or diagonally along the
// x = y direction (but _not_ in the x = -y direction). Since we are represent the standard board
// as a width of 5 land hexes, the board fits on a 5 by 5 grid.
type GridHex<T extends ImmutableHex> = T | undefined;
type HexRow<T extends ImmutableHex> = [GridHex<T>, GridHex<T>, GridHex<T>, GridHex<T>, GridHex<T>];
export type HexMatrix<T extends ImmutableHex>
    = [HexRow<T>, HexRow<T>, HexRow<T>, HexRow<T>, HexRow<T>];
export type RowIndexInBoard = 0 | 1 | 2 | 3 | 4;
export type HexIndexInRow = 0 | 1 | 2 | 3 | 4;

export class HexBoard {
    static getFullyRandomBoard(): HexBoard {
        // This information cannot be fully deduced from the manual alone. I looked at my physical
        // copy. Unfortunately I seem to have lost C but I deduce that it must have been the other
        // token with value 6.
        let productionScoreTokensInAlphabeticalOrder: ProductionRollScore[] =
            [5n, 2n, 6n, 3n, 8n, 10n, 9n, 12n, 11n, 4n, 8n, 10n, 9n, 4n, 5n, 6n, 3n, 11n];
        let hexTiles: MutableHex[] = [];
        let hexConstructors = [
            HillsHex, HillsHex, HillsHex,
            ForestHex, ForestHex, ForestHex, ForestHex,
            MountainsHex, MountainsHex, MountainsHex,
            FieldsHex, FieldsHex, FieldsHex, FieldsHex,
            PastureHex, PastureHex, PastureHex, PastureHex
        ];
        while (productionScoreTokensInAlphabeticalOrder.length) {
            const scoreTokenIndex =
                Math.floor(Math.random() * productionScoreTokensInAlphabeticalOrder.length);
            const extractedScore =
                productionScoreTokensInAlphabeticalOrder.splice(scoreTokenIndex, 1)[0]!;
            const hexConstructorIndex = Math.floor(Math.random() * hexConstructors.length);
            const extractedConstructor = hexConstructors.splice(hexConstructorIndex, 1)[0]!;
            hexTiles.push(new extractedConstructor(extractedScore));
        }

        const desertIndex = Math.floor(Math.random() * hexTiles.length);
        hexTiles.splice(desertIndex, 0, new DesertHex());

        return new HexBoard(hexTiles);
    }

    viewBoard(): HexMatrix<ImmutableHex> {
        return this.mutableHexes;
    }

    changeBoard(): HexMatrix<MutableHex> {
        return this.mutableHexes;
    }

    constructor(inAlmanacSpiralOrder: MutableHex[]) {
        if (inAlmanacSpiralOrder.length != 19) {
            throw Error(
                `Cannot fit given hex tile sequence ${inAlmanacSpiralOrder} into 19-hex spiral`
                + " pattern as given in the almanac");
        }

        // Using 0 for "no hex" and the index starting from one to make the spiral easier to read,
        // this is the board as depicted in the manual but with the lowest row of hexes contained
        // in the first tuple, so it looks inverted vertically when read in the code.
        const indexPlusOneMapping = [
            [5,  6,  7,  0,  0],
            [4, 15, 16,  8,  0],
            [3, 14, 19, 17,  9],
            [0,  2, 13, 18, 10],
            [0,  0,  1, 12, 11],
        ];
        this.mutableHexes = [
            [undefined, undefined, undefined, undefined, undefined],
            [undefined, undefined, undefined, undefined, undefined],
            [undefined, undefined, undefined, undefined, undefined],
            [undefined, undefined, undefined, undefined, undefined],
            [undefined, undefined, undefined, undefined, undefined],
        ];
        for (let verticalIndex = 0; verticalIndex < indexPlusOneMapping.length; verticalIndex++) {
            const indexRow = indexPlusOneMapping[verticalIndex]!;
            for (let horizontalIndex = 0; horizontalIndex < indexRow.length; horizontalIndex++) {
                const indexInSpiral = indexRow[horizontalIndex]! - 1;
                if (indexInSpiral >= 0) {
                    const hexBeingPlaced = inAlmanacSpiralOrder[indexInSpiral];
                    this.mutableHexes[verticalIndex]![horizontalIndex] = hexBeingPlaced;

                    // If this is a new neighbor for existing hexes, we need to update them.
                    const pureWesternNeighbor =
                        horizontalIndex > 0
                        ? this.mutableHexes[verticalIndex]![horizontalIndex - 1]!
                        : undefined;
                    if (pureWesternNeighbor != undefined) {
                        pureWesternNeighbor.setPureEasternNeighborAndUpdateOtherNeighbors(
                            hexBeingPlaced
                        );
                    }
                    const southEasternNeighbor =
                        verticalIndex > 0
                        ? this.mutableHexes[verticalIndex - 1]![horizontalIndex]!
                        : undefined;
                    if (southEasternNeighbor != undefined) {
                        southEasternNeighbor.setNorthWesternNeighborAndUpdateOtherNeighbors(
                            hexBeingPlaced
                        );
                    }
                }
            }
        }
    }

    private mutableHexes: HexMatrix<MutableHex>;
}
