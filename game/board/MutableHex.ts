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

        // Silly TypeScript, we have already filtered out all elements which are undefined.
        const acceptedSettlement = acceptedSettlementsOnCorner[0]!;

        return [acceptedSettlement.owningColor, acceptedSettlement.getType()];
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
        settlementForPlacement: SettlementPiece,
        settlementCorner: HexCornerDirection,
        roadForPlacement: RoadPiece,
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
        // viewed from outside the class.
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
            this.hasEdgeOrNeighborAllowingRoadOfColorOnEdge(roadFactory.pieceColor, placementEdge);
        if (!isConnectedToSameColorRoad) {
            return [false, "No neighboring edge with road owned by same player"];
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

    hasEdgeAllowingRoadOfColorOnEdge(
        pieceColor: PlayerColor,
        placementEdge: HexToHexDirection
    ): boolean {
        return ImmutableHex.getAnticlockwiseAndClockwiseEdgesNeighboringEdge(placementEdge).some(
            neighboringEdge => this.getRoadColor(neighboringEdge) == pieceColor
        );
    }

    hasRoadOfColorLeadingToCorner(
        pieceColor: PlayerColor,
        settlementCorner: HexCornerDirection
    ): boolean {
        return (
            ImmutableHex.getAnticlockwiseAndClockwiseEdgesNeighboringCorner(settlementCorner).some(
                hexEdge => this.getRoadColor(hexEdge) == pieceColor
            )
        );
    }

    abstract onResourceProductionEvent(callbackFunction: CallbackOnResourceProduction): void

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

    protected hasNeighborWithRoadOfColorLeadingToCorner(
        pieceColor: PlayerColor,
        edgeSharedWithNeighbor: HexToHexDirection,
        cornerSharedWithNeighbor: HexCornerDirection
    ): boolean {
        const neighboringHex = this.getMutableNeighbor(edgeSharedWithNeighbor);
        if (neighboringHex == undefined) {
            return false;
        }
        const cornerForNeighbor =
            ImmutableHex.getCloserCornerNeighboringOppositeEdge(
                edgeSharedWithNeighbor,
                cornerSharedWithNeighbor
            );
        return neighboringHex.hasRoadOfColorLeadingToCorner(pieceColor, cornerForNeighbor);
    }

    protected hasEdgeOrNeighborAllowingRoadOfColorOnEdge(
        pieceColor: PlayerColor,
        placementEdge: HexToHexDirection
    ): boolean {
        // If the edges of this hex allow this edge to get a road, that is sufficient.
        if (this.hasEdgeAllowingRoadOfColorOnEdge(pieceColor, placementEdge)) {
            return true;
        }

        // If this hex does not have a connecting road, then we check the connections on the hex
        // which shares the edge.
        const edgeSharer = this.getMutableNeighbor(placementEdge);

        if (edgeSharer != undefined) {
            return edgeSharer.hasEdgeAllowingRoadOfColorOnEdge(
                pieceColor,
                ImmutableHex.getOppositeEdge(placementEdge)
            );
        }

        // If this hex does not have a connecting road and the edge is not shared with another hex
        // (so it would be a road along a coast), then we have to check the neighbors on the
        // corners of the target edge.
        const [anticlockwiseEdge, clockwiseEdge] =
            ImmutableHex.getAnticlockwiseAndClockwiseEdgesNeighboringEdge(placementEdge);
        const [anticlockwiseCorner, clockwiseCorner] =
            ImmutableHex.getAnticlockwiseAndClockwiseCornersNeighboringEdge(placementEdge);

        // If the anticlockwise neighbor allows it, that is sufficient
        const isAllowedByAnticlockwiseNeighbor =
            this.hasNeighborWithRoadOfColorLeadingToCorner(
                pieceColor,
                anticlockwiseEdge,
                anticlockwiseCorner
            );
        if (isAllowedByAnticlockwiseNeighbor) {
            return true;
        }

        // At this point, whether or not the road is allowed is determined solely by the clockwise
        // neighbor.
        return this.hasNeighborWithRoadOfColorLeadingToCorner(
            pieceColor,
            clockwiseEdge,
            clockwiseCorner
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
