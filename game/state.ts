import { HexBoard, HexMatrix, ImmutableHex } from "./board/hex"

export class Game {
    constructor(private hexBoard: HexBoard) { }

    viewBoard(): HexMatrix<ImmutableHex> {
        return this.hexBoard.viewBoard()
    }
}