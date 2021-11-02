import { ProductionRollScore, ResourceType } from "../resource/resource";
import { LandType } from "./ImmutableHex";
import { HexCallback, MutableHex } from "./MutableHex";

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


export class DesertHex extends MutableHex {
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

export class HillsHex extends MutableProductiveHex {
    get landType(): LandType { return "hills"; }
    get producedResource(): ResourceType { return "brick"; }

    constructor(public readonly productionRollScore: ProductionRollScore) {
        // Only the desert hex starts with the robber piece.
        super(productionRollScore, false);
    }
}

export class ForestHex extends MutableProductiveHex {
    get landType(): LandType { return "forest"; }
    get producedResource(): ResourceType { return "lumber"; }

    constructor(public readonly productionRollScore: ProductionRollScore) {
        // Only the desert hex starts with the robber piece.
        super(productionRollScore, false);
     }
}

export class MountainsHex extends MutableProductiveHex {
    get landType(): LandType { return "mountains"; }
    get producedResource(): ResourceType { return "ore"; }

    constructor(public readonly productionRollScore: ProductionRollScore) {
        // Only the desert hex starts with the robber piece.
        super(productionRollScore, false);
     }
}

export class FieldsHex extends MutableProductiveHex {
    get landType(): LandType { return "fields"; }
    get producedResource(): ResourceType { return "grain"; }

    constructor(public readonly productionRollScore: ProductionRollScore) {
        // Only the desert hex starts with the robber piece.
        super(productionRollScore, false);
     }
}

export class PastureHex extends MutableProductiveHex {
    get landType(): LandType { return "pasture"; }
    get producedResource(): ResourceType { return "wool"; }

    constructor(public readonly productionRollScore: ProductionRollScore) {
        // Only the desert hex starts with the robber piece.
        super(productionRollScore, false);
     }
}
