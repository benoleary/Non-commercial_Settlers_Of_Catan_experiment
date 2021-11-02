/**
 * This file is for visualization of game elements, but only as an aid during
 * development. It only goes far enough for me to be satisfied that things are
 * working as intended.
 */

import { HexCornerDirection, HexToHexDirection, HexMatrix, ImmutableHex }
    from "../game/board/hex"
import { AuthenticatedPlayer } from "../game/player/player";
import { ProductionRollScore } from "../game/resource/resource";

// There is an issue with whether my terminal (Debian 10.2) displays emoji as
// single or double width. Hence some of these have spaces and others not.
// It might look buggy on your machine.
function emojiWideCharacterFor(inputType: string | undefined): string {
    if (inputType == "p1") {
        return "🛑";
    }
    if (inputType == "p2") {
        return "🔵";
    }
    if (inputType == "p3") {
        return "💚";
    }
    if (inputType == "p4") {
        return "🔶";
    }
    if (inputType == "village") {
        return "🏡";
    }
    if (inputType == "city") {
        return "🏛️";
    }
    if (inputType == "hills") {
        return "🧱";
    }
    if (inputType == "forest") {
        return "🌲";
    }
    if (inputType == "mountains") {
        return "⛰️ ";
    }
    if (inputType == "fields") {
        return "🌾";
    }
    if (inputType == "pasture") {
        return "🐑";
    }
    if (inputType == "desert") {
        return "🏜️ ";
    }
    if (inputType == "brick") {
        return "🧱";
    }
    if (inputType == "lumber") {
        return "🌲";
    }
    if (inputType == "ore") {
        return "⛰️ ";
    }
    if (inputType == "grain") {
        return "🌾";
    }
    if (inputType == "wool") {
        return "🐑";
    }
    if (inputType == "robber") {
        return "👺";
    }

    return "  ";
}

function asciiWideCharacterFor(inputType: string | undefined): string {
    if (inputType == "p1") {
        return "p1";
    }
    if (inputType == "p2") {
        return "p2";
    }
    if (inputType == "p3") {
        return "p3";
    }
    if (inputType == "p4") {
        return "p4";
    }
    if (inputType == "village") {
        return "VV";
    }
    if (inputType == "city") {
        return "CC";
    }
    if (inputType == "hills") {
        return "hh";
    }
    if (inputType == "forest") {
        return "tt";  // For "trees" to disambiguate from fields.
    }
    if (inputType == "mountains") {
        return "MM";
    }
    if (inputType == "fields") {
        return "gg";  // For "grain" to disambiguate from forest.
    }
    if (inputType == "pasture") {
        return "pp";
    }
    if (inputType == "desert") {
        return "DD";
    }
    if (inputType == "brick") {
        return " B";
    }
    if (inputType == "lumber") {
        return " L";
    }
    if (inputType == "ore") {
        return " O";
    }
    if (inputType == "grain") {
        return " G";
    }
    if (inputType == "wool") {
        return " W";
    }
    if (inputType == "robber") {
        return " R";
    }

    return "  ";
}

export class VisualizationUsingWideCharacters {
    constructor(useEmoji: boolean) {
        this.wideCharacterFor = useEmoji ? emojiWideCharacterFor : asciiWideCharacterFor;
    }

    protected wideCharacterFor: (inputType: string | undefined) => string
}

export class PlayerVisualization extends VisualizationUsingWideCharacters {
    constructor(useEmoji: boolean) {
        super(useEmoji);
    }

