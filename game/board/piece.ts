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

    getHexProductionRollCallback(): (producedResource: ResourceType) => void {
        return this.propagateResourceToPlayer.bind(this);
    }

    propagateResourceToPlayer(producedResource: ResourceType): void {
        // TODO: implement this.
    }
}
