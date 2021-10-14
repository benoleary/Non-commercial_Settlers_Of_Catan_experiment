/**
 * This file is for visualization of game elements, but only as an aid during
 * development. It only goes far enough for me to be satisfied that things are
 * working as intended.
 */

import { HexMatrix, ImmutableHex, LandType } from "../game/board/hex"
import { ProductionRollScore } from "../game/resource/resource";

type CouldHaveEmoji = LandType | "robber";

// There is an issue with whether my terminal (Debian 10.2) displays emoji as
// single or double width. Hence some of these have spaces and others not.
// It might look buggy on your machine.
function emojiWideCharacterFor(inputType: CouldHaveEmoji): string {
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
    if (inputType == "robber") {
        return "👺";
    }

    // This should never happen, but TypeScript complains that not all paths are
    // covered if I do not include a default case, despite understanding perfectly
    // that the above cases are correct, and there being no logical other case.
    // It does not even complain that undefined is not part of the type union!
    if (inputType == undefined) {
        return "??";
    }

    return "??";
}

function asciiWideCharacterFor(inputType: CouldHaveEmoji): string {
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
    if (inputType == "robber") {
        return " R";
    }

    return "??";
}

export class BoardVisualization {
    constructor(useEmoji: boolean) {
        this.wideCharacterFor = useEmoji ? emojiWideCharacterFor : asciiWideCharacterFor;
    }

    asString(hexBoard: HexMatrix<ImmutableHex>): string {
        let returnString = "";
        // Reverse order because I read co-ordinates as vertical increasing from bottom to top.
        for (let rowIndex = hexBoard.length - 1; rowIndex >= 0; rowIndex--) {
            const offsetHalves = hexBoard.length - 1 - rowIndex;
            returnString += this.rowAsString(offsetHalves, hexBoard[rowIndex]);
        }

        return returnString;
    }

    private wideCharacterFor: (inputType: CouldHaveEmoji) => string


    private rowAsString(offsetHexHalves: number, hexRow: (ImmutableHex | undefined)[]): string {
        const textHexes: TextHex[] =
            hexRow.map(
                gameHex => gameHex ? new LandHex(this.wideCharacterFor, gameHex) : new EmptyHex()
            );

        let rowAsString = "\n";
        const offsetString = "   ".repeat(offsetHexHalves);
        for (let rowIndex = 0; rowIndex < 4; rowIndex++) {
            rowAsString +=
                offsetString
                + textHexes.map(textHex =>textHex.textLines[rowIndex]).join("  ")
                + "\n";
        }

        return rowAsString + "\n";
    }
}

class TextHex {
    protected constructor(public readonly textLines: [string, string, string, string]) { }
}

class EmptyHex extends TextHex {
    constructor() {
        const fourspaces = "    ";
        super([fourspaces, fourspaces, fourspaces, fourspaces]);
    }
}

class LandHex extends TextHex {
    constructor(wideCharacterFor: (inputType: CouldHaveEmoji) => string, gameHex: ImmutableHex) {
        const landWideCharacter = wideCharacterFor(gameHex.landType);
        const robberWideCharacter = gameHex.hasRobber ? wideCharacterFor("robber") : "  ";
        const longSide = landWideCharacter + landWideCharacter + landWideCharacter;
        const productionScoreText = LandHex.rollScoreString(gameHex.productionRollScore);
        super([
            longSide,
            landWideCharacter + robberWideCharacter + landWideCharacter,
            landWideCharacter + productionScoreText + landWideCharacter,
            longSide
        ]);
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
}
