import { AuthenticatedPlayer } from "../player/player"
import { ResourceType } from "../resource/resource";

export type SettlementType = "village" | "city";

/**
 * This class does the job of representing a settlement owned by a player, and signalling if it is
 * a village or a city, and does the job of passing on the correct amount of resources if one of
 * its hexes informs the SettlementPiece that the hex is producing its resource.
 */
export class SettlementPiece {
    constructor(
        public readonly owningPlayer: AuthenticatedPlayer,
        private settlementType: SettlementType
    ) { }

    getType() {
        return this.settlementType;
    }

    getCallbackOnNormalTurnProduction(): (producedResource: ResourceType) => void {
        return this.propagateResourceToPlayer.bind(this);
    }

    propagateResourceToPlayer(producedResource: ResourceType): void {
        const numberOfCards = this.getType() == "city" ? 2n : 1n;
        this.owningPlayer.acceptResource(producedResource, numberOfCards);
    }
}
