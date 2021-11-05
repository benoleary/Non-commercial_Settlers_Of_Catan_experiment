import { AuthenticatedPlayer } from "../player/player"
import { ResourceType } from "../resource/resource";

export type SettlementType = "village" | "city";

export class RoadPiece {
    constructor(public readonly owningPlayer: AuthenticatedPlayer) { }
}

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
