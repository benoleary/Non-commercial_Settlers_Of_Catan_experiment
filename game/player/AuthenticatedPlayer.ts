import { ResourceCardSet, ResourceType } from "../resource/resource";
import { CallbackOnResourcePropagation, PieceFactory, RoadPiece, SettlementPiece }
    from "../board/piece";
import { PlayerColor } from "./PlayerColor";
import { PiecePool } from "./PiecePool";

/**
 * This class represents a player within the game state, relying on other systems to have
 * authenticated and verified the entity issuing commands as the player. The player has a set of
 * resource cards, possibly some set aside as offered as trades, and a number of victory points.
 */
export class AuthenticatedPlayer {
    constructor(public readonly playerName: string, public readonly playerColor: PlayerColor) {
        this.fullyOwnedResources = ResourceCardSet.createEmpty();
        this.offeredTrades = new Map<AuthenticatedPlayer, ResourceCardSet>();

        // Technically the players start with 0 but there is no way to avoid placing both initial
        // settlements and gaining a victory point for each.
        this.victoryPoints = 2n;

        const incrementVictoryPoints = this.acceptSingleVictoryPoint.bind(this);
        this.piecePool =
            new PiecePool(
                this.playerColor,
                incrementVictoryPoints,
                this.getCallbackOnSettlementResourcePropagation(),
                incrementVictoryPoints
            );
    }

    getCallbackOnSettlementResourcePropagation(): CallbackOnResourcePropagation {
        return this.acceptResource.bind(this);
    }

    getRoadFactory(): PieceFactory<RoadPiece> {
        return this.piecePool.getRoadFactory();
    }

    getVillageFactory(): PieceFactory<SettlementPiece> {
        return this.piecePool.getVillageFactory();
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

    acceptVictoryPointChange(changeInPoints: bigint): void {
        this.victoryPoints += changeInPoints;
    }

    acceptSingleVictoryPoint(): void {
        this.acceptVictoryPointChange(1n);
    }

    private readonly piecePool: PiecePool;
    private readonly fullyOwnedResources: ResourceCardSet;
    private readonly offeredTrades: Map<AuthenticatedPlayer, ResourceCardSet>;
    private victoryPoints: bigint;
}
