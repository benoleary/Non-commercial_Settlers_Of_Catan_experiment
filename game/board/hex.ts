import { ProductionRollScore, ResourceType } from "../resource/resource";
type ProductiveType = "hills" | "forest" | "mountains" | "fields" | "pasture";
export type LandType = ProductiveType | "desert";
export type RowIndexInBoard = 0 | 1 | 2 | 3 | 4;
export type HexIndexInRow = 0 | 1 | 2 | 3 | 4;

type HexToHexDirection =
    "NorthEast" | "PureEast" | "SouthEast" | "SouthWest" | "PureWest" | "NorthWest";

// We can build hex classes on an abstract base since there is going to be no multiple
// inheritance.
export abstract class ImmutableHex {
    abstract get landType(): LandType
    abstract get producedResource(): ResourceType | undefined

    get hasRobber(): boolean {
        return this.isOccupiedByRobber;
    }

    /**
     * This should return the neighbor of this hex in the given direction.
     *
     * This is really just exposing some debugging functionality, since only mutable hexes are
     * going to need to know about their neighbors. External components which know only about
     * immutable hexes will also know about their board positions so will not need to query the
     * hexes about their neighbors. However, it is harmless to allow it.
     *
     * @param neighborDirection The direction of the neighbor from the receiver hex
     */
    abstract getNeighbor(neighborDirection: HexToHexDirection): ImmutableHex | undefined

    protected constructor(
        public readonly productionRollScore: ProductionRollScore | undefined,
        protected isOccupiedByRobber: boolean
    ) {
        // This class should be constructed with information about any of its corners which are ports
        // because this is fixed from the creation of the board and is important information to be read
        // by players, but I have decided that implementation of ports is a stretch goal for this
        // project.
    }

    protected static neighborIndex(neighborDirection: HexToHexDirection): number | undefined {
        // This is just to avoid getting confused abotu which number means which direction.
        if (neighborDirection == "NorthEast") {
            return 0;
        }
        if (neighborDirection == "PureEast") {
            return 1;
        }
        if (neighborDirection == "SouthEast") {
            return 2;
        }
        if (neighborDirection == "SouthWest") {
            return 3;
        }
        if (neighborDirection == "PureWest") {
            return 4;
        }
        if (neighborDirection == "NorthWest") {
            return 5;
        }

        return undefined;
    }
}

type HexCallback = (producedResource: ResourceType) => void;

export abstract class MutableHex extends ImmutableHex {
    getNeighbor(neighborDirection: HexToHexDirection): ImmutableHex | undefined {
        const directionIndex = ImmutableHex.neighborIndex(neighborDirection);

        // TypeScript really should know that all the HexToHexDirection cases are covered and that
        // neighborIndex will never return undefined... but apparently it does not know that.
        if (directionIndex == undefined) {
            return undefined;
        }

        return this.nearestNeighbors[directionIndex];
    }

    /**
     * This links the given hex to the receiver hex as its eastern neighbor and also sets this
     * eastern neighbor as the south-eastern neighbor of the receiver hex's north-eastern neighbor
     * and as the north-eastern neighbor of the receiver hex's south-eastern neighbor, if such
     * neighbors exist.
     *
     * @param pureEasternNeighbor The hex which has been placed to the east of the receiver hex
     */
    setPureEasternNeighbor(pureEasternNeighbor: (MutableHex | undefined)): void {
        this.nearestNeighbors[ImmutableHex.neighborIndex("PureEast")!] = pureEasternNeighbor;

        const northEasternNeighbor =
            this.nearestNeighbors[ImmutableHex.neighborIndex("NorthEast")!];
        if (northEasternNeighbor != undefined) {
            northEasternNeighbor.nearestNeighbors[ImmutableHex.neighborIndex("SouthEast")!]
                = pureEasternNeighbor;
        }
        const southEasternNeighbor =
            this.nearestNeighbors[ImmutableHex.neighborIndex("SouthEast")!];
        if (southEasternNeighbor != undefined) {
            southEasternNeighbor.nearestNeighbors[ImmutableHex.neighborIndex("NorthEast")!]
                = pureEasternNeighbor;
        }

        // The new neighbor also needs to know about the hexes already in place.
        if (pureEasternNeighbor != undefined) {
            pureEasternNeighbor.nearestNeighbors[ImmutableHex.neighborIndex("PureWest")!]
                = this;
            pureEasternNeighbor.nearestNeighbors[ImmutableHex.neighborIndex("NorthWest")!]
                = northEasternNeighbor;
            pureEasternNeighbor.nearestNeighbors[ImmutableHex.neighborIndex("SouthWest")!]
                = southEasternNeighbor;
        }
    }

