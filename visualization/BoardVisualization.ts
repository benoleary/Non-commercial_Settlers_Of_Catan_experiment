import { HexCornerDirection, HexToHexDirection, HexMatrix, ImmutableHex } from "../game/board/hex";
import { ProductionRollScore } from "../game/resource/resource";
import { WideCharacterProvider } from "./WideCharacterProvider";
import { VisualizationUsingWideCharacters } from "./VisualizationUsingWideCharacters";

export class BoardVisualization extends VisualizationUsingWideCharacters {
    constructor(useEmoji: boolean) {
        super(useEmoji);
    }

    asString(hexBoard: HexMatrix<ImmutableHex>): string {
        // Reverse order because I read co-ordinates as vertical increasing from bottom to top.
        return [
            this.getNorthernEdge(hexBoard[4], 2),
            this.getRowBody(hexBoard[4], 2, "E"),
            this.getNorthernEdge(hexBoard[3], 1),
            this.getRowBody(hexBoard[3], 1, "D"),
            this.getNorthernEdge(hexBoard[2], 0),
            this.getRowBody(hexBoard[2], 0, "C"),
            this.getSouthernEdge(hexBoard[2], 0),
            this.getRowBody(hexBoard[1], 1, "B"),
            this.getSouthernEdge(hexBoard[1], 1),
            this.getRowBody(hexBoard[0], 2, "A"),
            this.getSouthernEdge(hexBoard[0], 2)
        ].join("");
    }

    private static getOffsetText(offsetHexHalves: number, initialConstant: string): string {
        return initialConstant + " ".repeat(8).repeat(offsetHexHalves + 1);
    }

    private getJoinedStrings(
        hexRow: (ImmutableHex | undefined)[],
        offsetHexHalves: number,
        initialConstant: string,
        getWestAndMiddle: (textHexes: TextHex[], hexIndex: number) => string[],
        getEast: (textHexes: TextHex[]) => string[]
    ): string {
        const textHexes: TextHex[] =
            hexRow
            .filter(gameHex => gameHex != undefined)
            .map(gameHex => new TextHex(this.wideCharacterProvider, gameHex!));

        let rowAsString = "";
        const offsetString = BoardVisualization.getOffsetText(offsetHexHalves, initialConstant);
        const firstColumn = getWestAndMiddle(textHexes, 0);
        for (let textIndex = 0; textIndex < firstColumn.length; textIndex++) {
            const lastHexIndex = textHexes.length - 1;

            rowAsString += offsetString
            for (let hexIndex = 0; hexIndex <= lastHexIndex; hexIndex++) {
                const currentColumn = getWestAndMiddle(textHexes, hexIndex);
                rowAsString += currentColumn[textIndex]!;
            }

            const lastColumn = getEast(textHexes);
            rowAsString += lastColumn[textIndex]! + "\n";
        }

        return rowAsString;
    }

    private getNorthernEdge(
        hexRow: (ImmutableHex | undefined)[],
        offsetHexHalves: number
    ): string {
        return this.getJoinedStrings(
            hexRow,
            offsetHexHalves,
            " ",
            (textHexes: TextHex[], hexIndex: number) =>
                textHexes[hexIndex] == undefined ? [] : textHexes[hexIndex]!.northernEdgeWithWest,
            (textHexes: TextHex[]) =>
                textHexes[textHexes.length - 1] == undefined
                ? []
                : textHexes[textHexes.length - 1]!.northEasternCorner
        );
    }

    private getRowBody(
        hexRow: (ImmutableHex | undefined)[],
        offsetHexHalves: number,
        initialConstant: string
    ): string {
        return this.getJoinedStrings(
            hexRow,
            offsetHexHalves,
            initialConstant,
            (textHexes: TextHex[], hexIndex: number) =>
                textHexes[hexIndex] == undefined ? [] : textHexes[hexIndex]!.bodyWithWest,
            (textHexes: TextHex[]) =>
                textHexes[textHexes.length - 1] == undefined
                ? []
                : textHexes[textHexes.length - 1]!.easternEdge
        );
    }

    private getSouthernEdge(
        hexRow: (ImmutableHex | undefined)[],
        offsetHexHalves: number
    ): string {
        return this.getJoinedStrings(
            hexRow,
            offsetHexHalves,
            " ",
            (textHexes: TextHex[], hexIndex: number) =>
                textHexes[hexIndex] == undefined ? [] : textHexes[hexIndex]!.southernEdgeWithWest,
            (textHexes: TextHex[]) =>
                textHexes[textHexes.length - 1] == undefined
                ? []
                : textHexes[textHexes.length - 1]!.southEasternCorner
        );
    }
}

