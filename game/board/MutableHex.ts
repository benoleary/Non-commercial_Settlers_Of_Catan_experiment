import { PlayerColor } from "../player/player";
import { ProductionRollScore, CallbackOnResourceProduction } from "../resource/resource";
import { PieceFactory, RoadPiece, SettlementPiece, SettlementType } from "./piece";
import { HexCornerDirection, HexToHexDirection, ImmutableHex } from "./ImmutableHex";

/**
 * This class provides the means for the game state to change the state of a hex, whether
 * initially informing hexes of their neighbors so that they can determine among themselves whether
 * their shared edges have roads and their corners have settlements, or placing pieces on the hex.
 *
 * The instances of MutableHex have the responsibility of determining if the placement of a piece
 * is valid or not.
 */
export abstract class MutableHex extends ImmutableHex {
    /**
     * This returns the color of the road which is on the given edge of this hex. It does not
     * distinguish whether the road was built on this edge on this hex or on the edge on the
     * neighboring hex.
     *
     * @param roadEdge The edge to examine
     * @returns The color of the road on the edge if either this hex or its neighbor sharing the
     *          accepted a road for the edge, or else undefined
     */
    getRoadColor(roadEdge: HexToHexDirection): PlayerColor | undefined {
        const acceptedColor = this.getAcceptedRoad(roadEdge)?.owningColor;
        if (acceptedColor != undefined) {
            return acceptedColor;
        }

        // Otherwise we return the owner of the road accepted by the neighbor, if any.
        return (
            this.getMutableNeighbor(roadEdge)
            ?.getAcceptedRoad(ImmutableHex.getOppositeEdge(roadEdge))
            ?.owningColor
        );
    }

    getSettlementColorAndType(
        settlementCorner: HexCornerDirection
    ): [PlayerColor, SettlementType] | undefined {
        const settlementOnCorner = this.getSettlement(settlementCorner);
        if (settlementOnCorner == undefined) {
            return undefined;
        }

        return [settlementOnCorner.owningColor, settlementOnCorner.getType()];
    }

    setNeighbor(
        neighborDirection: HexToHexDirection,
        neighborToNote: MutableHex | undefined
    ): void {
        const edgeIndex = ImmutableHex.edgeIndex(neighborDirection);
        if (edgeIndex != undefined) {
            this.nearestNeighbors[edgeIndex] = neighborToNote;
        }
    }

    /**
     * This links the given hex to the receiver hex as its eastern neighbor and also sets this
     * eastern neighbor as the south-eastern neighbor of the receiver hex's north-eastern neighbor
     * and as the north-eastern neighbor of the receiver hex's south-eastern neighbor, if such
     * neighbors exist.
     *
     * @param pureEasternNeighbor The hex which has been placed to the east of the receiver hex
     */
    setPureEasternNeighborAndUpdateOtherNeighbors(
        pureEasternNeighbor: MutableHex | undefined
    ): void {
        this.setNeighbor("E", pureEasternNeighbor);

        const northEasternNeighbor = this.getMutableNeighbor("NE");
        northEasternNeighbor?.setNeighbor("SE", pureEasternNeighbor);
        const southEasternNeighbor = this.getMutableNeighbor("SE");
        southEasternNeighbor?.setNeighbor("NE", pureEasternNeighbor);

        // The new neighbor also needs to know about the hexes already in place.
        if (pureEasternNeighbor != undefined) {
            pureEasternNeighbor.setNeighbor("W", this);
            pureEasternNeighbor.setNeighbor("NW", northEasternNeighbor);
            pureEasternNeighbor.setNeighbor("SW", southEasternNeighbor);
        }
    }

