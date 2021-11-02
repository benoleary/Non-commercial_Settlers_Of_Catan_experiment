import { WideCharacterProvider } from "./WideCharacterProvider";

export class AsciiProvider implements WideCharacterProvider {
    getFor(inputType: string | undefined): string {
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
}
