import { ResourceType } from "../resource/resource";

// This could probably be much more elaborate for a real implementation of the game.
export type PlayerId = "p1" | "p2" | "p3" | "p4";

export class AuthenticatedPlayer {
    constructor(public readonly playerName: string) {
        this.fullyOwnedResources = new Map<ResourceType, bigint>();
        this.offeredTrades = new Map<PlayerId, ResourceType[]>();
    }

    acceptResource(resourceType: ResourceType, numberOfCards: bigint): void {
        const amountBefore = this.fullyOwnedResources.get(resourceType) ?? 0n;
        this.fullyOwnedResources.set(resourceType, amountBefore + numberOfCards);
    }

    getResourceArray(): ResourceType[] {
        let resourceArray: ResourceType[] = [];

        for (const [resourceType, numberOfCards] of this.fullyOwnedResources) {
            for (let copyCount = 0; copyCount < Number(numberOfCards); copyCount++) {
                resourceArray.push(resourceType);
            }
        }

        return resourceArray;
    }

    offerTrade(
        otherPlayer: AuthenticatedPlayer,
        offeredResources: Iterable<ResourceType>,
        requestedResources: Iterable<ResourceType>
    ): boolean {
        // TODO: implement this.
        // However, implementing trading is a stretch goal for this project.
        // It would involve:
        // 1) check if this player has the resource
        // 2) if so then escrow it in offeredTrades,
        // 3) then ...
        return false;
    }

    protected fullyOwnedResources: Map<ResourceType, bigint>
    protected offeredTrades: Map<PlayerId, ResourceType[]>
}