    /**
     * This links the given hex to the receiver hex as its north-western neighbor and also sets
     * this north-western neighbor as the western neighbor of the receiver hex's north-eastern
     * neighbor and as the north-eastern neighbor of the receiver hex's western neighbor, if such
     * neighbors exist.
     *
     * @param northWesternNeighbor The hex which has been placed to the north-west of the receiver
     *                             hex
     */
    setNorthWesternNeighborAndUpdateOtherNeighbors(
        northWesternNeighbor: MutableHex | undefined
    ): void {
        this.setNeighbor("NW", northWesternNeighbor);

        const northEasternNeighbor = this.getMutableNeighbor("NE");
        northEasternNeighbor?.setNeighbor("W", northWesternNeighbor);
        const pureWesternNeighbor = this.getMutableNeighbor("W");
        pureWesternNeighbor?.setNeighbor("NE", northWesternNeighbor);

        // The new neighbor also needs to know about the hexes already in place.
        if (northWesternNeighbor != undefined) {
            northWesternNeighbor.setNeighbor("SE", this);
            northWesternNeighbor.setNeighbor("E", northEasternNeighbor);
            northWesternNeighbor.setNeighbor("SW", pureWesternNeighbor);
        }
    }

    /**
     * This checks to see if a a settlement at the specified corner and a road leading away from it
     * in the specified direction is allowed, and if so, performs the placements and returns true
     * and an empty string; otherwise no placement is performed and this returns false and an
     * explanation. The neighbors which share the chosen corner are taken into account for the
     * validation of the placement.
     * This also invokes any given callback on a successful placement with the resource produced by
     * this hex and with the resources produced by its neighbors which share this corner.
     *
     * @param settlementForPlacement The settlement piece to accept on the given corner
     * @param settlementCorner The corner of this hex chosen for the settlement
     * @param roadForPlacement The road piece to accept on the given edge
     * @param roadEdge The edge of the hex chosen for the road
     * @returns True and a confirmation message if the placement was performed, false and an
     *          explanation otherwise
     */
    acceptInitialSettlementAndRoad(
        settlementFactory: PieceFactory<SettlementPiece>,
        settlementCorner: HexCornerDirection,
        roadFactory: PieceFactory<RoadPiece>,
        roadEdge: HexToHexDirection,
        onPlacement: CallbackOnResourceProduction | undefined
    ): [boolean, string] {
        const validRoadEdgesForSettlement =
            ImmutableHex.getAnticlockwiseAndClockwiseEdgesNeighboringCorner(settlementCorner);

        if (!validRoadEdgesForSettlement.some(validEdge => validEdge == roadEdge)) {
            return [false, `The ${roadEdge} edge does not lead to the ${settlementCorner} corner`];
        }

        if (this.hasRoad(roadEdge)) {
            return [false, `The ${roadEdge} edge is already occupied by a road`];
        }

        const cornerSharers = this.getCornerSharing(settlementCorner);
        if (MutableHex.haveOnlyEmptySharedCorners(cornerSharers)) {
            return [false, `The ${settlementCorner} corner is too close to another settlement`];
        }

        // After it has been determined that both settlement and road have valid placements, the
        // hex can accept the pieces. The neighbors will treat these pieces as their own when
        // viewed from outside the class. There is no way that the factories could fail to produce
        // pieces in the initial placement phase.
        const roadForPlacement = roadFactory.createPiece()!;
        const settlementForPlacement = settlementFactory.createPiece()!;
        this.recordSettlementAndRegisterCallbacks(
            settlementForPlacement,
            settlementCorner,
            cornerSharers.map(sharerWithCorner => sharerWithCorner[0])
        );
        this.acceptedRoads[ImmutableHex.edgeIndex(roadEdge)] = roadForPlacement;

        if (onPlacement != undefined) {
            for(const [sharingHex, _] of cornerSharers) {
                if (sharingHex.producedResource != undefined) {
                    onPlacement(sharingHex.producedResource)
                }
            }
        }

        const pieceColor = `${settlementForPlacement.owningColor}`;
        return [
            true,
            `A ${pieceColor} settlement was placed on ${settlementCorner} corner`
            + ` and a ${pieceColor} road on ${roadEdge} edge`
        ];
    }

