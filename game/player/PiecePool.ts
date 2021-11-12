import { CallbackOnResourcePropagation, PieceFactory, RoadPiece, SettlementPiece }
    from "../board/piece";
import { PlayerColor } from "./PlayerColor";

export type CallbackOnEvent = () => void;

/**
 * This class represents the stock of pieces of a particular color, which will be owned by a single
 * player.
 */
export class PiecePool {
    constructor(
        public readonly playerColor: PlayerColor,
        private callbackOnVillageCreation: CallbackOnEvent,
        private callbackForSettlement: CallbackOnResourcePropagation,
        private callbackOnCityUpgrade: CallbackOnEvent
    ) {
        this.countOfRemainingRoadPieces = 15n;
        this.countOfRemainingVillagePieces = 5n;
        this.countOfRemainingCityPieces = 4n;
     }

    getRoadFactory(): PieceFactory<RoadPiece> {
        return new PieceFactory<RoadPiece>(
            this.playerColor,
            this.createRoad.bind(this)
        );
    }

    getVillageFactory(): PieceFactory<SettlementPiece> {
        return new PieceFactory<SettlementPiece>(
            this.playerColor,
            this.createVillage.bind(this)
        );
    }

    createRoad(): RoadPiece | undefined {
        if (this.countOfRemainingRoadPieces <= 0n) {
            return undefined;
        }

        this.countOfRemainingRoadPieces -= 1n;
        return new RoadPiece(this.playerColor);
    }

    createVillage(): SettlementPiece | undefined {
        if (this.countOfRemainingVillagePieces <= 0n) {
            return undefined;
        }

        this.countOfRemainingVillagePieces -= 1n;
        this.callbackOnVillageCreation();
        return new SettlementPiece(
            this.playerColor,
            this.callbackForSettlement,
            this.applyCityUpgradeCostOrRefuse.bind(this)
        );
    }

    applyCityUpgradeCostOrRefuse(): boolean {
        if (this.countOfRemainingCityPieces <= 0n) {
            return false;
        }

        this.countOfRemainingCityPieces -= 1n;
        this.countOfRemainingVillagePieces += 1n;
        this.callbackOnCityUpgrade();
        return true;
    }

    private countOfRemainingRoadPieces: bigint;
    private countOfRemainingVillagePieces: bigint;
    private countOfRemainingCityPieces: bigint;
}