    asString(displayedPlayer: AuthenticatedPlayer): string {
        const playerHand =
            displayedPlayer
            .getResourceArray()
            .map(resourceCard => this.wideCharacterFor(resourceCard))
            .join(" ");
        const playerName = displayedPlayer.playerName
        return `${playerName}${this.wideCharacterFor(playerName)}: ${playerHand}`;
    }
}

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
        ].join("\n")
    }

    private static getOffsetText(offsetHexHalves: number, initialConstant: string): string {
        return initialConstant + " ".repeat(8).repeat(offsetHexHalves + 1);
    }

    private getNorthernEdge(
        hexRow: (ImmutableHex | undefined)[],
        offsetHexHalves: number
    ): string {
        const textHexes: TextHex[] =
            hexRow
            .filter(gameHex => gameHex != undefined)
            .map(gameHex => new TextHex(this.wideCharacterFor, gameHex!));

        return (
            BoardVisualization.getOffsetText(offsetHexHalves, " ")
            + textHexes.map(textHex => textHex.northernEdgeWithWest).join("")
            + textHexes[textHexes.length - 1]!!.northEasternCorner
            + "\n"
        );
    }

    private getRowBody(
        hexRow: (ImmutableHex | undefined)[],
        offsetHexHalves: number,
        initialConstant: string
    ): string {
        const textHexes: TextHex[] =
            hexRow
            .filter(gameHex => gameHex != undefined)
            .map(gameHex => new TextHex(this.wideCharacterFor, gameHex!));

        let rowAsString = "";
        const offsetString = BoardVisualization.getOffsetText(offsetHexHalves, initialConstant);
        for (let textIndex = 0; textIndex < textHexes[0]!.bodyWithWest.length; textIndex++) {
            const lastHexIndex = textHexes.length - 1;

            rowAsString += offsetString
            for (let hexIndex = 0; hexIndex <= lastHexIndex; hexIndex++) {
                rowAsString += textHexes[hexIndex]!.bodyWithWest[textIndex]!;
            }

            rowAsString += textHexes[lastHexIndex]!.easternEdge[textIndex]! + "\n";
        }

        return rowAsString;
    }

    private getSouthernEdge(
        hexRow: (ImmutableHex | undefined)[],
        offsetHexHalves: number
    ): string {
        const textHexes: TextHex[] =
            hexRow
            .filter(gameHex => gameHex != undefined)
            .map(gameHex => new TextHex(this.wideCharacterFor, gameHex!));

        return (
            BoardVisualization.getOffsetText(offsetHexHalves, " ")
            + textHexes.map(textHex => textHex.southernEdgeWithWest).join("")
            + textHexes[textHexes.length - 1]!!.southEasternCorner
            + "\n"
        );
    }
}

type TextBody = [string, string, string, string];

class TextHex {
    public readonly northernEdgeWithWest: string;
    public readonly bodyWithWest: TextBody;
    public readonly southernEdgeWithWest: string;
    public readonly easternEdge: TextBody;
    public readonly northEasternCorner: string;
    public readonly southEasternCorner: string;

    constructor(
        wideCharacterFor: (inputType: string | undefined) => string,
        gameHex: ImmutableHex
    ) {
        const landWideCharacter = wideCharacterFor(gameHex.landType);
        const robberWideCharacter = gameHex.hasRobber ? wideCharacterFor("robber") : "  ";
        const shortSideWall = landWideCharacter.repeat(2)
        const longSide = landWideCharacter.repeat(6);
        const productionScoreText = TextHex.rollScoreString(gameHex.productionRollScore);

        const [
            northEasternRoad,
            pureEasternRoad,
            southEasternRoad,
            southWesternRoad,
            pureWesternRoad,
            northWesternRoad
        ] = TextHex.validHexToHexDirections.map(
            roadEdge => wideCharacterFor(gameHex.getRoadOwner(roadEdge)?.playerName)
        );

        const [
            pureNorthernSettlement,
            northEasternSettlement,
            southEasternSettlement,
            pureSouthernSettlement,
            southWesternSettlement,
            northWesternSettlement
        ] = TextHex.validCornerDirections.map(
            settlementCorner => {
                const ownerAndType = gameHex.getSettlementOwnerAndType(settlementCorner);
                if (ownerAndType == undefined) {
                    return " ".repeat(4);
                }

                return ownerAndType[0].playerName + wideCharacterFor(ownerAndType[1]);
            }
        );


        this.northernEdgeWithWest = (
            northWesternSettlement!
            + northWesternRoad!.repeat(2)
            + pureNorthernSettlement
            + northEasternRoad!.repeat(2)
        );
        this.northEasternCorner = northEasternSettlement!;

        const spacedWesternRoad = " " + pureWesternRoad + " "
        this.bodyWithWest = [
            spacedWesternRoad + longSide,
            spacedWesternRoad + shortSideWall + " " + robberWideCharacter + " " + shortSideWall,
            spacedWesternRoad + shortSideWall + " " + productionScoreText + " " + shortSideWall,
            spacedWesternRoad + longSide
        ];

        const spacedEasternRoad = " " + pureEasternRoad + " "
        this.easternEdge = [
            spacedEasternRoad,
            spacedEasternRoad,
            spacedEasternRoad,
            spacedEasternRoad
        ];

        this.southernEdgeWithWest = (
            southWesternSettlement!
            + southWesternRoad!.repeat(2)
            + pureSouthernSettlement
            + southEasternRoad!.repeat(2)
        );
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

    private static readonly validCornerDirections: HexCornerDirection[] =
        ["N", "NE", "SE", "S", "SW", "NW"];
    private static readonly validHexToHexDirections: HexToHexDirection[] =
        ["NE", "E", "SE", "SW", "W", "NW"];
}