    /**
     * This records a road at the specified edge if allowed, returning true and an empty string if
     * the placement is valid, or false and an explanation if not. The neighbor which shares the
     * chosen edge is taken into account for the validation of the placement.
     *
     * @param roadForPlacement The road piece to accept on the given edge
     * @param placementEdge The edge of the hex chosen for the road
     * @returns True and a confirmation message if the placement was performed, false and an
     *          explanation otherwise
     */
    acceptRoad(
        roadFactory: PieceFactory<RoadPiece>,
        placementEdge: HexToHexDirection
    ): [boolean, string] {
        if (this.hasRoad(placementEdge)) {
            return [false, `The ${placementEdge} edge is already occupied by a road`];
        }

        // The road leading to this edge which allows a road to be placed on it might only be on an
        // edge of the neighboring hex.
        const isConnectedToSameColorRoad =
            this.hasConnectionAllowingRoadOfColorOnEdge(roadFactory.pieceColor, placementEdge);
        if (!isConnectedToSameColorRoad) {
            return [
                false,
                "No neighboring edge with road owned by same player"
                + " (might be blocked by other player's settlement)"
            ];
        }

        const roadForPlacement = roadFactory.createPiece();
        if (roadForPlacement == undefined) {
            return [false, "No piece for road available from player"];
        }

        this.acceptedRoads[ImmutableHex.edgeIndex(placementEdge)] = roadForPlacement;

        return [
            true,
            `A ${roadForPlacement.owningColor} road was placed on the ${placementEdge} edge`
        ];
    }

    /**
     * This records a settlement at the specified corner if allowed, returning true and an empty
     * string if the placement is valid, or false and an explanation if not. The neighbors which
     * share the chosen corner are taken into account for the validation of the placement.
     * It also invokes any given callback on a successful placement with the resource produced by
     * this hex and with the resources produced by its neighbors which share this corner.
     *
     * @param placementCorner The corner of this hex chosen for the settlement
     * @param onPlacement A callback to invoke if the placement is successful, using the resource
     *                    produced by this hex and the resources produced by the neighbors which
     *                    share the chosen corner
     * @returns True and a confirmation message if the placement was performed, false and an
     *          explanation otherwise
     */
    acceptSettlement(
        settlementFactory: PieceFactory<SettlementPiece>,
        placementCorner: HexCornerDirection
    ): [boolean, string] {
        if (!this.hasRoadOfColorLeadingToCorner(settlementFactory.pieceColor, placementCorner)) {
            return [
                false,
                "no road owned by player leads to this corner"
                + " (remember to place on a hex with the road)"
            ];
        }

        const cornerSharers = this.getCornerSharing(placementCorner);
        if (MutableHex.haveOnlyEmptySharedCorners(cornerSharers)) {
            return [false, "too close to another settlement"];
        }

        const settlementForPlacement = settlementFactory.createPiece();
        if (settlementForPlacement == undefined) {
            return [false, "No piece for settlement available from player"];
        }

        this.recordSettlementAndRegisterCallbacks(
            settlementForPlacement,
            placementCorner,
            cornerSharers.map(sharerWithCorner => sharerWithCorner[0])
        );

        return [
            true,
            `A ${settlementForPlacement.owningColor} settlement`
            + ` was placed on ${placementCorner} corner`
        ];
    }

    /**
     * This upgrades the settlement on the given corner as long as there is a settlement there
     * which can be upgraded and belongs to the active player and if the player pays the cost.
     *
     * @param placementCorner The corner of the hex which should have a settlement which should get
     *                        upgraded
     * @param colorOfUpgradingPlayer The color of the player who wants to upgrade the settlement
     *                               (players may not upgrade the settlements of other players)
     * @returns True and a report if successful, false and an explanation if not
     */
    upgradeToCity(
        placementCorner: HexCornerDirection,
        colorOfUpgradingPlayer: PlayerColor
    ): [boolean, string] {
        const settlementOnCorner = this.getSettlement(placementCorner);
        if (settlementOnCorner == undefined) {
            return [false, `No settlement on ${placementCorner} corner`];
        }

        if (settlementOnCorner.owningColor != colorOfUpgradingPlayer) {
            return [
                false,
                `Settlement on ${placementCorner} corner`
                + ` belongs to ${settlementOnCorner.owningColor}`
                + ` so cannot be upgraded by player with color ${colorOfUpgradingPlayer}`
            ];
        }

        const [isUpgraded, refusalMessage] = settlementOnCorner.upgradeToCity();

        if (!isUpgraded) {
            return [false, refusalMessage];
        }

        return [
            true,
            `A ${settlementOnCorner.owningColor} settlement`
            + ` on ${placementCorner} corner was upgraded to a city`
        ];
    }

