import { PlayerColor } from "../player/player"
import { ResourceType } from "../resource/resource";

export type SettlementType = "village" | "city";
export type CallbackOnResourcePropagation =
    (resourceType: ResourceType, numberOfCards: bigint) => void;
export type CallbackForCheck = () => boolean;

/**
 * This class does the job of representing a settlement owned by a player, and signalling if it is
 * a village or a city, and does the job of passing on the correct amount of resources if one of
 * its hexes informs the SettlementPiece that the hex is producing its resource.
 */
export class SettlementPiece {
    constructor(
        public readonly owningColor: PlayerColor,
        private acceptPropagatedResource: CallbackOnResourcePropagation,
        private requestCostApplication: CallbackForCheck
    ) {
        // Settlements are always placed as villages, and later upgraded to cities.
        this.settlementType = "village";
    }

    getType() {
        return this.settlementType;
    }

    getCallbackOnNormalTurnProduction(): (producedResource: ResourceType) => void {
        return this.propagateResource.bind(this);
    }

    propagateResource(producedResource: ResourceType): void {
        const numberOfCards = (this.getType() == "city") ? 2n : 1n;
        this.acceptPropagatedResource(producedResource, numberOfCards);
    }

    upgradeToCity(): [boolean, string] {
        if (this.settlementType == "city") {
            return [false, "Already upgraded to city"];
        }

        if (!this.requestCostApplication()) {
            return [false, "No piece for city available from player"];
        }

        this.settlementType = "city";
        return [true, "Upgraded to city"];
    }

    private settlementType: SettlementType;
}
