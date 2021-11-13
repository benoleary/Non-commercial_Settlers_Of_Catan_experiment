export type ResourceType = "brick" | "lumber" | "ore" | "grain" | "wool";
export const ALL_RESOURCE_TYPES: ResourceType[] = ["brick", "lumber", "ore", "grain", "wool"];

export type CallbackOnResourceProduction = (producedResource: ResourceType) => void;

// These are the scores on a roll of 2d6 which generate resources, so integers
// 2 to 12, skipping over 7 (the robber case).
export type ProductionRollScore = 2n | 3n | 4n | 5n | 6n | 8n | 9n | 10n | 11n | 12n;
export const RobberActivationScore = 7n;

/**
 * This class exists to represent a set of fungible resource cards, whether as the resources owned
 * by a player, or to represent the resources offered or desired in a trade, or whatever.
 */
export class ResourceCardSet {
    static createEmpty(): ResourceCardSet {
        return new ResourceCardSet(0n, 0n, 0n, 0n, 0n);
    }

    constructor(
        public brickCount: bigint,
        public lumberCount: bigint,
        public oreCount: bigint,
        public grainCount: bigint,
        public woolCount: bigint
    ) { }

    getCount(resourceType: ResourceType): bigint {
        if (resourceType == "brick") {
            return this.brickCount;
        }
        if (resourceType == "lumber") {
            return this.lumberCount;
        }
        if (resourceType == "ore") {
            return this.oreCount;
        }
        if (resourceType == "grain") {
            return this.grainCount;
        }
        if (resourceType == "wool") {
            return this.woolCount;
        }
        return 0n;
    }

    isGreaterOrEqualInAllResources(resourceCost: ResourceCardSet): boolean {
        return (
            (this.brickCount >= resourceCost.brickCount)
            && (this.lumberCount >= resourceCost.lumberCount)
            && (this.oreCount >= resourceCost.oreCount)
            && (this.grainCount >= resourceCost.grainCount)
            && (this.woolCount >= resourceCost.woolCount)
        );
    }

    asArray(): ResourceType[] {
        let resourceArray: ResourceType[] = [];
        for (let copyCount = 0; copyCount < Number(this.brickCount); copyCount++) {
            resourceArray.push("brick");
        }
        for (let copyCount = 0; copyCount < Number(this.lumberCount); copyCount++) {
            resourceArray.push("lumber");
        }
        for (let copyCount = 0; copyCount < Number(this.oreCount); copyCount++) {
            resourceArray.push("ore");
        }
        for (let copyCount = 0; copyCount < Number(this.grainCount); copyCount++) {
            resourceArray.push("grain");
        }
        for (let copyCount = 0; copyCount < Number(this.woolCount); copyCount++) {
            resourceArray.push("wool");
        }
        return resourceArray;
    }

    asCost(): ResourceCardSet {
        return new ResourceCardSet(
            -this.brickCount,
            -this.lumberCount,
            -this.oreCount,
            -this.grainCount,
            -this.woolCount
        );
    }

    addTo(resourceType: ResourceType, numberOfCards: bigint): void {
        if (resourceType == "brick") {
            this.brickCount += numberOfCards;
        } else if (resourceType == "lumber") {
            this.lumberCount += numberOfCards;
        } else if (resourceType == "ore") {
            this.oreCount += numberOfCards;
        } else if (resourceType == "grain") {
            this.grainCount += numberOfCards;
        } else if (resourceType == "wool") {
            this.woolCount += numberOfCards;
        }
    }

    addAllOf(setToAdd: ResourceCardSet): void {
        this.brickCount += setToAdd.brickCount;
        this.lumberCount += setToAdd.lumberCount;
        this.oreCount += setToAdd.oreCount;
        this.grainCount += setToAdd.grainCount;
        this.woolCount += setToAdd.woolCount;
    }
}