    /**
     * This returns whether this hex edge has a road which was built on this hex. This is to be
     * distinguished from checking if the result of getRoadColor is undefined, as that would
     * return the road on the same edge but built on the neighboring hex.
     *
     * @param roadEdge The edge to examine for a road
     * @returns True if there is a road on the edge which was built on this hex (rather than on the
     *          neighbor sharing the hex)
     */
    hasAcceptedRoad(roadEdge: HexToHexDirection): boolean {
        return this.getAcceptedRoad(roadEdge) != undefined;
    }

    isEmptyCornerWithEmptyBothSides(placementCorner: HexCornerDirection): boolean {
        const placementIndex = ImmutableHex.cornerIndex(placementCorner);
        const northwestIndex = this.acceptedSettlements.length - 1;
        const clockwiseIndex = (placementIndex == 0) ? northwestIndex : placementIndex - 1;
        const anticlockwiseIndex = (placementIndex == northwestIndex) ? 0 : placementIndex + 1;

        return (
            (this.acceptedSettlements[clockwiseIndex] == undefined)
            && (this.acceptedSettlements[placementIndex] == undefined)
            && (this.acceptedSettlements[anticlockwiseIndex] == undefined)
        );
    }

    /**
     * This checks both edges of this hex which touch the given corner for a road of the given
     * color.
     *
     * @param pieceColor The color to look for
     * @param hexCorner The corner touching the edges which should be checked
     * @returns True if either edge sharing the corner has a road of the given color
     */
    hasRoadOfColorLeadingToCorner(
        pieceColor: PlayerColor,
        hexCorner: HexCornerDirection
    ): boolean {
        return (
            ImmutableHex.getAnticlockwiseAndClockwiseEdgesNeighboringCorner(hexCorner).some(
                hexEdge => this.getRoadColor(hexEdge) == pieceColor
            )
        );
    }

    /**
     * This should record the given callback function and invoke it when this hex produces its
     * resource 9using its resource as the argument).
     *
     * @param callbackFunction A function to invoke with the hex's resourec when it is produced
     */
    abstract onResourceProductionEvent(callbackFunction: CallbackOnResourceProduction): void

    /**
     * This should perform the appropriate actions when this hex must produce its resource (such
     * as invoking callbacks).
     */
    abstract produceResource(): void

    protected static haveOnlyEmptySharedCorners(
        cornerSharers: [MutableHex, HexCornerDirection][]
    ): boolean {
        return cornerSharers.some(
                sharerWithCorner =>
                    !sharerWithCorner[0].isEmptyCornerWithEmptyBothSides(sharerWithCorner[1])
            );
    }

    protected constructor(
        public readonly productionRollScore: ProductionRollScore | undefined,
        protected isOccupiedByRobber: boolean
    ) {
        super(productionRollScore, isOccupiedByRobber);

        this.nearestNeighbors = [undefined, undefined, undefined, undefined, undefined, undefined];
        this.acceptedSettlements = [undefined, undefined, undefined, undefined, undefined, undefined];
        this.acceptedRoads = [undefined, undefined, undefined, undefined, undefined, undefined];
    }

    protected getMutableNeighbor(neighborDirection: HexToHexDirection): MutableHex | undefined {
        return this.nearestNeighbors[ImmutableHex.edgeIndex(neighborDirection)];
    }

    protected getAcceptedRoad(roadEdge: HexToHexDirection): RoadPiece | undefined {
        return this.acceptedRoads[ImmutableHex.edgeIndex(roadEdge)];
    }

    protected hasRoad(roadEdge: HexToHexDirection): boolean {
        // The edge betweeen two hexes is technically represented by two separate locations, which
        // are considered to be the same place from the outside, but internally the edge on this
        // hex has to be checked and also the corresponding edge on the other hex (if not
        // undefined).
        return this.getEdgeSharing(roadEdge).some(
            sharerWithEdge => sharerWithEdge[0].hasAcceptedRoad(sharerWithEdge[1])
        );
    }

    protected getAcceptedSettlement(
        settlementCorner: HexCornerDirection
    ): SettlementPiece | undefined {
        return this.acceptedSettlements[ImmutableHex.cornerIndex(settlementCorner)];
    }

