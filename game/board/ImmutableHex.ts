import { PlayerColor } from "../player/player";
import { ProductionRollScore, ResourceType } from "../resource/resource";
import { SettlementType } from "./piece";

export type HexToHexDirection = "NE" | "E" | "SE" | "SW" | "W" | "NW";
export type HexCornerDirection = "N" | "NE" | "SE" | "S" | "SW" | "NW";
export type ProductiveType = "hills" | "forest" | "mountains" | "fields" | "pasture";
export type LandType = ProductiveType | "desert";

/**
 * This class offers the read-only information representing a hex. Pieces exist on a hex,
 * either on a corner (settlement) or on an edge (road), though both hexes sharing an edge will be
 * seen as having the same road piece, and all three hexes sharing a corner will be seen as having
 * the same settlement.
 *
 * We can build hex classes on an abstract base since there is going to be no multiple
 * inheritance.
 */
export abstract class ImmutableHex {
    abstract get landType(): LandType
    abstract get producedResource(): ResourceType | undefined

    get hasRobber(): boolean {
        return this.isOccupiedByRobber;
    }

    /**
     * Since roads never change and have only one characteristic, it suffices to basically show the
     * color of which player (if any) "owns" the edge of a hex.
     */
    abstract getRoadColor(roadEdge: HexToHexDirection): PlayerColor | undefined

    /**
     * The mechanics of how much a settlement produces is determined inside the SettlementPiece
     * class, but similarly to the road case, since they only ever have 2 states, it is sufficient
     * for reading purposes to return the color of which player owns the settlement (if any) on the
     * corner, and whether it is a city or not.
     */
    abstract getSettlementColorAndType(
        settlementCorner: HexCornerDirection
    ): [PlayerColor, SettlementType] | undefined

    protected constructor(
        public readonly productionRollScore: ProductionRollScore | undefined,
        protected isOccupiedByRobber: boolean
    ) {
        // This class should be constructed with information about any of its corners which are ports
        // because this is fixed from the creation of the board and is important information to be read
        // by players, but I have decided that implementation of ports is a stretch goal for this
        // project.
    }

    protected static edgeIndex(hexEdge: HexToHexDirection): number {
        // This is just to avoid getting confused about which number means which direction.
        if (hexEdge == "NE") {
            return 0;
        }
        if (hexEdge == "E") {
            return 1;
        }
        if (hexEdge == "SE") {
            return 2;
        }
        if (hexEdge == "SW") {
            return 3;
        }
        if (hexEdge == "W") {
            return 4;
        }
        // The only case left is NW.
        return 5;
    }

    protected static cornerIndex(hexCorner: HexCornerDirection): number {
        // This is just to avoid getting confused about which number means which direction.
        if (hexCorner == "N") {
            return 0;
        }
        if (hexCorner == "NE") {
            return 1;
        }
        if (hexCorner == "SE") {
            return 2;
        }
        if (hexCorner == "S") {
            return 3;
        }
        if (hexCorner == "SW") {
            return 4;
        }
        // The only case left is NW.
        return 5;
    }

    /**
     * This gets the edge opposite the given edge. The typical use case is to get the same edge as
     * seen by the neighboring hex (e.g. if x has y as its eastern neighbor, x's E is y's W).
     *
     * @param hexEdge The edge of the hex opposite to the desired output edge
     * @returns The edge of the hex opposite the input edge
     */
    protected static getOppositeEdge(hexEdge: HexToHexDirection): HexToHexDirection {
        if (hexEdge == "NE") {
            return "SW";
        }
        if (hexEdge == "E") {
            return "W";
        }
        if (hexEdge == "SE") {
            return "NW";
        }
        if (hexEdge == "SW") {
            return "NE";
        }
        if (hexEdge == "W") {
            return "E";
        }
        // The only case left is NW.
        return "SE";
    }

    protected static getAnticlockwiseAndClockwiseEdgesNeighboringCorner(
        hexCorner: HexCornerDirection
    ): [HexToHexDirection, HexToHexDirection] {
        if (hexCorner == "N") {
            return ["NW", "NE"];
        }
        if (hexCorner == "NE") {
            return ["NE", "E"];
        }
        if (hexCorner == "SE") {
            return ["E", "SE"];
        }
        if (hexCorner == "S") {
            return ["SE", "SW"];
        }
        if (hexCorner == "SW") {
            return ["SW", "W"];
        }
        // The only case left is NW.
        return ["W", "NW"];
    }

    /**
     * This gives the corner opposite the given corner through a line parallel to the given edge
     * drawn through the center of the hex. The typical use case is to get the same corner as seen
     * by the neighboring hex sharing it which also shares the given edge (e.g. the NE corner of x
     * is the NW corner of y if x shares its E edge with y (which is y's W edge)).
     * @param edgeToCorner The edge to use as the reflection axis
     * @param cornerDirection The corner to reflect in the line parallel to edgeToCorner through
     *                        the center of the hex
     * @returns The corner opposite cornerDirection across a line parallel to edgeToCorner through
     *          the center of the hex
     */
    protected static getCloserCornerNeighboringOppositeEdge(
        edgeToCorner: HexToHexDirection,
        cornerDirection: HexCornerDirection
    ): HexCornerDirection {
        const originalEdgeCorners =
            ImmutableHex.getAnticlockwiseAndClockwiseCornersNeighboringEdge(edgeToCorner);

        const isClockwiseFromOriginalEdge = (cornerDirection == originalEdgeCorners[0]);

        const oppositeEdge = ImmutableHex.getOppositeEdge(edgeToCorner);
        const oppositeEdgeCorners =
            ImmutableHex.getAnticlockwiseAndClockwiseCornersNeighboringEdge(oppositeEdge);
        return oppositeEdgeCorners[isClockwiseFromOriginalEdge ? 1 : 0];
    }

    protected static getAnticlockwiseAndClockwiseCornersNeighboringEdge(
        hexEdge: HexToHexDirection
    ): [HexCornerDirection, HexCornerDirection] {
        if (hexEdge == "NE") {
            return ["N", "NE"];
        }
        if (hexEdge == "E") {
            return ["NE", "SE"];
        }
        if (hexEdge == "SE") {
            return ["SE", "S"];
        }
        if (hexEdge == "SW") {
            return ["S", "SW"];
        }
        if (hexEdge == "W") {
            return ["SW", "NW"];
        }
        // The only case left is NW.
        return ["NW", "N"];
    }
}