class TextHex {
    public readonly northernEdgeWithWest: string[];
    public readonly bodyWithWest: string[];
    public readonly southernEdgeWithWest: string[];
    public readonly easternEdge: string[];
    public readonly northEasternCorner: string[];
    public readonly southEasternCorner: string[];

    constructor(
        wideCharacterProvider: WideCharacterProvider,
        gameHex: ImmutableHex
    ) {
        const blankWideCharacter = " ".repeat(2);
        const doubleBlankWide = blankWideCharacter.repeat(2);
        const landWideCharacter = wideCharacterProvider.getFor(gameHex.landType);
        const robberWideCharacter =
            gameHex.hasRobber ? wideCharacterProvider.getFor("robber") : blankWideCharacter;
        const shortSideWall = landWideCharacter.repeat(2)
        const longSide = landWideCharacter.repeat(6);
        const peakBit = doubleBlankWide + landWideCharacter.repeat(2) + doubleBlankWide;
        const productionScoreText = TextHex.rollScoreString(gameHex.productionRollScore);

        const [
            northEasternRoad,
            pureEasternRoad,
            southEasternRoad,
            southWesternRoad,
            pureWesternRoad,
            northWesternRoad
        ] = TextHex.VALID_HEX_TO_HEX_DIRECTIONS.map(
            roadEdge => wideCharacterProvider.getFor(gameHex.getRoadColor(roadEdge))
        );

        const [
            pureNorthernSettlement,
            northEasternSettlement,
            southEasternSettlement,
            pureSouthernSettlement,
            southWesternSettlement,
            northWesternSettlement
        ] = TextHex.VALID_CORNER_DIRECTIONS.map(
            settlementCorner => {
                const colorAndType = gameHex.getSettlementColorAndType(settlementCorner);
                if (colorAndType == undefined) {
                    return [doubleBlankWide, doubleBlankWide];
                }

                const playerWideCharacter = wideCharacterProvider.getFor(colorAndType[0]);
                const settlementWideCharacter = wideCharacterProvider.getFor(colorAndType[1]);
                return [
                    playerWideCharacter + settlementWideCharacter,
                    settlementWideCharacter + playerWideCharacter
                ];
            }
        );

        this.northernEdgeWithWest = [
            northWesternSettlement![0]!
            + blankWideCharacter + northWesternRoad!
            + pureNorthernSettlement![0]!
            + northEasternRoad! + blankWideCharacter,
            northWesternSettlement![1]!
            + northWesternRoad! + blankWideCharacter
            + pureNorthernSettlement![1]!
            + blankWideCharacter + northEasternRoad!
        ];
        this.northEasternCorner = northEasternSettlement!;

        const spacedWesternRoad = " " + pureWesternRoad + " ";
        this.bodyWithWest = [
            spacedWesternRoad + peakBit,
            spacedWesternRoad + longSide,
            spacedWesternRoad + shortSideWall + " " + robberWideCharacter + " " + shortSideWall,
            spacedWesternRoad + shortSideWall + " " + productionScoreText + " " + shortSideWall,
            spacedWesternRoad + longSide,
            spacedWesternRoad + peakBit
        ];

        const spacedEasternRoad = " " + pureEasternRoad + " ";
        this.easternEdge = [
            spacedEasternRoad,
            spacedEasternRoad,
            spacedEasternRoad,
            spacedEasternRoad,
            spacedEasternRoad,
            spacedEasternRoad
        ];

        this.southernEdgeWithWest = [
            southWesternSettlement![0]!
            + southWesternRoad! + blankWideCharacter
            + pureSouthernSettlement![0]!
            + blankWideCharacter + southEasternRoad!,
            southWesternSettlement![1]!
            + blankWideCharacter + southWesternRoad!
            + pureSouthernSettlement![1]!
            + southEasternRoad! + blankWideCharacter
        ];
        this.southEasternCorner = southEasternSettlement!;
    }

    // Even though tsconfig.json specifies ec2020, the compiler refuses to recognize padStart.
    private static rollScoreString(productionRollScore: ProductionRollScore | undefined): string {
        if (productionRollScore == undefined) {
            return "--";
        }

        if (productionRollScore < 10n) {
            return " " + productionRollScore.toString()
        }

        return productionRollScore.toString()
    }

    private static readonly VALID_CORNER_DIRECTIONS: HexCornerDirection[] =
        ["N", "NE", "SE", "S", "SW", "NW"];
    private static readonly VALID_HEX_TO_HEX_DIRECTIONS: HexToHexDirection[] =
        ["NE", "E", "SE", "SW", "W", "NW"];
}