    protected getSettlement(settlementCorner: HexCornerDirection): SettlementPiece | undefined {
        const cornerSharers = this.getCornerSharing(settlementCorner);
        const acceptedSettlementsOnCorner =
            cornerSharers.map(
                cornerSharer => cornerSharer[0].getAcceptedSettlement(cornerSharer[1])
            )
            .filter(acceptedSettlement => acceptedSettlement != undefined);

        if (acceptedSettlementsOnCorner.length > 1) {
            throw new Error(
                `Somehow multiple hexes own a settlement on this hex's ${settlementCorner} corner`
            );
        }

        if (acceptedSettlementsOnCorner.length < 1) {
            return undefined;
        }

        return acceptedSettlementsOnCorner[0];
    }

    protected getEdgeSharing(hexEdge: HexToHexDirection): [MutableHex, HexToHexDirection][] {
        const sharingNeighbor = this.getMutableNeighbor(hexEdge);

        if (sharingNeighbor == undefined) {
            return [[this, hexEdge]];
        }

        return [[this, hexEdge], [sharingNeighbor, ImmutableHex.getOppositeEdge(hexEdge)]];
    }

    protected getCornerSharing(
        cornerDirection: HexCornerDirection
    ): [MutableHex, HexCornerDirection][] {
        let cornerSharers: [MutableHex, HexCornerDirection][] = [[this, cornerDirection]];

        const sharingEdges =
            ImmutableHex.getAnticlockwiseAndClockwiseEdgesNeighboringCorner(cornerDirection);

        for (const sharingEdge of sharingEdges) {
            const sharingNeighbor = this.getMutableNeighbor(sharingEdge);
            if (sharingNeighbor != undefined) {
                cornerSharers.push([
                    sharingNeighbor,
                    ImmutableHex.getCloserCornerNeighboringOppositeEdge(
                        sharingEdge,
                        cornerDirection
                    )
                ])
            }
        }

        return cornerSharers;
    }

    protected hasConnectionAllowingRoadOfColorOnEdge(
        pieceColor: PlayerColor,
        placementEdge: HexToHexDirection
    ): boolean {
        const [anticlockwiseCorner, clockwiseCorner] =
            ImmutableHex.getAnticlockwiseAndClockwiseCornersNeighboringEdge(placementEdge);

        return (
            this.isValidConnectionForRoadOfColor(anticlockwiseCorner, pieceColor)
            || this.isValidConnectionForRoadOfColor(clockwiseCorner, pieceColor)
        );
    }

    protected isValidConnectionForRoadOfColor(
        cornerConnectingRoad: HexCornerDirection,
        roadColor: PlayerColor
    ): boolean {
        const settlementOnCorner = this.getSettlement(cornerConnectingRoad);

        // If there is a settlement, either it bleongs to someone else, in which case the road
        // cannot use this corner as a connection, or it belongs to the same player, in which case,
        // since this method is only called if the target edge is empty, there already is a road
        // belonging to the placing player leading to the player's settlement on this corner.
        if (settlementOnCorner != undefined) {
            return settlementOnCorner.owningColor == roadColor;
        }

        // If the corner is empty, then as long as one of the hexes on the corner has an edge with
        // a road of the given color leading to the corner, the edge chosen for placement (which is
        // empty or else we would not have ended up in this method) is connected to that road by
        // that corner (cornerConnectingRoad of this hex).
        const cornerSharers = this.getCornerSharing(cornerConnectingRoad);
        return cornerSharers.some(
            cornerSharer => cornerSharer[0].hasRoadOfColorLeadingToCorner(roadColor, cornerSharer[1])
        );
    }

    protected recordSettlementAndRegisterCallbacks(
        settlementForPlacement: SettlementPiece,
        settlementCorner: HexCornerDirection,
        cornerSharers: MutableHex[]
    ): void {
        this.acceptedSettlements[ImmutableHex.cornerIndex(settlementCorner)] =
            settlementForPlacement;
        for (const cornerSharer of cornerSharers) {
            cornerSharer.onResourceProductionEvent(
                settlementForPlacement.getCallbackOnNormalTurnProduction()
            );
        }
    }

    protected nearestNeighbors: (MutableHex | undefined)[];
    protected acceptedSettlements: (SettlementPiece | undefined)[];
    protected acceptedRoads: (RoadPiece | undefined)[];
}
