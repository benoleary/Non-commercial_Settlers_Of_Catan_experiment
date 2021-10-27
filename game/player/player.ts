import { ResourceType } from "../resource/resource";

// This could probably be much more elaborate for a real implementation of the game.
export type PlayerId = "p1" | "p2" | "p3" | "p4";

export class AuthenticatedPlayer {
    constructor(public readonly playerName: string) {
        this.fullyOwnedResources = [];
        this.offeredTrades = new Map<PlayerId, ResourceType[]>();
    }

    offerTrade(
        otherPlayer: AuthenticatedPlayer,
        offeredResources: Iterable<ResourceType>,
        requestedResources: Iterable<ResourceType>
    ): boolean {
        // TODO: check if this player has the resource, if so then escrow it in offeredTrades,
        // then ...
        // However, implementing trading is a stretch goal for this project.
        return false;
    }

    protected fullyOwnedResources: ResourceType[]
    protected offeredTrades: Map<PlayerId, ResourceType[]>
}