    /**
     * This links the given hex to the receiver hex as its north-western neighbor and also sets
     * this north-western neighbor as the western neighbor of the receiver hex's north-eastern
     * neighbor and as the north-eastern neighbor of the receiver hex's western neighbor, if such
     * neighbors exist.
     *
     * @param northWesternNeighbor The hex which has been placed to the north-west of the receiver
     *                             hex
     */
    setNorthWesternNeighbor(northWesternNeighbor: (MutableHex | undefined)): void {
        this.nearestNeighbors[ImmutableHex.neighborIndex("NorthWest")!] = northWesternNeighbor;

        const northEasternNeighbor =
            this.nearestNeighbors[ImmutableHex.neighborIndex("NorthEast")!];
        if (northEasternNeighbor != undefined) {
            northEasternNeighbor.nearestNeighbors[ImmutableHex.neighborIndex("PureWest")!]
                = northWesternNeighbor;
        }
        const pureWesternNeighbor =
            this.nearestNeighbors[ImmutableHex.neighborIndex("PureWest")!];
        if (pureWesternNeighbor != undefined) {
            pureWesternNeighbor.nearestNeighbors[ImmutableHex.neighborIndex("NorthEast")!]
                = northWesternNeighbor;
        }

        // The new neighbor also needs to know about the hexes already in place.
        if (northWesternNeighbor != undefined) {
            northWesternNeighbor.nearestNeighbors[ImmutableHex.neighborIndex("SouthEast")!]
                = this;
            northWesternNeighbor.nearestNeighbors[ImmutableHex.neighborIndex("PureEast")!]
                = northEasternNeighbor;
            northWesternNeighbor.nearestNeighbors[ImmutableHex.neighborIndex("SouthWest")!]
                = pureWesternNeighbor;
        }
    }

    abstract onProductionRoll(callbackFunction: HexCallback): void

    protected constructor(
        public readonly productionRollScore: ProductionRollScore | undefined,
        protected isOccupiedByRobber: boolean
    ) {
        super(productionRollScore, isOccupiedByRobber);

        this.nearestNeighbors = [undefined, undefined, undefined, undefined, undefined, undefined];
    }

    protected nearestNeighbors: (MutableHex | undefined)[]
}

export abstract class MutableProductiveHex extends MutableHex {
    /**
     * This accepts a callback to invoke if this hex is activated because the dice rolled its core,
     * and the callback will be given the value of the resource type of this hex.
     *
     * @param callbackFunction A function to invoke when the dice roll the score of this hex
     */
    onProductionRoll(callbackFunction: HexCallback): void {
        // We do not need a method to remove observers because this is used only for settlements or
        // cities, and the implementation is the same object in a different state, so the callback
        // remains the same, and also settlements are never destroyed, only upgraded, and cities
        // are never destroyed.
        this.callbackFunctions.push(callbackFunction);
    }

    protected constructor(
        public readonly productionRollScore: ProductionRollScore,
        protected isOccupiedByRobber: boolean
    ) {
        super(productionRollScore, isOccupiedByRobber);
        this.callbackFunctions = [];
    }

    private callbackFunctions: HexCallback[]
}

// We can represent the hexes as positions on a square grid where each position is considered to
// touch the positions 1 unit away in either the x or the y direction, or diagonally along the
// x = y direction (but _not_ in the x = -y direction). Since we are represent the standard board
// as a width of 5 land hexes, the board fits on a 5 by 5 grid.
type GridHex<T extends ImmutableHex> = T | undefined;
type HexRow<T extends ImmutableHex> = [GridHex<T>, GridHex<T>, GridHex<T>, GridHex<T>, GridHex<T>];
export type HexMatrix<T extends ImmutableHex>
    = [HexRow<T>, HexRow<T>, HexRow<T>, HexRow<T>, HexRow<T>];

class DesertHex extends MutableHex {
    get landType(): LandType { return "desert"; }
    get producedResource(): undefined { return undefined; }

    onProductionRoll(callbackFunction: HexCallback): void {
        // The desert hex has no dice roll score and never produces anything.
        // But it's easier to just let it accept any callbacks and just ignore them.
    }

    constructor() {
        // There is only one desert hex, and the robber piece starts there.
        super(undefined, true);
     }
}

class HillsHex extends MutableProductiveHex {
    get landType(): LandType { return "hills"; }
    get producedResource(): ResourceType { return "brick"; }

    constructor(public readonly productionRollScore: ProductionRollScore) {
        // Only the desert hex starts with the robber piece.
        super(productionRollScore, false);
    }
}

class ForestHex extends MutableProductiveHex {
    get landType(): LandType { return "forest"; }
    get producedResource(): ResourceType { return "lumber"; }

    constructor(public readonly productionRollScore: ProductionRollScore) {
        // Only the desert hex starts with the robber piece.
        super(productionRollScore, false);
     }
}

class MountainsHex extends MutableProductiveHex {
    get landType(): LandType { return "mountains"; }
    get producedResource(): ResourceType { return "ore"; }

    constructor(public readonly productionRollScore: ProductionRollScore) {
        // Only the desert hex starts with the robber piece.
        super(productionRollScore, false);
     }
}

class FieldsHex extends MutableProductiveHex {
    get landType(): LandType { return "fields"; }
    get producedResource(): ResourceType { return "grain"; }

    constructor(public readonly productionRollScore: ProductionRollScore) {
        // Only the desert hex starts with the robber piece.
        super(productionRollScore, false);
     }
}

class PastureHex extends MutableProductiveHex {
    get landType(): LandType { return "pasture"; }
    get producedResource(): ResourceType { return "wool"; }

    constructor(public readonly productionRollScore: ProductionRollScore) {
        // Only the desert hex starts with the robber piece.
        super(productionRollScore, false);
     }
}

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
                        pureWesternNeighbor.setPureEasternNeighbor(hexBeingPlaced);
                    }
                    const southEasternNeighbor =
                        verticalIndex > 0
                        ? this.mutableHexes[verticalIndex - 1]![horizontalIndex]!
                        : undefined;
                    if (southEasternNeighbor != undefined) {
                        southEasternNeighbor.setNorthWesternNeighbor(hexBeingPlaced);
                    }
                }
            }
        }
    }

    private mutableHexes: HexMatrix<MutableHex>;
}