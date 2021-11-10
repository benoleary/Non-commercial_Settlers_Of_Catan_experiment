import { PlayerColor } from "../player/player";
import { RoadPiece } from "./RoadPiece";
import { SettlementPiece } from "./SettlementPiece";

type CreatablePiece = RoadPiece | SettlementPiece;
export type PieceCreationFunction<T extends CreatablePiece> = () => T | undefined;

export class PieceFactory<T extends CreatablePiece> {
    constructor(
        public readonly pieceColor: PlayerColor,
        private pieceCreationFunction: PieceCreationFunction<T>
    ) { }

    createPiece(): T | undefined {
        return this.pieceCreationFunction();
    }
}