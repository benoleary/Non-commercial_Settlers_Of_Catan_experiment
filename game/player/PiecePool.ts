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
        // There would be 15 roads and 5 villages but 2 of each are used by the initial placement
        // phase without notifying the PiecePool.
        this.countOfRemainingRoadPieces = 13n;
        this.countOfRemainingVillagePieces = 3n;
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

    private createRoad(): RoadPiece | undefined {
        if (this.countOfRemainingRoadPieces <= 0n) {
            return undefined;
        }

        this.countOfRemainingRoadPieces -= 1n;
        return new RoadPiece(this.playerColor);
    }

    private createVillage(): SettlementPiece | undefined {
        if (this.countOfRemainingVillagePieces <= 0n) {
            return undefined;
        }

        this.countOfRemainingVillagePieces -= 1n;
        this.callbackOnVillageCreation();
        return new SettlementPiece(this.playerColor, this.callbackForSettlement);
    }

    private countOfRemainingRoadPieces: bigint;
    private countOfRemainingVillagePieces: bigint;
    private countOfRemainingCityPieces: bigint;
}