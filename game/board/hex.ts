import { ProductionRollScore, ResourceType } from "../resource/resource";
type ProductiveType = "hills" | "forest" | "mountains" | "fields" | "pasture";
type LandType = ProductiveType | "desert";

// We can build hex classes on an abstract base since there is going to be no multiple
// inheritance.
export abstract class ImmutableHex {
    abstract get landType(): LandType
    abstract get producedResource(): ResourceType | undefined

    get hasRobber(): boolean {
        return this.isOccupiedByRobber;
    }

    // This class should be constructed with information about any of its corners which are ports
    // because this is fixed from the creation of the board and is important information to be read
    // by players, but I have decided that implementation of ports is a stretch goal for this
    // project.
    protected constructor(
        public readonly productionRollScore: ProductionRollScore | undefined,
        protected isOccupiedByRobber: boolean
    ) { }
}

type HexCallback = (producedResource: ResourceType) => void;

export abstract class MutableHex extends ImmutableHex {
    abstract onProductionRoll(callbackFunction: HexCallback): void

    protected constructor(
        public readonly productionRollScore: ProductionRollScore | undefined,
        protected isOccupiedByRobber: boolean
    ) {
        super(productionRollScore, isOccupiedByRobber);
    }
}

export abstract class MutableProductiveHex extends MutableHex {
    // We do not need a method to remove observers because this is used only for settlements or
    // cities, and the implementation is the same object in a different state, so the callback
    // remains the same, and also settlements are never destroyed, only upgraded, and cities are
    // never destroyed.
    onProductionRoll(callbackFunction: HexCallback): void {
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
type HexMatrix<T extends ImmutableHex> = [HexRow<T>, HexRow<T>, HexRow<T>, HexRow<T>, HexRow<T>];

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
            const scoreTokenIndex = Math.random() * productionScoreTokensInAlphabeticalOrder.length;
            const extractedScore = productionScoreTokensInAlphabeticalOrder.splice(scoreTokenIndex, 1)[0]!;
            const hexConstructorIndex = Math.random() * productionScoreTokensInAlphabeticalOrder.length;
            const extractedConstructor = hexConstructors.splice(hexConstructorIndex, 1)[0]!;
            hexTiles.push(new extractedConstructor(extractedScore));
        }

        const desertIndex = Math.random() * productionScoreTokensInAlphabeticalOrder.length;
        hexTiles.splice(desertIndex, 0, new DesertHex());

        return new HexBoard(hexTiles);
    }

    viewBoard(): HexMatrix<ImmutableHex> {
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
        for (let verticalIndex = 0; verticalIndex < 5; verticalIndex++) {
            for (let horizontalIndex = 0; horizontalIndex < 5; horizontalIndex++) {
                const indexInSpiral = indexPlusOneMapping[verticalIndex]![horizontalIndex]! - 1;
                if (indexInSpiral >= 0) {
                    this.mutableHexes[verticalIndex]![horizontalIndex] = inAlmanacSpiralOrder[indexInSpiral];
                }
            }
        }
    }

    private mutableHexes: HexMatrix<MutableHex>;
}