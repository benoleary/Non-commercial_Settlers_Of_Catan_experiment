import { AuthenticatedPlayer } from "../player/player";
import { ProductionRollScore, ResourceType } from "../resource/resource";
import { SettlementType } from "./piece";

export type HexToHexDirection = "NE" | "E" | "SE" | "SW" | "W" | "NW";
export type HexCornerDirection = "N" | "NE" | "SE" | "S" | "SW" | "NW";
export type ProductiveType = "hills" | "forest" | "mountains" | "fields" | "pasture";
export type LandType = ProductiveType | "desert";

// We can build hex classes on an abstract base since there is going to be no multiple
// inheritance.
export abstract class ImmutableHex {
    abstract get landType(): LandType
    abstract get producedResource(): ResourceType | undefined

    get hasRobber(): boolean {
        return this.isOccupiedByRobber;
    }

    abstract getRoadOwner(roadEdge: HexToHexDirection): AuthenticatedPlayer | undefined

    abstract getSettlementOwnerAndType(
        settlementCorner: HexCornerDirection
    ): [AuthenticatedPlayer, SettlementType] | undefined

    /**
     * This should return the neighbor of this hex in the given direction.
     *
     * This is really just exposing some debugging functionality, since only mutable hexes are
     * going to need to know about their neighbors. External components which know only about
     * immutable hexes will also know about their board positions so will not need to query the
     * hexes about their neighbors. However, it is harmless to allow it.
     *
     * @param neighborDirection The direction of the neighbor from the receiver hex
     */
    abstract viewNeighbor(neighborDirection: HexToHexDirection): ImmutableHex | undefined

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

    protected static getAnticlockwiseAndClockwiseEdgesNeighboringEdge(
        hexEdge: HexToHexDirection
    ): [HexToHexDirection, HexToHexDirection]  {
        if (hexEdge == "NE") {
            return ["NW", "E"];
        }
        if (hexEdge == "E") {
            return ["NE", "SE"];
        }
        if (hexEdge == "SE") {
            return ["E", "SW"];
        }
        if (hexEdge == "SW") {
            return ["SE", "W"];
        }
        if (hexEdge == "W") {
            return ["SW", "NW"];
        }
        // The only case left is NW.
        return ["W", "NE"];
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
