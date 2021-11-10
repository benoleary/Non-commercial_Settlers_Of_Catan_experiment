import { PlayerColor } from "../player/player"

/**
 * This class does the simple job of representing a road owned by a player. Its location on the
 * board is determined by which hex has a reference to it as being on one of the edges of the hex.
 */
export class RoadPiece {
    constructor(public readonly owningColor: PlayerColor) { }
}
