import { errorMonitor } from "events";
import { AuthenticatedPlayer } from "../player/player";
import { ProductionRollScore, ResourceType } from "../resource/resource";
import { RoadPiece, SettlementPiece, SettlementType } from "./piece";

type ProductiveType = "hills" | "forest" | "mountains" | "fields" | "pasture";
export type LandType = ProductiveType | "desert";
export type RowIndexInBoard = 0 | 1 | 2 | 3 | 4;
export type HexIndexInRow = 0 | 1 | 2 | 3 | 4;

export type HexToHexDirection = "NE" | "E" | "SE" | "SW" | "W" | "NW";
export type HexCornerDirection = "N" | "NE" | "SE" | "S" | "SW" | "NW";

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

type HexCallback = (producedResource: ResourceType) => void;

export abstract class MutableHex extends ImmutableHex {
    viewNeighbor(neighborDirection: HexToHexDirection): ImmutableHex | undefined {
        return this.getMutableNeighbor(neighborDirection);
    }

    getRoadOwner(roadEdge: HexToHexDirection): AuthenticatedPlayer | undefined {
        return this.getPlayerOwningRoad(roadEdge);
    }

    getSettlementOwnerAndType(
        settlementCorner: HexCornerDirection
    ): [AuthenticatedPlayer, SettlementType] | undefined {
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

        return [acceptedSettlement.owningPlayer, acceptedSettlement.getType()];
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
     * @returns True with an empty string if the placement was performed, false and an explanation
     *          otherwise
     */
    acceptInitialSettlementAndRoad(
        settlementForPlacement: SettlementPiece,
        settlementCorner: HexCornerDirection,
        roadForPlacement: RoadPiece,
        roadEdge: HexToHexDirection,
        onPlacement: HexCallback | undefined
    ): [boolean, string] {
        const validRoadEdgesForSettlement =
            ImmutableHex.getAnticlockwiseAndClockwiseEdgesNeighboringCorner(settlementCorner);

        if (!validRoadEdgesForSettlement.some(validEdge => validEdge == roadEdge)) {
            return [false, `the ${roadEdge} edge does not lead to the ${settlementCorner} corner`];
        }

        if (this.hasRoad(roadEdge)) {
            return [false, `the ${roadEdge} edge is already occupied by a road`];
        }

        const cornerSharers = this.getCornerSharing(settlementCorner);
        if (MutableHex.haveOnlyEmptySharedCorners(cornerSharers)) {
            return [false, `the ${settlementCorner} corner is too close to another settlement`];
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

        return [true, ""];
    }

    /**
     * This records a road at the specified edge if allowed, returning true and an empty string if
     * the placement is valid, or false and an explanation if not. The neighbor which shares the
     * chosen edge is taken into account for the validation of the placement.
     *
     * @param roadForPlacement The road piece to accept on the given edge
     * @param placementEdge The edge of the hex chosen for the road
     * @returns True with an empty string if the placement was performed, false and an explanation
     *          otherwise
     */
    acceptRoad(roadForPlacement: RoadPiece, placementEdge: HexToHexDirection): [boolean, string] {
        if (this.hasRoad(placementEdge)) {
            return [false, `the ${placementEdge} edge is already occupied by a road`];
        }

        // The road leading to this edge which allows a road to be placed on it might only be on an
        // edge of the neighboring hex.
        if (
            !this.getEdgeSharing(placementEdge).some(
                sharerWithEdge =>
                    sharerWithEdge[0].hasRoadForSamePlayerLeadingToEdge(
                        roadForPlacement.owningPlayer,
                        sharerWithEdge[1]
                    )
                )
        ) {
            return [false, "no neighboring edge with road owned by same player"];
        }

        this.acceptedRoads[ImmutableHex.edgeIndex(placementEdge)] = roadForPlacement;

        return [true, ""];
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
     * @returns True with an empty string if the placement was performed, false and an explanation
     *          otherwise
     */
    acceptSettlement(
        settlementForPlacement: SettlementPiece,
        placementCorner: HexCornerDirection,
        onPlacement?: HexCallback
    ): [boolean, string] {
        if (
            !ImmutableHex.getAnticlockwiseAndClockwiseEdgesNeighboringCorner(placementCorner).some(
                hexEdge => this.hasRoadOwnedBySamePlayer(
                    settlementForPlacement.owningPlayer,
                    hexEdge
                )
            )
        ) {
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

        if (
            cornerSharers.some(
                cornerSharer => cornerSharer[0].hasBothRoadsToCornerOwnedByAnotherPlayer(
                    settlementForPlacement.owningPlayer,
                    cornerSharer[1]
                )
            )
        ) {
            return [false, "cannot break the road of another player"];
        }

        this.recordSettlementAndRegisterCallbacks(
            settlementForPlacement,
            placementCorner,
            cornerSharers.map(sharerWithCorner => sharerWithCorner[0])
        );

        return [true, ""];
    }

    hasRoad(roadEdge: HexToHexDirection): boolean {
        // The edge betweeen two hexes is technically represented by two separate locations, which
        // are considered to be the same place from the outside, but internally the edge on this
        // hex has to be checked and also the corresponding edge on the other hex (if not
        // undefined).
        return this.getEdgeSharing(roadEdge).some(
            sharerWithEdge => sharerWithEdge[0].hasAcceptedRoad(sharerWithEdge[1])
        );
    }

    hasAcceptedRoad(roadEdge: HexToHexDirection): boolean {
        return this.getAcceptedRoad(roadEdge) != undefined;
    }

    getPlayerOwningRoad(roadEdge: HexToHexDirection): AuthenticatedPlayer | undefined {
        const acceptedOwner = this.getAcceptedRoad(roadEdge)?.owningPlayer;
        if (acceptedOwner != undefined) {
            return acceptedOwner;
        }

        // Otherwise we return the owner of the road accepted by the neighbor, if any.
        return (
            this.getMutableNeighbor(roadEdge)
            ?.getAcceptedRoad(ImmutableHex.getOppositeEdge(roadEdge))
            ?.owningPlayer
        );
    }

    getPlayerOwningAcceptedRoad(roadEdge: HexToHexDirection): AuthenticatedPlayer | undefined {
        return this.getAcceptedRoad(roadEdge)?.owningPlayer;
    }

    hasRoadForSamePlayerLeadingToEdge(
        placingPlayer: AuthenticatedPlayer,
        placementEdge: HexToHexDirection
    ): boolean {
        return ImmutableHex.getAnticlockwiseAndClockwiseEdgesNeighboringEdge(placementEdge).some(
            neighboringEdge => this.hasRoadOwnedBySamePlayer(
                placingPlayer,
                neighboringEdge
            )
        );
    }

    hasRoadForSamePlayerLeadingToCorner(
        placingPlayer: AuthenticatedPlayer,
        placementCorner: HexCornerDirection
    ): boolean {
        return (
            ImmutableHex.getAnticlockwiseAndClockwiseEdgesNeighboringCorner(placementCorner).some(
                neighboringEdge => this.hasRoadOwnedBySamePlayer(placingPlayer, neighboringEdge)
            )
        );
    }

    hasBothRoadsToCornerOwnedByAnotherPlayer(
        placingPlayer: AuthenticatedPlayer,
        placementCorner: HexCornerDirection
    ): boolean {
        const roadOwners =
            ImmutableHex.getAnticlockwiseAndClockwiseEdgesNeighboringCorner(placementCorner)
            .map(edgeToCorner => this.getPlayerOwningRoad(edgeToCorner));
        return (
            (roadOwners.length == 2)
            && (roadOwners[0] == roadOwners[1])
            && (roadOwners[0] != placingPlayer)
        );
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

    abstract onProductionRoll(callbackFunction: HexCallback): void

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

    protected hasRoadOwnedBySamePlayer(
        placingPlayer: AuthenticatedPlayer,
        roadEdge: HexToHexDirection
    ): boolean {
        return (this.getPlayerOwningRoad(roadEdge) == placingPlayer);
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

    protected recordSettlementAndRegisterCallbacks(
        settlementForPlacement: SettlementPiece,
        settlementCorner: HexCornerDirection,
        cornerSharers: MutableHex[]
    ): void {
        this.acceptedSettlements[ImmutableHex.cornerIndex(settlementCorner)] =
            settlementForPlacement;
        for (const cornerSharer of cornerSharers) {
            cornerSharer.onProductionRoll(settlementForPlacement.getHexProductionRollCallback());
        }
    }

    protected nearestNeighbors: (MutableHex | undefined)[];
    protected acceptedSettlements: (SettlementPiece | undefined)[];
    protected acceptedRoads: (RoadPiece | undefined)[];
}

export abstract class MutableProductiveHex extends MutableHex {
    /**
     * This accepts a callback to invoke if this hex is activated because the dice rolled its core,
     * and the callback will be given the value of the resource type of this hex.
     *
     * @param callbackFunction A function to invoke when the dice roll the score of this hex
     */
    onProductionRoll(callbackFunction: HexCallback): void {
        // We do not need a method to remove observers because this is used only for settlements or
        // cities, and the implementation is the same object in a different state, so the callback
        // remains the same, and also settlements are never destroyed, only upgraded, and cities
        // are never destroyed.
        this.callbackFunctions.push(callbackFunction);
    }

    protected constructor(
        public readonly productionRollScore: ProductionRollScore,
        protected isOccupiedByRobber: boolean
    ) {
        super(productionRollScore, isOccupiedByRobber);
        this.callbackFunctions = [];
    }

    private callbackFunctions: HexCallback[]
}

// We can represent the hexes as positions on a square grid where each position is considered to
// touch the positions 1 unit away in either the x or the y direction, or diagonally along the
// x = y direction (but _not_ in the x = -y direction). Since we are represent the standard board
// as a width of 5 land hexes, the board fits on a 5 by 5 grid.
type GridHex<T extends ImmutableHex> = T | undefined;
type HexRow<T extends ImmutableHex> = [GridHex<T>, GridHex<T>, GridHex<T>, GridHex<T>, GridHex<T>];
export type HexMatrix<T extends ImmutableHex>
    = [HexRow<T>, HexRow<T>, HexRow<T>, HexRow<T>, HexRow<T>];

class DesertHex extends MutableHex {
    get landType(): LandType { return "desert"; }
    get producedResource(): undefined { return undefined; }

    onProductionRoll(callbackFunction: HexCallback): void {
        // The desert hex has no dice roll score and never produces anything.
        // But it's easier to just let it accept any callbacks and just ignore them.
    }

    constructor() {
        // There is only one desert hex, and the robber piece starts there.
        super(undefined, true);
     }
}

class HillsHex extends MutableProductiveHex {
    get landType(): LandType { return "hills"; }
    get producedResource(): ResourceType { return "brick"; }

    constructor(public readonly productionRollScore: ProductionRollScore) {
        // Only the desert hex starts with the robber piece.
        super(productionRollScore, false);
    }
}

class ForestHex extends MutableProductiveHex {
    get landType(): LandType { return "forest"; }
    get producedResource(): ResourceType { return "lumber"; }

    constructor(public readonly productionRollScore: ProductionRollScore) {
        // Only the desert hex starts with the robber piece.
        super(productionRollScore, false);
     }
}

class MountainsHex extends MutableProductiveHex {
    get landType(): LandType { return "mountains"; }
    get producedResource(): ResourceType { return "ore"; }

    constructor(public readonly productionRollScore: ProductionRollScore) {
        // Only the desert hex starts with the robber piece.
        super(productionRollScore, false);
     }
}

class FieldsHex extends MutableProductiveHex {
    get landType(): LandType { return "fields"; }
    get producedResource(): ResourceType { return "grain"; }

    constructor(public readonly productionRollScore: ProductionRollScore) {
        // Only the desert hex starts with the robber piece.
        super(productionRollScore, false);
     }
}

class PastureHex extends MutableProductiveHex {
    get landType(): LandType { return "pasture"; }
    get producedResource(): ResourceType { return "wool"; }

    constructor(public readonly productionRollScore: ProductionRollScore) {
        // Only the desert hex starts with the robber piece.
        super(productionRollScore, false);
     }
}

export class HexBoard {
    static getFullyRandomBoard(): HexBoard {
        // This information cannot be fully deduced from the manual alone. I looked at my physical
        // copy. Unfortunately I seem to have lost C but I deduce that it must have been the other
        // token with value 6.
        let productionScoreTokensInAlphabeticalOrder: ProductionRollScore[] =
            [5n, 2n, 6n, 3n, 8n, 10n, 9n, 12n, 11n, 4n, 8n, 10n, 9n, 4n, 5n, 6n, 3n, 11n];
        let hexTiles: MutableHex[] = [];
        let hexConstructors = [
            HillsHex, HillsHex, HillsHex,
            ForestHex, ForestHex, ForestHex, ForestHex,
            MountainsHex, MountainsHex, MountainsHex,
            FieldsHex, FieldsHex, FieldsHex, FieldsHex,
            PastureHex, PastureHex, PastureHex, PastureHex
        ];
        while (productionScoreTokensInAlphabeticalOrder.length) {
            const scoreTokenIndex =
                Math.floor(Math.random() * productionScoreTokensInAlphabeticalOrder.length);
            const extractedScore =
                productionScoreTokensInAlphabeticalOrder.splice(scoreTokenIndex, 1)[0]!;
            const hexConstructorIndex = Math.floor(Math.random() * hexConstructors.length);
            const extractedConstructor = hexConstructors.splice(hexConstructorIndex, 1)[0]!;
            hexTiles.push(new extractedConstructor(extractedScore));
        }

        const desertIndex = Math.floor(Math.random() * hexTiles.length);
        hexTiles.splice(desertIndex, 0, new DesertHex());

        return new HexBoard(hexTiles);
    }

    viewBoard(): HexMatrix<ImmutableHex> {
        return this.mutableHexes;
    }

    changeBoard(): HexMatrix<MutableHex> {
        return this.mutableHexes;
    }

    constructor(inAlmanacSpiralOrder: MutableHex[]) {
        if (inAlmanacSpiralOrder.length != 19) {
            throw Error(
                `Cannot fit given hex tile sequence ${inAlmanacSpiralOrder} into 19-hex spiral`
                + " pattern as given in the almanac");
        }

        // Using 0 for "no hex" and the index starting from one to make the spiral easier to read,
        // this is the board as depicted in the manual but with the lowest row of hexes contained
        // in the first tuple, so it looks inverted vertically when read in the code.
        const indexPlusOneMapping = [
            [5,  6,  7,  0,  0],
            [4, 15, 16,  8,  0],
            [3, 14, 19, 17,  9],
            [0,  2, 13, 18, 10],
            [0,  0,  1, 12, 11],
        ];
        this.mutableHexes = [
            [undefined, undefined, undefined, undefined, undefined],
            [undefined, undefined, undefined, undefined, undefined],
            [undefined, undefined, undefined, undefined, undefined],
            [undefined, undefined, undefined, undefined, undefined],
            [undefined, undefined, undefined, undefined, undefined],
        ];
        for (let verticalIndex = 0; verticalIndex < indexPlusOneMapping.length; verticalIndex++) {
            const indexRow = indexPlusOneMapping[verticalIndex]!;
            for (let horizontalIndex = 0; horizontalIndex < indexRow.length; horizontalIndex++) {
                const indexInSpiral = indexRow[horizontalIndex]! - 1;
                if (indexInSpiral >= 0) {
                    const hexBeingPlaced = inAlmanacSpiralOrder[indexInSpiral];
                    this.mutableHexes[verticalIndex]![horizontalIndex] = hexBeingPlaced;

                    // If this is a new neighbor for existing hexes, we need to update them.
                    const pureWesternNeighbor =
                        horizontalIndex > 0
                        ? this.mutableHexes[verticalIndex]![horizontalIndex - 1]!
                        : undefined;
                    if (pureWesternNeighbor != undefined) {
                        pureWesternNeighbor.setPureEasternNeighborAndUpdateOtherNeighbors(
                            hexBeingPlaced
                        );
                    }
                    const southEasternNeighbor =
                        verticalIndex > 0
                        ? this.mutableHexes[verticalIndex - 1]![horizontalIndex]!
                        : undefined;
                    if (southEasternNeighbor != undefined) {
                        southEasternNeighbor.setNorthWesternNeighborAndUpdateOtherNeighbors(
                            hexBeingPlaced
                        );
                    }
                }
            }
        }
    }

    private mutableHexes: HexMatrix<MutableHex>;
}