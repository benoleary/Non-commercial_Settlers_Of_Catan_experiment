import { ResourceCardSet, ResourceType } from "../resource/resource";

/**
 * This class represents a player within the game state, relying on other systems to have
 * authenticated and verified the entity issuing commands as the player. The player has a set of
 * resource cards, possibly some set aside as offered as trades, and a number of victory points.
 */
export class AuthenticatedPlayer {
    constructor(public readonly playerName: string) {
        this.fullyOwnedResources = ResourceCardSet.createEmpty();
        this.offeredTrades = new Map<AuthenticatedPlayer, ResourceCardSet>();
        this.victoryPoints = 0n;
    }

    getVictoryPointScore(): bigint {
        return this.victoryPoints;
    }

    acceptResource(resourceType: ResourceType, numberOfCards: bigint): void {
        this.fullyOwnedResources.addTo(resourceType, numberOfCards);
    }

    acceptResourceSet(resourceCost: ResourceCardSet): void {
        this.fullyOwnedResources.addAllOf(resourceCost);
    }

    getResourceArray(): ResourceType[] {
        return this.fullyOwnedResources.asArray();
    }

    canAfford(resourceCost: ResourceCardSet): boolean {
        return this.fullyOwnedResources.isGreaterOrEqualInAllResources(resourceCost);
    }

    getMaritimeCost(resourceType: ResourceType): bigint {
        // Maybe some day I will implement ports.
        return 4n;
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

    private fullyOwnedResources: ResourceCardSet;
    private offeredTrades: Map<AuthenticatedPlayer, ResourceCardSet>;
    private victoryPoints: bigint;
}
